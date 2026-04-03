import { useBluetoothPrinter } from "@/hooks/useBluetoothPrinter";
import { usePOSStore } from "@/store/posStore";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bluetooth,
  BluetoothConnected,
  BluetoothSearching,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  IndianRupee,
  MessageCircle,
  Milk,
  Phone,
  Plus,
  Printer,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const MILK_PURCHASE_KEY = "ndd_milk_purchases";
const MILK_PURCHASE_7DAY_KEY = "ndd_milk_purchases_7day";

// ESC/POS helpers
const ESC = 0x1b;
const GS = 0x1d;

function _bytes(...vals: number[]): Uint8Array {
  return new Uint8Array(vals);
}

function _text(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function _concat(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

function _padRow(left: string, right: string, width = 32): string {
  const maxLeft = width - right.length - 1;
  const truncated =
    left.length > maxLeft ? `${left.slice(0, maxLeft - 1)}.` : left;
  const spaces = width - truncated.length - right.length;
  return `${truncated}${" ".repeat(Math.max(1, spaces))}${right}\n`;
}

export interface MilkPurchaseRecord {
  id: string;
  milkType: "Buffalo" | "Cow";
  supplierName: string;
  quantity: number;
  ratePerLiter: number;
  fat: string;
  snf: string;
  totalAmount: number;
  date: string;
}

export interface SevenDayRow {
  date: string;
  morningQty: string;
  eveningQty: string;
}

export interface SevenDayRecord {
  id: string;
  milkType: "Buffalo" | "Cow";
  supplierName: string;
  morningRate: number;
  eveningRate: number;
  fat: string;
  snf: string;
  days: Array<{
    date: string;
    morningQty: number;
    eveningQty: number;
    amount: number;
  }>;
  totalMorningLiters: number;
  totalEveningLiters: number;
  totalAmount: number;
  createdAt: string;
}

function buildMilkReceiptBytes(record: MilkPurchaseRecord): Uint8Array {
  const LINE = `${"-".repeat(32)}\n`;
  const DBL = `${"=".repeat(32)}\n`;
  const slipNo = `M${record.id.slice(-6)}`;
  const now = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(record.date));

  const totalStr = `Rs.${Math.floor(record.totalAmount).toLocaleString("en-IN")}`;

  const parts: Uint8Array[] = [
    _bytes(ESC, 0x40),
    _bytes(ESC, 0x61, 0x01),
    _bytes(ESC, 0x45, 0x01),
    _bytes(GS, 0x21, 0x11),
    _text("Nanaji Dudh Dairy\n"),
    _bytes(GS, 0x21, 0x00),
    _bytes(ESC, 0x45, 0x00),
    _text("Milk Purchase Slip\n"),
    _text(`${now}\n`),
    _text(`Slip No: ${slipNo}\n`),
    _bytes(ESC, 0x61, 0x00),
    _text(LINE),
    _text(_padRow("Farmer:", record.supplierName)),
    _text(_padRow("Milk Type:", `${record.milkType} Milk`)),
    _text(_padRow("Quantity:", `${Math.floor(record.quantity)} L`)),
    _text(_padRow("Rate/Litre:", `Rs.${Math.floor(record.ratePerLiter)}`)),
  ];

  if (record.fat) {
    parts.push(_text(_padRow("Fat %:", `${record.fat}%`)));
  }
  if (record.snf) {
    parts.push(_text(_padRow("SNF %:", `${record.snf}%`)));
  }

  parts.push(
    _text(DBL),
    _bytes(ESC, 0x45, 0x01),
    _text(_padRow("TOTAL", totalStr)),
    _bytes(ESC, 0x45, 0x00),
    _text(LINE),
    _bytes(ESC, 0x61, 0x01),
    _text("Nanaji Dudh Dairy\n"),
    _bytes(ESC, 0x64, 0x03),
    _bytes(GS, 0x56, 0x42, 0x00),
  );

  return _concat(...parts);
}

function build7DayReceiptBytes(record: SevenDayRecord): Uint8Array {
  const LINE = `${"-".repeat(32)}\n`;
  const DBL = `${"=".repeat(32)}\n`;
  const slipNo = `M${record.id.slice(-6)}`;

  const sortedDays = [...record.days].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const firstDate = sortedDays[0]?.date ?? "";
  const lastDate = sortedDays[sortedDays.length - 1]?.date ?? "";

  function fmtDayShort(iso: string): string {
    const d = new Date(iso);
    const day = new Intl.DateTimeFormat("en-IN", { weekday: "short" }).format(
      d,
    );
    const date = new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
    }).format(d);
    return `${day} ${date}`;
  }

  const _dateRange =
    firstDate && lastDate
      ? `${fmtDayShort(firstDate)} - ${fmtDayShort(lastDate)}`
      : "";

  const parts: Uint8Array[] = [
    _bytes(ESC, 0x40),
    _bytes(ESC, 0x61, 0x01),
    _bytes(ESC, 0x45, 0x01),
    _bytes(GS, 0x21, 0x11),
    _text("Nanaji Dudh Dairy\n"),
    _bytes(GS, 0x21, 0x00),
    _bytes(ESC, 0x45, 0x00),
    _text("Milk Purchase - 7 Day Slip\n"),
    _text(`Slip No: ${slipNo}\n`),
    _bytes(ESC, 0x61, 0x00),
    _text(LINE),
    _text(_padRow("Farmer:", record.supplierName)),
    _text(_padRow("Milk Type:", `${record.milkType} Milk`)),
    _text(_padRow("Morning Rate:", `Rs.${Math.floor(record.morningRate)}/L`)),
    _text(_padRow("Evening Rate:", `Rs.${Math.floor(record.eveningRate)}/L`)),
  ];

  if (record.fat) parts.push(_text(_padRow("Fat %:", `${record.fat}%`)));
  if (record.snf) parts.push(_text(_padRow("SNF %:", `${record.snf}%`)));

  // Table header
  parts.push(_text(DBL), _text("Day        Morn  Eve   Amount\n"), _text(LINE));

  // Day rows
  for (const day of sortedDays) {
    if (day.morningQty > 0 || day.eveningQty > 0) {
      const dayNames = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ];
      const dayIdx2 = new Date(day.date).getDay();
      const dayNameIdx = dayIdx2 === 0 ? 6 : dayIdx2 - 1;
      const dateStr = (dayNames[dayNameIdx] ?? "").padEnd(11);
      const morn = `${Math.floor(day.morningQty)}L`.padEnd(6);
      const eve = `${Math.floor(day.eveningQty)}L`.padEnd(6);
      const amt = `Rs.${Math.floor(day.amount)}`;
      parts.push(_text(`${dateStr}${morn}${eve}${amt}\n`));
    }
  }

  // Totals
  parts.push(
    _text(DBL),
    _bytes(ESC, 0x45, 0x01),
    _text(
      _padRow("TOTAL MORNING:", `${Math.floor(record.totalMorningLiters)} L`),
    ),
    _text(
      _padRow("TOTAL EVENING:", `${Math.floor(record.totalEveningLiters)} L`),
    ),
    _text(
      _padRow(
        "GRAND TOTAL:",
        `Rs.${Math.floor(record.totalAmount).toLocaleString("en-IN")}`,
      ),
    ),
    _bytes(ESC, 0x45, 0x00),
    _text(LINE),
    _bytes(ESC, 0x61, 0x01),
    _text("Nanaji Dudh Dairy\n"),
    _bytes(ESC, 0x64, 0x03),
    _bytes(GS, 0x56, 0x42, 0x00),
  );

  return _concat(...parts);
}

