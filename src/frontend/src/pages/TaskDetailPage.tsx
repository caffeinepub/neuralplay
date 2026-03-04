import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link, useParams, useRouter } from "@tanstack/react-router";
import {
  AlertCircle,
  BrainCircuit,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flame,
  Loader2,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { TaskCategory } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCompleteTask,
  useGetAllTasks,
  useGetCallerUserProfile,
} from "../hooks/useQueries";

function getCategoryStyle(cat: TaskCategory) {
  switch (cat) {
    case TaskCategory.beginner:
      return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
    case TaskCategory.intermediate:
      return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
    case TaskCategory.advanced:
      return "text-red-400 bg-red-400/10 border-red-400/20";
  }
}

// Generate a simple multiple-choice quiz from step text
function generateMiniChallenge(
  stepText: string,
  stepIndex: number,
): {
  question: string;
  options: string[];
  correctIndex: number;
} {
  const questions = [
    `What is the main concept covered in Step ${stepIndex + 1}?`,
    "Which best describes the goal of this step?",
    "What skill does completing this step develop?",
  ];

  const question = questions[stepIndex % questions.length];

  // Extract a short phrase from the step text for the correct answer
  const words = stepText.split(" ").slice(0, 8).join(" ");
  const shortAnswer = words.length > 50 ? `${words.slice(0, 50)}…` : words;

  const wrongAnswers = [
    "Data preprocessing and feature engineering",
    "Model deployment and cloud infrastructure",
    "Statistical hypothesis testing methods",
  ];

  const options = [
    shortAnswer,
    wrongAnswers[stepIndex % 3],
    wrongAnswers[(stepIndex + 1) % 3],
    wrongAnswers[(stepIndex + 2) % 3],
  ];

  return { question, options, correctIndex: 0 };
}

