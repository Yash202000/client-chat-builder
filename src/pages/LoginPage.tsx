import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Mail, Lock, Loader2, ArrowRight, Bot, Zap, Shield, Users, ShieldCheck } from "lucide-react";
import { apiFetch } from "@/lib/api";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FEATURES = [
  { icon: Zap, text: "Deploy AI agents in minutes" },
  { icon: Bot, text: "Multi-LLM support built in" },
  { icon: Users, text: "CRM, voice & multi-channel" },
  { icon: Shield, text: "Enterprise-grade security" },
];

export const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // 2FA step
  const [step, setStep] = useState<"credentials" | "2fa">("credentials");
  const [tempToken, setTempToken] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  const validateEmail = (value: string): string => {
    if (!value) return "Email is required.";
    if (!EMAIL_REGEX.test(value)) return "Please enter a valid email address.";
    return "";
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailErr = validateEmail(email);
    const passwordErr = password.trim() === "" ? "Password is required." : "";

    setEmailError(emailErr);
    setPasswordError(passwordErr);

    if (emailErr || passwordErr) return;

    setIsLoading(true);
    try {
      const response = await apiFetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ username: email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.requires_2fa) {
          setTempToken(data.temp_token);
          setStep("2fa");
          setTimeout(() => otpRefs.current[0]?.focus(), 100);
        } else {
          await login(data.access_token);
          toast({ title: "Welcome back!", description: "Redirecting to your dashboard." });
          navigate("/dashboard");
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to log in");
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpInput = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otpDigits];
    next[index] = value;
    setOtpDigits(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpDigits.join("");
    if (code.length !== 6) return;

    setIsLoading(true);
    try {
      const response = await apiFetch("/api/v1/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ temp_token: tempToken, code }),
      });
      if (response.ok) {
        const data = await response.json();
        await login(data.access_token);
        toast({ title: "Welcome back!", description: "Redirecting to your dashboard." });
        navigate("/dashboard");
      } else {
        const err = await response.json();
        throw new Error(err.detail || "Invalid code");
      }
    } catch (error) {
      toast({ title: "Verification Failed", description: (error as Error).message, variant: "destructive" });
      setOtpDigits(["", "", "", "", "", ""]);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <SEOHead
        title="Log In to HeyGenAlly"
        description="Sign in to your HeyGenAlly account to manage your AI agents, conversations, CRM, and analytics."
        canonical="/login"
        noindex
      />

      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-600 via-purple-700 to-violet-900 relative overflow-hidden flex-col justify-between p-12">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-purple-500/20 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl" />

        {/* Logo */}
        <Link to="/" className="relative z-10 flex items-center gap-3">
          <img src="/icon.png" alt="HeyGenAlly" className="h-10 w-10 rounded-xl object-contain" />
          <span className="text-2xl font-bold text-white font-syne">HeyGenAlly</span>
        </Link>

        {/* Centre copy */}
        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Your AI agents<br />are waiting for you
          </h2>
          <p className="text-violet-200 text-lg mb-10 leading-relaxed">
            Sign back in and keep building the workflows that power your team.
          </p>
          <ul className="space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-violet-100">
                <span className="flex-shrink-0 w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                  <Icon className="h-4 w-4 text-white" />
                </span>
                <span className="text-sm font-medium">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom quote */}
        <div className="relative z-10 border-t border-white/10 pt-8">
          <p className="text-violet-200 text-sm italic">
            "HeyGenAlly cut our support resolution time by 80% in the first month."
          </p>
          <p className="text-violet-300 text-xs mt-2">— Customer success team</p>
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

          {step === "credentials" ? (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Welcome back</h1>
                <p className="text-slate-500 dark:text-slate-400">Sign in to your account to continue</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5" noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 font-medium">
                    Email address
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
                      onBlur={() => setEmailError(validateEmail(email))}
                      disabled={isLoading}
                      className="pl-10 h-11 dark:bg-slate-900 dark:border-slate-700 dark:text-white focus-visible:ring-violet-500 focus-visible:border-violet-500"
                    />
                  </div>
                  {emailError && <p className="text-xs text-destructive">{emailError}</p>}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-slate-700 dark:text-slate-300 font-medium">
                      Password
                    </Label>
                    <Link to="#" className="text-xs text-violet-600 dark:text-violet-400 hover:underline font-medium">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError && e.target.value.trim() !== "") setPasswordError("");
                      }}
                      disabled={isLoading}
                      className="pl-10 h-11 dark:bg-slate-900 dark:border-slate-700 dark:text-white focus-visible:ring-violet-500 focus-visible:border-violet-500"
                    />
                  </div>
                  {passwordError && <p className="text-xs text-destructive">{passwordError}</p>}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white shadow-md shadow-violet-500/25 hover:shadow-violet-500/40 transition-all font-semibold mt-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Don't have an account?{" "}
                <Link to="/signup" className="font-semibold text-violet-600 dark:text-violet-400 hover:underline">
                  Start for free
                </Link>
              </p>
            </>
          ) : (
            <>
              <div className="mb-8">
                <div className="w-14 h-14 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center mb-4">
                  <ShieldCheck className="w-7 h-7 text-violet-600 dark:text-violet-400" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Two-Factor Authentication</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Enter the 6-digit code from your authenticator app.
                </p>
              </div>

              <form onSubmit={handleVerify2FA} className="space-y-6">
                <div className="flex gap-2 justify-center">
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpInput(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      disabled={isLoading}
                      className="w-11 h-14 text-center text-xl font-bold rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 dark:focus:border-violet-400 transition-colors disabled:opacity-50"
                    />
                  ))}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white font-semibold"
                  disabled={isLoading || otpDigits.join("").length !== 6}
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Verify &amp; Sign In
                </Button>
              </form>

              <button
                onClick={() => { setStep("credentials"); setOtpDigits(["", "", "", "", "", ""]); }}
                className="mt-6 w-full text-center text-sm text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
              >
                ← Back to sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
