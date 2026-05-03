import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Mail, Lock, Loader2, Sparkles } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const SignupPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  const validateEmail = (value: string): string => {
    if (!value) return "Email is required.";
    if (!EMAIL_REGEX.test(value)) return "Please enter a valid email address.";
    return "";
  };

  const validatePassword = (value: string): string => {
    if (!value) return "Password is required.";
    if (value.length < 8) return "Password must be at least 8 characters long.";
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
      const response = await apiFetch("/api/v1/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        // Auto-login after signup
        const loginRes = await apiFetch("/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ username: email, password }),
        });
        if (loginRes.ok) {
          const { access_token } = await loginRes.json();
          await login(access_token);
          toast({ title: "Account created!", description: "Welcome! Let's get you set up." });
          navigate("/dashboard/onboarding");
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 dark:from-emerald-600/10 dark:to-teal-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-cyan-400/20 to-blue-400/20 dark:from-cyan-600/10 dark:to-blue-600/10 rounded-full blur-3xl"></div>
      </div>

      <Card className="mx-auto max-w-md w-full relative z-10 border-slate-200 dark:border-slate-700 dark:bg-slate-800/90 backdrop-blur-sm shadow-2xl">
        <CardHeader className="space-y-3 text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-700 rounded-2xl flex items-center justify-center shadow-lg">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Create Account
          </CardTitle>
          <CardDescription className="text-base dark:text-gray-400">
            Join HeyGenAlly and start building intelligent AI agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="grid gap-5" noValidate>
            <div className="grid gap-2">
              <Label htmlFor="email" className="dark:text-gray-300 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(validateEmail(e.target.value));
                }}
                disabled={isLoading}
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-white h-11"
              />
              {emailError && (
                <p className="text-xs text-destructive mt-1">{emailError}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password" className="dark:text-gray-300 flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError(validatePassword(e.target.value));
                }}
                disabled={isLoading}
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-white h-11"
                placeholder="Create a strong password"
              />
              {passwordError ? (
                <p className="text-xs text-destructive mt-1">{passwordError}</p>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Must be at least 8 characters long
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-5 w-5" />
                  Create Account
                </>
              )}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
