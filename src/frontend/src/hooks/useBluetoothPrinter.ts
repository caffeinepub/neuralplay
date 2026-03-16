import { useCallback, useRef, useState } from "react";

// ESC/POS command helpers
const ESC = 0x1b;
const GS = 0x1d;

function textEncoder(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) {
    out.set(a, offset);
    offset += a.length;
  }
  return out;
}

function cmd(...bytes: number[]): Uint8Array {
  return new Uint8Array(bytes);
}

// ASCII-safe currency formatter (avoids Unicode Rs symbol that breaks thermal printers)
// Output: "Rs.1,23,456" -- plain ASCII, safe for 58mm ESC/POS printers
function formatINR(n: number): string {
  const rounded = Math.round(n);
  const s = rounded.toString();
  let result = "";
  if (s.length <= 3) {
    result = s;
  } else {
    result = s.slice(-3);
    let remaining = s.slice(0, -3);
    while (remaining.length > 2) {
      result = `${remaining.slice(-2)},${result}`;
      remaining = remaining.slice(0, -2);
    }
    result = `${remaining},${result}`;
  }
  return `Rs.${result}`;
}

// Build ESC/POS receipt bytes
export function buildReceiptBytes(
  items: { name: string; price: number }[],
  total: number,
  billNo: string,
): Uint8Array {
  const line = `${"-".repeat(32)}\n`;
  const doubleLine = `${"=".repeat(32)}\n`;

  const init = cmd(ESC, 0x40); // Initialize printer
  const centerAlign = cmd(ESC, 0x61, 0x01);
  const leftAlign = cmd(ESC, 0x61, 0x00);
  const boldOn = cmd(ESC, 0x45, 0x01);
  const boldOff = cmd(ESC, 0x45, 0x00);
  const doubleSize = cmd(GS, 0x21, 0x11); // double width + height
  const normalSize = cmd(GS, 0x21, 0x00);
  const feed3 = cmd(ESC, 0x64, 0x03); // feed 3 lines
  const cutPaper = cmd(GS, 0x56, 0x42, 0x00); // full cut

  const padRow = (name: string, price: string): string => {
    const maxName = 20;
    const truncated =
      name.length > maxName ? `${name.slice(0, maxName - 1)}.` : name;
    const spaces = 32 - truncated.length - price.length;
    return `${truncated}${" ".repeat(Math.max(1, spaces))}${price}\n`;
  };

  const now = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  const totalStr = formatINR(total);

  const parts: Uint8Array[] = [
    init,
    centerAlign,
    boldOn,
    doubleSize,
    textEncoder("Nanaji Dudh\n"),
    textEncoder("Dairy\n"),
    normalSize,
    boldOff,
    textEncoder("Fresh & Pure - Farm to Family\n"),
    textEncoder(`${now}\n`),
    textEncoder(`Bill No: ${billNo}\n`),
    leftAlign,
    textEncoder(doubleLine),
    boldOn,
    textEncoder(padRow("ITEM", "AMOUNT")),
    boldOff,
    textEncoder(line),
    ...items.map((item) =>
      textEncoder(padRow(item.name, formatINR(item.price))),
    ),
    textEncoder(doubleLine),
    boldOn,
    textEncoder(padRow("TOTAL", totalStr)),
    boldOff,
    textEncoder(line),
    centerAlign,
    boldOn,
    textEncoder(`Amount: ${totalStr}\n`),
    boldOff,
    textEncoder(doubleLine),
    textEncoder("UPI: 7820957013@ibl\n"),
    textEncoder("Thank you for your purchase!\n"),
    textEncoder("Visit Again :)\n"),
    feed3,
    cutPaper,
  ];

  return concat(...parts);
}

