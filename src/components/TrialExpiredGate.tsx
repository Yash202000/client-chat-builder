import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { CheckCircle2, Lock, ArrowRight } from 'lucide-react';

interface Plan {
  id: number;
  name: string;
  price: number;
  currency: string;
  description: string | null;
  billing_interval: string;
}

const PLAN_HIGHLIGHTS: Record<string, string[]> = {
  Starter: [
    'AI Agents & Conversations',
    'AI Assistant (Copilot)',
    'Contacts, Leads & Booking Links',
    'Knowledge Base & Tools',
    'Team Chat, Calendar & Widget Designer',
  ],
  Growth: [
    'Everything in Starter',
    'Deals & CRM Pipeline',
    'Campaigns & Automation',
    'Reports & Analytics',
    'Workflow Automation & Social Media Hub',
  ],
  Pro: [
    'Everything in Growth',
    'Voice & Call Center',
    'AI Tool Library & Image Generation',
    'Product Catalog & Social Selling',
    'Call & Message Analytics',
  ],
};

const EXCLUDED_PLANS = ['Free Trial', 'Enterprise'];
const POPULAR_PLAN = 'Growth';

export const TrialExpiredGate = ({ children }: { children: ReactNode }) => {
  const { isSubscriptionExpired } = usePlanFeatures();
  const { authFetch, user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isBillingPage = pathname === '/dashboard/billing';

  const { data: plans = [] } = useQuery<Plan[]>({
    queryKey: ['subscriptionPlans'],
    queryFn: async () => {
      const res = await authFetch('/api/v1/billing/plans');
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isSubscriptionExpired && !isBillingPage,
    staleTime: 5 * 60 * 1000,
  });

  const { theme } = useTheme();
  const dark = theme === 'dark';

  // Super admins always pass through
  if (!isSubscriptionExpired || user?.is_super_admin || isBillingPage) {
    return <>{children}</>;
  }

  const displayPlans = plans.filter(p => !EXCLUDED_PLANS.includes(p.name));

  // ── Theme-aware tokens ──────────────────────────────────────────────────
  const bg = dark
    ? 'linear-gradient(135deg, #0f0c29 0%, #302b63 40%, #24243e 100%)'
    : 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 40%, #e0f2fe 100%)';

  const orbs = dark
    ? [
        { color: '#7c3aed', pos: '-top-24 -left-24', size: 'w-96 h-96', opacity: 0.30, blur: 60 },
        { color: '#2563eb', pos: 'top-1/3 -right-32',  size: 'w-80 h-80', opacity: 0.25, blur: 70 },
        { color: '#db2777', pos: '-bottom-20 left-1/3', size: 'w-72 h-72', opacity: 0.20, blur: 60 },
        { color: '#0891b2', pos: 'top-10 left-1/2',    size: 'w-64 h-64', opacity: 0.20, blur: 55 },
      ]
    : [
        { color: '#7c3aed', pos: '-top-24 -left-24', size: 'w-96 h-96', opacity: 0.18, blur: 70 },
        { color: '#3b82f6', pos: 'top-1/3 -right-32',  size: 'w-80 h-80', opacity: 0.14, blur: 80 },
        { color: '#ec4899', pos: '-bottom-20 left-1/3', size: 'w-72 h-72', opacity: 0.12, blur: 70 },
        { color: '#06b6d4', pos: 'top-10 left-1/2',    size: 'w-64 h-64', opacity: 0.12, blur: 65 },
      ];

  const skeletonCard = dark
    ? { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(12px)' }
    : { background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(139,92,246,0.15)', backdropFilter: 'blur(12px)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' };

  const skeletonLine = dark ? 'bg-white/10' : 'bg-violet-900/8';
  const skeletonAvatar = dark ? 'bg-white/10' : 'bg-violet-200/60';

  const overlayBg = dark ? 'rgba(10,8,30,0.58)' : 'rgba(245,243,255,0.72)';

  const headingColor  = dark ? 'text-white'      : 'text-slate-900';
  const subColor      = dark ? 'text-white/60'   : 'text-slate-600';
  const subColor2     = dark ? 'text-white/40'   : 'text-slate-400';
  const trustColor    = dark ? 'text-white/35'   : 'text-slate-400';
  const lockIconColor = dark ? 'text-violet-300' : 'text-violet-600';
  const lockRingStyle = dark
    ? { background: 'rgba(124,58,237,0.20)', border: '1px solid rgba(124,58,237,0.40)', backdropFilter: 'blur(8px)' }
    : { background: 'rgba(124,58,237,0.10)', border: '1px solid rgba(124,58,237,0.30)', backdropFilter: 'blur(8px)' };
  // ────────────────────────────────────────────────────────────────────────

  return (
    <div className="relative h-full overflow-hidden">

      {/* ── Decorative glass background — zero real data ── */}
      <div className="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
        <div className="absolute inset-0" style={{ background: bg }} />

        {orbs.map((orb, i) => (
          <div key={i} className={`absolute ${orb.pos} ${orb.size} rounded-full`}
            style={{
              background: `radial-gradient(circle, ${orb.color}, transparent 70%)`,
              filter: `blur(${orb.blur}px)`,
              opacity: orb.opacity,
            }}
          />
        ))}

        {/* Fake glass UI skeleton */}
        <div className="absolute inset-0 p-6 flex flex-col gap-4">
          <div className="grid grid-cols-4 gap-3">
            {[60, 45, 55, 40].map((w, i) => (
              <div key={i} className="h-20 rounded-xl" style={skeletonCard}>
                <div className="p-3 space-y-2">
                  <div className={`h-2 rounded-full ${skeletonLine}`} style={{ width: `${w}%` }} />
                  <div className={`h-5 rounded-full ${skeletonLine}`} style={{ width: '70%' }} />
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3 flex-1">
            <div className="col-span-2 rounded-xl" style={skeletonCard}>
              <div className="p-4 space-y-3">
                <div className={`h-2.5 rounded-full ${skeletonLine} w-1/3`} />
                {[90, 70, 80, 60, 75].map((w, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full ${skeletonAvatar} shrink-0`} />
                    <div className="flex-1 space-y-1.5">
                      <div className={`h-2 rounded-full ${skeletonLine}`} style={{ width: `${w}%` }} />
                      <div className={`h-1.5 rounded-full ${skeletonLine} opacity-60`} style={{ width: `${w - 20}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {[1, 2].map(i => (
                <div key={i} className="flex-1 rounded-xl" style={skeletonCard}>
                  <div className="p-4 space-y-2">
                    <div className={`h-2.5 rounded-full ${skeletonLine} w-2/3`} />
                    <div className={`h-2 rounded-full ${skeletonLine} opacity-60 w-1/2`} />
                    <div className={`h-2 rounded-full ${skeletonLine} opacity-60 w-3/4 mt-2`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Overlay — the only interactive layer ── */}
      <div className="absolute inset-0 flex items-start justify-center overflow-y-auto"
        style={{ background: overlayBg, backdropFilter: 'blur(4px)' }}>
        <div className="w-full max-w-4xl mx-auto px-4 py-10">

          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={lockRingStyle}>
              <Lock className={`h-7 w-7 ${lockIconColor}`} />
            </div>
            <h2 className={`text-3xl font-bold mb-2 ${headingColor}`}>Your free trial has ended</h2>
            <p className={`text-base max-w-md mx-auto ${subColor}`}>
              Everything you built is saved and waiting. Pick a plan to keep going.
            </p>
            <p className={`text-sm mt-1 ${subColor2}`}>
              Your agents, contacts, and conversations are all intact.
            </p>
          </div>

          {/* Plan cards */}
          {displayPlans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {displayPlans.map(plan => {
                const isPopular = plan.name === POPULAR_PLAN;
                const highlights = PLAN_HIGHLIGHTS[plan.name] ?? [];
                const symbol = plan.currency === 'INR' ? '₹' : '$';
                return (
                  <div
                    key={plan.id}
                    className="relative rounded-2xl flex flex-col p-6"
                    style={isPopular ? {
                      background: dark
                        ? 'linear-gradient(145deg, rgba(124,58,237,0.35), rgba(109,40,217,0.20))'
                        : 'linear-gradient(145deg, rgba(124,58,237,0.12), rgba(167,139,250,0.08))',
                      border: dark ? '1px solid rgba(167,139,250,0.50)' : '1px solid rgba(124,58,237,0.35)',
                      backdropFilter: 'blur(20px)',
                      boxShadow: dark
                        ? '0 0 40px rgba(124,58,237,0.20), inset 0 1px 0 rgba(255,255,255,0.10)'
                        : '0 4px 24px rgba(124,58,237,0.15), inset 0 1px 0 rgba(255,255,255,0.80)',
                    } : {
                      background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.70)',
                      border: dark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(139,92,246,0.15)',
                      backdropFilter: 'blur(20px)',
                      boxShadow: dark
                        ? 'inset 0 1px 0 rgba(255,255,255,0.06)'
                        : '0 2px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.80)',
                    }}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap"
                          style={{ background: 'linear-gradient(90deg, #7c3aed, #a855f7)', color: '#fff' }}>
                          Most Popular
                        </span>
                      </div>
                    )}

                    <div className="mb-4">
                      <h3 className={`text-lg font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
                      <div className="mt-1 flex items-baseline gap-1">
                        <span className={`text-3xl font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>
                          {symbol}{plan.price.toLocaleString()}
                        </span>
                        <span className={`text-sm ${dark ? 'text-white/50' : 'text-slate-500'}`}>/{plan.billing_interval}</span>
                      </div>
                      {plan.description && (
                        <p className={`text-xs mt-1 leading-snug ${dark ? 'text-white/40' : 'text-slate-500'}`}>{plan.description}</p>
                      )}
                    </div>

                    <ul className="flex-1 space-y-2 mb-6">
                      {highlights.map(h => (
                        <li key={h} className={`flex items-start gap-2 text-sm ${dark ? 'text-white/75' : 'text-slate-700'}`}>
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                          {h}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => navigate('/dashboard/billing')}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all"
                      style={isPopular ? {
                        background: 'linear-gradient(90deg, #7c3aed, #a855f7)',
                        color: '#fff',
                        boxShadow: '0 4px 20px rgba(124,58,237,0.35)',
                      } : dark ? {
                        background: 'rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.80)',
                        border: '1px solid rgba(255,255,255,0.15)',
                      } : {
                        background: 'rgba(124,58,237,0.07)',
                        color: '#6d28d9',
                        border: '1px solid rgba(124,58,237,0.25)',
                      }}
                    >
                      Choose {plan.name}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex justify-center mb-8">
              <button
                onClick={() => navigate('/dashboard/billing')}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(90deg, #7c3aed, #a855f7)', boxShadow: '0 4px 20px rgba(124,58,237,0.4)' }}
              >
                View Plans & Pricing
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Trust line */}
          <p className={`text-center text-sm ${trustColor}`}>
            No contracts · Cancel anytime · Your data is never deleted
          </p>
          <p className="text-center mt-2">
            <button
              onClick={() => navigate('/dashboard/billing')}
              className={`text-sm hover:underline transition-colors ${dark ? 'text-violet-400 hover:text-violet-300' : 'text-violet-600 hover:text-violet-700'}`}
            >
              View full pricing details →
            </button>
          </p>

        </div>
      </div>
    </div>
  );
};
