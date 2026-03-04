import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import {
  BookOpen,
  Brain,
  Flame,
  Home,
  Info,
  LayoutDashboard,
  LogIn,
  LogOut,
  Mail,
  Menu,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "../hooks/useQueries";

interface LayoutProps {
  children: ReactNode;
}

const navLinks = [
  { to: "/" as const, label: "Home", icon: Home, ocid: "nav.home_link" },
  {
    to: "/tasks" as const,
    label: "Tasks",
    icon: BookOpen,
    ocid: "nav.tasks_link",
  },
  {
    to: "/leaderboard" as const,
    label: "Leaderboard",
    icon: Trophy,
    ocid: "nav.leaderboard_link",
  },
  {
    to: "/dashboard" as const,
    label: "Dashboard",
    icon: LayoutDashboard,
    ocid: "nav.dashboard_link",
  },
  { to: "/about" as const, label: "About", icon: Info, ocid: "nav.about_link" },
  {
    to: "/contact" as const,
    label: "Contact",
    icon: Mail,
    ocid: "nav.contact_link",
  },
];

export default function Layout({ children }: LayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { identity, login, clear, loginStatus } = useInternetIdentity();
  const queryClient = useQueryClient();
  const router = useRouter();
  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const { data: profile } = useGetCallerUserProfile();

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: unknown) {
        const err = error as Error;
        if (err.message === "User is already authenticated") {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  const handleLogin = () => {
    handleAuth();
    router.navigate({ to: "/auth" });
  };

  // Helper to check if a path is active
  const isPathActive = (path: string) => {
    const current = router.state.location.pathname;
    if (path === "/") return current === "/";
    return current.startsWith(path);
  };

  return (
    <>
      {/* Fixed Navbar */}
      <header className="fixed top-0 inset-x-0 z-50 h-16">
        <div
          className="h-full border-b border-white/5"
          style={{
            background: "oklch(0.09 0.018 264 / 0.85)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <div className="container mx-auto h-full flex items-center justify-between px-4">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2 group"
              data-ocid="nav.home_link"
            >
              <div className="relative">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div
                  className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ boxShadow: "0 0 12px oklch(0.62 0.22 255 / 0.7)" }}
                />
              </div>
              <span className="font-display font-bold text-lg gradient-text hidden sm:block">
                NeuralPlay
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map(({ to, label, icon: Icon, ocid }) => {
                const active = isPathActive(to);
                return (
                  <Link
                    key={to}
                    to={to}
                    data-ocid={ocid}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      active
                        ? "text-neon-blue bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </Link>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {isAuthenticated && profile && (
                <div className="hidden sm:flex items-center gap-3 mr-2">
                  <div className="flex items-center gap-1 text-sm">
                    <Zap
                      className="w-3.5 h-3.5"
                      style={{ color: "oklch(0.72 0.20 255)" }}
                    />
                    <span className="font-mono font-semibold text-neon-blue">
                      {profile.credits.toString()}
                    </span>
                  </div>
                  {Number(profile.streak) > 0 && (
                    <div className="flex items-center gap-1 text-sm">
                      <Flame className="w-3.5 h-3.5 text-orange-400" />
                      <span className="font-mono font-semibold text-orange-400">
                        {profile.streak.toString()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {isAuthenticated ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAuth}
                  data-ocid="nav.logout_button"
                  className="text-muted-foreground hover:text-foreground hidden sm:flex"
                >
                  <LogOut className="w-4 h-4 mr-1.5" />
                  Logout
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  data-ocid="nav.login_button"
                  className="btn-primary-glow text-white border-0 hidden sm:flex"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <LogIn className="w-4 h-4 mr-1.5" />
                  {isLoggingIn ? "Logging in..." : "Login"}
                </Button>
              )}

              {/* Mobile hamburger */}
              <button
                type="button"
                className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                onClick={() => setMenuOpen(!menuOpen)}
                data-ocid="nav.hamburger_button"
                aria-label="Toggle menu"
              >
                {menuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div
            className="lg:hidden border-b border-white/5"
            style={{
              background: "oklch(0.09 0.018 264 / 0.95)",
              backdropFilter: "blur(20px)",
            }}
          >
            <nav className="container mx-auto py-4 px-4 flex flex-col gap-1">
              {navLinks.map(({ to, label, icon: Icon, ocid }) => {
                const active = isPathActive(to);
                return (
                  <Link
                    key={to}
                    to={to}
                    data-ocid={ocid}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? "text-neon-blue bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Link>
                );
              })}

              <div className="mt-3 pt-3 border-t border-white/5">
                {isAuthenticated ? (
                  <div className="flex items-center justify-between px-4">
                    {profile && (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-sm">
                          <Zap className="w-3.5 h-3.5 text-neon-blue" />
                          <span className="font-mono font-semibold text-neon-blue">
                            {profile.credits.toString()}
                          </span>
                        </div>
                        {Number(profile.streak) > 0 && (
                          <div className="flex items-center gap-1 text-sm">
                            <Flame className="w-3.5 h-3.5 text-orange-400" />
                            <span className="font-mono font-semibold text-orange-400">
                              {profile.streak.toString()}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        handleAuth();
                        setMenuOpen(false);
                      }}
                      data-ocid="nav.logout_button"
                      className="text-muted-foreground"
                    >
                      <LogOut className="w-4 h-4 mr-1.5" />
                      Logout
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => {
                      handleLogin();
                      setMenuOpen(false);
                    }}
                    disabled={isLoggingIn}
                    data-ocid="nav.login_button"
                    className="w-full btn-primary-glow text-white border-0"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    <LogIn className="w-4 h-4 mr-1.5" />
                    {isLoggingIn ? "Logging in..." : "Login"}
                  </Button>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="pt-16">{children}</main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 mt-16">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Brain className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display font-semibold text-sm gradient-text">
              NeuralPlay
            </span>
          </div>
          <p className="text-muted-foreground text-sm text-center">
            © {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neon-blue hover:underline"
            >
              caffeine.ai
            </a>
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link
              to="/about"
              className="hover:text-foreground transition-colors"
            >
              About
            </Link>
            <Link
              to="/contact"
              className="hover:text-foreground transition-colors"
            >
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
