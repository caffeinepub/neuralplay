import { create } from "zustand";

export interface CartItem {
  id: string;
  name: string;
  price: number;
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
  addItem: (name: string, price: number) => void;
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

export const usePOSStore = create<POSStore>((set, get) => ({
  isLoggedIn: false,
  login: () => set({ isLoggedIn: true }),
  logout: () => {
    syncDisplay([], 0, false);
    set({ isLoggedIn: false, ...emptyCartState });
  },

  cart: [],
  addItem: (name, price) => {
    set((s) => {
      const newItem: CartItem = { id: Date.now().toString(), name, price };
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
          `Payment of rupees ${total} received successfully.`,
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

  getLast30DaysSales: () => getAllLast30DaysSales(),
}));
