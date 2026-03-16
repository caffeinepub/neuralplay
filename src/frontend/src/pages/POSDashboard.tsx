import {
  buildReceiptBytes,
  useBluetoothPrinter,
} from "@/hooks/useBluetoothPrinter";
import { usePOSStore } from "@/store/posStore";
import { useNavigate } from "@tanstack/react-router";
import {
  Bluetooth,
  BluetoothConnected,
  BluetoothOff,
  CheckCircle2,
  IndianRupee,
  Loader2,
  LogOut,
  Milk,
  Monitor,
  Moon,
  Plus,
  Printer,
  QrCode,
  Sun,
  Trash2,
  TrendingUp,
  UserPlus,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());
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
  } = usePOSStore();

  const {
    status: btStatus,
    deviceName,
    errorMsg,
    connect,
    disconnect,
    print,
  } = useBluetoothPrinter();

  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [nameError, setNameError] = useState("");
  const [priceError, setPriceError] = useState("");
  const [currentTime, setCurrentTime] = useState(formatDate());
  const [dailySales, setDailySales] = useState({ total: 0, count: 0 });

  useEffect(() => {
    if (!isLoggedIn) {
      navigate({ to: "/" });
      return;
    }
    setDailySales(getDailySales());
  }, [isLoggedIn, navigate, getDailySales]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(formatDate()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (paymentSuccess) {
      setDailySales(getDailySales());
    }
  }, [paymentSuccess, getDailySales]);

  const total = cart.reduce((a, c) => a + c.price, 0);

  const handleAddProduct = useCallback(() => {
    let valid = true;
    if (!productName.trim()) {
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
    addItem(productName.trim(), price);
    setProductName("");
    setProductPrice("");
  }, [productName, productPrice, addItem]);

  const handlePrintBill = useCallback(async () => {
    const billNo = `B${String(Date.now()).slice(-6)}`;
    const bytes = buildReceiptBytes(cart, total, billNo);
    const success = await print(bytes);
    if (success) {
      toast.success("Receipt sent to printer!");
    } else if (errorMsg) {
      toast.error(errorMsg);
    }
  }, [cart, total, print, errorMsg]);

  function handleLogout() {
    logout();
    navigate({ to: "/" });
  }

  const isPrinting = btStatus === "printing";
  const isConnecting = btStatus === "connecting";
  const isConnected = btStatus === "connected" || btStatus === "printing";
  const canPrint = isConnected && cart.length > 0 && !isPrinting;

  return (
    <div className="min-h-dvh bg-background">
      {/* Header */}
      <header
        className="sticky top-0 z-30 border-b border-border px-4 py-3 flex items-center justify-between"
        style={{ background: "oklch(0.50 0.20 300)" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <Milk className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-white text-base leading-tight">
              Nanaji Dudh Dairy
            </h1>
            <p className="text-white/70 text-xs">POS Terminal</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Bluetooth Status */}
          <div className="flex items-center">
            {btStatus === "disconnected" && (
              <button
                type="button"
                onClick={connect}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-medium transition-colors"
                data-ocid="pos.bluetooth_connect.button"
                title="Connect 58Printer via Bluetooth"
              >
                <Bluetooth className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Connect 58Printer</span>
              </button>
            )}
            {isConnecting && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 text-white text-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">Connecting...</span>
              </div>
            )}
            {isConnected && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 text-white text-xs">
                {isPrinting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                )}
                <span className="hidden sm:inline max-w-[80px] truncate">
                  {isPrinting ? "Printing..." : (deviceName ?? "Printer")}
                </span>
                {!isPrinting && (
                  <button
                    type="button"
                    onClick={disconnect}
                    className="ml-1 text-white/60 hover:text-white transition-colors text-xs underline"
                    data-ocid="pos.bluetooth_disconnect.button"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}
            {btStatus === "error" && (
              <button
                type="button"
                onClick={connect}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/30 hover:bg-red-500/40 text-white text-xs font-medium transition-colors"
                data-ocid="pos.bluetooth_connect.button"
                title={errorMsg ?? "Printer error"}
              >
                <BluetoothOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline max-w-[80px] truncate">
                  {errorMsg ? `${errorMsg.slice(0, 16)}…` : "Retry 58Printer"}
                </span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              window.open("/customer-display", "_blank", "width=900,height=700")
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-medium transition-colors"
            data-ocid="pos.customer_display.button"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Customer Display</span>
          </button>
          <button
            type="button"
            onClick={toggleDarkMode}
            className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
            data-ocid="pos.dark_mode.toggle"
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
            data-ocid="pos.logout.button"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* LEFT: Product Entry */}
          <div className="space-y-4">
            {/* Daily Sales Summary */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="pos-card p-4 flex items-center gap-4"
            >
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
            </motion.div>

            {/* Add Product Form */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="pos-card p-5"
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
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
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
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="number"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddProduct()}
                    placeholder="Price"
                    min="0"
                    step="0.5"
                    className="pos-input pl-9"
                    data-ocid="pos.product_price.input"
                  />
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
                    className="flex-1 py-3 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90 active:scale-95 flex items-center justify-center gap-2 shadow-purple-glow"
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
                    className="px-4 py-3 rounded-xl font-medium text-sm border border-border bg-secondary text-secondary-foreground hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                    data-ocid="pos.clear_cart.button"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Product Table */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="pos-card overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-border">
                <h2 className="font-display font-semibold text-foreground text-base">
                  Cart Items
                  {cart.length > 0 && (
                    <span
                      className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold text-white"
                      style={{ background: "oklch(0.50 0.20 300)" }}
                    >
                      {cart.length}
                    </span>
                  )}
                </h2>
              </div>

              {cart.length === 0 ? (
                <div
                  className="py-12 text-center"
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
                  {cart.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12 }}
                      className="flex items-center gap-3 px-5 py-3.5"
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
                        data-ocid={`pos.remove_item.button.${idx + 1}`}
                        aria-label={`Remove ${item.name}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* RIGHT: Bill Summary */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="pos-card overflow-hidden"
            >
              {/* Bill Header */}
              <div
                className="px-6 py-5 text-center"
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
              <div className="px-6 py-4">
                {cart.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Bill is empty
                  </p>
                ) : (
                  <div className="space-y-2 mb-4">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center text-sm"
                      >
                        <span className="text-foreground">{item.name}</span>
                        <span className="font-medium text-foreground">
                          {formatCurrency(item.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Totals */}
                <div className="border-t border-border pt-4 space-y-2">
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

              {/* Generate QR + Print Bill buttons */}
              {!showQR && !paymentSuccess && (
                <div className="px-6 pb-5 space-y-3">
                  <button
                    type="button"
                    onClick={generateQR}
                    disabled={cart.length === 0}
                    className="w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-purple-glow"
                    style={{ background: "oklch(0.50 0.20 300)" }}
                    data-ocid="pos.generate_qr.button"
                  >
                    <QrCode className="w-5 h-5" />
                    Generate QR Code
                  </button>

                  {/* Print Bill button */}
                  <button
                    type="button"
                    onClick={handlePrintBill}
                    disabled={!canPrint}
                    className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed border-2"
                    style={{
                      borderColor: "oklch(0.50 0.20 300)",
                      color: "oklch(0.50 0.20 300)",
                      background: "transparent",
                    }}
                    data-ocid="pos.print_bill.button"
                    title={
                      !isConnected
                        ? "Connect 58Printer via Bluetooth first"
                        : cart.length === 0
                          ? "Add items to print"
                          : "Print bill on 58Printer"
                    }
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

                  {/* Hint when printer not connected */}
                  {!isConnected && cart.length > 0 && (
                    <p className="text-xs text-muted-foreground text-center">
                      <Bluetooth className="inline w-3 h-3 mr-1" />
                      Connect 58Printer via Bluetooth in the header to print
                    </p>
                  )}
                </div>
              )}

              {/* QR Code Display */}
              <AnimatePresence>
                {showQR && !paymentSuccess && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="px-6 pb-6"
                  >
                    <div
                      className="rounded-2xl p-5 text-center"
                      style={{ background: "oklch(0.50 0.20 300 / 0.06)" }}
                    >
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                        Scan to Pay
                      </p>
                      <div className="inline-block bg-white rounded-2xl p-3 shadow-card">
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

                    {/* Print Bill in QR state */}
                    <button
                      type="button"
                      onClick={handlePrintBill}
                      disabled={!canPrint}
                      className="mt-3 w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed border-2"
                      style={{
                        borderColor: "oklch(0.50 0.20 300)",
                        color: "oklch(0.50 0.20 300)",
                        background: "transparent",
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
                      className="mt-3 w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 shadow-card"
                      style={{ background: "oklch(0.42 0.18 160)" }}
                      data-ocid="pos.payment_received.button"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Payment Received
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Payment Success */}
              <AnimatePresence>
                {paymentSuccess && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-6 pb-6"
                    data-ocid="pos.payment.success_state"
                  >
                    <div
                      className="rounded-2xl p-6 text-center"
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

                    {/* Print Receipt after payment */}
                    <button
                      type="button"
                      onClick={handlePrintBill}
                      disabled={!isConnected || isPrinting}
                      className="mt-4 w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed border-2"
                      style={{
                        borderColor: "oklch(0.50 0.20 300)",
                        color: "oklch(0.50 0.20 300)",
                        background: "transparent",
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
                      className="mt-3 w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 border border-border bg-secondary text-secondary-foreground"
                      data-ocid="pos.new_customer.button"
                    >
                      <UserPlus className="w-5 h-5" />
                      New Customer
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Footer */}
            <p className="text-center text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()}. Built with love using{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
