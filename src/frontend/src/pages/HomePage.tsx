import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Award,
  BookOpen,
  BrainCircuit,
  ChevronRight,
  Flame,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { TaskCategory } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetAllTasks,
  useGetCallerUserProfile,
  useGetDailyChallenge,
} from "../hooks/useQueries";

const LEVEL_NAMES = ["Novice", "Explorer", "Practitioner", "Master"];

function getLevelProgress(credits: number): number {
  if (credits < 100) return (credits / 100) * 100;
  if (credits < 300) return ((credits - 100) / 200) * 100;
  if (credits < 600) return ((credits - 300) / 300) * 100;
  return 100;
}

function getCategoryColor(cat: TaskCategory) {
  switch (cat) {
    case TaskCategory.beginner:
      return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
    case TaskCategory.intermediate:
      return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
    case TaskCategory.advanced:
      return "text-red-400 bg-red-400/10 border-red-400/20";
  }
}

// Particle background component
function ParticleBackground() {
  const particles = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 6 + 4,
    delay: Math.random() * -6,
    opacity: Math.random() * 0.5 + 0.2,
    isBlue: Math.random() > 0.4,
  }));

  return (
    <div className="particles-bg">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={
            {
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              "--duration": `${p.duration}s`,
              "--delay": `${p.delay}s`,
              opacity: p.opacity,
              background: p.isBlue
                ? "oklch(0.62 0.22 255 / 0.8)"
                : "oklch(0.55 0.22 295 / 0.8)",
              boxShadow: p.isBlue
                ? `0 0 ${p.size * 3}px oklch(0.62 0.22 255)`
                : `0 0 ${p.size * 3}px oklch(0.55 0.22 295)`,
            } as React.CSSProperties
          }
        />
      ))}
      {/* Neural grid lines */}
      <div className="absolute inset-0 neural-grid opacity-30" />
      {/* Gradient orbs */}
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
    </div>
  );
}

// Stats bar
const stats = [
  { icon: BookOpen, value: "500+", label: "Tasks Completed" },
  { icon: Users, value: "1,200+", label: "Students" },
  { icon: BrainCircuit, value: "50+", label: "AI Topics" },
  { icon: Award, value: "200+", label: "Badges Earned" },
];

