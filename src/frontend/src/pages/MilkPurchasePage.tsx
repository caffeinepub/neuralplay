import { usePOSStore } from "@/store/posStore";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  IndianRupee,
  Milk,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const MILK_PURCHASE_KEY = "ndd_milk_purchases";

export interface MilkPurchaseRecord {
  id: string;
  milkType: "Buffalo" | "Cow";
  supplierName: string;
  quantity: number;
  ratePerLiter: number;
  fat: string;
  namak: string;
  totalAmount: number;
  date: string;
  signedBy: string;
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

export default function MilkPurchasePage() {
  const navigate = useNavigate();
  const { isLoggedIn, darkMode } = usePOSStore();

  const [milkType, setMilkType] = useState<"Buffalo" | "Cow">("Buffalo");
  const [supplierName, setSupplierName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [ratePerLiter, setRatePerLiter] = useState("");
  const [fat, setFat] = useState("");
  const [namak, setNamak] = useState("");
  const [signedBy, setSignedBy] = useState("");
  const [records, setRecords] = useState<MilkPurchaseRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const qty = Number.parseFloat(quantity);
  const rate = Number.parseFloat(ratePerLiter);
  const total = !Number.isNaN(qty) && !Number.isNaN(rate) ? qty * rate : 0;

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!supplierName.trim()) errs.supplierName = "Supplier name is required";
    if (!quantity || Number.isNaN(qty) || qty <= 0)
      errs.quantity = "Enter valid quantity";
    if (!ratePerLiter || Number.isNaN(rate) || rate <= 0)
      errs.ratePerLiter = "Enter valid rate";
    if (!namak.trim()) errs.namak = "Namak value is required";
    if (!signedBy.trim()) errs.signedBy = "Sign-off name is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const record: MilkPurchaseRecord = {
      id: Date.now().toString(),
      milkType,
      supplierName: supplierName.trim(),
      quantity: qty,
      ratePerLiter: rate,
      fat: fat.trim(),
      namak: namak.trim(),
      totalAmount: total,
      date: new Date().toISOString(),
      signedBy: signedBy.trim(),
    };
    savePurchase(record);
    setRecords(loadPurchases());
    toast.success(`Milk purchase of ${formatCurrency(total)} saved!`);
    // Reset form
    setSupplierName("");
    setQuantity("");
    setRatePerLiter("");
    setFat("");
    setNamak("");
    setSignedBy("");
    setErrors({});
  }

  function handleDelete(id: string) {
    deletePurchase(id);
    setRecords(loadPurchases());
    toast.success("Record deleted");
  }

  const todayRecords = records.filter(
    (r) => new Date(r.date).toDateString() === new Date().toDateString(),
  );
  const todayTotal = todayRecords.reduce((a, r) => a + r.totalAmount, 0);

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
        <button
          type="button"
          onClick={() => setShowHistory((v) => !v)}
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
          <h2 className="font-display font-semibold text-foreground text-base flex items-center gap-2">
            <Plus
              className="w-4 h-4"
              style={{ color: "oklch(0.50 0.20 300)" }}
            />
            New Purchase Entry
          </h2>

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

          {/* Supplier Name */}
          <div>
            <label
              htmlFor="supplier-name"
              className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1"
            >
              Supplier / Farmer Name
            </label>
            <input
              type="text"
              value={supplierName}
              id="supplier-name"
              onChange={(e) => {
                setSupplierName(e.target.value);
                setErrors((p) => ({ ...p, supplierName: "" }));
              }}
              placeholder="Enter supplier name"
              className="pos-input"
            />
            {errors.supplierName && (
              <p className="text-xs text-destructive mt-1">
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
                <p className="text-xs text-destructive mt-1">
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
                <p className="text-xs text-destructive mt-1">
                  {errors.ratePerLiter}
                </p>
              )}
            </div>
          </div>

          {/* Fat % */}
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
              onChange={(e) => setFat(e.target.value)}
              placeholder="e.g. 6.5"
              className="pos-input"
            />
          </div>

          {/* Namak Field */}
          <div>
            <label
              htmlFor="milk-namak"
              className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1"
            >
              Namak (Purchasing Sign)
            </label>
            <input
              id="milk-namak"
              type="text"
              value={namak}
              onChange={(e) => {
                setNamak(e.target.value);
                setErrors((p) => ({ ...p, namak: "" }));
              }}
              placeholder="Enter namak value / quality mark"
              className="pos-input"
            />
            {errors.namak && (
              <p className="text-xs text-destructive mt-1">{errors.namak}</p>
            )}
          </div>

          {/* Signed By */}
          <div>
            <label
              htmlFor="milk-signed-by"
              className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1"
            >
              Signed By (Purchasing Milk Namak)
            </label>
            <input
              id="milk-signed-by"
              type="text"
              value={signedBy}
              onChange={(e) => {
                setSignedBy(e.target.value);
                setErrors((p) => ({ ...p, signedBy: "" }));
              }}
              placeholder="Enter name of person signing"
              className="pos-input"
            />
            {errors.signedBy && (
              <p className="text-xs text-destructive mt-1">{errors.signedBy}</p>
            )}
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

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSave}
            className="w-full py-6 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 shadow-purple-glow"
            style={{ background: "oklch(0.50 0.20 300)" }}
          >
            <CheckCircle2 className="w-5 h-5" />
            Save Purchase Entry
          </button>
        </motion.div>

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
                <div className="py-12 text-center">
                  <p className="text-muted-foreground text-sm">
                    No purchases recorded yet
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {records.map((r) => (
                    <div key={r.id} className="px-8 py-6">
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
                            {r.fat && (
                              <p className="text-xs text-muted-foreground">
                                Fat: {r.fat}%
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Namak: {r.namak} &middot; Signed: {r.signedBy}
                            </p>
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
                            onClick={() => handleDelete(r.id)}
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
