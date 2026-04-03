import { create } from "zustand";

export interface CartItem {
  id: string;
  name: string;
  price: number; // total line price = unitPrice * qty
  unitPrice: number;
  qty: number;
}

interface DailySales {
  total: number;
  count: number;
}

export interface SaleRecord {
  id: string;
  items: CartItem[];
  total: number;
  date: string;
}

interface POSStore {
  // Auth
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;

  // Cart
  cart: CartItem[];
  addItem: (name: string, unitPrice: number, qty: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;

  // QR / Payment
  qrDataUrl: string;
  showQR: boolean;
  paymentSuccess: boolean;
  generateQR: () => void;
  confirmPayment: () => void;
  newCustomer: () => void;

  // Dark mode
  darkMode: boolean;
  toggleDarkMode: () => void;

  // Quick preset selection
  selectedPreset: string | null;
  setSelectedPreset: (name: string | null) => void;

  // Sales
  getDailySales: () => DailySales;
  addSale: (amount: number) => void;
  saveCartAsSale: () => void;
  getLast30DaysSales: () => SaleRecord[];
}

const SALES_KEY = "ndd_sales";
const DARK_KEY = "ndd_dark";
const DISPLAY_KEY = "ndd_display";

function getStoredDark(): boolean {
  try {
    return localStorage.getItem(DARK_KEY) === "true";
  } catch {
    return false;
  }
}

function saveSale(tx: SaleRecord): void {
  try {
    const raw = localStorage.getItem(SALES_KEY);
    const sales: SaleRecord[] = raw ? (JSON.parse(raw) as SaleRecord[]) : [];
    sales.push(tx);
    localStorage.setItem(SALES_KEY, JSON.stringify(sales));
  } catch {
    // ignore storage errors
  }
}

function getTodaySales(): SaleRecord[] {
  try {
    const raw = localStorage.getItem(SALES_KEY);
    const sales: SaleRecord[] = raw ? (JSON.parse(raw) as SaleRecord[]) : [];
    const today = new Date().toDateString();
    return sales.filter((s) => new Date(s.date).toDateString() === today);
  } catch {
    return [];
  }
}

function getAllLast30DaysSales(): SaleRecord[] {
  try {
    const raw = localStorage.getItem(SALES_KEY);
    const sales: SaleRecord[] = raw ? (JSON.parse(raw) as SaleRecord[]) : [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return sales
      .filter((s) => new Date(s.date) >= cutoff)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch {
    return [];
  }
}

function buildUPIString(total: number): string {
  return `upi://pay?pa=7820957013@ibl&pn=Nanaji%20Dudh%20Dairy&am=${total}&cu=INR`;
}

function syncDisplay(cart: CartItem[], total: number, showQR: boolean): void {
  try {
    localStorage.setItem(
      DISPLAY_KEY,
      JSON.stringify({ cart, total, showQR, ts: Date.now() }),
    );
  } catch {
    // ignore
  }
}

const emptyCartState = {
  cart: [] as CartItem[],
  showQR: false,
  qrDataUrl: "",
  paymentSuccess: false,
  selectedPreset: null as string | null,
};

function amountWords(n: number): string {
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
  function below1000(x: number): string {
    if (x === 0) return "";
    if (x < 20) return `${ones[x]} `;
    if (x < 100)
      return tens[Math.floor(x / 10)] + (x % 10 ? ` ${ones[x % 10]} ` : " ");
    return `${ones[Math.floor(x / 100)]} Hundred ${below1000(x % 100)}`;
  }
  const r = Math.round(n);
  let res = "";
  const th = Math.floor(r / 1000);
  const rem = r % 1000;
  if (th > 0) res += `${below1000(th)}Thousand `;
  if (rem > 0) res += below1000(rem);
  return res.trim() || "Zero";
}

export const usePOSStore = create<POSStore>((set, get) => ({
  isLoggedIn: false,
  login: () => set({ isLoggedIn: true }),
  logout: () => {
    syncDisplay([], 0, false);
    set({ isLoggedIn: false, ...emptyCartState });
  },

  cart: [],
  addItem: (name, unitPrice, qty) => {
    set((s) => {
      const newItem: CartItem = {
        id: Date.now().toString(),
        name,
        unitPrice,
        qty,
        price: unitPrice * qty,
      };
      const cart = [...s.cart, newItem];
      const total = cart.reduce((acc, item) => acc + item.price, 0);
      syncDisplay(cart, total, false);
      return {
        cart,
        showQR: false,
        qrDataUrl: "",
        paymentSuccess: false,
        selectedPreset: null,
      };
    });
  },
  removeItem: (id) => {
    set((s) => {
      const cart = s.cart.filter((item) => item.id !== id);
      const total = cart.reduce((acc, item) => acc + item.price, 0);
      syncDisplay(cart, total, false);
      return { cart, showQR: false, qrDataUrl: "", paymentSuccess: false };
    });
  },
  clearCart: () => {
    syncDisplay([], 0, false);
    set({ ...emptyCartState });
  },

  qrDataUrl: "",
  showQR: false,
  paymentSuccess: false,

  generateQR: () => {
    const { cart } = get();
    const total = cart.reduce((acc, item) => acc + item.price, 0);
    if (total <= 0) return;
    const upi = buildUPIString(total);
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&ecc=M&data=${encodeURIComponent(upi)}`;
    syncDisplay(cart, total, true);
    set({ qrDataUrl: url, showQR: true });
  },

  confirmPayment: () => {
    const { cart } = get();
    const total = cart.reduce((acc, item) => acc + item.price, 0);
    const tx: SaleRecord = {
      id: Date.now().toString(),
      items: [...cart],
      total,
      date: new Date().toISOString(),
    };
    saveSale(tx);
    set({ paymentSuccess: true });

    // Notification beep + voice announcement
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // audio not available
    }

    setTimeout(() => {
      if (window.speechSynthesis) {
        const utter = new SpeechSynthesisUtterance(
          `Payment of rupees ${amountWords(total)} only, received successfully.`,
        );
        utter.lang = "en-IN";
        utter.rate = 0.95;
        window.speechSynthesis.speak(utter);
      }
    }, 500);
  },

  newCustomer: () => {
    syncDisplay([], 0, false);
    set({ ...emptyCartState });
  },

  darkMode: getStoredDark(),
  toggleDarkMode: () => {
    const next = !get().darkMode;
    try {
      localStorage.setItem(DARK_KEY, String(next));
      if (next) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch {
      // ignore
    }
    set({ darkMode: next });
  },

  selectedPreset: null,
  setSelectedPreset: (name) => set({ selectedPreset: name }),

  getDailySales: () => {
    const sales = getTodaySales();
    return {
      total: sales.reduce((acc, s) => acc + s.total, 0),
      count: sales.length,
    };
  },

  addSale: (amount) => {
    const tx: SaleRecord = {
      id: Date.now().toString(),
      items: [],
      total: amount,
      date: new Date().toISOString(),
    };
    saveSale(tx);
  },

  saveCartAsSale: () => {
    const { cart } = get();
    const total = cart.reduce((acc, item) => acc + item.price, 0);
    if (cart.length === 0 || total <= 0) return;
    const tx: SaleRecord = {
      id: Date.now().toString(),
      items: [...cart],
      total,
      date: new Date().toISOString(),
    };
    saveSale(tx);
  },

  getLast30DaysSales: () => getAllLast30DaysSales(),
}));