// Known BLE service/characteristic UUIDs for common BT thermal printers
const PRINTER_SERVICES = [
  // Generic BLE serial (used by many ESC/POS printers incl. 58mm models)
  {
    service: "000018f0-0000-1000-8000-00805f9b34fb",
    characteristic: "00002af1-0000-1000-8000-00805f9b34fb",
  },
  // Another common profile
  {
    service: "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
    characteristic: "bef8d6c9-9c21-4c9e-b632-bd58c1009f9f",
  },
  // SPP-like profile used by some 58mm printers
  {
    service: "49535343-fe7d-4ae5-8fa9-9fafd205e455",
    characteristic: "49535343-8841-43f4-a8d4-ecbe34729bb3",
  },
];

// Bluetooth name of the thermal printer
const PRINTER_NAME = "58Printer";

export type PrinterStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "printing"
  | "error";

export function useBluetoothPrinter() {
  const [status, setStatus] = useState<PrinterStatus>("disconnected");
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const characteristicRef = useRef<BluetoothRemoteGATTCharacteristic | null>(
    null,
  );
  const deviceRef = useRef<BluetoothDevice | null>(null);

  const connect = useCallback(async () => {
    if (!navigator.bluetooth) {
      setErrorMsg(
        "Web Bluetooth is not supported in this browser. Use Chrome on Android/Desktop.",
      );
      setStatus("error");
      return;
    }
    try {
      setStatus("connecting");
      setErrorMsg(null);

      let device: BluetoothDevice | null = null;
      try {
        device = await navigator.bluetooth.requestDevice({
          filters: [{ name: PRINTER_NAME }],
          optionalServices: PRINTER_SERVICES.map((s) => s.service),
        });
      } catch {
        device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: PRINTER_SERVICES.map((s) => s.service),
        });
      }

      deviceRef.current = device;
      setDeviceName(device.name ?? "Unknown Printer");

      device.addEventListener("gattserverdisconnected", () => {
        setStatus("disconnected");
        setDeviceName(null);
        characteristicRef.current = null;
      });

      const server = await device.gatt!.connect();

      let found = false;
      for (const { service, characteristic } of PRINTER_SERVICES) {
        try {
          const svc = await server.getPrimaryService(service);
          const ch = await svc.getCharacteristic(characteristic);
          characteristicRef.current = ch;
          found = true;
          break;
        } catch {
          // try next
        }
      }

      if (!found) {
        const services = await server.getPrimaryServices();
        for (const svc of services) {
          const chars = await svc.getCharacteristics();
          for (const ch of chars) {
            if (ch.properties.write || ch.properties.writeWithoutResponse) {
              characteristicRef.current = ch;
              found = true;
              break;
            }
          }
          if (found) break;
        }
      }

      if (!found || !characteristicRef.current) {
        throw new Error("No writable characteristic found on this printer.");
      }

      setStatus("connected");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes("cancelled") ||
        msg.includes("User cancelled") ||
        msg.includes("user")
      ) {
        setStatus("disconnected");
      } else {
        setErrorMsg(msg);
        setStatus("error");
      }
    }
  }, []);

  const disconnect = useCallback(() => {
    if (deviceRef.current?.gatt?.connected) {
      deviceRef.current.gatt.disconnect();
    }
    setStatus("disconnected");
    setDeviceName(null);
    characteristicRef.current = null;
  }, []);

  const print = useCallback(async (data: Uint8Array) => {
    const ch = characteristicRef.current;
    if (!ch) {
      setErrorMsg("Printer not connected.");
      setStatus("error");
      return false;
    }
    try {
      setStatus("printing");
      const CHUNK = 512;
      for (let i = 0; i < data.length; i += CHUNK) {
        const chunk = data.slice(i, i + CHUNK);
        if (ch.properties.writeWithoutResponse) {
          await ch.writeValueWithoutResponse(chunk);
        } else {
          await ch.writeValue(chunk);
        }
        await new Promise((r) => setTimeout(r, 20));
      }
      setStatus("connected");
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      setStatus("error");
      return false;
    }
  }, []);

  return { status, deviceName, errorMsg, connect, disconnect, print };
}
