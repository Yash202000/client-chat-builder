import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Building2, Users, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const TEAM_SIZES = [
  { value: "solo", label: "Just me", description: "Solo founder or freelancer" },
  { value: "2-10", label: "2–10", description: "Small team" },
  { value: "11-50", label: "11–50", description: "Growing team" },
  { value: "51-200", label: "51–200", description: "Mid-size business" },
  { value: "200+", label: "200+", description: "Enterprise" },
];

const USE_CASES = [
  { value: "customer_support", label: "Customer Support", icon: "💬" },
  { value: "sales", label: "Sales & Lead Gen", icon: "📈" },
  { value: "marketing", label: "Marketing", icon: "📣" },
  { value: "hr", label: "HR & Internal", icon: "👥" },
  { value: "other", label: "Something else", icon: "✨" },
];

export default function QualifyPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { authFetch, user } = useAuth();

  const [companyName, setCompanyName] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [useCase, setUseCase] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = teamSize && useCase;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const res = await authFetch(`/api/v1/onboarding/qualify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: companyName.trim() || undefined,
          team_size: teamSize,
          primary_use_case: useCase,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to save");
      }
      navigate("/select-plan");
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    navigate("/dashboard/onboarding");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 shadow-lg shadow-violet-200 mb-5">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome! Let's personalize your experience</h1>
          <p className="text-slate-500">Just 3 quick questions so we can set up the right tools for you.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Q1: Company name */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-5 w-5 text-violet-600" />
              <Label className="text-base font-semibold text-slate-800">What's your company name?</Label>
              <span className="text-xs text-slate-400">(optional)</span>
            </div>
            <Input
              placeholder="Acme Corp"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="h-11 focus-visible:ring-violet-500 focus-visible:border-violet-500"
            />
          </div>

          {/* Q2: Team size */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-5 w-5 text-violet-600" />
              <Label className="text-base font-semibold text-slate-800">How big is your team?</Label>
              <span className="text-xs text-red-400">*</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {TEAM_SIZES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setTeamSize(s.value)}
                  className={cn(
                    "relative flex flex-col items-center p-3 rounded-xl border-2 transition-all text-center cursor-pointer",
                    teamSize === s.value
                      ? "border-violet-600 bg-violet-50 shadow-sm shadow-violet-200"
                      : "border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/50"
                  )}
                >
                  {teamSize === s.value && (
                    <CheckCircle2 className="absolute top-1.5 right-1.5 h-3.5 w-3.5 text-violet-600" />
                  )}
                  <span className={cn(
                    "text-sm font-bold",
                    teamSize === s.value ? "text-violet-700" : "text-slate-700"
                  )}>{s.label}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 leading-tight">{s.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Q3: Primary use case */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-5 w-5 text-violet-600" />
              <Label className="text-base font-semibold text-slate-800">What will you mainly use AgentConnect for?</Label>
              <span className="text-xs text-red-400">*</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {USE_CASES.map((uc) => (
                <button
                  key={uc.value}
                  type="button"
                  onClick={() => setUseCase(uc.value)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left cursor-pointer",
                    useCase === uc.value
                      ? "border-violet-600 bg-violet-50 shadow-sm shadow-violet-200"
                      : "border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/50"
                  )}
                >
                  <span className="text-xl">{uc.icon}</span>
                  <span className={cn(
                    "text-sm font-medium",
                    useCase === uc.value ? "text-violet-700" : "text-slate-700"
                  )}>{uc.label}</span>
                  {useCase === uc.value && (
                    <CheckCircle2 className="ml-auto h-4 w-4 text-violet-600 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className="flex-1 h-11 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white shadow-md shadow-violet-500/25 font-semibold"
            >
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Setting up your workspace…</>
              ) : (
                <>Continue to dashboard <ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="text-slate-400 hover:text-slate-600"
              onClick={handleSkip}
            >
              Skip
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
