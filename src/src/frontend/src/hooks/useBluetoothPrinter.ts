import { useCallback, useRef, useState } from "react";

// ESC/POS constants
const ESC = 0x1b;
const GS = 0x1d;

const PRINTER_NAME = "58Printer";

// Known BLE service/characteristic UUID pairs for common 58mm thermal printers
const PRINTER_PROFILES = [
  {
    service: "000018f0-0000-1000-8000-00805f9b34fb",
    characteristic: "00002af1-0000-1000-8000-00805f9b34fb",
  },
  {
    service: "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
    characteristic: "bef8d6c9-9c21-4c9e-b632-bd58c1009f9f",
  },
  {
    service: "49535343-fe7d-4ae5-8fa9-9fafd205e455",
    characteristic: "49535343-8841-43f4-a8d4-ecbe34729bb3",
  },
];

export type PrinterStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "printing"
  | "error";

// ------- ESC/POS helpers -------

function bytes(...vals: number[]): Uint8Array {
  return new Uint8Array(vals);
}

function text(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

// ASCII-only Indian number format (no Unicode symbols)
// Format total as whole number only (floor - no rounding up, no decimals)
function formatAmountASCII(n: number): string {
  const floored = Math.floor(n);
  const s = floored.toString();
  if (s.length <= 3) return `Rs.${s}`;
  const last3 = s.slice(-3);
  let rest = s.slice(0, -3);
  const groups: string[] = [last3];
  while (rest.length > 2) {
    groups.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }
  if (rest.length > 0) groups.unshift(rest);
  return `Rs.${groups.join(",")}`;
}

// Format individual item price keeping decimal values (e.g. 4.75 -> Rs.4.75)
function formatItemAmountASCII(n: number): string {
  const isWhole = Number.isInteger(n);
  const display = isWhole ? n.toString() : n.toFixed(2).replace(/\.?0+$/, "");
  return `Rs.${display}`;
}

// Convert integer to words (ASCII-safe)
function numberToWords(n: number): string {
  if (n === 0) return "Zero";

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function below1000(num: number): string {
    if (num === 0) return "";
    if (num < 20) return `${ones[num]} `;
    if (num < 100) {
      return `${tens[Math.floor(num / 10)]} ${num % 10 ? `${ones[num % 10]} ` : ""}`;
    }
    return `${ones[Math.floor(num / 100)]} Hundred ${below1000(num % 100)}`;
  }

  let result = "";
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const remainder = n % 1000;

  if (crore > 0) result += `${below1000(crore)}Crore `;
  if (lakh > 0) result += `${below1000(lakh)}Lakh `;
  if (thousand > 0) result += `${below1000(thousand)}Thousand `;
  if (remainder > 0) result += below1000(remainder);

  return result.trim();
}

function amountInWords(total: number): string {
  const rounded = Math.round(total);
  return `Rupees ${numberToWords(rounded)} Only`;
}

// Pad a row to 32 chars: name on left, price on right
function padRow(name: string, price: string, width = 32): string {
  const maxName = width - price.length - 1;
  const truncated =
    name.length > maxName ? `${name.slice(0, maxName - 1)}.` : name;
  const spaces = width - truncated.length - price.length;
  return `${truncated + " ".repeat(Math.max(1, spaces)) + price}\n`;
}

export interface ReceiptItem {
  name: string;
  price: number;
}

export function buildReceiptBytes(
  items: ReceiptItem[],
  total: number,
  billNo: string,
): Uint8Array {
  const LINE = `${"-".repeat(32)}\n`;
  const DBL = `${"=".repeat(32)}\n`;

  const now = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  const totalStr = formatAmountASCII(total);

  return concat(
    bytes(ESC, 0x40), // Init
    bytes(ESC, 0x61, 0x01), // Center align
    bytes(ESC, 0x45, 0x01), // Bold on
    bytes(GS, 0x21, 0x11), // Double size
    text("Nanaji Dudh\n"),
    text("Dairy\n"),
    bytes(GS, 0x21, 0x00), // Normal size
    bytes(ESC, 0x45, 0x00), // Bold off
    text("Fresh & Pure - Farm to Family\n"),
    text(`${now}\n`),
    text(`Bill No: ${billNo}\n`),
    bytes(ESC, 0x61, 0x00), // Left align
    text(DBL),
    bytes(ESC, 0x45, 0x01),
    text(padRow("ITEM", "AMOUNT")),
    bytes(ESC, 0x45, 0x00),
    text(LINE),
    ...items.map((item) =>
      text(padRow(item.name, formatItemAmountASCII(item.price))),
    ),
    text(DBL),
    bytes(ESC, 0x45, 0x01),
    text(padRow("TOTAL", totalStr)),
    bytes(ESC, 0x45, 0x00),
    text(LINE),
    bytes(ESC, 0x61, 0x01),
    bytes(ESC, 0x45, 0x01),
    text(`Amount: ${totalStr}\n`),
    bytes(ESC, 0x45, 0x00),
    text(`${amountInWords(total)}\n`),
    text(DBL),
    text("Thank you for your purchase!\n"),
    text("Visit Again :)\n"),
    bytes(ESC, 0x64, 0x03), // Feed 3 lines
    bytes(GS, 0x56, 0x42, 0x00), // Full cut
  );
}

// ------- Hook -------

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
        "Web Bluetooth not supported. Use Chrome on Android or Desktop.",
      );
      setStatus("error");
      return;
    }

    setStatus("connecting");
    setErrorMsg(null);

    try {
      let device: BluetoothDevice;
      try {
        device = await navigator.bluetooth.requestDevice({
          filters: [{ name: PRINTER_NAME }],
          optionalServices: PRINTER_PROFILES.map((p) => p.service),
        });
      } catch {
        // Fallback: show all devices
        device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: PRINTER_PROFILES.map((p) => p.service),
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

      // Try known profiles first
      let found = false;
      for (const { service, characteristic } of PRINTER_PROFILES) {
        try {
          const svc = await server.getPrimaryService(service);
          const ch = await svc.getCharacteristic(characteristic);
          characteristicRef.current = ch;
          found = true;
          break;
        } catch {
          // Try next profile
        }
      }

      // Fallback: scan all services for a writable characteristic
      if (!found) {
        const services = await server.getPrimaryServices();
        outer: for (const svc of services) {
          const chars = await svc.getCharacteristics();
          for (const ch of chars) {
            if (ch.properties.write || ch.properties.writeWithoutResponse) {
              characteristicRef.current = ch;
              found = true;
              break outer;
            }
          }
        }
      }

      if (!found || !characteristicRef.current) {
        throw new Error("No writable characteristic found on this printer.");
      }

      setStatus("connected");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isUserCancel =
        msg.toLowerCase().includes("cancel") ||
        msg.toLowerCase().includes("user");
      if (isUserCancel) {
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
    characteristicRef.current = null;
    setStatus("disconnected");
    setDeviceName(null);
  }, []);

  // Low-level: write raw bytes to printer
  const print = useCallback(async (data: Uint8Array): Promise<boolean> => {
    const ch = characteristicRef.current;
    if (!ch) {
      setErrorMsg("Printer not connected.");
      setStatus("error");
      return false;
    }
    setStatus("printing");
    try {
      const CHUNK_SIZE = 512;
      for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        const chunk = data.slice(i, i + CHUNK_SIZE);
        if (ch.properties.writeWithoutResponse) {
          await ch.writeValueWithoutResponse(chunk);
        } else {
          await ch.writeValue(chunk);
        }
        // Small delay between chunks to avoid buffer overflow
        await new Promise<void>((r) => setTimeout(r, 20));
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

  // High-level: build + print a full receipt
  const printBill = useCallback(
    async (items: ReceiptItem[], total: number): Promise<boolean> => {
      const billNo = `B${String(Date.now()).slice(-6)}`;
      const receiptBytes = buildReceiptBytes(items, total, billNo);
      return print(receiptBytes);
    },
    [print],
  );

  // Alias for API consistency
  const connectPrinter = connect;

  return {
    status,
    deviceName,
    errorMsg,
    connect,
    connectPrinter,
    disconnect,
    print,
    printBill,
    isConnected: status === "connected" || status === "printing",
    isPrinting: status === "printing",
    isConnecting: status === "connecting",
  };
}
