import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  Brain,
  CheckCircle2,
  Loader2,
  Mail,
  MessageSquare,
  Send,
} from "lucide-react";
import { useState } from "react";
import { SiGithub, SiLinkedin, SiX } from "react-icons/si";
import { toast } from "sonner";
import { useSubmitContactMessage } from "../hooks/useSubmitContactMessage";

const SOCIAL_LINKS = [
  {
    icon: SiX,
    label: "Twitter / X",
    handle: "@NeuralPlayAI",
    href: "https://twitter.com/NeuralPlayAI",
  },
  {
    icon: SiLinkedin,
    label: "LinkedIn",
    handle: "NeuralPlay",
    href: "https://linkedin.com/company/neuralplay",
  },
  {
    icon: SiGithub,
    label: "GitHub",
    handle: "neuralplay-ai",
    href: "https://github.com/neuralplay-ai",
  },
];

export default function ContactPage() {
  const submitMutation = useSubmitContactMessage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (!email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    try {
      await submitMutation.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      });
      setSubmitted(true);
      toast.success("Message sent! We'll get back to you soon.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to send message. Please try again.");
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setName("");
    setEmail("");
    setMessage("");
    submitMutation.reset();
  };

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
            Get In Touch
          </Badge>
          <h1 className="heading-display text-5xl mb-4">
            <span className="gradient-text">Contact</span> Us
          </h1>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            Have questions, feedback, or want to collaborate? We'd love to hear
            from you.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Left: Contact info */}
          <div className="space-y-8">
            <div>
              <h2 className="font-display text-2xl font-bold mb-4">
                Let's Talk
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Whether you're a student with a question, a teacher looking to
                integrate NeuralPlay into your curriculum, or a developer with
                feedback — we're here and listening.
              </p>
            </div>

            {/* Email */}
            <div
              className="flex items-start gap-4 p-5 rounded-2xl"
              style={{
                background: "var(--gradient-card)",
                border: "1px solid oklch(0.62 0.22 255 / 0.15)",
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: "oklch(0.62 0.22 255 / 0.15)",
                  border: "1px solid oklch(0.62 0.22 255 / 0.3)",
                }}
              >
                <Mail className="w-5 h-5 text-neon-blue" />
              </div>
              <div>
                <div className="font-semibold text-sm mb-1">Email Us</div>
                <a
                  href="mailto:hello@neuralplay.ai"
                  className="text-neon-blue hover:underline text-sm"
                >
                  hello@neuralplay.ai
                </a>
                <p className="text-muted-foreground text-xs mt-1">
                  We respond within 24 hours
                </p>
              </div>
            </div>

            {/* Support */}
            <div
              className="flex items-start gap-4 p-5 rounded-2xl"
              style={{
                background: "var(--gradient-card)",
                border: "1px solid oklch(0.55 0.22 295 / 0.15)",
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: "oklch(0.55 0.22 295 / 0.15)",
                  border: "1px solid oklch(0.55 0.22 295 / 0.3)",
                }}
              >
                <MessageSquare className="w-5 h-5 text-neon-purple" />
              </div>
              <div>
                <div className="font-semibold text-sm mb-1">Support</div>
                <a
                  href="mailto:support@neuralplay.ai"
                  className="text-neon-purple hover:underline text-sm"
                >
                  support@neuralplay.ai
                </a>
                <p className="text-muted-foreground text-xs mt-1">
                  Technical help & account issues
                </p>
              </div>
            </div>

            {/* Social links */}
            <div>
              <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wider">
                Follow Us
              </h3>
              <div className="space-y-3">
                {SOCIAL_LINKS.map(({ icon: Icon, label, handle, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl transition-all hover:-translate-y-0.5 group"
                    style={{
                      background: "var(--gradient-card)",
                      border: "1px solid oklch(0.62 0.22 255 / 0.1)",
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "oklch(0.62 0.22 255 / 0.1)" }}
                    >
                      <Icon className="w-4 h-4 text-neon-blue" />
                    </div>
                    <div>
                      <div className="text-sm font-medium group-hover:text-neon-blue transition-colors">
                        {label}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {handle}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Brand mini */}
            <div className="flex items-center gap-3 pt-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-display font-bold gradient-text">
                  NeuralPlay
                </div>
                <div className="text-xs text-muted-foreground">
                  AI Learning Platform
                </div>
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div>
            <div
              className="rounded-2xl p-8"
              style={{
                background: "var(--gradient-card)",
                border: "1px solid oklch(0.62 0.22 255 / 0.2)",
                boxShadow: "0 0 40px oklch(0.62 0.22 255 / 0.08)",
              }}
            >
              {submitted ? (
                <div
                  className="text-center py-12"
                  data-ocid="contact.success_state"
                >
                  <div
                    className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
                    style={{
                      background: "oklch(0.65 0.22 145 / 0.15)",
                      border: "1px solid oklch(0.65 0.22 145 / 0.3)",
                    }}
                  >
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-scaleIn" />
                  </div>
                  <h3 className="font-display text-2xl font-bold mb-3">
                    Message Sent!
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Thanks for reaching out. We'll get back to you at{" "}
                    <span className="text-neon-blue">{email}</span> within 24
                    hours.
                  </p>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="border-primary/30 hover:border-primary/60"
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <h3 className="font-display text-2xl font-bold mb-1">
                      Send a Message
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Fill out the form and we'll respond promptly.
                    </p>
                  </div>

                  {submitMutation.isError && (
                    <div
                      data-ocid="contact.error_state"
                      className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                      style={{
                        background: "oklch(0.60 0.22 25 / 0.1)",
                        border: "1px solid oklch(0.60 0.22 25 / 0.3)",
                      }}
                    >
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <span className="text-red-400">
                        Failed to send message. Please try again.
                      </span>
                    </div>
                  )}

                  <div>
                    <Label
                      htmlFor="contact-name"
                      className="text-sm font-medium mb-1.5 block"
                    >
                      Name
                    </Label>
                    <Input
                      id="contact-name"
                      data-ocid="contact.name_input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      required
                      className="bg-secondary/50 border-border focus:border-primary/50"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="contact-email"
                      className="text-sm font-medium mb-1.5 block"
                    >
                      Email
                    </Label>
                    <Input
                      id="contact-email"
                      data-ocid="contact.email_input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="bg-secondary/50 border-border focus:border-primary/50"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="contact-message"
                      className="text-sm font-medium mb-1.5 block"
                    >
                      Message
                    </Label>
                    <Textarea
                      id="contact-message"
                      data-ocid="contact.message_textarea"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="How can we help you?"
                      required
                      rows={5}
                      className="bg-secondary/50 border-border focus:border-primary/50 resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    data-ocid="contact.submit_button"
                    disabled={submitMutation.isPending}
                    size="lg"
                    className="w-full btn-primary-glow text-white border-0"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    {submitMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" /> Send Message
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
