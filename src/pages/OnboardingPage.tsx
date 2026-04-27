import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Bot, Plug, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: CheckCircle2,
    title: "Account created",
    description: "Your workspace is ready to go.",
    done: true,
    action: null,
  },
  {
    icon: Plug,
    title: "Connect a channel",
    description: "Set up Twilio for SMS/Voice, Gmail for email, or WhatsApp to start receiving messages.",
    done: false,
    action: { label: "Go to Integrations", href: "/dashboard/settings" },
  },
  {
    icon: Bot,
    title: "Create your first agent",
    description: "Build an AI agent to handle conversations automatically.",
    done: false,
    action: { label: "Create Agent", href: "/dashboard/agents" },
  },
];

export const OnboardingPage = () => {
  const navigate = useNavigate();

  const handleFinish = () => {
    localStorage.setItem("onboarding_done", "true");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <Bot className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Welcome aboard!</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">Here's how to get started in 3 steps.</p>
        </div>

        <div className="space-y-4 mb-8">
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex items-start gap-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm"
            >
              <div className="mt-0.5">
                {step.done
                  ? <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  : <Circle className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                }
              </div>
              <div className="flex-1">
                <p className={`font-semibold ${step.done ? "text-emerald-600 dark:text-emerald-400" : "text-slate-800 dark:text-white"}`}>
                  {step.title}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{step.description}</p>
              </div>
              {step.action && (
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  onClick={() => navigate(step.action!.href)}
                >
                  {step.action.label}
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <Button
          className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
          onClick={handleFinish}
        >
          Go to Dashboard
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
