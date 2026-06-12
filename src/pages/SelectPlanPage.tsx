import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, CheckCircle2, Sparkles, ArrowRight, Users, Zap, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

interface Plan {
  id: number;
  name: string;
  price: number;
  currency: string;
  description: string | null;
  features: string | null;
  default_user_limit: number;
  trial_days: number;
  billing_interval: string;
  max_agents: number | null;
  max_monthly_conversations: number | null;
}

const PLAN_ICONS: Record<string, React.ReactNode> = {
  default: <Zap className="h-5 w-5" />,
  free: <Sparkles className="h-5 w-5" />,
  pro: <Zap className="h-5 w-5" />,
  enterprise: <Crown className="h-5 w-5" />,
};

const PLAN_COLORS: Record<string, string> = {
  default: "from-violet-600 to-purple-700",
  free: "from-slate-500 to-slate-600",
  pro: "from-violet-600 to-purple-700",
  enterprise: "from-amber-500 to-orange-600",
};

function getPlanKey(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("enterprise")) return "enterprise";
  if (lower.includes("pro")) return "pro";
  if (lower.includes("free") || lower.includes("trial")) return "free";
  return "default";
}

function formatFeatures(features: string | null): string[] {
  if (!features) return [];
  try {
    const parsed = JSON.parse(features);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return features.split(",").map((f) => f.trim()).filter(Boolean);
}

function formatPrice(price: number, currency: string, interval: string) {
  if (price === 0) return "Free";
  const sym = currency === "INR" ? "₹" : "$";
  return `${sym}${price}/${interval === "year" ? "yr" : "mo"}`;
}

export default function SelectPlanPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { authFetch } = useAuth();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: plans = [], isLoading } = useQuery<Plan[]>({
    queryKey: ["onboarding-plans"],
    queryFn: async () => {
      const res = await apiFetch("/api/v1/onboarding/select-plan");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async (planId: number) => {
      const res = await authFetch("/api/v1/onboarding/select-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: planId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to select plan");
      }
      return res.json();
    },
    onSuccess: () => navigate("/dashboard/onboarding"),
    onError: (e: Error) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleSelect = (planId: number) => {
    setSelectedId(planId);
    mutation.mutate(planId);
  };

  const handleSkip = () => navigate("/dashboard/onboarding");

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 shadow-lg shadow-violet-200 mb-5">
            <Crown className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Choose your plan</h1>
          <p className="text-slate-500">
            Start with a{" "}
            <span className="font-semibold text-violet-600">
              {plans[0]?.trial_days ?? 14}-day free trial
            </span>{" "}
            on any paid plan. No credit card required.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
          </div>
        ) : (
          <div
            className={cn(
              "grid gap-4",
              plans.length <= 2
                ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            )}
          >
            {plans.map((plan) => {
              const key = getPlanKey(plan.name);
              const gradient = PLAN_COLORS[key] ?? PLAN_COLORS.default;
              const icon = PLAN_ICONS[key] ?? PLAN_ICONS.default;
              const features = formatFeatures(plan.features);
              const isFree = plan.price === 0;
              const isSelected = selectedId === plan.id;
              const isLoading = mutation.isPending && selectedId === plan.id;

              return (
                <div
                  key={plan.id}
                  className={cn(
                    "relative flex flex-col rounded-2xl border-2 bg-white p-6 transition-all cursor-pointer",
                    isSelected
                      ? "border-violet-600 shadow-lg shadow-violet-200/50"
                      : "border-slate-200 hover:border-violet-300 hover:shadow-md"
                  )}
                  onClick={() => !mutation.isPending && handleSelect(plan.id)}
                >
                  {/* Plan badge */}
                  <div
                    className={cn(
                      "inline-flex items-center gap-1.5 self-start px-3 py-1 rounded-full text-white text-xs font-semibold mb-4 bg-gradient-to-r",
                      gradient
                    )}
                  >
                    {icon}
                    {plan.name}
                  </div>

                  {/* Price */}
                  <div className="mb-1">
                    <span className="text-3xl font-bold text-slate-900">
                      {formatPrice(plan.price, plan.currency, plan.billing_interval)}
                    </span>
                  </div>

                  {!isFree && (
                    <p className="text-xs text-violet-600 font-medium mb-3">
                      {plan.trial_days}-day free trial
                    </p>
                  )}

                  {plan.description && (
                    <p className="text-sm text-slate-500 mb-4">{plan.description}</p>
                  )}

                  {/* Limits */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="flex items-center gap-1 text-xs text-slate-600 bg-slate-100 rounded-full px-2 py-0.5">
                      <Users className="h-3 w-3" />
                      {plan.default_user_limit} users
                    </span>
                    {plan.max_agents !== null && (
                      <span className="flex items-center gap-1 text-xs text-slate-600 bg-slate-100 rounded-full px-2 py-0.5">
                        <Zap className="h-3 w-3" />
                        {plan.max_agents} agents
                      </span>
                    )}
                    {plan.max_monthly_conversations !== null && (
                      <span className="text-xs text-slate-600 bg-slate-100 rounded-full px-2 py-0.5">
                        {plan.max_monthly_conversations.toLocaleString()} conv/mo
                      </span>
                    )}
                  </div>

                  {/* Features */}
                  {features.length > 0 && (
                    <ul className="space-y-1.5 mb-6 flex-1">
                      {features.slice(0, 5).map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                          <CheckCircle2 className="h-4 w-4 text-violet-500 mt-0.5 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}

                  <Button
                    className={cn(
                      "w-full mt-auto font-semibold",
                      isSelected
                        ? `bg-gradient-to-r ${gradient} text-white hover:opacity-90`
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    )}
                    disabled={mutation.isPending}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!mutation.isPending) handleSelect(plan.id);
                    }}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        {isFree ? "Get started free" : `Start ${plan.trial_days}-day trial`}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center mt-6">
          <button
            onClick={handleSkip}
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
