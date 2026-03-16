import { create } from "zustand";

export interface CartItem {
  id: string;
  name: string;
  price: number;
}

export interface SaleTransaction {
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

  // Sales
  getDailySales: () => { total: number; count: number };
}

const SALES_KEY = "ndd_sales";
const DARK_KEY = "ndd_dark";

function getStoredDark(): boolean {
  try {
    return localStorage.getItem(DARK_KEY) === "true";
  } catch {
    return false;
  }
}

function saveSale(tx: SaleTransaction) {
  try {
    const raw = localStorage.getItem(SALES_KEY);
    const sales: SaleTransaction[] = raw ? JSON.parse(raw) : [];
    sales.push(tx);
    localStorage.setItem(SALES_KEY, JSON.stringify(sales));
  } catch {
    // ignore
  }
}

function getTodaySales(): SaleTransaction[] {
  try {
    const raw = localStorage.getItem(SALES_KEY);
    const sales: SaleTransaction[] = raw ? JSON.parse(raw) : [];
    const today = new Date().toDateString();
    return sales.filter((s) => new Date(s.date).toDateString() === today);
  } catch {
    return [];
  }
}

function buildUPIString(total: number): string {
  return `upi://pay?pa=7820957013@ibl&pn=Nanaji%20Dudh%20Dairy&am=${total}&cu=INR`;
}

function syncToStorage(cart: CartItem[], total: number, showQR: boolean) {
  try {
    localStorage.setItem(
      "ndd_display",
      JSON.stringify({ cart, total, showQR, ts: Date.now() }),
    );
  } catch {
    // ignore
  }
}

export const usePOSStore = create<POSStore>((set, get) => ({
  isLoggedIn: false,
  login: () => set({ isLoggedIn: true }),
  logout: () =>
    set({
      isLoggedIn: false,
      cart: [],
      showQR: false,
      qrDataUrl: "",
      paymentSuccess: false,
    }),

  cart: [],
  addItem: (name, price) => {
    const item: CartItem = { id: Date.now().toString(), name, price };
    set((s) => {
      const cart = [...s.cart, item];
      const total = cart.reduce((a, c) => a + c.price, 0);
      syncToStorage(cart, total, s.showQR);
      return { cart, showQR: false, qrDataUrl: "", paymentSuccess: false };
    });
  },
  removeItem: (id) => {
    set((s) => {
      const cart = s.cart.filter((i) => i.id !== id);
      const total = cart.reduce((a, c) => a + c.price, 0);
      syncToStorage(cart, total, false);
      return { cart, showQR: false, qrDataUrl: "", paymentSuccess: false };
    });
  },
  clearCart: () => {
    syncToStorage([], 0, false);
    set({ cart: [], showQR: false, qrDataUrl: "", paymentSuccess: false });
  },

  qrDataUrl: "",
  showQR: false,
  paymentSuccess: false,

  generateQR: () => {
    const { cart } = get();
    const total = cart.reduce((a, c) => a + c.price, 0);
    const upi = buildUPIString(total);
    const encoded = encodeURIComponent(upi);
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&ecc=M&data=${encoded}`;
    syncToStorage(cart, total, true);
    set({ qrDataUrl: url, showQR: true });
  },

  confirmPayment: () => {
    const { cart } = get();
    const total = cart.reduce((a, c) => a + c.price, 0);
    const tx: SaleTransaction = {
      id: Date.now().toString(),
      items: [...cart],
      total,
      date: new Date().toISOString(),
    };
    saveSale(tx);
    set({ paymentSuccess: true });

    // Voice announcement
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
    } catch {
      // ignore audio errors
    }
  },

  newCustomer: () => {
    syncToStorage([], 0, false);
    set({ cart: [], showQR: false, qrDataUrl: "", paymentSuccess: false });
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

  getDailySales: () => {
    const sales = getTodaySales();
    return {
      total: sales.reduce((a, s) => a + s.total, 0),
      count: sales.length,
    };
  },
}));
