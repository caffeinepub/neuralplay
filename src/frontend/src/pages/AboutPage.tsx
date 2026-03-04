import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  Eye,
  Flame,
  Shield,
  Star,
  Target,
  Trophy,
  Users,
  Zap,
} from "lucide-react";

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: BookOpen,
    title: "Pick a Task",
    desc: "Browse our curated library of AI and ML learning tasks. Filter by difficulty: Beginner, Intermediate, or Advanced.",
    color: "text-neon-blue",
    border: "oklch(0.62 0.22 255 / 0.3)",
    bg: "oklch(0.62 0.22 255 / 0.08)",
  },
  {
    step: "02",
    icon: Target,
    title: "Complete Steps",
    desc: "Follow guided step-by-step instructions. Each step includes a mini challenge to reinforce your learning.",
    color: "text-neon-purple",
    border: "oklch(0.55 0.22 295 / 0.3)",
    bg: "oklch(0.55 0.22 295 / 0.08)",
  },
  {
    step: "03",
    icon: Zap,
    title: "Earn Credits",
    desc: "Complete tasks to earn AI Credits. Credits accumulate and contribute to your level progression.",
    color: "text-yellow-400",
    border: "oklch(0.78 0.18 90 / 0.3)",
    bg: "oklch(0.78 0.18 90 / 0.08)",
  },
  {
    step: "04",
    icon: Trophy,
    title: "Level Up",
    desc: "Progress from Novice to Explorer, Practitioner, and finally Master. Earn badges and climb the leaderboard.",
    color: "text-orange-400",
    border: "oklch(0.65 0.22 50 / 0.3)",
    bg: "oklch(0.65 0.22 50 / 0.08)",
  },
];