export default function HomePage() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { data: tasks, isLoading: tasksLoading } = useGetAllTasks();
  const { data: dailyChallenge } = useGetDailyChallenge();
  const { data: profile } = useGetCallerUserProfile();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Neural network animation on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const nodes: { x: number; y: number; vx: number; vy: number }[] = [];
    for (let i = 0; i < 40; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
      });
    }

    let animId: number;
    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      }

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const m = nodes[j];
          const dist = Math.hypot(n.x - m.x, n.y - m.y);
          if (dist < 120) {
            const alpha = (1 - dist / 120) * 0.3;
            ctx.strokeStyle = `rgba(99, 138, 255, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(m.x, m.y);
            ctx.stroke();
          }
        }

        ctx.fillStyle = "rgba(99, 138, 255, 0.6)";
        ctx.shadowColor = "rgba(99, 138, 255, 0.8)";
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const featuredTasks = tasks?.slice(0, 3) ?? [];

  return (
    <div className="overflow-x-hidden">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Canvas neural network */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full opacity-40"
          aria-hidden
        />
        <ParticleBackground />

        {/* Hero image overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url('/assets/generated/neural-hero-bg.dim_1920x1080.jpg')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        {/* Gradient vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/20 to-background" />

        <div className="container mx-auto px-4 relative z-10 py-20">
          <div className="max-w-4xl mx-auto text-center">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 mb-8 animate-fadeInUp">
              <Sparkles className="w-3.5 h-3.5 text-neon-blue" />
              <span className="text-sm font-medium text-neon-blue">
                AI & ML Gamified Learning Platform
              </span>
            </div>

            {/* Headline */}
            <h1
              className="heading-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl mb-6 animate-fadeInUp"
              style={{ animationDelay: "0.1s", opacity: 0 }}
            >
              Learn AI{" "}
              <span
                className="gradient-text"
                style={{ display: "inline-block" }}
              >
                by Playing
              </span>
            </h1>

            <p
              className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-fadeInUp"
              style={{ animationDelay: "0.2s", opacity: 0 }}
            >
              Master Artificial Intelligence and Machine Learning through
              interactive gamified challenges. Earn credits, unlock badges, and
              level up your AI expertise one task at a time.
            </p>

            <div
              className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fadeInUp"
              style={{ animationDelay: "0.3s", opacity: 0 }}
            >
              <Button
                asChild
                size="lg"
                data-ocid="hero.start_learning_button"
                className="btn-primary-glow text-white border-0 text-base px-9 h-13 font-semibold"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Link to="/tasks">
                  Start Learning <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                data-ocid="hero.leaderboard_button"
                className="btn-secondary-outline text-base px-9 h-13 font-semibold border-0"
              >
                <Link to="/leaderboard">
                  <Trophy className="mr-2 w-4 h-4" />
                  View Leaderboard
                </Link>
              </Button>
            </div>

            {/* Logged in quick stats */}
            {isAuthenticated && profile && (
              <div
                className="mt-10 inline-flex items-center gap-6 px-6 py-3 rounded-2xl glass-card animate-fadeInUp"
                style={{ animationDelay: "0.4s", opacity: 0 }}
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-neon-blue" />
                  <span className="font-mono font-bold text-neon-blue">
                    {profile.credits.toString()}
                  </span>
                  <span className="text-muted-foreground text-sm">credits</span>
                </div>
                <div className="w-px h-5 bg-border" />
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="font-mono font-bold text-orange-400">
                    {profile.streak.toString()}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    day streak
                  </span>
                </div>
                <div className="w-px h-5 bg-border" />
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="font-semibold">
                    {LEVEL_NAMES[Number(profile.level)] ?? "Master"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Stats Bar ───────────────────────────────────────────── */}
      <section className="py-12 border-y border-white/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map(({ icon: Icon, value, label }) => (
              <div
                key={label}
                className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "oklch(0.62 0.22 255 / 0.1)",
                    border: "1px solid oklch(0.62 0.22 255 / 0.2)",
                  }}
                >
                  <Icon className="w-5 h-5 text-neon-blue" />
                </div>
                <div>
                  <div className="font-display text-2xl font-bold gradient-text">
                    {value}
                  </div>
                  <div className="text-muted-foreground text-sm">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Progress tracker (if logged in) ─────────────────────── */}
      {isAuthenticated && profile && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="glass-card rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-display text-xl font-bold">
                    Welcome back,{" "}
                    <span className="gradient-text">
                      {profile.username || "Learner"}
                    </span>
                  </h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Keep building your AI skills!
                  </p>
                </div>
                <Link to="/dashboard">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-primary/30 hover:border-primary/60"
                  >
                    View Dashboard <ChevronRight className="ml-1 w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: "oklch(0.62 0.22 255 / 0.08)",
                    border: "1px solid oklch(0.62 0.22 255 / 0.2)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-neon-blue" />
                    <span className="text-sm text-muted-foreground">
                      Total Credits
                    </span>
                  </div>
                  <div className="font-display text-3xl font-bold text-neon-blue">
                    {profile.credits.toString()}
                  </div>
                </div>
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: "oklch(0.55 0.22 295 / 0.08)",
                    border: "1px solid oklch(0.55 0.22 295 / 0.2)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-neon-purple" />
                    <span className="text-sm text-muted-foreground">Level</span>
                  </div>
                  <div className="font-display text-3xl font-bold text-neon-purple">
                    {LEVEL_NAMES[Number(profile.level)] ?? "Master"}
                  </div>
                  <Progress
                    value={getLevelProgress(Number(profile.credits))}
                    className="mt-2 h-1.5"
                  />
                </div>
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: "oklch(0.65 0.20 50 / 0.08)",
                    border: "1px solid oklch(0.65 0.20 50 / 0.2)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span className="text-sm text-muted-foreground">
                      Day Streak
                    </span>
                  </div>
                  <div className="font-display text-3xl font-bold text-orange-400">
                    {profile.streak.toString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Daily Challenge ─────────────────────────────────────── */}
      {dailyChallenge && (
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-6">
              <Target className="w-5 h-5 text-neon-blue" />
              <h2 className="heading-section text-2xl">
                Daily <span className="gradient-text">Challenge</span>
              </h2>
              <Badge className="bg-primary/20 text-neon-blue border-primary/30 animate-glow-pulse">
                LIVE
              </Badge>
            </div>

            <Link to="/tasks/$id" params={{ id: dailyChallenge.id.toString() }}>
              <div
                className="relative rounded-2xl p-6 cursor-pointer transition-transform hover:-translate-y-1"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.12 0.025 264), oklch(0.14 0.035 275))",
                  border: "1px solid oklch(0.62 0.22 255 / 0.4)",
                  animation: "pulse-neon 2s ease-in-out infinite",
                }}
              >
                <div className="absolute top-4 right-4">
                  <Badge className="bg-primary/20 text-neon-blue border-primary/40 font-mono">
                    ⚡ {dailyChallenge.creditReward.toString()} credits
                  </Badge>
                </div>
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        className={`text-xs border ${getCategoryColor(dailyChallenge.category)}`}
                      >
                        {dailyChallenge.category}
                      </Badge>
                      <Badge className="bg-yellow-400/10 text-yellow-400 border-yellow-400/20 text-xs">
                        🔥 DAILY
                      </Badge>
                    </div>
                    <h3 className="font-display text-xl font-bold mb-2">
                      {dailyChallenge.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {dailyChallenge.description}
                    </p>
                    <div className="mt-3 flex items-center gap-1 text-neon-blue text-sm font-medium">
                      Take the challenge{" "}
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* ── Featured Tasks ──────────────────────────────────────── */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-neon-blue" />
              <h2 className="heading-section text-2xl">
                <span className="gradient-text">Featured</span> Tasks
              </h2>
            </div>
            <Link to="/tasks">
              <Button
                variant="ghost"
                size="sm"
                className="text-neon-blue hover:text-primary"
              >
                View All <ChevronRight className="ml-1 w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          {tasksLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl h-48 animate-shimmer" />
              ))}
            </div>
          ) : featuredTasks.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <BrainCircuit className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p>No tasks available yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredTasks.map((task, idx) => (
                <Link
                  key={task.id.toString()}
                  to="/tasks/$id"
                  params={{ id: task.id.toString() }}
                >
                  <div
                    className="group relative rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:-translate-y-2 card-glow card-shimmer"
                    style={{
                      background: "var(--gradient-card)",
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <Badge
                        className={`text-xs border ${getCategoryColor(task.category)}`}
                      >
                        {task.category}
                      </Badge>
                      {task.isDaily && (
                        <Badge className="bg-yellow-400/10 text-yellow-400 border-yellow-400/20 text-xs">
                          🔥 Daily
                        </Badge>
                      )}
                    </div>
                    <div
                      className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center"
                      style={{
                        background:
                          idx === 0
                            ? "oklch(0.62 0.22 255 / 0.15)"
                            : idx === 1
                              ? "oklch(0.55 0.22 295 / 0.15)"
                              : "oklch(0.72 0.18 200 / 0.15)",
                        border: `1px solid ${idx === 0 ? "oklch(0.62 0.22 255 / 0.3)" : idx === 1 ? "oklch(0.55 0.22 295 / 0.3)" : "oklch(0.72 0.18 200 / 0.3)"}`,
                      }}
                    >
                      <BrainCircuit className="w-5 h-5 text-neon-blue" />
                    </div>
                    <h3 className="font-display font-bold tracking-tight mb-2 group-hover:text-neon-blue transition-colors line-clamp-2 leading-snug">
                      {task.title}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                      {task.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-sm font-mono">
                        <Zap className="w-3.5 h-3.5 text-neon-blue" />
                        <span className="text-neon-blue font-bold">
                          {task.creditReward.toString()}
                        </span>
                        <span className="text-muted-foreground">credits</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {task.steps.length} steps
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Gamification callout ─────────────────────────────────── */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="relative rounded-3xl overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.12 0.03 264), oklch(0.14 0.04 280) 50%, oklch(0.12 0.03 295))",
                border: "1px solid oklch(0.62 0.22 255 / 0.15)",
              }}
            />
            <div className="absolute inset-0 neural-grid opacity-20" />
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 p-8 md:p-12">
              <div>
                <Badge className="bg-accent/20 text-neon-purple border-accent/30 mb-4">
                  Gamified Learning
                </Badge>
                <h2 className="heading-section text-3xl mb-4">
                  Learn AI the <span className="gradient-text">fun way</span>
                </h2>
                <p className="text-muted-foreground mb-6">
                  Traditional learning is boring. NeuralPlay makes AI education
                  an adventure. Complete challenges, earn credits, climb
                  leaderboards, and collect achievement badges.
                </p>
                <Button
                  asChild
                  className="btn-primary-glow text-white border-0"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <Link to="/about">
                    Learn How It Works <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    icon: Trophy,
                    label: "Leaderboard",
                    desc: "Compete globally",
                    color: "text-yellow-400",
                  },
                  {
                    icon: Award,
                    label: "Badges",
                    desc: "Collect achievements",
                    color: "text-neon-purple",
                  },
                  {
                    icon: Flame,
                    label: "Streaks",
                    desc: "Daily rewards",
                    color: "text-orange-400",
                  },
                  {
                    icon: Zap,
                    label: "Credits",
                    desc: "Earn & level up",
                    color: "text-neon-blue",
                  },
                ].map(({ icon: Icon, label, desc, color }) => (
                  <div key={label} className="rounded-xl p-4 glass-card">
                    <Icon className={`w-6 h-6 ${color} mb-2`} />
                    <div className="font-semibold text-sm">{label}</div>
                    <div className="text-muted-foreground text-xs mt-0.5">
                      {desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
