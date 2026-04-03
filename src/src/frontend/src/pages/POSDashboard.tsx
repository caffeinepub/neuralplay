import SalesReportModal from "@/components/SalesReportModal";
import {
  buildReceiptBytes,
  useBluetoothPrinter,
} from "@/hooks/useBluetoothPrinter";
import { usePOSStore } from "@/store/posStore";
import { useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  Bluetooth,
  BluetoothConnected,
  BluetoothOff,
  CheckCircle2,
  IndianRupee,
  Loader2,
  LogOut,
  MessageCircle,
  Milk,
  Monitor,
  Moon,
  Phone,
  Plus,
  Printer,
  QrCode,
  ShoppingBag,
  Sun,
  Trash2,
  TrendingUp,
  UserPlus,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const QUICK_PRODUCTS = [
  { name: "Dudh", emoji: "🥛" },
  { name: "Buffalo Ghee", emoji: "🧈" },
  { name: "Dahi", emoji: "🍶" },
  { name: "Tak", emoji: "💧" },
  { name: "Lassi", emoji: "🥤" },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDateTime(): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());
}

function buildWhatsAppMessage(
  cart: { name: string; price: number }[],
  total: number,
  dateTime: string,
): string {
  const lines: string[] = [];
  lines.push("*Nanaji Dudh Dairy*");
  lines.push("Bill Receipt");
  lines.push(dateTime);
  lines.push("");
  lines.push("-------------------------------");
  cart.forEach((item, idx) => {
    const priceStr = Number.isInteger(item.price)
      ? item.price.toString()
      : item.price.toFixed(2).replace(/\.?0+$/, "");
    lines.push(`${idx + 1}. ${item.name}  Rs.${priceStr}`);
  });
  lines.push("-------------------------------");
  lines.push(`*Total: Rs.${Math.floor(total)}*`);
  lines.push("");
  lines.push("Thank you for your purchase!");
  return lines.join("\n");
}

