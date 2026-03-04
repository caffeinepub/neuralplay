import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import {
  Brain,
  CheckCircle2,
  Loader2,
  LogIn,
  LogOut,
  Shield,
  Star,
  UserPlus,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetCallerUserProfile,
  useRegisterOrUpdateProfile,
} from "../hooks/useQueries";

const FEATURES = [
  { icon: Zap, text: "Earn credits for every task completed" },
  { icon: Star, text: "Level up from Novice to Master" },
  { icon: Shield, text: "Achievement badges & streaks" },
];

export default function AuthPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { identity, login, clear, loginStatus, isInitializing } =
    useInternetIdentity();
  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const {
    data: profile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();
  const registerMutation = useRegisterOrUpdateProfile();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [profileSaved, setProfileSaved] = useState(false);

  // Redirect if already authenticated and profile exists
  useEffect(() => {
    if (isAuthenticated && isFetched && profile && !profileLoading) {
      toast.success(`Welcome back, ${profile.username}!`);
      router.navigate({ to: "/dashboard" });
    }
  }, [isAuthenticated, isFetched, profile, profileLoading, router]);

  // Pre-fill from existing profile
  useEffect(() => {
    if (profile) {
      setUsername(profile.username || "");
      setEmail(profile.email || "");
    }
  }, [profile]);

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: unknown) {
      const err = error as Error;
      if (err.message === "User is already authenticated") {
        await clear();
        setTimeout(() => login(), 300);
      }
    }
  };

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    setProfileSaved(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("Please enter a username.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    try {
      await registerMutation.mutateAsync({
        username: username.trim(),
        email: email.trim(),
      });
      setProfileSaved(true);
      toast.success("Profile saved! Welcome to NeuralPlay! 🎉");
      setTimeout(() => router.navigate({ to: "/dashboard" }), 1500);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save profile. Please try again.");
    }
  };

  const showProfileForm =
    isAuthenticated && isFetched && !profile && !profileSaved;
  const isProfileLoading = isInitializing || profileLoading;

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-16">
      {/* Background */}
      <div className="absolute inset-0 neural-grid opacity-15" />
      <div
        className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.62 0.22 255), transparent)",
        }}
      />
      <div
        className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full opacity-8 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.55 0.22 295), transparent)",
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
          {/* Left: Marketing */}
          <div className="hidden lg:block">
            <div className="flex items-center gap-3 mb-8">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Brain className="w-6 h-6 text-white" />
              </div>
              <span className="font-display text-2xl font-bold gradient-text">
                NeuralPlay
              </span>
            </div>
            <h2 className="heading-display text-4xl mb-4">
              Your AI learning <span className="gradient-text">adventure</span>{" "}
              starts here
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Join thousands of students mastering AI and Machine Learning
              through gamified challenges.
            </p>
            <div className="space-y-4">
              {FEATURES.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: "oklch(0.62 0.22 255 / 0.15)",
                      border: "1px solid oklch(0.62 0.22 255 / 0.25)",
                    }}
                  >
                    <Icon className="w-4 h-4 text-neon-blue" />
                  </div>
                  <span className="text-muted-foreground">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Auth form */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            <div
              className="rounded-2xl p-8"
              style={{
                background: "var(--gradient-card)",
                border: "1px solid oklch(0.62 0.22 255 / 0.25)",
                boxShadow:
                  "0 0 50px oklch(0.62 0.22 255 / 0.12), inset 0 1px 0 oklch(1 0 0 / 0.08), 0 4px 24px oklch(0 0 0 / 0.4)",
              }}
            >
              {/* Profile setup after login */}
              {isProfileLoading && isAuthenticated && (
                <div className="flex items-center gap-3 justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-neon-blue" />
                  <span className="text-muted-foreground">
                    Loading profile...
                  </span>
                </div>
              )}

              {profileSaved && (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4 animate-scaleIn" />
                  <h3 className="font-display text-xl font-bold mb-2 text-emerald-400">
                    Profile Created!
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Redirecting to your dashboard...
                  </p>
                </div>
              )}

              {showProfileForm && !isProfileLoading && (
                <div>
                  <div className="mb-6">
                    <h3 className="font-display text-2xl font-bold mb-2">
                      Create Your Profile
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Almost there! Set up your NeuralPlay identity.
                    </p>
                  </div>
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div>
                      <Label
                        htmlFor="profile-username"
                        className="text-sm font-medium mb-1.5 block"
                      >
                        Username
                      </Label>
                      <Input
                        id="profile-username"
                        data-ocid="auth.username_input"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Your NeuralPlay name"
                        className="bg-secondary/50 border-border focus:border-primary/50"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="profile-email"
                        className="text-sm font-medium mb-1.5 block"
                      >
                        Email
                      </Label>
                      <Input
                        id="profile-email"
                        data-ocid="auth.email_input"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="bg-secondary/50 border-border focus:border-primary/50"
                      />
                    </div>
                    <Button
                      type="submit"
                      data-ocid="auth.submit_button"
                      disabled={registerMutation.isPending}
                      className="w-full btn-primary-glow text-white border-0 mt-2"
                      style={{ background: "var(--gradient-primary)" }}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                          Saving...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" /> Create Profile
                        </>
                      )}
                    </Button>
                  </form>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-center text-sm text-muted-foreground hover:text-foreground mt-4 transition-colors"
                  >
                    Not you? Log out
                  </button>
                </div>
              )}

              {!isAuthenticated && !isProfileLoading && !profileSaved && (
                <Tabs
                  value={activeTab}
                  onValueChange={(v) => setActiveTab(v as "login" | "signup")}
                >
                  <TabsList className="w-full mb-6 bg-secondary/50">
                    <TabsTrigger
                      value="login"
                      data-ocid="auth.login_tab"
                      className="flex-1 data-[state=active]:bg-primary/20 data-[state=active]:text-neon-blue"
                    >
                      <LogIn className="w-3.5 h-3.5 mr-1.5" />
                      Login
                    </TabsTrigger>
                    <TabsTrigger
                      value="signup"
                      data-ocid="auth.signup_tab"
                      className="flex-1 data-[state=active]:bg-primary/20 data-[state=active]:text-neon-blue"
                    >
                      <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                      Sign Up
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="login" className="space-y-5">
                    <div>
                      <h3 className="font-display text-2xl font-bold mb-1">
                        Welcome Back
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Continue your AI learning journey.
                      </p>
                    </div>
                    <div className="py-4 text-center space-y-3">
                      <p className="text-sm text-muted-foreground">
                        We use Internet Identity for secure, decentralized
                        authentication.
                      </p>
                      <Button
                        onClick={handleLogin}
                        disabled={isLoggingIn}
                        data-ocid="auth.submit_button"
                        size="lg"
                        className="w-full btn-primary-glow text-white border-0"
                        style={{ background: "var(--gradient-primary)" }}
                      >
                        {isLoggingIn ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                            Connecting...
                          </>
                        ) : (
                          <>
                            <LogIn className="w-4 h-4 mr-2" /> Login with
                            Internet Identity
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Secure, decentralized login. No password required.
                    </p>
                  </TabsContent>

                  <TabsContent value="signup" className="space-y-5">
                    <div>
                      <h3 className="font-display text-2xl font-bold mb-1">
                        Join NeuralPlay
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Start your AI learning adventure today.
                      </p>
                    </div>
                    <div className="space-y-3 py-2">
                      {FEATURES.map(({ icon: Icon, text }) => (
                        <div
                          key={text}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <Icon className="w-3.5 h-3.5 text-neon-blue flex-shrink-0" />
                          {text}
                        </div>
                      ))}
                    </div>
                    <Button
                      onClick={handleLogin}
                      disabled={isLoggingIn}
                      data-ocid="auth.submit_button"
                      size="lg"
                      className="w-full btn-primary-glow text-white border-0"
                      style={{ background: "var(--gradient-primary)" }}
                    >
                      {isLoggingIn ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                          Connecting...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" /> Sign Up & Start
                          Learning
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      After login, you'll create your profile and begin earning
                      credits.
                    </p>
                  </TabsContent>
                </Tabs>
              )}

              {/* Already logged in, profile exists — redirect handled by effect */}
              {isAuthenticated && isFetched && profile && (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-neon-blue mx-auto mb-4 animate-scaleIn" />
                  <h3 className="font-display text-xl font-bold mb-2">
                    Already Logged In
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Redirecting to your dashboard...
                  </p>
                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    size="sm"
                    className="mt-4 text-muted-foreground"
                  >
                    <LogOut className="w-3.5 h-3.5 mr-1.5" />
                    Switch Account
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
