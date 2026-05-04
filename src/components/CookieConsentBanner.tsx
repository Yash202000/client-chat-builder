import { useState, useEffect } from "react";
import { X, Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const STORAGE_KEY = "cookie_consent";

type ConsentState = "accepted" | "rejected" | null;

export const CookieConsentBanner = () => {
  const [consent, setConsent] = useState<ConsentState>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ConsentState;
    if (!stored) {
      // Small delay so it doesn't flash on initial paint
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
    setConsent(stored);
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setConsent("accepted");
    setVisible(false);
  };

  const reject = () => {
    localStorage.setItem(STORAGE_KEY, "rejected");
    setConsent("rejected");
    setVisible(false);
  };

  if (!visible || consent !== null) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 sm:p-6 animate-fade-in">
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl shadow-black/10 p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex-shrink-0">
            <Cookie className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
              We use cookies
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              We use essential cookies to keep you logged in and analytics cookies to understand how you use the platform.
              By clicking <strong>Accept all</strong> you consent to our use of cookies.{" "}
              <Link to="/cookie-policy" className="text-violet-600 dark:text-violet-400 hover:underline">
                Cookie Policy
              </Link>{" "}
              ·{" "}
              <Link to="/privacy-policy" className="text-violet-600 dark:text-violet-400 hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
          <button
            onClick={reject}
            className="flex-shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={reject}
            className="rounded-xl text-xs dark:border-slate-600 dark:text-slate-300"
          >
            Reject non-essential
          </Button>
          <Button
            size="sm"
            onClick={accept}
            className="rounded-xl text-xs bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
          >
            Accept all
          </Button>
        </div>
      </div>
    </div>
  );
};
