import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Crown, Medal, Star, Trophy, Zap } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetCallerUserProfile,
  useGetLeaderboard,
} from "../hooks/useQueries";

const LEVEL_NAMES = ["Novice", "Explorer", "Practitioner", "Master"];

function getMedalIcon(rank: number) {
  if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
  return (
    <span className="font-mono text-sm text-muted-foreground w-5 text-center">
      {rank}
    </span>
  );
}

function getMedalColor(rank: number) {
  if (rank === 1)
    return {
      border: "oklch(0.78 0.18 90 / 0.4)",
      bg: "oklch(0.78 0.18 90 / 0.08)",
      glow: "0 0 20px oklch(0.78 0.18 90 / 0.2)",
    };
  if (rank === 2)
    return {
      border: "oklch(0.75 0.02 264 / 0.4)",
      bg: "oklch(0.75 0.02 264 / 0.08)",
      glow: "0 0 15px oklch(0.75 0.02 264 / 0.2)",
    };
  if (rank === 3)
    return {
      border: "oklch(0.60 0.12 55 / 0.4)",
      bg: "oklch(0.60 0.12 55 / 0.08)",
      glow: "0 0 15px oklch(0.60 0.12 55 / 0.1)",
    };
  return {
    border: "oklch(0.62 0.22 255 / 0.1)",
    bg: "transparent",
    glow: "none",
  };
}

function getLevelName(level: bigint): string {
  return LEVEL_NAMES[Number(level)] ?? "Master";
}

