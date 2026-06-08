import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Enter your email address'); return; }
    setError('');
    setIsLoading(true);
    try {
      await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      // Always show success — avoid email enumeration
      setSent(true);
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
          {sent ? (
            <div className="text-center">
              <div className="inline-flex h-14 w-14 rounded-full bg-emerald-100 items-center justify-center mb-4">
                <CheckCircle2 className="h-7 w-7 text-emerald-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 mb-2">Check your inbox</h1>
              <p className="text-sm text-slate-500 mb-6">
                If <span className="font-medium text-slate-700">{email}</span> has an account, we've sent a reset link. Check spam if you don't see it.
              </p>
              <Link to="/login" className="text-sm text-violet-600 hover:underline font-medium">
                ← Back to login
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="inline-flex h-12 w-12 rounded-xl bg-violet-50 border border-violet-100 items-center justify-center mb-4">
                  <Mail className="h-5 w-5 text-violet-600" />
                </div>
                <h1 className="text-xl font-bold text-slate-900">Forgot your password?</h1>
                <p className="text-sm text-slate-500 mt-1">Enter your email and we'll send a reset link.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-slate-700 font-medium">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
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
                  {isLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending…</> : 'Send reset link'}
                </Button>
              </form>

              <div className="mt-5 text-center">
                <Link to="/login" className="text-sm text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1.5">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
