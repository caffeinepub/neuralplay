import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useRouter } from "@tanstack/react-router";
import {
  Award,
  BookOpen,
  ChevronRight,
  Flame,
  Loader2,
  Lock,
  LogIn,
  Shield,
  Star,
  Target,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { useEffect } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetAllTasks, useGetCallerUserProfile } from "../hooks/useQueries";

const LEVEL_NAMES = ["Novice", "Explorer", "Practitioner", "Master"];
const LEVEL_MAX = [100, 300, 600, 1000];

function getLevelProgress(credits: number): {
  pct: number;
  current: number;
  max: number;
  nextLevel: string;
} {
  if (credits < 100)
    return {
      pct: (credits / 100) * 100,
      current: credits,
      max: 100,
      nextLevel: "Explorer",
    };
  if (credits < 300)
    return {
      pct: ((credits - 100) / 200) * 100,
      current: credits - 100,
      max: 200,
      nextLevel: "Practitioner",
    };
  if (credits < 600)
    return {
      pct: ((credits - 300) / 300) * 100,
      current: credits - 300,
      max: 300,
      nextLevel: "Master",
    };
  return {
    pct: 100,
    current: credits - 600,
    max: Number.POSITIVE_INFINITY,
    nextLevel: "MAX",
  };
}

const ALL_BADGES = [
  {
    id: "welcome",
    icon: Star,
    label: "Welcome",
    desc: "Joined NeuralPlay",
    color: "text-yellow-400",
    bg: "oklch(0.78 0.18 90 / 0.15)",
  },
  {
    id: "first_task",
    icon: Target,
    label: "First Step",
    desc: "Completed first task",
    color: "text-neon-blue",
    bg: "oklch(0.62 0.22 255 / 0.15)",
  },
  {
    id: "streak_3",
    icon: Flame,
    label: "On Fire",
    desc: "3 day streak",
    color: "text-orange-400",
    bg: "oklch(0.65 0.22 50 / 0.15)",
  },
  {
    id: "streak_7",
    icon: Flame,
    label: "Week Warrior",
    desc: "7 day streak",
    color: "text-red-400",
    bg: "oklch(0.60 0.22 25 / 0.15)",
  },
  {
    id: "tasks_10",
    icon: BookOpen,
    label: "Eager Learner",
    desc: "Completed 10 tasks",
    color: "text-neon-purple",
    bg: "oklch(0.55 0.22 295 / 0.15)",
  },
  {
    id: "tasks_25",
    icon: Award,
    label: "AI Enthusiast",
    desc: "Completed 25 tasks",
    color: "text-neon-purple",
    bg: "oklch(0.55 0.22 295 / 0.15)",
  },
  {
    id: "master",
    icon: Trophy,
    label: "AI Master",
    desc: "Reached Master level",
    color: "text-yellow-400",
    bg: "oklch(0.78 0.18 90 / 0.15)",
  },
  {
    id: "leaderboard",
    icon: Users,
    label: "Top Rank",
    desc: "Top 10 on leaderboard",
    color: "text-cyan-400",
    bg: "oklch(0.72 0.18 200 / 0.15)",
  },
  {
    id: "explorer",
    icon: Shield,
    label: "Explorer",
    desc: "Reached Explorer level",
    color: "text-neon-blue",
    bg: "oklch(0.62 0.22 255 / 0.15)",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const {
    data: profile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();
  const { data: allTasks } = useGetAllTasks();

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.navigate({ to: "/auth" });
    }
  }, [isInitializing, isAuthenticated, router]);

  if (isInitializing || profileLoading) {
    return (
      <div
        className="container mx-auto px-4 py-16"
        data-ocid="dashboard.section"
      >
        <div className="flex items-center gap-3 mb-8">
          <Loader2 className="w-5 h-5 animate-spin text-neon-blue" />
          <span className="text-muted-foreground">Loading dashboard...</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl animate-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
          style={{ background: "var(--gradient-primary)" }}
        >
          <LogIn className="w-8 h-8 text-white" />
        </div>
        <h2 className="font-display text-2xl font-bold mb-2">Login Required</h2>
        <p className="text-muted-foreground mb-6">
          Please log in to view your dashboard.
        </p>
        <Button
          asChild
          className="btn-primary-glow text-white border-0"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Link to="/auth">Login</Link>
        </Button>
      </div>
    );
  }

  if (isFetched && !profile) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Star className="w-8 h-8 text-white" />
        </div>
        <h2 className="font-display text-2xl font-bold mb-2">
          Complete Your Profile
        </h2>
        <p className="text-muted-foreground mb-6">
          Set up your profile to start tracking progress.
        </p>
        <Button
          asChild
          className="btn-primary-glow text-white border-0"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Link to="/auth">Set Up Profile</Link>
        </Button>
      </div>
    );
  }

  if (!profile) return null;

  const credits = Number(profile.credits);
  const level = Number(profile.level);
  const streak = Number(profile.streak);
  const levelInfo = getLevelProgress(credits);
  const levelName = LEVEL_NAMES[level] ?? "Master";

  const earnedBadgeIds = new Set(profile.badges);

  const completedTaskDetails = (allTasks ?? [])
    .filter((t) =>
      profile.completedTaskIds.map(String).includes(t.id.toString()),
    )
    .slice(-5)
    .reverse();

  return (
    <div className="min-h-screen" data-ocid="dashboard.section">
      {/* Page header */}
      <div className="relative py-12 border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 neural-grid opacity-20" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, oklch(0.11 0.025 264), oklch(0.09 0.018 264))",
          }}
        />
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-neon-blue" />
            <span className="text-neon-blue text-sm font-medium">
              AI Credits Dashboard
            </span>
          </div>
          <h1 className="heading-display text-4xl mb-1">
            Welcome back,{" "}
            <span className="gradient-text">
              {profile.username || "Learner"}
            </span>
          </h1>
          <p className="text-muted-foreground">{profile.email}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Top stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Credits */}
          <div
            className="rounded-2xl p-6 relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.12 0.03 255), oklch(0.14 0.04 270))",
              border: "1px solid oklch(0.62 0.22 255 / 0.35)",
              boxShadow:
                "0 0 40px oklch(0.62 0.22 255 / 0.12), inset 0 1px 0 oklch(1 0 0 / 0.1), 0 2px 8px oklch(0 0 0 / 0.4)",
            }}
          >
            <div
              className="absolute top-0 right-0 w-24 h-24 opacity-10 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, oklch(0.62 0.22 255), transparent)",
                transform: "translate(30%, -30%)",
              }}
            />
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-neon-blue" />
              <span className="text-sm text-muted-foreground">
                Total Credits
              </span>
            </div>
            <div className="heading-display text-5xl text-neon-blue mb-1">
              {credits}
            </div>
            <div className="text-xs text-muted-foreground font-mono">
              ⚡ AI Credits
            </div>
          </div>

          {/* Level */}
          <div
            className="rounded-2xl p-6 relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.12 0.03 280), oklch(0.14 0.04 295))",
              border: "1px solid oklch(0.55 0.22 295 / 0.35)",
              boxShadow:
                "0 0 40px oklch(0.55 0.22 295 / 0.12), inset 0 1px 0 oklch(1 0 0 / 0.1), 0 2px 8px oklch(0 0 0 / 0.4)",
            }}
          >
            <div
              className="absolute top-0 right-0 w-24 h-24 opacity-10 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, oklch(0.55 0.22 295), transparent)",
                transform: "translate(30%, -30%)",
              }}
            />
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-neon-purple" />
              <span className="text-sm text-muted-foreground">
                Current Level
              </span>
            </div>
            <div className="heading-display text-4xl text-neon-purple mb-3">
              {levelName}
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  Level {level} → {level < 3 ? `Level ${level + 1}` : "MAX"}
                </span>
                <span className="font-mono">{levelInfo.pct.toFixed(0)}%</span>
              </div>
              <Progress value={levelInfo.pct} className="h-1.5" />
              {levelInfo.nextLevel !== "MAX" && (
                <div className="text-xs text-muted-foreground">
                  {LEVEL_MAX[level] - credits} credits to {levelInfo.nextLevel}
                </div>
              )}
            </div>
          </div>

          {/* Streak */}
          <div
            className="rounded-2xl p-6 relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.12 0.03 40), oklch(0.14 0.03 55))",
              border: "1px solid oklch(0.65 0.22 50 / 0.35)",
              boxShadow:
                "0 0 40px oklch(0.65 0.22 50 / 0.12), inset 0 1px 0 oklch(1 0 0 / 0.1), 0 2px 8px oklch(0 0 0 / 0.4)",
            }}
          >
            <div
              className="absolute top-0 right-0 w-24 h-24 opacity-10 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, oklch(0.65 0.22 50), transparent)",
                transform: "translate(30%, -30%)",
              }}
            />
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-muted-foreground">Day Streak</span>
            </div>
            <div className="heading-display text-5xl text-orange-400 mb-1">
              {streak}
            </div>
            <div className="text-xs text-muted-foreground">
              {streak === 0
                ? "Start your streak today!"
                : streak >= 7
                  ? "🔥 Week warrior!"
                  : streak >= 3
                    ? "🌟 On fire!"
                    : "Keep it up!"}
            </div>
          </div>
        </div>

        {/* Badges */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: "var(--gradient-card)",
            border: "1px solid oklch(0.62 0.22 255 / 0.2)",
            boxShadow:
              "0 0 0 1px oklch(0.62 0.22 255 / 0.06), 0 4px 24px oklch(0 0 0 / 0.35), inset 0 1px 0 oklch(1 0 0 / 0.06)",
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="heading-section text-xl flex items-center gap-2">
              <Award className="w-5 h-5 text-neon-blue" />
              Achievement Badges
            </h2>
            <Badge className="bg-primary/10 text-neon-blue border-primary/20 text-xs font-mono">
              {earnedBadgeIds.size}/{ALL_BADGES.length}
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {ALL_BADGES.map(({ id, icon: Icon, label, desc, color, bg }) => {
              const earned = earnedBadgeIds.has(id);
              return (
                <div
                  key={id}
                  className={`relative rounded-xl p-4 text-center transition-all ${
                    earned
                      ? "animate-badge-pop card-shimmer"
                      : "opacity-35 grayscale"
                  }`}
                  style={{
                    background: earned ? bg : "oklch(0.13 0.018 264)",
                    border: `1px solid ${earned ? "oklch(0.62 0.22 255 / 0.35)" : "oklch(0.22 0.03 264)"}`,
                    boxShadow: earned
                      ? "inset 0 1px 0 oklch(1 0 0 / 0.08), 0 2px 8px oklch(0 0 0 / 0.3)"
                      : "none",
                  }}
                >
                  {!earned && (
                    <Lock className="absolute top-2 right-2 w-3 h-3 text-muted-foreground" />
                  )}
                  <Icon
                    className={`w-7 h-7 mx-auto mb-2 ${earned ? color : "text-muted-foreground"}`}
                  />
                  <div
                    className={`text-xs font-semibold ${earned ? "" : "text-muted-foreground"}`}
                  >
                    {label}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {desc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent tasks */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: "var(--gradient-card)",
            border: "1px solid oklch(0.62 0.22 255 / 0.15)",
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-neon-blue" />
              Recent Completions
            </h2>
            <Link to="/tasks">
              <Button variant="ghost" size="sm" className="text-neon-blue">
                Browse More <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          {completedTaskDetails.length === 0 ? (
            <div className="text-center py-10">
              <Target className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
              <p className="text-muted-foreground">
                No tasks completed yet. Start learning!
              </p>
              <Button
                asChild
                size="sm"
                className="mt-4 btn-primary-glow text-white border-0"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Link to="/tasks">Browse Tasks</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {completedTaskDetails.map((task) => (
                <Link
                  key={task.id.toString()}
                  to="/tasks/$id"
                  params={{ id: task.id.toString() }}
                >
                  <div className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-secondary/30 transition-colors group">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: "oklch(0.65 0.22 145 / 0.15)",
                        border: "1px solid oklch(0.65 0.22 145 / 0.25)",
                      }}
                    >
                      <Target className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate group-hover:text-neon-blue transition-colors">
                        {task.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {task.steps.length} steps
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-mono flex-shrink-0">
                      <Zap className="w-3 h-3 text-neon-blue" />
                      <span className="text-neon-blue">
                        {task.creditReward.toString()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Link to Leaderboard */}
        <div className="flex justify-center">
          <Button
            asChild
            variant="outline"
            className="border-primary/30 hover:border-primary/60"
          >
            <Link to="/leaderboard">
              <Trophy className="w-4 h-4 mr-2 text-neon-blue" />
              View Leaderboard
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