function build7DayWhatsAppMessage(record: SevenDayRecord): string {
  const sortedDays = [...record.days].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  function fmtDayShort(iso: string): string {
    const d = new Date(iso);
    const day = new Intl.DateTimeFormat("en-IN", { weekday: "short" }).format(
      d,
    );
    const date = new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
    }).format(d);
    return `${day} ${date}`;
  }

  const firstDate = sortedDays[0]?.date ?? "";
  const lastDate = sortedDays[sortedDays.length - 1]?.date ?? "";
  const _dateRange =
    firstDate && lastDate
      ? `${fmtDayShort(firstDate)} - ${fmtDayShort(lastDate)}`
      : "";

  let msg = "*Nanaji Dudh Dairy*\nMilk Purchase - 7 Day Slip\n";
  msg += "\n----------------------------\n";
  msg += `Farmer: ${record.supplierName}\n`;
  msg += `Milk Type: ${record.milkType} Milk\n`;
  msg += `Morning Rate: Rs.${Math.floor(record.morningRate)}/L
`;
  msg += `Evening Rate: Rs.${Math.floor(record.eveningRate)}/L
`;
  if (record.fat) msg += `Fat %: ${record.fat}%\n`;
  if (record.snf) msg += `SNF %: ${record.snf}%\n`;
  msg += "\n*Date | Morning | Evening | Amount*\n";
  msg += "----------------------------\n";

  for (const day of sortedDays) {
    if (day.morningQty > 0 || day.eveningQty > 0) {
      const _dayNames = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ];
      const _di = new Date(day.date).getDay();
      const _dni = _di === 0 ? 6 : _di - 1;
      msg += `${_dayNames[_dni] ?? ""} | ${Math.floor(day.morningQty)}L | ${Math.floor(day.eveningQty)}L | Rs.${Math.floor(day.amount)}
`;
    }
  }

  msg += "============================\n";
  msg += `Total Morning: ${Math.floor(record.totalMorningLiters)} L
`;
  msg += `Total Evening: ${Math.floor(record.totalEveningLiters)} L
`;
  msg += `*GRAND TOTAL: Rs.${Math.floor(record.totalAmount).toLocaleString("en-IN")}*
`;
  msg += "----------------------------\n";
  return msg;
}

function savePurchase(record: MilkPurchaseRecord): void {
  try {
    const raw = localStorage.getItem(MILK_PURCHASE_KEY);
    const records: MilkPurchaseRecord[] = raw
      ? (JSON.parse(raw) as MilkPurchaseRecord[])
      : [];
    records.push(record);
    localStorage.setItem(MILK_PURCHASE_KEY, JSON.stringify(records));
  } catch {
    // ignore
  }
}

function loadPurchases(): MilkPurchaseRecord[] {
  try {
    const raw = localStorage.getItem(MILK_PURCHASE_KEY);
    const records: MilkPurchaseRecord[] = raw
      ? (JSON.parse(raw) as MilkPurchaseRecord[])
      : [];
    return records.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  } catch {
    return [];
  }
}