export default function TaskDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const router = useRouter();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const { data: tasks, isLoading } = useGetAllTasks();
  const { data: profile } = useGetCallerUserProfile();
  const completeTaskMutation = useCompleteTask();

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, number>
  >({});
  const [answeredCorrectly, setAnsweredCorrectly] = useState<Set<number>>(
    new Set(),
  );
  const [showFeedback, setShowFeedback] = useState<
    Record<number, "correct" | "wrong" | null>
  >({});
  const [taskCompleted, setTaskCompleted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const task = tasks?.find((t) => t.id.toString() === id);
  const isAlreadyCompleted =
    profile?.completedTaskIds.map(String).includes(id ?? "") ?? false;

  const handleSelectAnswer = (stepIdx: number, optionIdx: number) => {
    if (answeredCorrectly.has(stepIdx)) return;

    const challenge = generateMiniChallenge(task!.steps[stepIdx], stepIdx);
    setSelectedAnswers((prev) => ({ ...prev, [stepIdx]: optionIdx }));

    if (optionIdx === challenge.correctIndex) {
      setAnsweredCorrectly((prev) => new Set([...prev, stepIdx]));
      setShowFeedback((prev) => ({ ...prev, [stepIdx]: "correct" }));
      setCompletedSteps((prev) => new Set([...prev, stepIdx]));
      toast.success("Correct answer! 🎉");
    } else {
      setShowFeedback((prev) => ({ ...prev, [stepIdx]: "wrong" }));
      setTimeout(() => {
        setShowFeedback((prev) => ({ ...prev, [stepIdx]: null }));
        setSelectedAnswers((prev) => {
          const copy = { ...prev };
          delete copy[stepIdx];
          return copy;
        });
      }, 1500);
    }
  };

  const handleCompleteTask = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to complete tasks and earn credits.");
      router.navigate({ to: "/auth" });
      return;
    }
    if (!task) return;

    try {
      await completeTaskMutation.mutateAsync(task.id);
      setTaskCompleted(true);
      setShowCelebration(true);
      toast.success(`🎉 Task completed! +${task.creditReward} credits earned!`);
      setTimeout(() => setShowCelebration(false), 3000);
    } catch (err) {
      console.error(err);
      toast.error("Failed to complete task. Please try again.");
    }
  };

  const allStepsCompleted = task
    ? completedSteps.size === task.steps.length
    : false;
  const progressPct = task
    ? (completedSteps.size / task.steps.length) * 100
    : 0;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin text-neon-blue" />
          <span>Loading task...</span>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{
            background: "oklch(0.62 0.22 255 / 0.1)",
            border: "1px solid oklch(0.62 0.22 255 / 0.2)",
          }}
        >
          <AlertCircle className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="font-display text-2xl font-bold mb-2">Task Not Found</h2>
        <p className="text-muted-foreground mb-6">
          This task doesn't exist or has been removed.
        </p>
        <Button
          asChild
          className="btn-primary-glow text-white border-0"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Link to="/tasks">Browse Tasks</Link>
        </Button>
      </div>
    );
  }

  const challenge = generateMiniChallenge(task.steps[currentStep], currentStep);

  return (
    <div className="min-h-screen">
      {/* Celebration overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div className="animate-scaleIn text-center">
            <div className="heading-display text-6xl gradient-text mb-4">
              🎉
            </div>
            <div className="heading-display text-3xl gradient-text">
              Task Complete!
            </div>
            <div className="text-neon-blue text-xl font-mono mt-2">
              +{task.creditReward.toString()} Credits
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="relative py-10 border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 neural-grid opacity-20" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, oklch(0.11 0.025 264), oklch(0.09 0.018 264))",
          }}
        />
        <div className="container mx-auto px-4 relative z-10">
          <Link
            to="/tasks"
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground mb-4 text-sm transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Tasks
          </Link>
          <div className="flex flex-wrap items-start gap-3 mb-3">
            <Badge
              className={`text-xs border ${getCategoryStyle(task.category)}`}
            >
              {task.category}
            </Badge>
            {task.isDaily && (
              <Badge className="bg-yellow-400/10 text-yellow-400 border-yellow-400/20 text-xs">
                <Flame className="w-3 h-3 mr-1" />
                Daily Challenge
              </Badge>
            )}
            {(isAlreadyCompleted || taskCompleted) && (
              <Badge className="bg-emerald-400/10 text-emerald-400 border-emerald-400/20 text-xs">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Completed
              </Badge>
            )}
          </div>
          <h1 className="heading-display text-3xl md:text-4xl mb-3">
            {task.title}
          </h1>
          <p className="text-muted-foreground mb-4">{task.description}</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 font-mono">
              <Zap className="w-4 h-4 text-neon-blue" />
              <span className="font-bold text-neon-blue">
                {task.creditReward.toString()}
              </span>
              <span className="text-muted-foreground text-sm">credits</span>
            </div>
            <div className="text-muted-foreground text-sm">
              {task.steps.length} steps
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar: Step navigator */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div
                className="rounded-2xl p-5"
                style={{
                  background: "var(--gradient-card)",
                  border: "1px solid oklch(0.62 0.22 255 / 0.2)",
                  boxShadow:
                    "inset 0 1px 0 oklch(1 0 0 / 0.06), 0 4px 20px oklch(0 0 0 / 0.3)",
                }}
              >
                <h3 className="heading-section text-sm mb-4 flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-neon-blue" />
                  Steps
                </h3>

                <div className="mb-4">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Progress</span>
                    <span>
                      {completedSteps.size}/{task.steps.length}
                    </span>
                  </div>
                  <Progress value={progressPct} className="h-1.5" />
                </div>

                <div className="space-y-2">
                  {task.steps.map((step, idx) => {
                    const isCompleted = completedSteps.has(idx);
                    const isCurrent = currentStep === idx;
                    return (
                      <button
                        type="button"
                        key={step.slice(0, 20)}
                        data-ocid={`task_detail.step.${idx + 1}`}
                        onClick={() => setCurrentStep(idx)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center gap-2.5 ${
                          isCurrent
                            ? "text-white"
                            : isCompleted
                              ? "text-emerald-400"
                              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                        }`}
                        style={
                          isCurrent
                            ? { background: "var(--gradient-primary)" }
                            : {}
                        }
                      >
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-mono flex-shrink-0 ${
                            isCompleted
                              ? "bg-emerald-400/20 border border-emerald-400/40"
                              : isCurrent
                                ? "bg-white/20"
                                : "bg-secondary border border-border"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            idx + 1
                          )}
                        </div>
                        <span className="line-clamp-1 text-xs">
                          {step.slice(0, 40)}...
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Current step */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: "var(--gradient-card)",
                border: "1px solid oklch(0.62 0.22 255 / 0.15)",
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-display font-bold text-sm"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  {currentStep + 1}
                </div>
                <h2 className="font-display text-xl font-bold">
                  Step {currentStep + 1}
                </h2>
                {completedSteps.has(currentStep) && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 ml-auto" />
                )}
              </div>
              <p className="text-foreground leading-relaxed text-base">
                {task.steps[currentStep]}
              </p>
            </div>

            {/* Mini Challenge */}
            <div
              className="rounded-2xl p-6 relative overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.12 0.03 275), oklch(0.14 0.04 295))",
                border: `1px solid ${answeredCorrectly.has(currentStep) ? "oklch(0.65 0.22 145 / 0.4)" : "oklch(0.55 0.22 295 / 0.3)"}`,
              }}
            >
              <div
                className="absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, oklch(0.55 0.22 295), transparent)",
                  transform: "translate(30%, -30%)",
                }}
              />

              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-neon-purple" />
                <span className="text-sm font-semibold text-neon-purple">
                  Mini Challenge
                </span>
                {answeredCorrectly.has(currentStep) && (
                  <Badge className="ml-auto bg-emerald-400/10 text-emerald-400 border-emerald-400/20 text-xs">
                    ✓ Solved
                  </Badge>
                )}
              </div>

              <p className="font-medium mb-5">{challenge.question}</p>

              <div className="space-y-3">
                {challenge.options.map((option, optIdx) => {
                  const isSelected = selectedAnswers[currentStep] === optIdx;
                  const isCorrect = optIdx === challenge.correctIndex;
                  const feedback = showFeedback[currentStep];
                  const stepAnsweredCorrectly =
                    answeredCorrectly.has(currentStep);

                  let style =
                    "border-border text-foreground hover:border-primary/50 hover:bg-primary/5";
                  if (stepAnsweredCorrectly && isCorrect) {
                    style =
                      "border-emerald-400/50 bg-emerald-400/10 text-emerald-400";
                  } else if (feedback === "wrong" && isSelected) {
                    style = "border-red-400/50 bg-red-400/10 text-red-400";
                  }

                  return (
                    <button
                      type="button"
                      key={option.slice(0, 20)}
                      onClick={() => handleSelectAnswer(currentStep, optIdx)}
                      disabled={stepAnsweredCorrectly}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm border transition-all ${style} ${
                        !stepAnsweredCorrectly
                          ? "cursor-pointer"
                          : "cursor-default"
                      }`}
                    >
                      <span className="inline-flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-mono flex-shrink-0">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        {option}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="border-border"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>

              <span className="text-sm text-muted-foreground">
                {currentStep + 1} / {task.steps.length}
              </span>

              {currentStep < task.steps.length - 1 ? (
                <Button
                  onClick={() =>
                    setCurrentStep(
                      Math.min(task.steps.length - 1, currentStep + 1),
                    )
                  }
                  className="btn-primary-glow text-white border-0"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <div />
              )}
            </div>

            {/* Complete Task button */}
            {currentStep === task.steps.length - 1 && (
              <div
                className="rounded-2xl p-6 text-center"
                style={{
                  background:
                    isAlreadyCompleted || taskCompleted
                      ? "oklch(0.65 0.22 145 / 0.08)"
                      : "linear-gradient(135deg, oklch(0.12 0.03 255), oklch(0.14 0.04 275))",
                  border: `1px solid ${isAlreadyCompleted || taskCompleted ? "oklch(0.65 0.22 145 / 0.3)" : "oklch(0.62 0.22 255 / 0.3)"}`,
                }}
              >
                {isAlreadyCompleted || taskCompleted ? (
                  <div className="flex flex-col items-center gap-3">
                    <Trophy className="w-10 h-10 text-yellow-400" />
                    <h3 className="font-display text-xl font-bold text-emerald-400">
                      Task Already Completed!
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      You've already earned {task.creditReward.toString()}{" "}
                      credits for this task.
                    </p>
                    <Button
                      asChild
                      variant="outline"
                      className="border-emerald-400/30 text-emerald-400 mt-2"
                    >
                      <Link to="/tasks">Explore More Tasks</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ background: "var(--gradient-primary)" }}
                    >
                      <Trophy className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-display text-xl font-bold">
                      Ready to Complete?
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {allStepsCompleted
                        ? "You've answered all mini challenges! Complete the task to earn your credits."
                        : `Answer the mini challenges to complete all steps (${completedSteps.size}/${task.steps.length} done).`}
                    </p>
                    <Button
                      size="lg"
                      data-ocid="task_detail.complete_button"
                      onClick={handleCompleteTask}
                      disabled={completeTaskMutation.isPending}
                      className="btn-primary-glow text-white border-0 px-8"
                      style={{ background: "var(--gradient-primary)" }}
                    >
                      {completeTaskMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Completing...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Complete & Earn {task.creditReward.toString()} Credits
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
