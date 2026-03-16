import { usePOSStore } from "@/store/posStore";
import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Lock, Mail, Milk, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

const VALID_CREDENTIALS = [
  { email: "demo@nanaji.com", password: "demo123" },
  { email: "owner@nanaji.com", password: "dairy123" },
];

export default function POSLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const login = usePOSStore((s) => s.login);
  const navigate = useNavigate();

  useEffect(() => {
    // Apply dark mode from storage on mount
    const dark = localStorage.getItem("ndd_dark") === "true";
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, []);

  function handleDemoLogin() {
    setEmail("demo@nanaji.com");
    setPassword("demo123");
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const valid = VALID_CREDENTIALS.find(
      (c) => c.email === email.trim() && c.password === password,
    );
    if (valid) {
      login();
      navigate({ to: "/dashboard" });
    } else {
      setError("Invalid credentials. Try demo@nanaji.com / demo123");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Background gradient blobs */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, oklch(0.50 0.20 300 / 0.18) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 80%, oklch(0.62 0.18 280 / 0.12) 0%, transparent 60%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        {/* Logo card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-center mb-8"
        >
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-4 shadow-purple-glow"
            style={{
              background: "oklch(0.50 0.20 300)",
            }}
          >
            <Milk className="w-10 h-10 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">
            Nanaji Dudh Dairy
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            POS Billing System
          </p>
        </motion.div>

        {/* Login card */}
        <div className="pos-card p-6 shadow-card">
          <h2 className="font-display text-xl font-semibold text-foreground mb-6">
            Sign In
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="login-email"
              >
                Email / Phone
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="login-email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="demo@nanaji.com"
                  className="pos-input pl-10"
                  autoComplete="email"
                  data-ocid="login.email.input"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="login-password"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="login-password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pos-input pl-10 pr-10"
                  autoComplete="current-password"
                  data-ocid="login.password.input"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-2.5 border border-destructive/20"
                data-ocid="login.error_state"
              >
                {error}
              </div>
            )}

            {/* Login button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shadow-purple-glow"
              style={{ background: "oklch(0.50 0.20 300)" }}
              data-ocid="login.submit_button"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>

            {/* Demo login */}
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full py-3 rounded-xl font-medium text-sm border border-border bg-secondary text-secondary-foreground hover:bg-accent transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
              data-ocid="login.demo_button"
            >
              <Zap
                className="w-4 h-4"
                style={{ color: "oklch(0.50 0.20 300)" }}
              />
              Use Demo Login
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} Nanaji Dudh Dairy. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}