export default function POSDashboard() {
  const navigate = useNavigate();

  const {
    isLoggedIn,
    cart,
    addItem,
    removeItem,
    clearCart,
    qrDataUrl,
    showQR,
    paymentSuccess,
    generateQR,
    confirmPayment,
    newCustomer,
    darkMode,
    toggleDarkMode,
    logout,
    getDailySales,
    getLast30DaysSales,
    selectedPreset,
    setSelectedPreset,
  } = usePOSStore();

  const {
    status: btStatus,
    deviceName,
    errorMsg,
    connect,
    disconnect,
    print,
    isPrinting,
    isConnecting,
    isConnected,
  } = useBluetoothPrinter();

  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [nameError, setNameError] = useState("");
  const [priceError, setPriceError] = useState("");
  const [currentTime, setCurrentTime] = useState(formatDateTime);
  const [dailySales, setDailySales] = useState({ total: 0, count: 0 });
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappError, setWhatsappError] = useState("");
  const [salesReportOpen, setSalesReportOpen] = useState(false);

  const priceInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const addFormRef = useRef<HTMLDivElement>(null);

  const total = cart.reduce((acc, item) => acc + item.price, 0);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate({ to: "/" });
    }
  }, [isLoggedIn, navigate]);

  // Apply dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Load initial daily sales
  useEffect(() => {
    setDailySales(getDailySales());
  }, [getDailySales]);

  // Refresh daily sales after payment
  useEffect(() => {
    if (paymentSuccess) {
      setDailySales(getDailySales());
    }
  }, [paymentSuccess, getDailySales]);

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(formatDateTime()), 30_000);
    return () => clearInterval(timer);
  }, []);

  // Sync productName when a preset is selected from store
  useEffect(() => {
    if (selectedPreset !== null) {
      setProductName(selectedPreset);
      setNameError("");
    }
  }, [selectedPreset]);

  const handleQuickSelect = useCallback(
    (name: string) => {
      setSelectedPreset(name);
      setProductPrice("");
      setPriceError("");
      setTimeout(() => priceInputRef.current?.focus(), 50);
    },
    [setSelectedPreset],
  );

  const handleAddProduct = useCallback(() => {
    let valid = true;
    const trimmedName = productName.trim();
    if (!trimmedName) {
      setNameError("Product name is required");
      valid = false;
    } else {
      setNameError("");
    }
    const price = Number.parseFloat(productPrice);
    if (!productPrice || Number.isNaN(price) || price <= 0) {
      setPriceError("Enter a valid price");
      valid = false;
    } else {
      setPriceError("");
    }
    if (!valid) return;
    addItem(trimmedName, price);
    setProductName("");
    setProductPrice("");
    setSelectedPreset(null);
  }, [productName, productPrice, addItem, setSelectedPreset]);

  const handleAddNew = useCallback(() => {
    setProductName("");
    setProductPrice("");
    setNameError("");
    setPriceError("");
    setSelectedPreset(null);
    setTimeout(() => {
      addFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      nameInputRef.current?.focus();
    }, 50);
  }, [setSelectedPreset]);

  const handlePrintBill = useCallback(async () => {
    if (!isConnected) {
      toast.error("Connect 58Printer via Bluetooth first");
      return;
    }
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    const billNo = `B${String(Date.now()).slice(-6)}`;
    const data = buildReceiptBytes(cart, total, billNo);
    const ok = await print(data);
    if (ok) {
      toast.success("Receipt sent to 58Printer!");
    } else {
      toast.error(errorMsg ?? "Print failed");
    }
  }, [isConnected, cart, total, print, errorMsg]);

  const handleSendWhatsApp = useCallback(() => {
    if (cart.length === 0) {
      toast.error("Cart is empty — add products first");
      return;
    }
    const raw = whatsappNumber.trim().replace(/[^0-9+]/g, "");
    if (!raw || raw.replace(/\+/g, "").length < 10) {
      setWhatsappError("Enter a valid 10-digit WhatsApp number");
      return;
    }
    setWhatsappError("");
    const withCode = raw.startsWith("+") ? raw : `91${raw}`;
    const message = buildWhatsAppMessage(cart, total, currentTime);
    const url = `https://wa.me/${withCode}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success("Opening WhatsApp to send bill...");
  }, [cart, total, whatsappNumber, currentTime]);

  function handleLogout() {
    logout();
    navigate({ to: "/" });
  }

  const canPrint = isConnected && cart.length > 0 && !isPrinting;

  // WhatsApp Send Bill section
  const WhatsAppSection = (
    <div
      className="px-9 py-7 border-t border-border"
      data-ocid="pos.whatsapp.section"
    >
      <h3 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
        <MessageCircle className="w-4 h-4" style={{ color: "#25D366" }} />
        Send Bill on WhatsApp
      </h3>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="tel"
            value={whatsappNumber}
            onChange={(e) => {
              setWhatsappNumber(e.target.value);
              setWhatsappError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSendWhatsApp()}
            placeholder="Customer WhatsApp no."
            className="pos-input pl-11 text-sm"
            maxLength={15}
            data-ocid="pos.whatsapp_number.input"
          />
        </div>
        <button
          type="button"
          onClick={handleSendWhatsApp}
          disabled={cart.length === 0}
          className="px-7 py-5 rounded-xl font-semibold text-white text-sm flex items-center gap-1.5 transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          style={{ background: "#25D366" }}
          data-ocid="pos.send_whatsapp.button"
        >
          <MessageCircle className="w-4 h-4" />
          Send
        </button>
      </div>
      {whatsappError && (
        <p
          className="text-xs text-destructive mt-1"
          data-ocid="pos.whatsapp.error_state"
        >
          {whatsappError}
        </p>
      )}
      <p className="text-xs text-muted-foreground mt-1.5">
        Opens WhatsApp with bill pre-filled. One tap to send.
      </p>
    </div>
  );

  return (
    <div className="min-h-dvh bg-background">
      {/* ─── Header ─── */}
      <header
        className="sticky top-0 z-30 border-b border-border px-7 py-5 flex items-center justify-between gap-2"
        style={{ background: "oklch(0.50 0.20 300)" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Milk className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display font-bold text-white text-base leading-tight truncate">
              Nanaji Dudh Dairy
            </h1>
            <p className="text-white/70 text-xs">POS Terminal</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Bluetooth Button */}
          {btStatus === "disconnected" && (
            <button
              type="button"
              onClick={connect}
              className="flex items-center gap-1.5 px-5 py-4 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-medium transition-colors"
              data-ocid="pos.bluetooth_connect.button"
              title="Connect 58Printer via Bluetooth"
            >
              <Bluetooth className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Connect 58Printer</span>
            </button>
          )}
          {isConnecting && (
            <div className="flex items-center gap-1.5 px-5 py-4 rounded-lg bg-white/15 text-white text-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="hidden sm:inline">Connecting...</span>
            </div>
          )}
          {isConnected && (
            <div className="flex items-center gap-1.5 px-5 py-4 rounded-lg bg-white/20 text-white text-xs">
              {isPrinting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
              )}
              <span className="hidden sm:inline max-w-[80px] truncate">
                {isPrinting ? "Printing..." : (deviceName ?? "58Printer")}
              </span>
              {!isPrinting && (
                <button
                  type="button"
                  onClick={disconnect}
                  className="ml-1 text-white/60 hover:text-white transition-colors"
                  aria-label="Disconnect printer"
                  data-ocid="pos.bluetooth_disconnect.button"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
          {btStatus === "error" && (
            <button
              type="button"
              onClick={connect}
              className="flex items-center gap-1.5 px-5 py-4 rounded-lg bg-red-500/30 hover:bg-red-500/40 text-white text-xs font-medium transition-colors"
              data-ocid="pos.bluetooth_connect.button"
              title={errorMsg ?? "Printer error — click to retry"}
            >
              <BluetoothOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Retry 58Printer</span>
            </button>
          )}

          {/* Milk Purchase */}
          <button
            type="button"
            onClick={() => navigate({ to: "/milk-purchase" })}
            className="flex items-center gap-1.5 px-5 py-4 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-medium transition-colors"
            data-ocid="pos.milk_purchase.button"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Milk Purchase</span>
          </button>

          {/* Customer Display */}
          <button
            type="button"
            onClick={() =>
              window.open("/customer-display", "_blank", "width=900,height=700")
            }
            className="flex items-center gap-1.5 px-5 py-4 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-medium transition-colors"
            data-ocid="pos.customer_display.button"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Customer Display</span>
          </button>

          {/* Dark Mode */}
          <button
            type="button"
            onClick={toggleDarkMode}
            className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
            aria-label="Toggle dark mode"
            data-ocid="pos.dark_mode.toggle"
          >
            {darkMode ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
            aria-label="Logout"
            data-ocid="pos.logout.button"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ─── Main Layout ─── */}
      <div className="max-w-6xl mx-auto p-7 lg:p-9">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* ══ LEFT COLUMN ══ */}
          <div className="space-y-4">
            {/* Daily Sales + 30-Day Report Button */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="pos-card p-7"
              data-ocid="pos.daily_sales.card"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "oklch(0.50 0.20 300 / 0.12)" }}
                >
                  <TrendingUp
                    className="w-6 h-6"
                    style={{ color: "oklch(0.50 0.20 300)" }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Today&apos;s Sales
                  </p>
                  <p className="font-display text-xl font-bold text-foreground">
                    {formatCurrency(dailySales.total)}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-muted-foreground">Transactions</p>
                  <p
                    className="font-display text-xl font-bold"
                    style={{ color: "oklch(0.50 0.20 300)" }}
                  >
                    {dailySales.count}
                  </p>
                </div>
              </div>

              {/* 30-Day Sales Report Button */}
              <button
                type="button"
                onClick={() => setSalesReportOpen(true)}
                className="mt-3 w-full py-5 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95"
                style={{ background: "oklch(0.50 0.20 300)" }}
                data-ocid="pos.sales_report.button"
              >
                <BarChart3 className="w-4 h-4" />
                View 30-Day Sales Report
              </button>
            </motion.div>

            {/* Quick Add Presets */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 }}
              className="pos-card p-7"
            >
              <h2 className="font-display font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                <Zap
                  className="w-4 h-4"
                  style={{ color: "oklch(0.50 0.20 300)" }}
                />
                Quick Add
              </h2>
              <div
                className="grid grid-cols-2 sm:grid-cols-3 gap-2"
                data-ocid="pos.quick_add.panel"
              >
                {QUICK_PRODUCTS.map((p, idx) => {
                  const active = productName === p.name;
                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => handleQuickSelect(p.name)}
                      className={`flex items-center gap-2.5 px-7 py-5 rounded-xl border-2 font-medium text-sm transition-all active:scale-95 hover:shadow-md ${
                        active
                          ? "text-white shadow-purple-glow"
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
                      data-ocid={`pos.quick_add.button.${idx + 1}`}
                    >
                      <span className="text-lg leading-none">{p.emoji}</span>
                      <span>{p.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* + Add New Product */}
              <div className="flex justify-center mt-3">
                <motion.button
                  type="button"
                  onClick={handleAddNew}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.92 }}
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-purple-glow"
                  style={{ background: "oklch(0.50 0.20 300)" }}
                  aria-label="Add new custom product"
                  title="Add a custom product"
                  data-ocid="pos.quick_add_new.button"
                >
                  <Plus className="w-6 h-6" />
                </motion.button>
              </div>

              {productName &&
                QUICK_PRODUCTS.some((p) => p.name === productName) && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    <span
                      style={{ color: "oklch(0.50 0.20 300)" }}
                      className="font-semibold"
                    >
                      {productName}
                    </span>{" "}
                    selected — enter amount below and tap Add
                  </p>
                )}
            </motion.div>

            {/* Add Product Form */}
            <motion.div
              ref={addFormRef}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.07 }}
              className="pos-card p-8"
            >
              <h2 className="font-display font-semibold text-foreground text-base mb-4 flex items-center gap-2">
                <Plus
                  className="w-4 h-4"
                  style={{ color: "oklch(0.50 0.20 300)" }}
                />
                Add Product
              </h2>
              <div className="space-y-3">
                <div>
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={productName}
                    onChange={(e) => {
                      setProductName(e.target.value);
                      setNameError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleAddProduct()}
                    placeholder="Product name (e.g. Fresh Milk)"
                    className="pos-input"
                    data-ocid="pos.product_name.input"
                  />
                  {nameError && (
                    <p
                      className="text-xs text-destructive mt-1"
                      data-ocid="pos.name.error_state"
                    >
                      {nameError}
                    </p>
                  )}
                </div>

                <div>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <input
                      ref={priceInputRef}
                      type="number"
                      value={productPrice}
                      onChange={(e) => {
                        setProductPrice(e.target.value);
                        setPriceError("");
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleAddProduct()}
                      placeholder="Price"
                      min="0"
                      step="0.5"
                      className="pos-input pl-11"
                      data-ocid="pos.product_price.input"
                    />
                  </div>
                  {priceError && (
                    <p
                      className="text-xs text-destructive mt-1"
                      data-ocid="pos.price.error_state"
                    >
                      {priceError}
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleAddProduct}
                    className="flex-1 py-5 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90 active:scale-95 flex items-center justify-center gap-2 shadow-purple-glow"
                    style={{ background: "oklch(0.50 0.20 300)" }}
                    data-ocid="pos.add_product.button"
                  >
                    <Plus className="w-4 h-4" />
                    Add Product
                  </button>
                  <button
                    type="button"
                    onClick={clearCart}
                    disabled={cart.length === 0}
                    className="px-7 py-5 rounded-xl font-medium text-sm border border-border bg-secondary text-secondary-foreground hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                    data-ocid="pos.clear_cart.button"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Cart Items */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="pos-card overflow-hidden"
            >
              <div className="px-8 py-7 border-b border-border flex items-center gap-2">
                <h2 className="font-display font-semibold text-foreground text-base">
                  Cart Items
                </h2>
                {cart.length > 0 && (
                  <span
                    className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold text-white"
                    style={{ background: "oklch(0.50 0.20 300)" }}
                  >
                    {cart.length}
                  </span>
                )}
              </div>

              {cart.length === 0 ? (
                <div
                  className="py-15 text-center"
                  data-ocid="pos.cart.empty_state"
                >
                  <div
                    className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                    style={{ background: "oklch(0.50 0.20 300 / 0.10)" }}
                  >
                    <Milk
                      className="w-7 h-7"
                      style={{ color: "oklch(0.50 0.20 300)" }}
                    />
                  </div>
                  <p className="text-muted-foreground text-sm">
                    No items added yet
                  </p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Add products above to start billing
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  <AnimatePresence>
                    {cart.map((item, idx) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 12, height: 0 }}
                        className="flex items-center gap-3 px-8 py-6"
                        data-ocid={`pos.cart.item.${idx + 1}`}
                      >
                        <span className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-xs font-bold text-secondary-foreground flex-shrink-0">
                          {idx + 1}
                        </span>
                        <span className="flex-1 font-medium text-foreground text-sm truncate">
                          {item.name}
                        </span>
                        <span
                          className="font-semibold text-sm flex-shrink-0"
                          style={{ color: "oklch(0.50 0.20 300)" }}
                        >
                          {formatCurrency(item.price)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
                          aria-label={`Remove ${item.name}`}
                          data-ocid={`pos.remove_item.button.${idx + 1}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </div>

          {/* ══ RIGHT COLUMN ══ */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="pos-card overflow-hidden"
            >
              {/* Bill Header */}
              <div
                className="px-9 py-8 text-center"
                style={{ background: "oklch(0.50 0.20 300 / 0.06)" }}
              >
                <h2 className="font-display font-bold text-foreground text-lg">
                  Nanaji Dudh Dairy
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {currentTime}
                </p>
                <div
                  className="mt-2 mx-auto w-16 h-0.5 rounded-full"
                  style={{ background: "oklch(0.50 0.20 300 / 0.3)" }}
                />
              </div>

              {/* Bill Items */}
              <div className="px-9 py-7">
                {cart.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-11">
                    Bill is empty
                  </p>
                ) : (
                  <div className="space-y-2 mb-4">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center text-sm"
                      >
                        <span className="text-foreground truncate pr-4">
                          {item.name}
                        </span>
                        <span className="font-medium text-foreground flex-shrink-0">
                          {formatCurrency(item.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Totals */}
                <div className="border-t border-border pt-7 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(total)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-display font-bold text-foreground">
                      Total
                    </span>
                    <span
                      className="font-display font-bold text-xl"
                      style={{ color: "oklch(0.50 0.20 300)" }}
                    >
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* WhatsApp Send Bill */}
              {WhatsAppSection}

              {/* Pre-QR Actions */}
              {!showQR && !paymentSuccess && (
                <div className="px-9 pb-8 space-y-3">
                  <button
                    type="button"
                    onClick={generateQR}
                    disabled={cart.length === 0}
                    className="w-full py-6 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-purple-glow"
                    style={{ background: "oklch(0.50 0.20 300)" }}
                    data-ocid="pos.generate_qr.button"
                  >
                    <QrCode className="w-5 h-5" />
                    Generate QR Code
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintBill}
                    disabled={!canPrint}
                    className="w-full py-5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed border-2"
                    style={{
                      borderColor: "oklch(0.50 0.20 300)",
                      color: "oklch(0.50 0.20 300)",
                    }}
                    title={
                      !isConnected
                        ? "Connect 58Printer via Bluetooth first"
                        : cart.length === 0
                          ? "Add items to print"
                          : "Print bill on 58Printer"
                    }
                    data-ocid="pos.print_bill.button"
                  >
                    {isPrinting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Printer className="w-4 h-4" />
                    )}
                    {isPrinting ? "Printing..." : "Print Bill"}
                    {isConnected && !isPrinting && (
                      <BluetoothConnected className="w-3.5 h-3.5 opacity-60" />
                    )}
                  </button>

                  {!isConnected && cart.length > 0 && (
                    <p className="text-xs text-muted-foreground text-center">
                      <Bluetooth className="inline w-3 h-3 mr-1" />
                      Connect 58Printer via Bluetooth to enable printing
                    </p>
                  )}
                </div>
              )}

              {/* QR Shown Actions */}
              <AnimatePresence>
                {showQR && !paymentSuccess && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    className="px-9 pb-9"
                  >
                    <div
                      className="rounded-2xl p-8 text-center mb-3"
                      style={{ background: "oklch(0.50 0.20 300 / 0.06)" }}
                    >
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                        Scan to Pay
                      </p>
                      <div className="inline-block bg-white rounded-2xl p-5 shadow-card">
                        <img
                          src={qrDataUrl}
                          alt="UPI QR Code"
                          className="w-52 h-52 rounded-xl"
                          data-ocid="pos.qr.card"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        Google Pay &middot; PhonePe &middot; Paytm
                      </p>
                      <p
                        className="font-display font-bold text-2xl mt-2"
                        style={{ color: "oklch(0.50 0.20 300)" }}
                      >
                        {formatCurrency(total)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handlePrintBill}
                      disabled={!canPrint}
                      className="w-full py-5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed border-2 mb-3"
                      style={{
                        borderColor: "oklch(0.50 0.20 300)",
                        color: "oklch(0.50 0.20 300)",
                      }}
                      data-ocid="pos.print_bill.button"
                    >
                      {isPrinting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Printer className="w-4 h-4" />
                      )}
                      {isPrinting ? "Printing..." : "Print Bill"}
                    </button>

                    <button
                      type="button"
                      onClick={confirmPayment}
                      className="w-full py-6 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95"
                      style={{ background: "oklch(0.42 0.18 160)" }}
                      data-ocid="pos.payment_received.button"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Payment Received
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Payment Success Actions */}
              <AnimatePresence>
                {paymentSuccess && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-9 pb-9"
                    data-ocid="pos.payment.success_state"
                  >
                    <div
                      className="rounded-2xl p-9 text-center mb-4"
                      style={{ background: "oklch(0.42 0.18 160 / 0.08)" }}
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 260,
                          damping: 20,
                        }}
                        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                        style={{ background: "oklch(0.42 0.18 160)" }}
                      >
                        <CheckCircle2 className="w-9 h-9 text-white" />
                      </motion.div>
                      <h3 className="font-display font-bold text-lg text-foreground">
                        Payment Successful!
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Bill Completed
                      </p>
                      <p
                        className="font-display font-bold text-2xl mt-2"
                        style={{ color: "oklch(0.42 0.18 160)" }}
                      >
                        {formatCurrency(total)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handlePrintBill}
                      disabled={!isConnected || isPrinting}
                      className="w-full py-5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed border-2 mb-3"
                      style={{
                        borderColor: "oklch(0.50 0.20 300)",
                        color: "oklch(0.50 0.20 300)",
                      }}
                      data-ocid="pos.print_bill.button"
                    >
                      {isPrinting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Printer className="w-4 h-4" />
                      )}
                      {isPrinting ? "Printing..." : "Print Receipt"}
                    </button>

                    <button
                      type="button"
                      onClick={newCustomer}
                      className="w-full py-6 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 border border-border bg-secondary text-secondary-foreground"
                      data-ocid="pos.new_customer.button"
                    >
                      <UserPlus className="w-5 h-5" />
                      New Customer
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Copyright */}
            <p className="text-center text-xs text-muted-foreground">
              All Rights Reserved. Nanaji Dudh Dairy &reg;&copy; 2026
            </p>
          </div>
        </div>
      </div>

      {/* 30-Day Sales Report Modal */}
      <SalesReportModal
        open={salesReportOpen}
        onClose={() => setSalesReportOpen(false)}
        sales={salesReportOpen ? getLast30DaysSales() : []}
      />
    </div>
  );
}
