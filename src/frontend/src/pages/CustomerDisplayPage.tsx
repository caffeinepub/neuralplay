import { Milk } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

interface DisplayData {
  cart: { id: string; name: string; price: number }[];
  total: number;
  showQR: boolean;
  ts: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function buildQRUrl(total: number): string {
  const upi = `upi://pay?pa=7820957013@ibl&pn=Nanaji%20Dudh%20Dairy&am=${total}&cu=INR`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&ecc=M&data=${encodeURIComponent(upi)}`;
}

const EMPTY_DATA: DisplayData = { cart: [], total: 0, showQR: false, ts: 0 };

export default function CustomerDisplayPage() {
  const [data, setData] = useState<DisplayData>(EMPTY_DATA);

  useEffect(() => {
    function loadData() {
      try {
        const raw = localStorage.getItem("ndd_display");
        if (raw) {
          setData(JSON.parse(raw) as DisplayData);
        }
      } catch {
        // ignore parse errors
      }
    }

    loadData();

    const onStorage = (e: StorageEvent) => {
      if (e.key === "ndd_display") loadData();
    };

    window.addEventListener("storage", onStorage);
    const interval = setInterval(loadData, 2000);
    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(interval);
    };
  }, []);

  const qrUrl = data.showQR && data.total > 0 ? buildQRUrl(data.total) : null;
  const hasItems = data.cart.length > 0 || data.total > 0;

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 100% 80% at 50% 0%, oklch(0.30 0.15 300) 0%, oklch(0.12 0.06 285) 100%)",
      }}
      data-ocid="customer.display.panel"
    >
      {/* Decorative blobs */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 80%, oklch(0.50 0.20 300 / 0.15) 0%, transparent 40%), radial-gradient(circle at 80% 20%, oklch(0.62 0.18 280 / 0.10) 0%, transparent 40%)",
        }}
      />

      {/* Shop Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 relative z-10"
      >
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
          style={{
            background: "oklch(0.50 0.20 300 / 0.3)",
            backdropFilter: "blur(10px)",
            border: "1px solid oklch(1 0 0 / 0.15)",
          }}
        >
          <Milk className="w-8 h-8 text-white" />
        </div>
        <h1
          className="font-display font-bold text-white"
          style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)" }}
        >
          Nanaji Dudh Dairy
        </h1>
        <p className="text-white/60 text-sm mt-1">
          Welcome &middot; UPI: 7820957013@ibl
        </p>
      </motion.div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {!hasItems ? (
          <motion.div
            key="waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center relative z-10"
            data-ocid="customer.display.empty_state"
          >
            <div
              className="rounded-3xl px-12 py-10"
              style={{
                background: "oklch(1 0 0 / 0.06)",
                backdropFilter: "blur(20px)",
                border: "1px solid oklch(1 0 0 / 0.12)",
              }}
            >
              <p className="text-white/50 text-lg">Waiting for items...</p>
              <p className="text-white/30 text-sm mt-2">
                Items will appear as seller adds them
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="bill"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg relative z-10"
          >
            {/* Bill Card */}
            <div
              className="rounded-3xl p-6 mb-5"
              style={{
                background: "oklch(1 0 0 / 0.08)",
                backdropFilter: "blur(24px)",
                border: "1px solid oklch(1 0 0 / 0.15)",
              }}
            >
              {data.cart.length > 0 && (
                <div className="space-y-2 mb-4">
                  {data.cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center"
                    >
                      <span className="text-white/80 text-sm">{item.name}</span>
                      <span className="text-white font-medium text-sm">
                        {formatCurrency(item.price)}
                      </span>
                    </div>
                  ))}
                  <div
                    className="h-px mt-3"
                    style={{ background: "oklch(1 0 0 / 0.15)" }}
                  />
                </div>
              )}

              <div className="text-center">
                <p className="text-white/50 text-xs uppercase tracking-widest mb-2">
                  Total Amount
                </p>
                <motion.p
                  key={data.total}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-white font-display font-bold"
                  style={{
                    fontSize: "clamp(3rem, 12vw, 5.5rem)",
                    lineHeight: 1,
                  }}
                >
                  {formatCurrency(data.total)}
                </motion.p>
              </div>
            </div>

            {/* QR Code */}
            <AnimatePresence>
              {qrUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-3xl p-6 text-center"
                  style={{
                    background: "oklch(1 0 0 / 0.08)",
                    backdropFilter: "blur(24px)",
                    border: "1px solid oklch(1 0 0 / 0.15)",
                  }}
                  data-ocid="customer.display.card"
                >
                  <p className="text-white/60 text-sm mb-4 font-medium">
                    Scan &amp; Pay using UPI
                  </p>
                  <div className="inline-block bg-white rounded-2xl p-3">
                    <img
                      src={qrUrl}
                      alt="UPI QR Code"
                      className="w-52 h-52 sm:w-64 sm:h-64 rounded-xl"
                    />
                  </div>
                  <p className="text-white/50 text-xs mt-3">7820957013@ibl</p>
                  <p className="text-white/40 text-xs mt-1">
                    Google Pay &middot; PhonePe &middot; Paytm &middot; Any UPI
                    App
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* QR placeholder */}
            {!qrUrl && (
              <div
                className="rounded-3xl p-6 text-center"
                style={{
                  background: "oklch(1 0 0 / 0.05)",
                  border: "1px dashed oklch(1 0 0 / 0.15)",
                }}
              >
                <p className="text-white/40 text-sm">
                  QR code will appear when seller generates payment
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <p className="absolute bottom-4 text-white/25 text-xs">
        &copy; {new Date().getFullYear()} Nanaji Dudh Dairy. All Rights
        Reserved.
      </p>
    </div>
  );
}