export default function LeaderboardPage() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const { data: leaderboard, isLoading } = useGetLeaderboard();
  const { data: profile } = useGetCallerUserProfile();

  const currentUsername = profile?.username;

  const top3 = leaderboard?.slice(0, 3) ?? [];

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <div className="relative py-16 border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 neural-grid opacity-20" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, oklch(0.11 0.025 264), oklch(0.09 0.018 264))",
          }}
        />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-yellow-400/30 bg-yellow-400/10 mb-6">
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-sm font-medium text-yellow-400">
              Global Rankings
            </span>
          </div>
          <h1 className="heading-display text-4xl md:text-5xl mb-4">
            <span className="gradient-text">Leaderboard</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            The top AI learners ranked by credits earned. Compete, learn, and
            rise to the top.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="space-y-4 max-w-3xl mx-auto">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-2xl animate-shimmer" />
            ))}
          </div>
        ) : !leaderboard?.length ? (
          <div className="text-center py-20">
            <Trophy className="w-14 h-14 mx-auto mb-4 text-muted-foreground opacity-30" />
            <h3 className="font-display text-xl font-bold mb-2">
              No Rankings Yet
            </h3>
            <p className="text-muted-foreground">
              Be the first to complete tasks and claim the top spot!
            </p>
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            {top3.length > 0 && (
              <div className="mb-12">
                <div className="flex items-end justify-center gap-4 max-w-2xl mx-auto">
                  {/* 2nd place */}
                  {top3[1] && (
                    <div className="flex-1 flex flex-col items-center">
                      <div
                        className={`w-full rounded-2xl p-5 text-center transition-all ${
                          top3[1].username === currentUsername
                            ? "ring-2 ring-primary/50"
                            : ""
                        }`}
                        style={{
                          background:
                            "linear-gradient(135deg, oklch(0.12 0.022 264), oklch(0.16 0.02 264))",
                          border: "1px solid oklch(0.75 0.02 264 / 0.3)",
                          boxShadow: "0 0 15px oklch(0.75 0.02 264 / 0.15)",
                          marginBottom: "0px",
                        }}
                      >
                        <Medal
                          className="w-8 h-8 mx-auto mb-2"
                          style={{ color: "oklch(0.75 0.02 264)" }}
                        />
                        <div className="font-display font-bold truncate">
                          {top3[1].username}
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">
                          {getLevelName(top3[1].level)}
                        </div>
                        <div className="flex items-center justify-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-neon-blue" />
                          <span className="font-mono font-bold text-neon-blue">
                            {top3[1].credits.toString()}
                          </span>
                        </div>
                      </div>
                      <div
                        className="w-full h-16 rounded-b-xl flex items-center justify-center font-display text-2xl font-bold"
                        style={{
                          background: "oklch(0.75 0.02 264 / 0.15)",
                          color: "oklch(0.75 0.02 264)",
                        }}
                      >
                        2
                      </div>
                    </div>
                  )}

                  {/* 1st place */}
                  <div className="flex-1 flex flex-col items-center -mt-6">
                    <div
                      className={`w-full rounded-2xl p-6 text-center relative overflow-hidden transition-all ${
                        top3[0].username === currentUsername
                          ? "ring-2 ring-primary/50"
                          : ""
                      }`}
                      style={{
                        background:
                          "linear-gradient(135deg, oklch(0.13 0.04 75), oklch(0.16 0.03 90))",
                        border: "1px solid oklch(0.78 0.18 90 / 0.4)",
                        boxShadow: "0 0 30px oklch(0.78 0.18 90 / 0.25)",
                      }}
                    >
                      <div className="absolute inset-0 neural-grid opacity-10" />
                      <Crown className="w-10 h-10 mx-auto mb-2 text-yellow-400 relative z-10 animate-float" />
                      <div className="heading-section text-lg relative z-10 truncate">
                        {top3[0].username}
                      </div>
                      <div className="text-xs text-muted-foreground mb-3 relative z-10">
                        {getLevelName(top3[0].level)}
                      </div>
                      <div className="flex items-center justify-center gap-1.5 relative z-10">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <span className="font-mono font-bold text-yellow-400 text-lg">
                          {top3[0].credits.toString()}
                        </span>
                      </div>
                    </div>
                    <div
                      className="w-full h-24 rounded-b-xl flex items-center justify-center font-display text-3xl font-bold"
                      style={{
                        background: "oklch(0.78 0.18 90 / 0.15)",
                        color: "oklch(0.78 0.18 90)",
                      }}
                    >
                      1
                    </div>
                  </div>

                  {/* 3rd place */}
                  {top3[2] && (
                    <div className="flex-1 flex flex-col items-center mt-4">
                      <div
                        className={`w-full rounded-2xl p-5 text-center transition-all ${
                          top3[2].username === currentUsername
                            ? "ring-2 ring-primary/50"
                            : ""
                        }`}
                        style={{
                          background:
                            "linear-gradient(135deg, oklch(0.12 0.025 50), oklch(0.14 0.02 60))",
                          border: "1px solid oklch(0.60 0.12 55 / 0.3)",
                          boxShadow: "0 0 15px oklch(0.60 0.12 55 / 0.1)",
                        }}
                      >
                        <Award className="w-8 h-8 mx-auto mb-2 text-amber-600" />
                        <div className="font-display font-bold truncate">
                          {top3[2].username}
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">
                          {getLevelName(top3[2].level)}
                        </div>
                        <div className="flex items-center justify-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-neon-blue" />
                          <span className="font-mono font-bold text-neon-blue">
                            {top3[2].credits.toString()}
                          </span>
                        </div>
                      </div>
                      <div
                        className="w-full h-12 rounded-b-xl flex items-center justify-center font-display text-2xl font-bold"
                        style={{
                          background: "oklch(0.60 0.12 55 / 0.15)",
                          color: "oklch(0.60 0.12 55)",
                        }}
                      >
                        3
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Full Table */}
            <div
              className="rounded-2xl overflow-hidden max-w-3xl mx-auto"
              style={{
                background: "var(--gradient-card)",
                border: "1px solid oklch(0.62 0.22 255 / 0.2)",
                boxShadow:
                  "0 0 0 1px oklch(0.62 0.22 255 / 0.08), 0 8px 32px oklch(0 0 0 / 0.4), inset 0 1px 0 oklch(1 0 0 / 0.06)",
              }}
              data-ocid="leaderboard.table"
            >
              <div className="px-6 py-4 border-b border-white/5">
                <h2 className="heading-section text-lg">Full Rankings</h2>
              </div>
              <div className="divide-y divide-white/5">
                {(leaderboard ?? []).map((user, idx) => {
                  const rank = idx + 1;
                  const medal = getMedalColor(rank);
                  const isCurrentUser =
                    isAuthenticated && user.username === currentUsername;

                  return (
                    <div
                      key={user.username}
                      data-ocid={`leaderboard.row.${rank}`}
                      className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-primary/3"
                      style={{
                        background: isCurrentUser
                          ? "oklch(0.62 0.22 255 / 0.05)"
                          : rank <= 3
                            ? medal.bg
                            : "transparent",
                        boxShadow: isCurrentUser
                          ? "inset 0 0 0 1px oklch(0.62 0.22 255 / 0.2)"
                          : "none",
                      }}
                    >
                      {/* Rank */}
                      <div className="w-8 flex items-center justify-center flex-shrink-0">
                        {getMedalIcon(rank)}
                      </div>

                      {/* Avatar */}
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{
                          background: "var(--gradient-primary)",
                        }}
                      >
                        {user.username?.[0]?.toUpperCase() ?? "?"}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm truncate">
                            {user.username}
                          </span>
                          {isCurrentUser && (
                            <Badge className="bg-primary/20 text-neon-blue border-primary/30 text-[10px] px-1.5 py-0">
                              You
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge className="bg-secondary/50 border-border text-muted-foreground text-[10px] px-1.5 py-0">
                            {getLevelName(user.level)}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {user.badges.length} badges
                          </span>
                        </div>
                      </div>

                      {/* Credits */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Zap className="w-4 h-4 text-neon-blue" />
                        <span className="font-mono font-bold text-neon-blue">
                          {user.credits.toString()}
                        </span>
                      </div>

                      {/* Stars for completed tasks */}
                      <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                        <Star className="w-3 h-3 text-yellow-400" />
                        <span>{user.completedTaskIds.length}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
