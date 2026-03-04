import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Flame,
  Search,
  Target,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { TaskCategory } from "../backend.d";
import { useGetAllTasks } from "../hooks/useQueries";
import { useGetCallerUserProfile } from "../hooks/useQueries";

type FilterTab = "all" | "beginner" | "intermediate" | "advanced";

const FILTER_TABS: { id: FilterTab; label: string; color: string }[] = [
  { id: "all", label: "All", color: "" },
  { id: "beginner", label: "Beginner", color: "text-emerald-400" },
  { id: "intermediate", label: "Intermediate", color: "text-yellow-400" },
  { id: "advanced", label: "Advanced", color: "text-red-400" },
];

function getCategoryStyle(cat: TaskCategory) {
  switch (cat) {
    case TaskCategory.beginner:
      return {
        badge: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
        glow: "oklch(0.65 0.22 145 / 0.15)",
        border: "oklch(0.65 0.22 145 / 0.2)",
      };
    case TaskCategory.intermediate:
      return {
        badge: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
        glow: "oklch(0.78 0.18 90 / 0.15)",
        border: "oklch(0.78 0.18 90 / 0.2)",
      };
    case TaskCategory.advanced:
      return {
        badge: "text-red-400 bg-red-400/10 border-red-400/20",
        glow: "oklch(0.60 0.22 25 / 0.15)",
        border: "oklch(0.60 0.22 25 / 0.2)",
      };
  }
}

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const { data: tasks, isLoading } = useGetAllTasks();
  const { data: profile } = useGetCallerUserProfile();

  const completedIds = new Set((profile?.completedTaskIds ?? []).map(String));

  const filtered = (tasks ?? []).filter((task) => {
    const matchesTab = activeTab === "all" || task.category === activeTab;
    const matchesSearch =
      !search ||
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.description.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

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
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <BrainCircuit className="w-5 h-5 text-neon-blue" />
            <span className="text-neon-blue text-sm font-medium">
              Task Catalogue
            </span>
          </div>
          <h1 className="heading-display text-4xl md:text-5xl mb-4">
            Browse <span className="gradient-text">AI Tasks</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl">
            Pick a challenge, follow the steps, earn credits. From neural
            networks to natural language processing.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Filter tabs */}
          <div
            className="flex items-center gap-1 p-1 rounded-xl"
            style={{
              background: "oklch(0.12 0.022 264)",
              border: "1px solid oklch(0.62 0.22 255 / 0.1)",
            }}
          >
            {FILTER_TABS.map(({ id, label }) => (
              <button
                type="button"
                key={id}
                data-ocid="tasks.filter_tab"
                onClick={() => setActiveTab(id)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === id
                    ? "text-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                style={
                  activeTab === id
                    ? { background: "var(--gradient-primary)" }
                    : {}
                }
              >
                {label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-secondary/50 border-border focus:border-primary/50"
            />
          </div>
        </div>

        {/* Tasks grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {["s1", "s2", "s3", "s4", "s5", "s6"].map((k) => (
              <Skeleton key={k} className="h-52 rounded-2xl animate-shimmer" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            data-ocid="tasks.empty_state"
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div
              className="w-16 h-16 rounded-2xl mb-4 flex items-center justify-center"
              style={{
                background: "oklch(0.62 0.22 255 / 0.1)",
                border: "1px solid oklch(0.62 0.22 255 / 0.2)",
              }}
            >
              <BrainCircuit className="w-8 h-8 text-neon-blue opacity-60" />
            </div>
            <h3 className="font-display text-xl font-bold mb-2">
              No tasks found
            </h3>
            <p className="text-muted-foreground mb-6">
              {search
                ? "Try a different search query."
                : "No tasks in this category yet."}
            </p>
            <Button
              variant="outline"
              className="border-primary/30"
              onClick={() => {
                setActiveTab("all");
                setSearch("");
              }}
            >
              View All Tasks
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((task, idx) => {
              const style = getCategoryStyle(task.category);
              const isCompleted = completedIds.has(String(task.id));

              return (
                <Link
                  key={task.id.toString()}
                  to="/tasks/$id"
                  params={{ id: task.id.toString() }}
                  data-ocid={`tasks.item.${idx + 1}`}
                >
                  <div
                    className="group relative rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 h-full flex flex-col card-shimmer"
                    style={{
                      background: "var(--gradient-card)",
                      border: `1px solid ${style.border}`,
                      boxShadow: `0 0 0 1px ${style.border}, 0 4px 20px oklch(0 0 0 / 0.3), inset 0 1px 0 oklch(1 0 0 / 0.06)`,
                      transition: "box-shadow 0.25s ease, transform 0.25s ease",
                    }}
                  >
                    {/* Top row badges */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs border ${style.badge}`}>
                          {task.category}
                        </Badge>
                        {task.isDaily && (
                          <Badge className="bg-yellow-400/10 text-yellow-400 border-yellow-400/20 text-xs">
                            <Flame className="w-2.5 h-2.5 mr-1" />
                            Daily
                          </Badge>
                        )}
                      </div>
                      {isCompleted && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>

                    {/* Icon */}
                    <div
                      className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center"
                      style={{
                        background: style.glow,
                        border: `1px solid ${style.border}`,
                      }}
                    >
                      <Target className="w-5 h-5 text-neon-blue" />
                    </div>

                    {/* Content */}
                    <h3 className="font-display font-bold tracking-tight leading-snug mb-2 group-hover:text-neon-blue transition-colors line-clamp-2 flex-1">
                      {task.title}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                      {task.description}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-1.5 text-sm font-mono">
                        <Zap className="w-3.5 h-3.5 text-neon-blue" />
                        <span className="font-bold text-neon-blue">
                          {task.creditReward.toString()}
                        </span>
                        <span className="text-muted-foreground">credits</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground text-xs">
                        <span>{task.steps.length} steps</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>

                    {/* Completed overlay */}
                    {isCompleted && (
                      <div className="absolute inset-0 rounded-2xl bg-emerald-400/3 pointer-events-none" />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Count */}
        {!isLoading && filtered.length > 0 && (
          <p className="text-muted-foreground text-sm text-center mt-8">
            Showing {filtered.length} of {tasks?.length ?? 0} tasks
          </p>
        )}
      </div>
    </div>
  );
}
