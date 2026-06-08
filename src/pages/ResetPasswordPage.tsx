import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-md w-full text-center">
          <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
          <h1 className="text-lg font-bold text-slate-900 mb-2">Invalid reset link</h1>
          <p className="text-sm text-slate-500 mb-5">This link is missing a token. Request a new one.</p>
          <Link to="/forgot-password" className="text-sm text-violet-600 hover:underline font-medium">Request new link →</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }

    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || 'Reset failed. The link may have expired.');
      } else {
        setDone(true);
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          {done ? (
            <div className="text-center">
              <div className="inline-flex h-14 w-14 rounded-full bg-emerald-100 items-center justify-center mb-4">
                <CheckCircle2 className="h-7 w-7 text-emerald-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 mb-2">Password updated</h1>
              <p className="text-sm text-slate-500">Redirecting you to login…</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="inline-flex h-12 w-12 rounded-xl bg-violet-50 border border-violet-100 items-center justify-center mb-4">
                  <Lock className="h-5 w-5 text-violet-600" />
                </div>
                <h1 className="text-xl font-bold text-slate-900">Set new password</h1>
                <p className="text-sm text-slate-500 mt-1">Must be at least 8 characters.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-slate-700 font-medium">New password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      disabled={isLoading}
                      className="pl-10 pr-10 h-11 focus-visible:ring-violet-500 focus-visible:border-violet-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm" className="text-slate-700 font-medium">Confirm password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="confirm"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirm}
                      onChange={(e) => { setConfirm(e.target.value); setError(''); }}
                      disabled={isLoading}
                      className="pl-10 h-11 focus-visible:ring-violet-500 focus-visible:border-violet-500"
                    />
                  </div>
                  {error && <p className="text-xs text-destructive">{error}</p>}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white font-semibold"
                >
                  {isLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Updating…</> : 'Reset password'}
                </Button>
              </form>

              <div className="mt-5 text-center">
                <Link to="/login" className="text-sm text-slate-500 hover:text-slate-700">Back to login</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