const GAMIFICATION_FEATURES = [
  {
    icon: Trophy,
    title: "Global Leaderboard",
    desc: "Compete with thousands of AI learners worldwide. Rankings update in real-time as you earn credits.",
    color: "text-yellow-400",
  },
  {
    icon: Flame,
    title: "Daily Challenges",
    desc: "A new challenge every day. Maintain your streak to unlock exclusive streak badges and bonus credits.",
    color: "text-orange-400",
  },
  {
    icon: Star,
    title: "Achievement Badges",
    desc: "Unlock badges for milestones like completing your first task, maintaining a 7-day streak, or reaching Master level.",
    color: "text-neon-purple",
  },
  {
    icon: Shield,
    title: "Level System",
    desc: "Four distinct levels: Novice, Explorer, Practitioner, and Master. Each level unlocks new tasks and opportunities.",
    color: "text-neon-blue",
  },
  {
    icon: Zap,
    title: "Credit Economy",
    desc: "Earn credits for every task, with higher rewards for more challenging content. Credits never expire.",
    color: "text-neon-blue",
  },
  {
    icon: Users,
    title: "Community",
    desc: "Join a growing community of AI enthusiasts from beginners to experienced practitioners.",
    color: "text-neon-purple",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative py-20 border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 neural-grid opacity-20" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, oklch(0.11 0.025 264), oklch(0.09 0.018 264))",
          }}
        />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <Badge className="bg-primary/10 text-neon-blue border-primary/20 mb-6">
            Our Story
          </Badge>
          <h1 className="heading-display text-5xl md:text-6xl mb-6">
            About <span className="gradient-text">NeuralPlay</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            We believe learning AI should be exciting, rewarding, and accessible
            to everyone. Not just engineers — students, creatives,
            entrepreneurs, and curious minds of all kinds.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 space-y-20">
        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div
            className="rounded-2xl p-8 relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.12 0.03 255), oklch(0.14 0.04 270))",
              border: "1px solid oklch(0.62 0.22 255 / 0.3)",
              boxShadow:
                "inset 0 1px 0 oklch(1 0 0 / 0.08), 0 4px 20px oklch(0 0 0 / 0.4)",
            }}
          >
            <div
              className="absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, oklch(0.62 0.22 255), transparent)",
                transform: "translate(30%, -30%)",
              }}
            />
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: "oklch(0.62 0.22 255 / 0.2)",
                  border: "1px solid oklch(0.62 0.22 255 / 0.3)",
                }}
              >
                <Target className="w-5 h-5 text-neon-blue" />
              </div>
              <h2 className="heading-section text-2xl text-neon-blue">
                Our Mission
              </h2>
            </div>
            <p className="text-muted-foreground leading-relaxed relative z-10">
              To democratize AI education by making it interactive, engaging,
              and rewarding. We're breaking down the barriers that make AI
              learning intimidating — replacing passive reading with hands-on
              challenges, and replacing boredom with genuine excitement.
            </p>
            <ul className="mt-4 space-y-2 relative z-10">
              {[
                "Accessible AI for everyone",
                "Learn by doing, not watching",
                "Real skills, real rewards",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-neon-blue flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div
            className="rounded-2xl p-8 relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.12 0.03 280), oklch(0.14 0.04 295))",
              border: "1px solid oklch(0.55 0.22 295 / 0.25)",
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
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: "oklch(0.55 0.22 295 / 0.2)",
                  border: "1px solid oklch(0.55 0.22 295 / 0.3)",
                }}
              >
                <Eye className="w-5 h-5 text-neon-purple" />
              </div>
              <h2 className="heading-section text-2xl text-neon-purple">
                Our Vision
              </h2>
            </div>
            <p className="text-muted-foreground leading-relaxed relative z-10">
              A world where AI literacy is universal. Where anyone — regardless
              of technical background — can understand, apply, and benefit from
              artificial intelligence. NeuralPlay is our contribution to that
              future.
            </p>
            <ul className="mt-4 space-y-2 relative z-10">
              {[
                "1M+ AI learners worldwide",
                "50+ curated learning tracks",
                "The #1 AI learning game",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-neon-purple flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* How It Works */}
        <div>
          <div className="text-center mb-12">
            <Badge className="bg-primary/10 text-neon-blue border-primary/20 mb-4">
              The System
            </Badge>
            <h2 className="heading-display text-4xl mb-4">
              How <span className="gradient-text">It Works</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Four simple steps from curious beginner to confident AI
              practitioner.
            </p>
          </div>

          <div className="relative">
            {/* Connector line */}
            <div
              className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2"
              style={{
                background:
                  "linear-gradient(90deg, transparent, oklch(0.62 0.22 255 / 0.3) 20%, oklch(0.55 0.22 295 / 0.3) 80%, transparent)",
              }}
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
              {HOW_IT_WORKS.map(
                ({ step, icon: Icon, title, desc, color, border, bg }) => (
                  <div
                    key={step}
                    className="rounded-2xl p-6 text-center transition-transform hover:-translate-y-1"
                    style={{ background: bg, border: `1px solid ${border}` }}
                  >
                    <div className="font-display text-5xl font-bold opacity-20 mb-3">
                      {step}
                    </div>
                    <div
                      className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                      style={{ background: bg, border: `1px solid ${border}` }}
                    >
                      <Icon className={`w-6 h-6 ${color}`} />
                    </div>
                    <h3
                      className={`font-display font-bold text-lg mb-2 ${color}`}
                    >
                      {title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {desc}
                    </p>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>

        {/* Gamification */}
        <div>
          <div className="text-center mb-12">
            <Badge className="bg-accent/10 text-neon-purple border-accent/20 mb-4">
              Gamification
            </Badge>
            <h2 className="heading-display text-4xl mb-4">
              More than <span className="gradient-text">just learning</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              We've built a full achievement ecosystem to keep you motivated,
              engaged, and coming back every day.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {GAMIFICATION_FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="rounded-2xl p-6 group transition-all hover:-translate-y-1 card-glow card-shimmer"
                style={{
                  background: "var(--gradient-card)",
                  border: "1px solid oklch(0.62 0.22 255 / 0.12)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl mb-4 flex items-center justify-center"
                  style={{
                    background: "oklch(0.62 0.22 255 / 0.1)",
                    border: "1px solid oklch(0.62 0.22 255 / 0.2)",
                  }}
                >
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <h3 className="font-display font-bold text-base mb-2 group-hover:text-neon-blue transition-colors">
                  {title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div
          className="text-center rounded-3xl py-16 px-8 relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.12 0.03 264), oklch(0.14 0.04 280) 50%, oklch(0.12 0.03 295))",
            border: "1px solid oklch(0.62 0.22 255 / 0.2)",
          }}
        >
          <div className="absolute inset-0 neural-grid opacity-10" />
          <div className="relative z-10">
            <div
              className="w-14 h-14 rounded-2xl mx-auto mb-6 flex items-center justify-center"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Brain className="w-7 h-7 text-white" />
            </div>
            <h2 className="heading-display text-4xl mb-4">
              Ready to <span className="gradient-text">Play?</span>
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Join thousands of learners who are already mastering AI through
              NeuralPlay's gamified challenges.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="btn-primary-glow text-white border-0 px-8"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Link to="/tasks">
                  Start Learning <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="btn-secondary-outline px-8 border-0"
              >
                <Link to="/leaderboard">View Leaderboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
