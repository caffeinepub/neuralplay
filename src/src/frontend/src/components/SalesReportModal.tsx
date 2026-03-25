import type { SaleRecord } from "@/store/posStore";
import {
  BarChart3,
  Calendar,
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface Props {
  open: boolean;
  onClose: () => void;
  sales: SaleRecord[];
}

function formatCurrency(amount: number): string {
  return `Rs. ${amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

export default function SalesReportModal({ open, onClose, sales }: Props) {
  const totalRevenue = sales.reduce((acc, s) => acc + s.total, 0);
  const totalItems = sales.reduce((acc, s) => acc + s.items.length, 0);

  // Product summary
  const productMap = new Map<string, { qty: number; revenue: number }>();
  for (const sale of sales) {
    for (const item of sale.items) {
      const existing = productMap.get(item.name) ?? { qty: 0, revenue: 0 };
      productMap.set(item.name, {
        qty: existing.qty + 1,
        revenue: existing.revenue + item.price,
      });
    }
  }
  const productSummary = Array.from(productMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue);

  // Sort sales newest first
  const sortedSales = [...sales].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal - full screen on mobile */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed inset-0 z-50 flex flex-col bg-background md:inset-4 md:rounded-2xl md:shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-7 py-5 flex-shrink-0"
              style={{ background: "oklch(0.45 0.22 300)" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-base leading-tight">
                    30-Day Sales Report
                  </h2>
                  <p className="text-white/70 text-xs">
                    {sales.length} transactions
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
                aria-label="Close report"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-2 px-7 py-5 flex-shrink-0 border-b border-border bg-background">
              <div
                className="rounded-xl p-5 text-center"
                style={{ background: "oklch(0.45 0.22 300 / 0.10)" }}
              >
                <TrendingUp
                  className="w-4 h-4 mx-auto mb-1"
                  style={{ color: "oklch(0.45 0.22 300)" }}
                />
                <p className="text-[10px] text-muted-foreground">Revenue</p>
                <p
                  className="font-bold text-sm leading-tight"
                  style={{ color: "oklch(0.45 0.22 300)" }}
                >
                  {formatCurrency(totalRevenue)}
                </p>
              </div>
              <div
                className="rounded-xl p-5 text-center"
                style={{ background: "oklch(0.45 0.22 300 / 0.10)" }}
              >
                <Calendar
                  className="w-4 h-4 mx-auto mb-1"
                  style={{ color: "oklch(0.45 0.22 300)" }}
                />
                <p className="text-[10px] text-muted-foreground">
                  Transactions
                </p>
                <p
                  className="font-bold text-sm"
                  style={{ color: "oklch(0.45 0.22 300)" }}
                >
                  {sales.length}
                </p>
              </div>
              <div
                className="rounded-xl p-5 text-center"
                style={{ background: "oklch(0.45 0.22 300 / 0.10)" }}
              >
                <ShoppingBag
                  className="w-4 h-4 mx-auto mb-1"
                  style={{ color: "oklch(0.45 0.22 300)" }}
                />
                <p className="text-[10px] text-muted-foreground">Items Sold</p>
                <p
                  className="font-bold text-sm"
                  style={{ color: "oklch(0.45 0.22 300)" }}
                >
                  {totalItems}
                </p>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              {sales.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-23 text-center px-9">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: "oklch(0.45 0.22 300 / 0.10)" }}
                  >
                    <BarChart3
                      className="w-8 h-8"
                      style={{ color: "oklch(0.45 0.22 300)" }}
                    />
                  </div>
                  <p className="font-semibold text-foreground">
                    No sales in last 30 days
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Complete a payment to see it here.
                  </p>
                </div>
              ) : (
                <div className="p-7 space-y-6">
                  {/* Product Summary */}
                  {productSummary.length > 0 && (
                    <div>
                      <h3 className="font-bold text-foreground text-sm mb-3 flex items-center gap-2">
                        <IndianRupee
                          className="w-4 h-4 flex-shrink-0"
                          style={{ color: "oklch(0.45 0.22 300)" }}
                        />
                        Product Performance
                      </h3>
                      <div className="rounded-xl border border-border overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm min-w-[320px]">
                            <thead>
                              <tr
                                style={{
                                  background: "oklch(0.45 0.22 300 / 0.08)",
                                }}
                              >
                                <th className="text-left px-5 py-5 font-semibold text-foreground">
                                  #
                                </th>
                                <th className="text-left px-5 py-5 font-semibold text-foreground">
                                  Product
                                </th>
                                <th className="text-center px-5 py-5 font-semibold text-foreground">
                                  Qty
                                </th>
                                <th className="text-right px-5 py-5 font-semibold text-foreground">
                                  Revenue
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {productSummary.map((p, idx) => (
                                <tr
                                  key={p.name}
                                  className="border-t border-border"
                                >
                                  <td className="px-5 py-5 text-muted-foreground text-xs">
                                    {idx + 1}
                                  </td>
                                  <td className="px-5 py-5 font-medium text-foreground">
                                    {p.name}
                                  </td>
                                  <td className="px-5 py-5 text-center text-muted-foreground">
                                    {p.qty}
                                  </td>
                                  <td
                                    className="px-5 py-5 text-right font-bold"
                                    style={{ color: "oklch(0.45 0.22 300)" }}
                                  >
                                    {formatCurrency(p.revenue)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* All Transactions - Card style for mobile */}
                  <div>
                    <h3 className="font-bold text-foreground text-sm mb-3 flex items-center gap-2">
                      <Calendar
                        className="w-4 h-4 flex-shrink-0"
                        style={{ color: "oklch(0.45 0.22 300)" }}
                      />
                      All Transactions — Last 30 Days
                    </h3>

                    <div className="space-y-3">
                      {sortedSales.map((sale, idx) => (
                        <div
                          key={sale.id}
                          className="rounded-xl border border-border overflow-hidden"
                        >
                          {/* Transaction header row */}
                          <div
                            className="flex items-center justify-between px-5 py-4"
                            style={{
                              background: "oklch(0.45 0.22 300 / 0.07)",
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center flex-shrink-0"
                                style={{ background: "oklch(0.45 0.22 300)" }}
                              >
                                {sortedSales.length - idx}
                              </span>
                              <span className="text-xs font-semibold text-foreground">
                                {formatDate(sale.date)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatTime(sale.date)}
                              </span>
                            </div>
                            <span
                              className="font-bold text-sm"
                              style={{ color: "oklch(0.45 0.22 300)" }}
                            >
                              {formatCurrency(sale.total)}
                            </span>
                          </div>

                          {/* Items list */}
                          {sale.items.length > 0 && (
                            <div className="px-5 py-4 divide-y divide-border/60">
                              {sale.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between py-4"
                                >
                                  <span className="text-sm text-foreground">
                                    {item.name}
                                  </span>
                                  <span
                                    className="text-sm font-semibold ml-4 flex-shrink-0"
                                    style={{ color: "oklch(0.45 0.22 300)" }}
                                  >
                                    Rs. {item.price.toFixed(0)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Grand Total footer */}
                    <div
                      className="mt-4 rounded-xl px-7 py-5 flex items-center justify-between"
                      style={{ background: "oklch(0.45 0.22 300 / 0.12)" }}
                    >
                      <span className="font-bold text-foreground">
                        Grand Total ({sales.length} transactions)
                      </span>
                      <span
                        className="font-bold text-lg"
                        style={{ color: "oklch(0.45 0.22 300)" }}
                      >
                        {formatCurrency(totalRevenue)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
