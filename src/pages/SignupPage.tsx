import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, Loader2, ArrowRight, Bot, CheckCircle2, Phone, AlertTriangle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PERSONAL_DOMAINS = new Set([
  "gmail.com", "yahoo.com", "yahoo.co.in", "yahoo.co.uk", "hotmail.com",
  "outlook.com", "live.com", "icloud.com", "me.com", "mac.com",
  "protonmail.com", "proton.me", "aol.com", "msn.com", "rediffmail.com",
  "yandex.com", "yandex.ru", "zoho.com", "gmx.com", "gmx.net",
]);

function isPersonalEmail(email: string): boolean {
  try {
    const domain = email.split("@")[1]?.toLowerCase();
    return !!domain && PERSONAL_DOMAINS.has(domain);
  } catch {
    return false;
  }
}

const PERKS = [
  "Free forever plan — no credit card needed",
  "Build your first AI agent in under 5 minutes",
  "Multi-LLM: OpenAI, Anthropic, Groq & more",
  "Knowledge base, CRM, voice & web widget included",
  "Cancel or upgrade anytime",
];

export const SignupPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  const showPersonalEmailNote = email.includes("@") && isPersonalEmail(email);

  const validateEmail = (value: string): string => {
    if (!value) return "Email is required.";
    if (!EMAIL_REGEX.test(value)) return "Please enter a valid email address.";
    return "";
  };

  const validatePassword = (value: string): string => {
    if (!value) return "Password is required.";
    if (value.length < 8) return "Password must be at least 8 characters.";
    return "";
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);

    setEmailError(emailErr);
    setPasswordError(passwordErr);

    if (emailErr || passwordErr) return;

    setIsLoading(true);
    try {
      const body: Record<string, string> = { email, password };
      if (phone.trim()) body.phone_number = phone.trim();

      const response = await apiFetch("/api/v1/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const loginRes = await apiFetch("/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ username: email, password }),
        });
        if (loginRes.ok) {
          const { access_token } = await loginRes.json();
          await login(access_token);
          toast({ title: "Account created!", description: "Welcome! Let's get you set up." });
          navigate("/qualify");
        } else {
          toast({ title: "Account created!", description: "You can now sign in with your credentials." });
          navigate("/login");
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to sign up");
      }
    } catch (error) {
      toast({
        title: "Signup Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <SEOHead
        title="Start Free – Sign Up for HeyGenAlly"
        description="Create your free HeyGenAlly account and start building AI agents in minutes. No code required. No credit card needed."
        canonical="/signup"
      />

      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-600 via-purple-700 to-violet-900 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-purple-500/20 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl" />

        <Link to="/" className="relative z-10 flex items-center gap-3">
          <img src="/icon.png" alt="HeyGenAlly" className="h-10 w-10 rounded-xl object-contain" />
          <span className="text-2xl font-bold text-white font-syne">HeyGenAlly</span>
        </Link>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <Bot className="h-3.5 w-3.5" />
            No credit card required
          </div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Build smarter.<br />Ship faster.<br />Scale effortlessly.
          </h2>
          <p className="text-violet-200 text-lg mb-10 leading-relaxed">
            Join thousands of teams using HeyGenAlly to automate support, generate leads, and delight customers — 24/7.
          </p>
          <ul className="space-y-3">
            {PERKS.map((perk) => (
              <li key={perk} className="flex items-start gap-3 text-violet-100">
                <CheckCircle2 className="h-4 w-4 text-violet-300 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{perk}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 border-t border-white/10 pt-8 grid grid-cols-3 gap-4">
          {[
            { value: "10k+", label: "Active agents" },
            { value: "80%", label: "Faster resolution" },
            { value: "24/7", label: "Always on" },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-violet-300 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-white dark:bg-slate-950">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link to="/" className="lg:hidden flex items-center gap-3 mb-10">
            <img src="/icon.png" alt="HeyGenAlly" className="h-9 w-9 rounded-xl object-contain" />
            <span className="text-xl font-bold font-syne bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              HeyGenAlly
            </span>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Create your account</h1>
            <p className="text-slate-500 dark:text-slate-400">Free forever. No credit card required.</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5" noValidate>
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 font-medium">
                Work email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError(validateEmail(e.target.value));
                  }}
                  disabled={isLoading}
                  className="pl-10 h-11 dark:bg-slate-900 dark:border-slate-700 dark:text-white focus-visible:ring-violet-500 focus-visible:border-violet-500"
                />
              </div>
              {emailError && <p className="text-xs text-destructive">{emailError}</p>}
              {!emailError && showPersonalEmailNote && (
                <p className="flex items-center gap-1.5 text-xs text-amber-600">
                  <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                  Using a personal email? You can still sign up — but a work email unlocks team collaboration features.
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-slate-700 dark:text-slate-300 font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError(validatePassword(e.target.value));
                  }}
                  disabled={isLoading}
                  className="pl-10 h-11 dark:bg-slate-900 dark:border-slate-700 dark:text-white focus-visible:ring-violet-500 focus-visible:border-violet-500"
                />
              </div>
              {passwordError ? (
                <p className="text-xs text-destructive">{passwordError}</p>
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500">Must be at least 8 characters</p>
              )}
            </div>

            {/* Phone (optional) */}
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-slate-700 dark:text-slate-300 font-medium">
                Phone number <span className="text-slate-400 font-normal">(optional)</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 555 000 0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isLoading}
                  className="pl-10 h-11 dark:bg-slate-900 dark:border-slate-700 dark:text-white focus-visible:ring-violet-500 focus-visible:border-violet-500"
                />
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">Used for account security and alerts</p>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white shadow-md shadow-violet-500/25 hover:shadow-violet-500/40 transition-all font-semibold mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Get started free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <p className="text-xs text-center text-slate-400 dark:text-slate-500">
              By signing up you agree to our{" "}
              <Link to="/terms" className="underline hover:text-violet-600">Terms</Link>
              {" "}and{" "}
              <Link to="/privacy-policy" className="underline hover:text-violet-600">Privacy Policy</Link>.
            </p>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-violet-600 dark:text-violet-400 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
