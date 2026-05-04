import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot } from "lucide-react";

export const MarketingNav = () => (
  <nav className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-16">
        <Link to="/">
          <div className="flex items-center space-x-3 cursor-pointer">
            <img src="/icon.png" alt="HeyGenAlly" className="h-9 w-9 rounded-xl object-contain" />
            <span className="text-xl font-bold font-syne bg-gradient-to-r from-violet-700 to-purple-600 dark:from-violet-400 dark:to-cyan-400 bg-clip-text text-transparent">
              HeyGenAlly
            </span>
          </div>
        </Link>

        <div className="hidden md:flex items-center space-x-8">
          {[
            { label: "Features", to: "/features" },
            { label: "Use Cases", to: "/use-cases" },
            { label: "Blog", to: "/blog" },
            { label: "Pricing", to: "/pricing" },
          ].map(({ label, to }) => (
            <Link
              key={label}
              to={to}
              className="text-sm font-medium text-slate-600 hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-400 transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center space-x-3">
          <Link to="/login">
            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-violet-600 dark:text-slate-400">
              Sign In
            </Button>
          </Link>
          <Link to="/signup">
            <Button className="bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 shadow-md shadow-violet-500/30 text-white text-sm">
              Get Started Free →
            </Button>
          </Link>
        </div>
      </div>
    </div>
  </nav>
);

export const MarketingFooter = () => (
  <footer className="bg-slate-900 dark:bg-slate-950 text-white py-20">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid md:grid-cols-4 gap-12 mb-16">
        <div className="col-span-2">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-gradient-to-br from-violet-600 to-purple-700 p-2.5 rounded-xl shadow-lg">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold font-syne">HeyGenAlly</span>
          </div>
          <p className="text-slate-400 mb-6 max-w-md leading-relaxed">
            Your generative ally — always on, always learning, always in your corner. Built for teams who want to move faster without burning out.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Badge variant="secondary" className="bg-slate-800 text-slate-300">Multi-LLM</Badge>
            <Badge variant="secondary" className="bg-slate-800 text-slate-300">Self-Hosted</Badge>
            <Badge variant="secondary" className="bg-slate-800 text-slate-300">Open Platform</Badge>
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-lg mb-6">Platform</h3>
          <ul className="space-y-4 text-slate-400">
            <li><Link to="/features" className="hover:text-white transition-colors">Features</Link></li>
            <li><Link to="/use-cases" className="hover:text-white transition-colors">Use Cases</Link></li>
            <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
            <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
            <li><Link to="/signup" className="hover:text-white transition-colors">Get Started Free</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-lg mb-6">Company</h3>
          <ul className="space-y-4 text-slate-400">
            <li><Link to="/security" className="hover:text-white transition-colors">Security & Trust</Link></li>
            <li><Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            <li><Link to="/cookie-policy" className="hover:text-white transition-colors">Cookie Policy</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-slate-400 text-sm">© 2026 HeyGenAlly. Your generative ally — built for your team's success.</p>
        <div className="flex items-center gap-6 text-sm text-slate-400">
          <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
          <Link to="/security" className="hover:text-white transition-colors">Security</Link>
        </div>
      </div>
    </div>
  </footer>
);