function deletePurchase(id: string): void {
  try {
    const raw = localStorage.getItem(MILK_PURCHASE_KEY);
    const records: MilkPurchaseRecord[] = raw
      ? (JSON.parse(raw) as MilkPurchaseRecord[])
      : [];
    const updated = records.filter((r) => r.id !== id);
    localStorage.setItem(MILK_PURCHASE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

function save7DayRecord(record: SevenDayRecord): void {
  try {
    const raw = localStorage.getItem(MILK_PURCHASE_7DAY_KEY);
    const records: SevenDayRecord[] = raw
      ? (JSON.parse(raw) as SevenDayRecord[])
      : [];
    records.push(record);
    localStorage.setItem(MILK_PURCHASE_7DAY_KEY, JSON.stringify(records));
  } catch {
    // ignore
  }
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function buildWhatsAppMessage(record: MilkPurchaseRecord): string {
  const now = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(record.date));

  let msg = `*Nanaji Dudh Dairy*\nMilk Purchase Slip\n${now}\n`;
  msg += "\n----------------------------\n";
  msg += `Farmer: ${record.supplierName}\n`;
  msg += `Milk Type: ${record.milkType} Milk\n`;
  msg += `Quantity: ${Math.floor(record.quantity)} L
`;
  msg += `Rate/Litre: Rs.${Math.floor(record.ratePerLiter)}
`;
  if (record.fat) msg += `Fat %: ${record.fat}%\n`;
  if (record.snf) msg += `SNF %: ${record.snf}%\n`;
  msg += "============================\n";
  msg += `*TOTAL: Rs.${Math.floor(record.totalAmount).toLocaleString("en-IN")}*
`;
  msg += "----------------------------\n";
  return msg;
}

// Returns 7 dates Mon→Sun for a given week offset (0 = current week, -1 = last week)
function getWeekDates(weekOffset = -1): string[] {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...6=Sat
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysFromMonday + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const dy = String(d.getDate()).padStart(2, "0");
    return `${yr}-${mo}-${dy}`;
  });
}

function getWeekLabel(weekOffset: number): string {
  const dates = getWeekDates(weekOffset);
  const first = new Date(dates[0]);
  const last = new Date(dates[6]);
  const fmt = (d: Date) =>
    new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(
      d,
    );
  if (weekOffset === 0) return `This Week (${fmt(first)} - ${fmt(last)})`;
  if (weekOffset === -1) return `Last Week (${fmt(first)} - ${fmt(last)})`;
  return `${fmt(first)} - ${fmt(last)}`;
}

function fmtDateLabel(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(d);
}

export default function MilkPurchasePage() {
  const navigate = useNavigate();
  const { isLoggedIn, darkMode } = usePOSStore();
  const printer = useBluetoothPrinter();

  // Single entry form state
  const [milkType, setMilkType] = useState<"Buffalo" | "Cow">("Buffalo");
  const [supplierName, setSupplierName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [ratePerLiter, setRatePerLiter] = useState("");
  const [fat, setFat] = useState("");
  const [snf, setSnf] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [records, setRecords] = useState<MilkPurchaseRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 7-day entry panel state
  const [show7Day, setShow7Day] = useState(false);
  const [s7MilkType, setS7MilkType] = useState<"Buffalo" | "Cow">("Buffalo");
  const [s7SupplierName, setS7SupplierName] = useState("");
  const [s7MorningRate, setS7MorningRate] = useState("");
  const [s7EveningRate, setS7EveningRate] = useState("");
  const [s7Fat, setS7Fat] = useState("");
  const [s7Snf, setS7Snf] = useState("");
  const [s7WhatsApp, setS7WhatsApp] = useState("");
  const [s7Errors, setS7Errors] = useState<Record<string, string>>({});
  const [s7WeekOffset, setS7WeekOffset] = useState(-1);
  const [s7Rows, setS7Rows] = useState<SevenDayRow[]>(() =>
    getWeekDates(-1).map((date) => ({ date, morningQty: "", eveningQty: "" })),
  );

  useEffect(() => {
    if (!isLoggedIn) navigate({ to: "/" });
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
    setRecords(loadPurchases());
  }, []);

  useEffect(() => {
    setS7Rows(
      getWeekDates(s7WeekOffset).map((date) => ({
        date,
        morningQty: "",
        eveningQty: "",
      })),
    );
  }, [s7WeekOffset]);

  const qty = Number.parseFloat(quantity);
  const rate = Number.parseFloat(ratePerLiter);
  const total = !Number.isNaN(qty) && !Number.isNaN(rate) ? qty * rate : 0;

  // 7-day computed values
  const mRate = Number.parseFloat(s7MorningRate);
  const eRate = Number.parseFloat(s7EveningRate);

  const s7ComputedRows = useMemo(() => {
    return s7Rows.map((row) => {
      const mQty = Number.parseFloat(row.morningQty) || 0;
      const eQty = Number.parseFloat(row.eveningQty) || 0;
      const mR = Number.isNaN(mRate) ? 0 : mRate;
      const eR = Number.isNaN(eRate) ? 0 : eRate;
      const amount = mQty * mR + eQty * eR;
      return { ...row, mQty, eQty, amount };
    });
  }, [s7Rows, mRate, eRate]);

  const s7TotalMorning = s7ComputedRows.reduce((a, r) => a + r.mQty, 0);
  const s7TotalEvening = s7ComputedRows.reduce((a, r) => a + r.eQty, 0);
  const s7GrandTotal = s7ComputedRows.reduce((a, r) => a + r.amount, 0);

  // Sort display rows Mon→Sun (getDay: Sun=0→7, Mon=1, Tue=2...Sat=6)
  const s7DisplayRows = useMemo(() => {
    return s7ComputedRows
      .map((row, origIdx) => ({ ...row, origIdx }))
      .sort((a, b) => {
        const dayA = new Date(a.date).getDay() || 7;
        const dayB = new Date(b.date).getDay() || 7;
        return dayA - dayB;
      });
  }, [s7ComputedRows]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!supplierName.trim()) errs.supplierName = "Farmer name is required";
    if (!quantity || Number.isNaN(qty) || qty <= 0)
      errs.quantity = "Enter valid quantity";
    if (!ratePerLiter || Number.isNaN(rate) || rate <= 0)
      errs.ratePerLiter = "Enter valid rate";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validate7Day(): boolean {
    const errs: Record<string, string> = {};
    if (!s7SupplierName.trim()) errs.supplierName = "Farmer name is required";
    if (!s7MorningRate || Number.isNaN(mRate) || mRate <= 0)
      errs.morningRate = "Enter valid morning rate";
    if (!s7EveningRate || Number.isNaN(eRate) || eRate <= 0)
      errs.eveningRate = "Enter valid evening rate";
    const anyQty = s7ComputedRows.some((r) => r.mQty > 0 || r.eQty > 0);
    if (!anyQty) errs.rows = "Enter quantity for at least one day";
    setS7Errors(errs);
    return Object.keys(errs).length === 0;
  }

  function buildRecord(): MilkPurchaseRecord {
    return {
      id: Date.now().toString(),
      milkType,
      supplierName: supplierName.trim(),
      quantity: qty,
      ratePerLiter: rate,
      fat: fat.trim(),
      snf: snf.trim(),
      totalAmount: total,
      date: new Date().toISOString(),
    };
  }

  function build7DayRecord(): SevenDayRecord {
    return {
      id: Date.now().toString(),
      milkType: s7MilkType,
      supplierName: s7SupplierName.trim(),
      morningRate: mRate,
      eveningRate: eRate,
      fat: s7Fat.trim(),
      snf: s7Snf.trim(),
      days: s7ComputedRows.map((r) => ({
        date: r.date,
        morningQty: r.mQty,
        eveningQty: r.eQty,
        amount: r.amount,
      })),
      totalMorningLiters: s7TotalMorning,
      totalEveningLiters: s7TotalEvening,
      totalAmount: s7GrandTotal,
      createdAt: new Date().toISOString(),
    };
  }

  function resetForm() {
    setSupplierName("");
    setQuantity("");
    setRatePerLiter("");
    setFat("");
    setSnf("");
    setWhatsappNumber("");
    setErrors({});
  }

  function reset7DayForm() {
    setS7SupplierName("");
    setS7MorningRate("");
    setS7EveningRate("");
    setS7Fat("");
    setS7Snf("");
    setS7WhatsApp("");
    setS7Errors({});
    setS7Rows(
      getWeekDates(s7WeekOffset).map((date) => ({
        date,
        morningQty: "",
        eveningQty: "",
      })),
    );
  }

  function handleSave() {
    if (!validate()) return null;
    const record = buildRecord();
    savePurchase(record);
    setRecords(loadPurchases());
    toast.success(`Milk purchase of ${formatCurrency(total)} saved!`);
    resetForm();
    return record;
  }

  async function handleSaveAndPrint() {
    if (!validate()) return;
    if (!printer.isConnected) {
      toast.error("Connect 58Printer in the header first");
      return;
    }
    const record = buildRecord();
    savePurchase(record);
    setRecords(loadPurchases());
    toast.success(`Milk purchase of ${formatCurrency(total)} saved!`);
    resetForm();
    const bytes = buildMilkReceiptBytes(record);
    const ok = await printer.print(bytes);
    if (ok) {
      toast.success("Milk purchase slip sent to 58Printer!");
    } else {
      toast.error(printer.errorMsg ?? "Print failed");
    }
  }

  function handleSaveAndWhatsApp() {
    if (!validate()) return;
    const num = whatsappNumber.trim().replace(/\D/g, "");
    if (!num || num.length < 10) {
      toast.error("Enter a valid WhatsApp number (10 digits)");
      return;
    }
    const record = buildRecord();
    savePurchase(record);
    setRecords(loadPurchases());
    toast.success(`Milk purchase of ${formatCurrency(total)} saved!`);
    resetForm();
    const message = buildWhatsAppMessage(record);
    const url = `https://wa.me/91${num}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  }

  function handle7DaySave(): SevenDayRecord | null {
    if (!validate7Day()) return null;
    const record = build7DayRecord();
    save7DayRecord(record);
    toast.success(
      `7-day milk purchase of ${formatCurrency(s7GrandTotal)} saved!`,
    );
    reset7DayForm();
    return record;
  }

  async function handle7DaySaveAndPrint() {
    if (!validate7Day()) return;
    if (!printer.isConnected) {
      toast.error("Connect 58Printer in the header first");
      return;
    }
    const record = build7DayRecord();
    save7DayRecord(record);
    toast.success(
      `7-day milk purchase of ${formatCurrency(s7GrandTotal)} saved!`,
    );
    reset7DayForm();
    const bytes = build7DayReceiptBytes(record);
    const ok = await printer.print(bytes);
    if (ok) {
      toast.success("7-day slip sent to 58Printer!");
    } else {
      toast.error(printer.errorMsg ?? "Print failed");
    }
  }

  function handle7DaySaveAndWhatsApp() {
    if (!validate7Day()) return;
    const num = s7WhatsApp.trim().replace(/\D/g, "");
    if (!num || num.length < 10) {
      toast.error("Enter a valid WhatsApp number (10 digits)");
      return;
    }
    const record = build7DayRecord();
    save7DayRecord(record);
    toast.success(
      `7-day milk purchase of ${formatCurrency(s7GrandTotal)} saved!`,
    );
    reset7DayForm();
    const message = build7DayWhatsAppMessage(record);
    const url = `https://wa.me/91${num}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  }

  async function handlePrint(record: MilkPurchaseRecord) {
    const bytes = buildMilkReceiptBytes(record);
    const ok = await printer.print(bytes);
    if (ok) {
      toast.success("Milk purchase slip sent to 58Printer!");
    } else {
      toast.error(printer.errorMsg ?? "Print failed");
    }
  }

  function handleDelete(id: string) {
    deletePurchase(id);
    setRecords(loadPurchases());
    toast.success("Record deleted");
  }

  function updateS7Row(
    idx: number,
    field: "morningQty" | "eveningQty",
    value: string,
  ) {
    setS7Rows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }

  const todayRecords = records.filter(
    (r) => new Date(r.date).toDateString() === new Date().toDateString(),
  );
  const todayTotal = todayRecords.reduce((a, r) => a + r.totalAmount, 0);

  const printerConnected = printer.isConnected;

  return (
    <div className="min-h-dvh bg-background">
      {/* Header */}
      <header
        className="sticky top-0 z-30 border-b border-border px-7 py-5 flex items-center gap-3"
        style={{ background: "oklch(0.50 0.20 300)" }}
      >
        <button
          type="button"
          onClick={() => navigate({ to: "/dashboard" })}
          data-ocid="milk.back.button"
          className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors flex-shrink-0"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <Milk className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-bold text-white text-base leading-tight">
            Milk Purchase Entry
          </h1>
          <p className="text-white/70 text-xs">Nanaji Dudh Dairy</p>
        </div>

        {/* Bluetooth Printer Controls */}
        {printer.status === "disconnected" || printer.status === "error" ? (
          <button
            type="button"
            onClick={printer.connect}
            data-ocid="milk.printer.button"
            className="flex items-center gap-1.5 px-4 py-3 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-medium transition-colors"
            title={printer.errorMsg ?? "Connect 58Printer"}
          >
            <Bluetooth className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">58Printer</span>
          </button>
        ) : printer.status === "connecting" ? (
          <div className="flex items-center gap-1.5 px-4 py-3 rounded-lg bg-white/15 text-white/80 text-xs">
            <BluetoothSearching className="w-3.5 h-3.5 animate-pulse" />
            <span className="hidden sm:inline">Connecting...</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={printer.disconnect}
            data-ocid="milk.printer.toggle"
            className="flex items-center gap-1.5 px-4 py-3 rounded-lg bg-green-500/30 hover:bg-green-500/40 text-green-200 text-xs font-medium transition-colors"
            title="Disconnect 58Printer"
          >
            <BluetoothConnected className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">58Printer</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setShowHistory((v) => !v)}
          data-ocid="milk.history.button"
          className="flex items-center gap-1.5 px-5 py-4 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-medium transition-colors"
        >
          <ClipboardList className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">History</span>
        </button>
      </header>

      <div className="max-w-2xl mx-auto p-7 space-y-5">
        {/* Today summary */}
        {todayRecords.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pos-card p-7 flex items-center gap-4"
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "oklch(0.50 0.20 300 / 0.12)" }}
            >
              <Milk
                className="w-6 h-6"
                style={{ color: "oklch(0.50 0.20 300)" }}
              />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Today&apos;s Purchases
              </p>
              <p className="font-display font-bold text-lg text-foreground">
                {formatCurrency(todayTotal)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Entries</p>
              <p
                className="font-display font-bold text-xl"
                style={{ color: "oklch(0.50 0.20 300)" }}
              >
                {todayRecords.length}
              </p>
            </div>
          </motion.div>
        )}

        {/* Purchase Form */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="pos-card p-8 space-y-5"
        >
          {/* Form heading with 7 Days Entry button */}
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display font-semibold text-foreground text-base flex items-center gap-2">
              <Plus
                className="w-4 h-4"
                style={{ color: "oklch(0.50 0.20 300)" }}
              />
              New Purchase Entry
            </h2>
            <button
              type="button"
              onClick={() => setShow7Day((v) => !v)}
              data-ocid="milk.seven_day.toggle"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
              style={
                show7Day
                  ? {
                      background: "oklch(0.50 0.20 300)",
                      color: "white",
                    }
                  : {
                      border: "2px solid oklch(0.50 0.20 300)",
                      color: "oklch(0.50 0.20 300)",
                      background: "oklch(0.50 0.20 300 / 0.06)",
                    }
              }
            >
              <CalendarDays className="w-3.5 h-3.5" />7 Days Entry
            </button>
          </div>

          {/* Milk Type */}
          <div>
            <p className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Milk Type
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(["Buffalo", "Cow"] as const).map((type) => {
                const active = milkType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setMilkType(type)}
                    data-ocid={`milk.type.${type.toLowerCase()}.button`}
                    className={`flex items-center justify-center gap-2 py-5 px-7 rounded-xl border-2 font-semibold text-sm transition-all active:scale-95 ${
                      active
                        ? "text-white"
                        : "border-border bg-secondary text-foreground hover:border-purple-400/50"
                    }`}
                    style={
                      active
                        ? {
                            background: "oklch(0.50 0.20 300)",
                            borderColor: "oklch(0.50 0.20 300)",
                          }
                        : {}
                    }
                  >
                    <span className="text-xl">
                      {type === "Buffalo" ? "🐃" : "🐄"}
                    </span>
                    {type} Milk
                  </button>
                );
              })}
            </div>
          </div>

          {/* Farmer Name */}
          <div>
            <label
              htmlFor="supplier-name"
              className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1"
            >
              Farmer Name
            </label>
            <input
              type="text"
              value={supplierName}
              id="supplier-name"
              data-ocid="milk.supplier.input"
              onChange={(e) => {
                setSupplierName(e.target.value);
                setErrors((p) => ({ ...p, supplierName: "" }));
              }}
              placeholder="Enter farmer name"
              className="pos-input"
            />
            {errors.supplierName && (
              <p
                className="text-xs text-destructive mt-1"
                data-ocid="milk.supplier.error_state"
              >
                {errors.supplierName}
              </p>
            )}
          </div>

          {/* Quantity + Rate */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="milk-quantity"
                className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1"
              >
                Quantity (Litres)
              </label>
              <input
                id="milk-quantity"
                type="number"
                value={quantity}
                data-ocid="milk.quantity.input"
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setErrors((p) => ({ ...p, quantity: "" }));
                }}
                placeholder="0.0"
                min="0"
                step="0.5"
                className="pos-input"
              />
              {errors.quantity && (
                <p
                  className="text-xs text-destructive mt-1"
                  data-ocid="milk.quantity.error_state"
                >
                  {errors.quantity}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="milk-rate"
                className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1"
              >
                Rate / Litre (Rs.)
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  id="milk-rate"
                  type="number"
                  value={ratePerLiter}
                  data-ocid="milk.rate.input"
                  onChange={(e) => {
                    setRatePerLiter(e.target.value);
                    setErrors((p) => ({ ...p, ratePerLiter: "" }));
                  }}
                  placeholder="0"
                  min="0"
                  step="0.5"
                  className="pos-input pl-11"
                />
              </div>
              {errors.ratePerLiter && (
                <p
                  className="text-xs text-destructive mt-1"
                  data-ocid="milk.rate.error_state"
                >
                  {errors.ratePerLiter}
                </p>
              )}
            </div>
          </div>

          {/* Fat % + SNF % side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="milk-fat"
                className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1"
              >
                Fat % (Optional)
              </label>
              <input
                id="milk-fat"
                type="text"
                value={fat}
                data-ocid="milk.fat.input"
                onChange={(e) => setFat(e.target.value)}
                placeholder="e.g. 6.5"
                className="pos-input"
              />
            </div>
            <div>
              <label
                htmlFor="milk-snf"
                className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1"
              >
                SNF % (Optional)
              </label>
              <input
                id="milk-snf"
                type="text"
                value={snf}
                data-ocid="milk.snf.input"
                onChange={(e) => setSnf(e.target.value)}
                placeholder="e.g. 8.5"
                className="pos-input"
              />
            </div>
          </div>

          {/* Total Preview */}
          {total > 0 && (
            <div
              className="rounded-xl p-5 flex items-center justify-between"
              style={{ background: "oklch(0.50 0.20 300 / 0.08)" }}
            >
              <span className="text-sm font-medium text-foreground">
                Total Amount
              </span>
              <span
                className="font-display font-bold text-xl"
                style={{ color: "oklch(0.50 0.20 300)" }}
              >
                {formatCurrency(total)}
              </span>
            </div>
          )}

          {/* WhatsApp Number */}
          <div>
            <label
              htmlFor="whatsapp-number"
              className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1"
            >
              Customer WhatsApp Number (Optional)
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                id="whatsapp-number"
                type="tel"
                value={whatsappNumber}
                data-ocid="milk.whatsapp.input"
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="e.g. 9876543210"
                maxLength={10}
                className="pos-input pl-11"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleSave}
              data-ocid="milk.save.primary_button"
              className="w-full py-6 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 shadow-purple-glow"
              style={{ background: "oklch(0.50 0.20 300)" }}
            >
              <CheckCircle2 className="w-5 h-5" />
              Save Purchase Entry
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleSaveAndPrint}
                data-ocid="milk.print.primary_button"
                disabled={printer.isPrinting}
                className="flex items-center justify-center gap-2 py-5 rounded-xl border-2 font-semibold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                style={{
                  borderColor: "oklch(0.50 0.20 300)",
                  color: "oklch(0.50 0.20 300)",
                  background: "oklch(0.50 0.20 300 / 0.06)",
                }}
              >
                <Printer className="w-4 h-4" />
                {printer.isPrinting ? "Printing..." : "Print Slip"}
              </button>

              <button
                type="button"
                onClick={handleSaveAndWhatsApp}
                data-ocid="milk.whatsapp.primary_button"
                className="flex items-center justify-center gap-2 py-5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 active:scale-95"
                style={{ background: "oklch(0.55 0.18 142)" }}
              >
                <MessageCircle className="w-4 h-4" />
                Send on WhatsApp
              </button>
            </div>
          </div>
        </motion.div>

        {/* 7-Day Entry Panel */}
        <AnimatePresence>
          {show7Day && (
            <motion.div
              key="7day-panel"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="pos-card overflow-hidden"
              data-ocid="milk.seven_day.panel"
            >
              {/* Panel header */}
              <div
                className="px-8 py-5 flex items-center gap-3"
                style={{ background: "oklch(0.50 0.20 300 / 0.08)" }}
              >
                <CalendarDays
                  className="w-5 h-5 flex-shrink-0"
                  style={{ color: "oklch(0.50 0.20 300)" }}
                />
                <div className="flex-1">
                  <h2 className="font-display font-semibold text-foreground text-base">
                    7 Days Milk Purchase Entry
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {getWeekLabel(s7WeekOffset)}
                  </p>
                </div>
                {/* Week navigation */}
                <div className="flex items-center gap-1 mr-2">
                  <button
                    type="button"
                    onClick={() => setS7WeekOffset((v) => v - 1)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors text-xs font-bold"
                    title="Previous week"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => setS7WeekOffset((v) => Math.min(0, v + 1))}
                    disabled={s7WeekOffset >= 0}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors text-xs font-bold disabled:opacity-30"
                    title="Next week"
                  >
                    ›
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShow7Day(false)}
                  data-ocid="milk.seven_day.close_button"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-8 space-y-5">
                {/* Milk Type */}
                <div>
                  <p className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Milk Type
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {(["Buffalo", "Cow"] as const).map((type) => {
                      const active = s7MilkType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setS7MilkType(type)}
                          data-ocid={`milk.seven_day.type.${type.toLowerCase()}.button`}
                          className={`flex items-center justify-center gap-2 py-4 px-5 rounded-xl border-2 font-semibold text-sm transition-all active:scale-95 ${
                            active
                              ? "text-white"
                              : "border-border bg-secondary text-foreground hover:border-purple-400/50"
                          }`}
                          style={
                            active
                              ? {
                                  background: "oklch(0.50 0.20 300)",
                                  borderColor: "oklch(0.50 0.20 300)",
                                }
                              : {}
                          }
                        >
                          <span className="text-lg">
                            {type === "Buffalo" ? "🐃" : "🐄"}
                          </span>
                          {type} Milk
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Farmer Name */}
                <div>
                  <label
                    htmlFor="s7-supplier-name"
                    className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1"
                  >
                    Farmer Name
                  </label>
                  <input
                    id="s7-supplier-name"
                    type="text"
                    value={s7SupplierName}
                    data-ocid="milk.seven_day.supplier.input"
                    onChange={(e) => {
                      setS7SupplierName(e.target.value);
                      setS7Errors((p) => ({ ...p, supplierName: "" }));
                    }}
                    placeholder="Enter farmer name"
                    className="pos-input"
                  />
                  {s7Errors.supplierName && (
                    <p
                      className="text-xs text-destructive mt-1"
                      data-ocid="milk.seven_day.supplier.error_state"
                    >
                      {s7Errors.supplierName}
                    </p>
                  )}
                </div>

                {/* Morning Rate + Evening Rate */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="s7-morning-rate"
                      className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1"
                    >
                      Morning Rate (Rs./L)
                    </label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <input
                        id="s7-morning-rate"
                        type="number"
                        value={s7MorningRate}
                        data-ocid="milk.seven_day.morning_rate.input"
                        onChange={(e) => {
                          setS7MorningRate(e.target.value);
                          setS7Errors((p) => ({ ...p, morningRate: "" }));
                        }}
                        placeholder="0"
                        min="0"
                        step="0.5"
                        className="pos-input pl-11"
                      />
                    </div>
                    {s7Errors.morningRate && (
                      <p
                        className="text-xs text-destructive mt-1"
                        data-ocid="milk.seven_day.morning_rate.error_state"
                      >
                        {s7Errors.morningRate}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="s7-evening-rate"
                      className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1"
                    >
                      Evening Rate (Rs./L)
                    </label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <input
                        id="s7-evening-rate"
                        type="number"
                        value={s7EveningRate}
                        data-ocid="milk.seven_day.evening_rate.input"
                        onChange={(e) => {
                          setS7EveningRate(e.target.value);
                          setS7Errors((p) => ({ ...p, eveningRate: "" }));
                        }}
                        placeholder="0"
                        min="0"
                        step="0.5"
                        className="pos-input pl-11"
                      />
                    </div>
                    {s7Errors.eveningRate && (
                      <p
                        className="text-xs text-destructive mt-1"
                        data-ocid="milk.seven_day.evening_rate.error_state"
                      >
                        {s7Errors.eveningRate}
                      </p>
                    )}
                  </div>
                </div>

                {/* Fat % + SNF % */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="s7-fat"
                      className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1"
                    >
                      Fat % (Optional)
                    </label>
                    <input
                      id="s7-fat"
                      type="text"
                      value={s7Fat}
                      data-ocid="milk.seven_day.fat.input"
                      onChange={(e) => setS7Fat(e.target.value)}
                      placeholder="e.g. 6.5"
                      className="pos-input"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="s7-snf"
                      className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1"
                    >
                      SNF % (Optional)
                    </label>
                    <input
                      id="s7-snf"
                      type="text"
                      value={s7Snf}
                      data-ocid="milk.seven_day.snf.input"
                      onChange={(e) => setS7Snf(e.target.value)}
                      placeholder="e.g. 8.5"
                      className="pos-input"
                    />
                  </div>
                </div>

                {/* 7-day table */}
                <div>
                  <p className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Daily Quantities
                  </p>
                  {s7Errors.rows && (
                    <p
                      className="text-xs text-destructive mb-2"
                      data-ocid="milk.seven_day.rows.error_state"
                    >
                      {s7Errors.rows}
                    </p>
                  )}
                  <div className="rounded-xl border border-border overflow-hidden">
                    {/* Table header */}
                    <div
                      className="grid gap-0 text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 py-2.5"
                      style={{
                        gridTemplateColumns: "1fr 80px 80px 90px",
                        background: "oklch(0.50 0.20 300 / 0.06)",
                      }}
                    >
                      <span>Date</span>
                      <span className="text-center">Morning</span>
                      <span className="text-center">Evening</span>
                      <span className="text-right">Amount</span>
                    </div>

                    {/* Rows */}
                    {s7DisplayRows.map((row, idx) => {
                      const isToday = (() => {
                        const n = new Date();
                        return (
                          row.date ===
                          `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`
                        );
                      })();
                      const amount = row.amount;
                      return (
                        <div
                          key={row.date}
                          className="grid items-center gap-0 px-3 py-2 border-t border-border"
                          style={{ gridTemplateColumns: "1fr 80px 80px 90px" }}
                          data-ocid={`milk.seven_day.row.item.${idx + 1}`}
                        >
                          <div>
                            <p
                              className="text-xs font-medium"
                              style={
                                isToday ? { color: "oklch(0.50 0.20 300)" } : {}
                              }
                            >
                              {fmtDateLabel(row.date)}
                              {isToday && (
                                <span
                                  className="ml-1 text-[10px] font-bold"
                                  style={{ color: "oklch(0.50 0.20 300)" }}
                                >
                                  Today
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="px-1">
                            <input
                              type="number"
                              value={s7Rows[row.origIdx].morningQty}
                              onChange={(e) =>
                                updateS7Row(
                                  row.origIdx,
                                  "morningQty",
                                  e.target.value,
                                )
                              }
                              data-ocid={`milk.seven_day.morning.input.${idx + 1}`}
                              placeholder="0"
                              min="0"
                              step="0.5"
                              className="w-full text-center text-xs rounded-lg border border-border bg-background px-1 py-1.5 focus:outline-none focus:ring-1"
                              style={{
                                // @ts-ignore
                                "--tw-ring-color": "oklch(0.50 0.20 300)",
                              }}
                            />
                          </div>
                          <div className="px-1">
                            <input
                              type="number"
                              value={s7Rows[row.origIdx].eveningQty}
                              onChange={(e) =>
                                updateS7Row(
                                  row.origIdx,
                                  "eveningQty",
                                  e.target.value,
                                )
                              }
                              data-ocid={`milk.seven_day.evening.input.${idx + 1}`}
                              placeholder="0"
                              min="0"
                              step="0.5"
                              className="w-full text-center text-xs rounded-lg border border-border bg-background px-1 py-1.5 focus:outline-none focus:ring-1"
                              style={{
                                // @ts-ignore
                                "--tw-ring-color": "oklch(0.50 0.20 300)",
                              }}
                            />
                          </div>
                          <div className="text-right">
                            <span
                              className="text-xs font-semibold"
                              style={
                                amount > 0
                                  ? { color: "oklch(0.50 0.20 300)" }
                                  : {}
                              }
                            >
                              {amount > 0 ? `Rs.${Math.round(amount)}` : "—"}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Grand Total row */}
                    <div
                      className="grid items-center gap-0 px-3 py-3 border-t-2"
                      style={{
                        gridTemplateColumns: "1fr 80px 80px 90px",
                        borderColor: "oklch(0.50 0.20 300 / 0.3)",
                        background: "oklch(0.50 0.20 300 / 0.06)",
                      }}
                    >
                      <span className="text-xs font-bold text-foreground">
                        Total
                      </span>
                      <span
                        className="text-center text-xs font-bold"
                        style={{ color: "oklch(0.50 0.20 300)" }}
                      >
                        {s7TotalMorning > 0
                          ? `${s7TotalMorning.toFixed(1)}L`
                          : "—"}
                      </span>
                      <span
                        className="text-center text-xs font-bold"
                        style={{ color: "oklch(0.50 0.20 300)" }}
                      >
                        {s7TotalEvening > 0
                          ? `${s7TotalEvening.toFixed(1)}L`
                          : "—"}
                      </span>
                      <span
                        className="text-right text-xs font-bold"
                        style={{ color: "oklch(0.50 0.20 300)" }}
                      >
                        {s7GrandTotal > 0
                          ? `Rs.${Math.round(s7GrandTotal).toLocaleString("en-IN")}`
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 7-Day Bar Chart */}
                {(() => {
                  const hasData = s7DisplayRows.some(
                    (r) => r.mQty > 0 || r.eQty > 0,
                  );
                  const DAY_ABBR = [
                    "Mon",
                    "Tue",
                    "Wed",
                    "Thu",
                    "Fri",
                    "Sat",
                    "Sun",
                  ];
                  const svgW = 560;
                  const svgH = 280;
                  const padL = 44;
                  const padR = 12;
                  const padT = 30;
                  const padB = 75;
                  const chartW = svgW - padL - padR;
                  const chartH = svgH - padT - padB;
                  const numDays = 7;
                  const groupW = chartW / numDays;
                  const barW = groupW * 0.3;
                  const gap = groupW * 0.05;
                  const maxQty = Math.max(
                    1,
                    ...s7DisplayRows.map((r) => Math.max(r.mQty, r.eQty)),
                  );
                  const niceMax = Math.ceil(maxQty / 5) * 5 || 5;
                  const yTicks = [
                    0,
                    niceMax * 0.25,
                    niceMax * 0.5,
                    niceMax * 0.75,
                    niceMax,
                  ].map((v) => Math.round(v));
                  const scaleY = (v: number) => chartH - (v / niceMax) * chartH;
                  const MORNING_CLR = "oklch(0.50 0.20 300)";
                  const EVENING_CLR = "oklch(0.65 0.18 50)";
                  return (
                    <div>
                      <p className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                        Daily Milk Chart (Mon → Sun)
                      </p>
                      {/* Legend */}
                      <div className="flex gap-4 mb-3 text-xs">
                        <span className="flex items-center gap-1.5">
                          <span
                            className="inline-block w-3 h-3 rounded-sm"
                            style={{ background: MORNING_CLR }}
                          />
                          Morning
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span
                            className="inline-block w-3 h-3 rounded-sm"
                            style={{ background: EVENING_CLR }}
                          />
                          Evening
                        </span>
                      </div>
                      <div style={{ width: "100%", overflowX: "auto" }}>
                        <svg
                          viewBox={`0 0 ${svgW} ${svgH}`}
                          style={{
                            minWidth: 320,
                            width: "100%",
                            display: "block",
                          }}
                          aria-label="Daily milk quantity bar chart"
                          role="img"
                        >
                          {/* Y gridlines + labels */}
                          {yTicks.map((tick) => {
                            const y = padT + scaleY(tick);
                            return (
                              <g key={tick}>
                                <line
                                  x1={padL}
                                  y1={y}
                                  x2={svgW - padR}
                                  y2={y}
                                  stroke="currentColor"
                                  strokeOpacity={0.12}
                                  strokeWidth={1}
                                />
                                <text
                                  x={padL - 4}
                                  y={y + 3}
                                  textAnchor="end"
                                  fontSize={9}
                                  fill="currentColor"
                                  fillOpacity={0.55}
                                >
                                  {tick}L
                                </text>
                              </g>
                            );
                          })}

                          {/* Bars */}
                          {s7DisplayRows.map((row, i) => {
                            const gx = padL + i * groupW;
                            const cx = gx + groupW / 2;
                            const mBarH = (row.mQty / niceMax) * chartH;
                            const eBarH = (row.eQty / niceMax) * chartH;
                            const mX = cx - barW - gap / 2;
                            const eX = cx + gap / 2;
                            const baseY = padT + chartH;
                            const dayIdx =
                              (new Date(row.date).getDay() || 7) - 1;
                            const dayLabel = DAY_ABBR[dayIdx] ?? "";
                            const amtLabel =
                              row.amount > 0
                                ? `Rs.${Math.round(row.amount).toLocaleString("en-IN")}`
                                : "";
                            return (
                              <g key={row.date}>
                                {/* Morning bar */}
                                {row.mQty > 0 && (
                                  <>
                                    <rect
                                      x={mX}
                                      y={baseY - mBarH}
                                      width={barW}
                                      height={mBarH}
                                      rx={3}
                                      fill={MORNING_CLR}
                                      fillOpacity={0.85}
                                    />
                                    <text
                                      x={mX + barW / 2}
                                      y={baseY - mBarH - 4}
                                      textAnchor="middle"
                                      fontSize={8}
                                      fill={MORNING_CLR}
                                      fontWeight="600"
                                    >
                                      {row.mQty % 1 === 0
                                        ? `${row.mQty}L`
                                        : `${row.mQty.toFixed(1)}L`}
                                    </text>
                                  </>
                                )}
                                {/* Evening bar */}
                                {row.eQty > 0 && (
                                  <>
                                    <rect
                                      x={eX}
                                      y={baseY - eBarH}
                                      width={barW}
                                      height={eBarH}
                                      rx={3}
                                      fill={EVENING_CLR}
                                      fillOpacity={0.85}
                                    />
                                    <text
                                      x={eX + barW / 2}
                                      y={baseY - eBarH - 4}
                                      textAnchor="middle"
                                      fontSize={8}
                                      fill={EVENING_CLR}
                                      fontWeight="600"
                                    >
                                      {row.eQty % 1 === 0
                                        ? `${row.eQty}L`
                                        : `${row.eQty.toFixed(1)}L`}
                                    </text>
                                  </>
                                )}
                                {/* Day label */}
                                <text
                                  x={cx}
                                  y={baseY + 14}
                                  textAnchor="middle"
                                  fontSize={10}
                                  fill="currentColor"
                                  fillOpacity={0.7}
                                  fontWeight="600"
                                >
                                  {dayLabel}
                                </text>
                                {/* Date label below day */}
                                <text
                                  x={cx}
                                  y={baseY + 26}
                                  textAnchor="middle"
                                  fontSize={8}
                                  fill="currentColor"
                                  fillOpacity={0.55}
                                >
                                  {new Intl.DateTimeFormat("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                  }).format(new Date(row.date))}
                                </text>
                                {/* Amount label */}
                                {amtLabel && (
                                  <text
                                    x={cx}
                                    y={baseY + 40}
                                    textAnchor="middle"
                                    fontSize={8}
                                    fill="currentColor"
                                    fillOpacity={0.55}
                                  >
                                    {amtLabel}
                                  </text>
                                )}
                              </g>
                            );
                          })}

                          {/* X axis baseline */}
                          <line
                            x1={padL}
                            y1={padT + chartH}
                            x2={svgW - padR}
                            y2={padT + chartH}
                            stroke="currentColor"
                            strokeOpacity={0.2}
                            strokeWidth={1}
                          />
                        </svg>
                      </div>
                      {!hasData && (
                        <p className="text-center text-xs text-muted-foreground py-3">
                          Enter quantities above to see chart
                        </p>
                      )}
                    </div>
                  );
                })()}

                {/* Grand total preview */}
                {s7GrandTotal > 0 && (
                  <div
                    className="rounded-xl p-5 flex items-center justify-between"
                    style={{ background: "oklch(0.50 0.20 300 / 0.08)" }}
                  >
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Grand Total
                      </p>
                      <p
                        className="font-display font-bold text-xl"
                        style={{ color: "oklch(0.50 0.20 300)" }}
                      >
                        {formatCurrency(s7GrandTotal)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {(s7TotalMorning + s7TotalEvening).toFixed(1)} L total
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Morning {s7TotalMorning.toFixed(1)}L · Evening{" "}
                        {s7TotalEvening.toFixed(1)}L
                      </p>
                    </div>
                  </div>
                )}

                {/* WhatsApp */}
                <div>
                  <label
                    htmlFor="s7-whatsapp"
                    className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1"
                  >
                    WhatsApp Number (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <input
                      id="s7-whatsapp"
                      type="tel"
                      value={s7WhatsApp}
                      data-ocid="milk.seven_day.whatsapp.input"
                      onChange={(e) => setS7WhatsApp(e.target.value)}
                      placeholder="e.g. 9876543210"
                      maxLength={10}
                      className="pos-input pl-11"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handle7DaySave}
                    data-ocid="milk.seven_day.save.primary_button"
                    className="w-full py-6 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95"
                    style={{ background: "oklch(0.50 0.20 300)" }}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Save 7-Day Entry
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={handle7DaySaveAndPrint}
                      data-ocid="milk.seven_day.print.primary_button"
                      disabled={printer.isPrinting}
                      className="flex items-center justify-center gap-2 py-5 rounded-xl border-2 font-semibold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                      style={{
                        borderColor: "oklch(0.50 0.20 300)",
                        color: "oklch(0.50 0.20 300)",
                        background: "oklch(0.50 0.20 300 / 0.06)",
                      }}
                    >
                      <Printer className="w-4 h-4" />
                      {printer.isPrinting ? "Printing..." : "Print Slip"}
                    </button>

                    <button
                      type="button"
                      onClick={handle7DaySaveAndWhatsApp}
                      data-ocid="milk.seven_day.whatsapp.primary_button"
                      className="flex items-center justify-center gap-2 py-5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 active:scale-95"
                      style={{ background: "oklch(0.55 0.18 142)" }}
                    >
                      <MessageCircle className="w-4 h-4" />
                      Send on WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History Section */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="pos-card overflow-hidden"
            >
              <div className="px-8 py-7 border-b border-border flex items-center justify-between">
                <h2 className="font-display font-semibold text-foreground text-base flex items-center gap-2">
                  <ClipboardList
                    className="w-4 h-4"
                    style={{ color: "oklch(0.50 0.20 300)" }}
                  />
                  Purchase History
                </h2>
                <span className="text-xs text-muted-foreground">
                  {records.length} record{records.length !== 1 ? "s" : ""}
                </span>
              </div>

              {records.length === 0 ? (
                <div
                  className="py-12 text-center"
                  data-ocid="milk.history.empty_state"
                >
                  <p className="text-muted-foreground text-sm">
                    No purchases recorded yet
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {records.map((r, idx) => (
                    <div
                      key={r.id}
                      className="px-8 py-6"
                      data-ocid={`milk.history.item.${idx + 1}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-2xl flex-shrink-0">
                            {r.milkType === "Buffalo" ? "🐃" : "🐄"}
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-foreground truncate">
                              {r.supplierName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {r.milkType} Milk &middot; {r.quantity}L @ Rs.
                              {r.ratePerLiter}/L
                            </p>
                            {(r.fat || r.snf) && (
                              <p className="text-xs text-muted-foreground">
                                {r.fat ? `Fat: ${r.fat}%` : ""}
                                {r.fat && r.snf ? " · " : ""}
                                {r.snf ? `SNF: ${r.snf}%` : ""}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatDateTime(r.date)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span
                            className="font-display font-bold text-sm"
                            style={{ color: "oklch(0.50 0.20 300)" }}
                          >
                            {formatCurrency(r.totalAmount)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handlePrint(r)}
                            disabled={!printerConnected || printer.isPrinting}
                            data-ocid={`milk.history.print.button.${idx + 1}`}
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                            style={{
                              color: printerConnected
                                ? "oklch(0.50 0.20 300)"
                                : undefined,
                            }}
                            aria-label="Print slip"
                            title={
                              printerConnected
                                ? "Print slip"
                                : "Connect 58Printer first"
                            }
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(r.id)}
                            data-ocid={`milk.history.delete_button.${idx + 1}`}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            aria-label="Delete record"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-xs text-muted-foreground pb-4">
          All Rights Reserved. Nanaji Dudh Dairy &reg;&copy; 2026
        </p>
      </div>
    </div>
  );
}
