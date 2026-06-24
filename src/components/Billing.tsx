import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { CheckCircle2, CreditCard, Loader2, Crown, Zap, Users, AlertTriangle, Clock, Shield, Key, Building2, XCircle, Lock, MessageSquare, Mail, HardDrive, HeartCrack, Sparkles, Phone, BarChart3, Bot, Globe } from "lucide-react";
import { useI18n } from '@/hooks/useI18n';
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

// Declare Razorpay on window
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface SubscriptionStatus {
  plan_name: string | null;
  plan_id: number | null;
  status: string;
  is_trial: boolean;
  trial_days_remaining: number | null;
  current_period_start: string | null;
  current_period_end: string | null;
  user_limit: number;
  current_user_count: number;
  users_remaining: number;
  addon_seats: number;
  addon_seat_cap: number;
  addon_seat_price_usd: number | null;
  addon_seat_price_inr: number | null;
  warn_threshold: number | null;
  users_near_limit: boolean;
  grace_period_end: string | null;
  cancel_at_period_end: boolean;
  razorpay_customer_id: string | null;
  plan_features: string[];
  monthly_conversation_count: number;
  max_monthly_conversations: number | null;
  conversations_near_limit: boolean;
  monthly_email_count: number;
  max_monthly_emails: number | null;
  emails_near_limit: boolean;
  total_storage_bytes: number;
  max_storage_bytes: number | null;
  storage_near_limit: boolean;
}

interface SubscriptionPlan {
  id: number;
  name: string;
  price: number;
  currency: string;
  features: string | null;
  description: string | null;
  default_user_limit: number;
  billing_interval: string;
}

interface LicenseStatus {
  mode: string; // "on_premise" | "cloud"
  status: string; // "active" | "expired" | "invalid" | "not_activated"
  instance_name: string | null;
  max_users: number | null;
  max_companies: number | null;
  current_user_count: number | null;
  current_company_count: number | null;
  users_remaining: number | null;
  features: string[];
  expires_at: string | null;
  days_until_expiry: number | null;
  activated_at: string | null;
}

interface SubscriptionCreateResponse {
  subscription_id: string;
  razorpay_key_id: string;
  plan_id: string;
  plan_name: string;
  amount: number;
  currency: string;
  customer_id: string | null;
}

const FEATURE_LABELS: Record<string, string> = {
  // Base platform
  conversations: 'AI Conversations',
  agents: 'AI Agents',
  knowledge_base: 'Knowledge Base',
  tools: 'Agent Tools',
  widget_designer: 'Widget Designer',
  contacts: 'CRM Contacts',
  leads: 'Leads Management',
  forms: 'Forms',
  team_chat: 'Team Chat',
  calendar: 'Calendar',
  drive: 'Drive & Files',
  settings: 'Workspace Settings',
  billing: 'Billing Management',
  team_management: 'Team & Roles',
  // Starter tier
  ai_chat: 'AI Assistant',
  booking_links: 'Booking Links',
  // Growth tier
  deals: 'Deals Pipeline',
  accounts: 'Accounts',
  tickets: 'Tickets & Projects',
  crm_dashboard: 'CRM Dashboard',
  campaigns: 'Campaigns & Sequences',
  workflows: 'Workflow Automation',
  reports: 'Reports & Analytics',
  social: 'Social Media Hub',
  segments: 'CRM Segments',
  tags: 'CRM Tags',
  crm_templates: 'CRM Templates',
  link_shortener: 'Link Shortener',
  comms_analytics: 'Call & Message Analytics',
  // Pro tier
  api_vault: 'API Vault',
  voice_lab: 'Voice & Call Center',
  ai_tools: 'AI Tool Library',
  ai_images: 'AI Image Generation',
  catalog: 'Product Catalog',
  cts: 'Social Selling',
};

const PLAN_HIGHLIGHTS: Record<string, string[]> = {
  'free trial': [
    '2 AI Agents (1 active)',
    '1 Channel',
    '100 AI conversations / month',
    '1 Knowledge Base (5 MB)',
    'Up to 5 team members',
  ],
  'spark': [
    '1 AI chat agent with knowledge base',
    'Live chat inbox (website widget)',
    'Contact management (1,000 contacts)',
    'Agent builder — prompt + tool config',
    'Email support',
  ],
  'starter': [
    '1 AI chat agent with knowledge base',
    'Live chat inbox (website widget)',
    'Contact management (1,000 contacts)',
    'Agent builder — prompt + tool config',
    'Email support',
  ],
  'growth': [
    'Full CRM — leads, deals, campaigns',
    'Social media posting & scheduling',
    'Marketing automation + workflows',
    'Reports & analytics dashboard',
    '5,000 contacts · 25 team members',
  ],
  'pro': [
    'Voice Lab — inbound/outbound AI calls',
    'AI image generation (50 images/mo)',
    'AI Tools — GPT-4o automations',
    'Advanced inbox routing + supervisor',
    'Unlimited contacts · priority support',
  ],
};

const PLAN_TAGLINES: Record<string, string> = {
  'free trial': 'Try the full platform, free',
  'spark': 'Your first AI agent, live in 30 minutes.',
  'starter': 'Your first AI agent, live in 30 minutes.',
  'growth': 'Turn conversations into customers, automatically.',
  'pro': 'AI that calls, creates, and converts — all in one place.',
  'enterprise': 'Built for your team. Deployed your way.',
};

const ANNUAL_DISCOUNT = 0.20;

const getDisplayName = (name: string) => name;

export const Billing = () => {
  const { t, isRTL } = useI18n();
  const { authFetch, companyId, user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const lockedFeature = searchParams.get('locked');
  const isTrialExpiredRedirect = searchParams.get('expired') === 'true';

  // Billing period toggle — default annual (higher conversion)
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');

  // Cancellation reason modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelOtherText, setCancelOtherText] = useState('');

  const CANCEL_REASONS = [
    'Too expensive',
    'Missing features I need',
    'Switching to a competitor',
    'Not using it enough',
    'Technical issues',
    'Other',
  ];

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // 1. Fetch license status (works for both cloud and on-premise)
  const { data: licenseStatus, isLoading: isLoadingLicense } = useQuery<LicenseStatus>({
    queryKey: ['licenseStatus'],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/billing/licenses/status`);
      if (!response.ok) throw new Error("Failed to fetch license status");
      return response.json();
    },
  });

  const isOnPremise = licenseStatus?.mode === "on_premise";

  // 2. Fetch available subscription plans (only in cloud mode)
  const { data: plans, isLoading: isLoadingPlans } = useQuery<SubscriptionPlan[]>({
    queryKey: ['subscriptionPlans'],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/billing/plans`);
      if (!response.ok) throw new Error("Failed to fetch plans");
      return response.json();
    },
    enabled: !isOnPremise,
  });

  // 3. Fetch the company's current subscription status (only in cloud mode)
  const { data: status, isLoading: isLoadingStatus } = useQuery<SubscriptionStatus>({
    queryKey: ['billingStatus', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const response = await authFetch(`/api/v1/billing/status`);
      if (!response.ok) throw new Error("Failed to fetch billing status");
      return response.json();
    },
    enabled: !!companyId && !isOnPremise,
  });

  // 4. Mutation to create a Razorpay subscription
  const { mutate: createSubscription, isPending: isCreatingSubscription } = useMutation({
    mutationFn: async (planId: number) => {
      const response = await authFetch(`/api/v1/billing/create-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: planId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create subscription");
      }
      return response.json() as Promise<SubscriptionCreateResponse>;
    },
    onSuccess: (data) => {
      // Open Razorpay checkout
      openRazorpayCheckout(data);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // 5. Mutation to verify payment
  const { mutate: verifyPayment } = useMutation({
    mutationFn: async (paymentData: {
      razorpay_payment_id: string;
      razorpay_subscription_id: string;
      razorpay_signature: string;
      plan_id: number;
    }) => {
      const response = await authFetch(`/api/v1/billing/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to verify payment");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Subscription activated successfully!");
      queryClient.invalidateQueries({ queryKey: ['billingStatus'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // 6. Mutation to cancel subscription
  const { mutate: cancelSubscription, isPending: isCancelling } = useMutation({
    mutationFn: async () => {
      const response = await authFetch(`/api/v1/billing/cancel-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to cancel subscription");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Subscription will be cancelled at the end of the billing period");
      queryClient.invalidateQueries({ queryKey: ['billingStatus'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Open Razorpay checkout popup
  const openRazorpayCheckout = (subscriptionData: SubscriptionCreateResponse) => {
    if (!window.Razorpay) {
      toast.error("Razorpay SDK not loaded. Please refresh the page.");
      return;
    }

    const options = {
      key: subscriptionData.razorpay_key_id,
      subscription_id: subscriptionData.subscription_id,
      name: "HeyGenAlly",
      description: `${subscriptionData.plan_name} Subscription`,
      handler: function (response: any) {
        // Verify payment on backend
        verifyPayment({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_subscription_id: response.razorpay_subscription_id,
          razorpay_signature: response.razorpay_signature,
          plan_id: parseInt(subscriptionData.plan_id.split('_').pop() || '0'), // Extract plan_id
        });
      },
      prefill: {
        name: user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.email || '',
        email: user?.email || '',
      },
      theme: {
        color: "#7c3aed",
      },
      modal: {
        ondismiss: function () {
          toast.info("Payment cancelled");
        }
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };

  if (isLoadingLicense || (!isOnPremise && (isLoadingPlans || isLoadingStatus))) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  // Cloud mode variables
  const userLimitPercentage = status ? Math.min(100, (status.current_user_count / status.user_limit) * 100) : 0;
  const isOverUserLimit = status ? status.current_user_count > status.user_limit : false;
  const isAtUserLimit = status ? status.users_remaining <= 0 : false;
  const usersOverLimit = isOverUserLimit ? status!.current_user_count - status!.user_limit : 0;
  const isTrialExpiringSoon = status?.is_trial && status?.trial_days_remaining !== null && status.trial_days_remaining <= 3;

  // On-premise mode variables
  const licenseUserLimitPercentage = licenseStatus?.max_users && licenseStatus?.current_user_count
    ? (licenseStatus.current_user_count / licenseStatus.max_users) * 100
    : 0;
  const isLicenseAtUserLimit = licenseStatus?.users_remaining === 0;
  const isLicenseExpiringSoon = licenseStatus?.days_until_expiry !== null && licenseStatus.days_until_expiry <= 30;
  const isLicenseExpired = licenseStatus?.status === "expired";
  const isLicenseInvalid = licenseStatus?.status === "invalid";
  const isLicenseNotActivated = licenseStatus?.status === "not_activated";

  return (
    <div className="min-h-full app-surface" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-sm border-b border-border px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <CreditCard className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{t('billing.title')}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t('billing.subtitle')}</p>
          </div>
        </div>
      </div>
      <div className="px-6 py-6 space-y-6">
        {isTrialExpiredRedirect && (
          <Alert className="border-red-300 bg-red-50 text-red-900 dark:bg-red-950/30 dark:border-red-800 dark:text-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertTitle className="text-red-800 dark:text-red-300">
              Your trial has expired
            </AlertTitle>
            <AlertDescription className="text-red-700 dark:text-red-400">
              Your free trial has ended and your account is now locked. Choose a plan below to restore access to all your data and features.
            </AlertDescription>
          </Alert>
        )}

        {!isTrialExpiredRedirect && lockedFeature && (
          <Alert className="border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200">
            <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="text-amber-800 dark:text-amber-300">
              Upgrade required
            </AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-400">
              <strong>{FEATURE_LABELS[lockedFeature] ?? lockedFeature}</strong> is not available on your current plan. Upgrade below to unlock it.
            </AlertDescription>
          </Alert>
        )}

      {/* On-Premise Alerts */}
      {isOnPremise && isLicenseExpired && (
        <Alert variant="destructive" className="border-red-500 bg-red-50 dark:bg-red-950/50">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>License Expired</AlertTitle>
          <AlertDescription>
            Your license has expired. Please contact your administrator to renew the license.
          </AlertDescription>
        </Alert>
      )}

      {isOnPremise && isLicenseInvalid && (
        <Alert variant="destructive" className="border-red-500 bg-red-50 dark:bg-red-950/50">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Invalid License</AlertTitle>
          <AlertDescription>
            The license key is invalid. Please contact your administrator.
          </AlertDescription>
        </Alert>
      )}

      {isOnPremise && isLicenseNotActivated && (
        <Alert variant="destructive" className="border-orange-500 bg-orange-50 dark:bg-orange-950/50">
          <Key className="h-4 w-4" />
          <AlertTitle>License Not Activated</AlertTitle>
          <AlertDescription>
            No license has been activated for this instance. Please contact your administrator.
          </AlertDescription>
        </Alert>
      )}

      {isOnPremise && isLicenseExpiringSoon && !isLicenseExpired && (
        <Alert variant="destructive" className="border-orange-500 bg-orange-50 dark:bg-orange-950/50">
          <Clock className="h-4 w-4" />
          <AlertTitle>License Expiring Soon</AlertTitle>
          <AlertDescription>
            Your license will expire in {licenseStatus?.days_until_expiry} days. Please contact your administrator to renew.
          </AlertDescription>
        </Alert>
      )}

      {isOnPremise && isLicenseAtUserLimit && (
        <Alert variant="destructive" className="border-violet-500 bg-violet-50 dark:bg-violet-950/50">
          <Users className="h-4 w-4" />
          <AlertTitle>User Limit Reached</AlertTitle>
          <AlertDescription>
            You have reached the maximum number of users allowed by your license. Please contact your administrator to upgrade.
          </AlertDescription>
        </Alert>
      )}

      {/* Cloud Mode Alerts */}
      {!isOnPremise && isTrialExpiringSoon && (
        <Alert variant="destructive" className="border-orange-500 bg-orange-50 dark:bg-orange-950/50">
          <Clock className="h-4 w-4" />
          <AlertTitle>{t('billing.trialExpiringSoon')}</AlertTitle>
          <AlertDescription>
            {t('billing.trialExpiringSoonDesc', { days: status?.trial_days_remaining })}
          </AlertDescription>
        </Alert>
      )}

      {!isOnPremise && status?.cancel_at_period_end && (
        <Alert variant="destructive" className="border-red-500 bg-red-50 dark:bg-red-950/50">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('billing.subscriptionCanceling')}</AlertTitle>
          <AlertDescription>
            {t('billing.subscriptionCancelingDesc', {
              date: status?.current_period_end ? new Date(status.current_period_end).toLocaleDateString() : ''
            })}
          </AlertDescription>
        </Alert>
      )}

      {!isOnPremise && isAtUserLimit && (
        <Alert variant="destructive" className="border-violet-500 bg-violet-50 dark:bg-violet-950/50">
          <Users className="h-4 w-4" />
          <AlertTitle>{t('billing.userLimitReached')}</AlertTitle>
          <AlertDescription>
            {t('billing.userLimitReachedDesc')}
          </AlertDescription>
        </Alert>
      )}

      {!isOnPremise && !isAtUserLimit && status?.users_near_limit && (
        <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700">
          <Users className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-amber-800 dark:text-amber-300">Approaching user limit</AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-400">
            You have {status.current_user_count} of {status.user_limit + (status.addon_seats || 0)} users.{' '}
            {status.addon_seat_cap > (status.addon_seats || 0)
              ? `You can add up to ${status.addon_seat_cap - (status.addon_seats || 0)} more seat${status.addon_seat_cap - (status.addon_seats || 0) === 1 ? '' : 's'} or upgrade your plan.`
              : 'Upgrade your plan to add more team members.'}
          </AlertDescription>
        </Alert>
      )}

      {/* On-Premise License Section */}
      {isOnPremise && (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  On-Premise License
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Enterprise license for self-hosted deployment</p>
              </div>
              {licenseStatus?.status === "active" && licenseStatus?.days_until_expiry !== null && (
                <Badge variant="outline" className={`${
                  licenseStatus.days_until_expiry <= 30
                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 border-orange-300'
                    : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-300'
                }`}>
                  <Clock className="h-3 w-3 mr-1" />
                  {licenseStatus.days_until_expiry} days remaining
                </Badge>
              )}
            </div>
          </div>
          <div className="p-6 space-y-6">
            {licenseStatus && licenseStatus.status !== "not_activated" ? (
              <>
                <div className={`flex flex-col md:flex-row md:items-center ${isRTL ? 'md:flex-row-reverse' : ''} md:justify-between gap-4`}>
                  <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 rounded-xl flex items-center justify-center shadow-sm">
                      <Building2 className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold dark:text-white">
                        {licenseStatus.instance_name || "Enterprise License"}
                      </p>
                      <p className={`text-sm capitalize flex items-center gap-1 mt-1 ${isRTL ? 'flex-row-reverse' : ''} ${
                        licenseStatus.status === 'active' ? 'text-green-600 dark:text-green-400' :
                        licenseStatus.status === 'expired' ? 'text-red-600 dark:text-red-400' :
                        'text-orange-600 dark:text-orange-400'
                      }`}>
                        {licenseStatus.status === 'active' ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <AlertTriangle className="h-4 w-4" />
                        )}
                        {licenseStatus.status}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Instance-wide User Limit Progress */}
                {licenseStatus.max_users && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium dark:text-white flex items-center gap-2">
                        <Users className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                        Instance User Limit
                      </span>
                      <span className={`text-sm font-medium ${isLicenseAtUserLimit ? 'text-red-600 dark:text-red-400' : 'dark:text-gray-400'}`}>
                        {licenseStatus.current_user_count} / {licenseStatus.max_users} users
                      </span>
                    </div>
                    <Progress
                      value={licenseUserLimitPercentage}
                      className={`h-2 ${isLicenseAtUserLimit ? '[&>div]:bg-red-500' : '[&>div]:bg-violet-500'}`}
                    />
                    {!isLicenseAtUserLimit && licenseStatus.users_remaining !== null && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {licenseStatus.users_remaining} users remaining
                      </p>
                    )}
                  </div>
                )}

                {/* Company Limit (if set) */}
                {licenseStatus.max_companies && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium dark:text-white flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                        Company Limit
                      </span>
                      <span className="text-sm font-medium dark:text-gray-400">
                        {licenseStatus.current_company_count} / {licenseStatus.max_companies} companies
                      </span>
                    </div>
                    <Progress
                      value={licenseStatus.current_company_count && licenseStatus.max_companies
                        ? (licenseStatus.current_company_count / licenseStatus.max_companies) * 100
                        : 0}
                      className="h-2 [&>div]:bg-violet-500"
                    />
                  </div>
                )}

                {/* License Features */}
                {licenseStatus.features && licenseStatus.features.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium dark:text-white">Licensed Features</span>
                    <div className="flex flex-wrap gap-2">
                      {licenseStatus.features.map((feature, index) => (
                        <Badge key={index} variant="outline" className="bg-slate-100 dark:bg-slate-700">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expiry Info */}
                {licenseStatus.expires_at && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    License expires: {new Date(licenseStatus.expires_at).toLocaleDateString()}
                  </div>
                )}

                {licenseStatus.activated_at && (
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    Activated: {new Date(licenseStatus.activated_at).toLocaleDateString()}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <div className="h-14 w-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <Key className="h-7 w-7 text-slate-400" />
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-1">No license activated</p>
                <p className="text-sm text-slate-500 dark:text-slate-500">Contact your administrator to activate a license.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cloud Mode - Current Plan Section */}
      {!isOnPremise && (
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                {t('billing.currentPlan')}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t('billing.activeSubscription')}</p>
            </div>
            {status?.is_trial && status?.trial_days_remaining !== null && (
              <Badge variant="outline" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-blue-300">
                <Clock className="h-3 w-3 mr-1" />
                {t('billing.trialDaysRemaining', { days: status.trial_days_remaining })}
              </Badge>
            )}
          </div>
        </div>
        <div className="p-6 space-y-6">
          {status ? (
            <>
              <div className={`flex flex-col md:flex-row md:items-center ${isRTL ? 'md:flex-row-reverse' : ''} md:justify-between gap-4`}>
                <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 rounded-xl flex items-center justify-center shadow-sm">
                    <Crown className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold dark:text-white">
                      {status.plan_name || (status.is_trial ? t('billing.freeTrial') : t('billing.noPlan'))}
                    </p>
                    <p className={`text-sm capitalize flex items-center gap-1 mt-1 ${isRTL ? 'flex-row-reverse' : ''} ${
                      status.status === 'active' ? 'text-green-600 dark:text-green-400' :
                      status.status === 'trial' ? 'text-violet-600 dark:text-violet-400' :
                      status.status === 'past_due' ? 'text-orange-600 dark:text-orange-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      <CheckCircle2 className="h-4 w-4" />
                      {status.status === 'trial' ? t('billing.trialStatus') : status.status}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {status.razorpay_customer_id && status.status === 'active' && !status.cancel_at_period_end && (
                    <Button
                      variant="outline"
                      className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700 text-red-600 border-red-300 hover:bg-red-50"
                      onClick={() => { setCancelReason(''); setCancelOtherText(''); setShowCancelModal(true); }}
                      disabled={isCancelling}
                    >
                      {isCancelling ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <XCircle className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                          Cancel Subscription
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* User Limit Progress */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium dark:text-white flex items-center gap-2">
                    <Users className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    {t('billing.userLimit')}
                  </span>
                  <span className={`text-sm font-medium ${isAtUserLimit ? 'text-red-600 dark:text-red-400' : 'dark:text-gray-400'}`}>
                    {status.current_user_count} / {status.user_limit} {t('billing.users')}
                  </span>
                </div>
                <Progress
                  value={userLimitPercentage}
                  className={`h-2 ${isAtUserLimit ? '[&>div]:bg-red-500' : '[&>div]:bg-violet-500'}`}
                />
                {isOverUserLimit ? (
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                    {usersOverLimit} {usersOverLimit === 1 ? 'user' : 'users'} over limit — upgrade to add more
                  </p>
                ) : !isAtUserLimit ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('billing.usersRemaining', { count: status.users_remaining })}
                  </p>
                ) : (
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                    User limit reached — upgrade to add more
                  </p>
                )}
              </div>

              {/* Conversation Quota Progress */}
              {status.max_monthly_conversations != null && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium dark:text-white flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                      AI Conversations (this month)
                    </span>
                    <span className={`text-sm font-medium ${status.conversations_near_limit ? 'text-orange-600 dark:text-orange-400' : 'dark:text-gray-400'}`}>
                      {status.monthly_conversation_count} / {status.max_monthly_conversations}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(100, (status.monthly_conversation_count / status.max_monthly_conversations) * 100)}
                    className={`h-2 ${status.conversations_near_limit ? '[&>div]:bg-orange-500' : '[&>div]:bg-violet-500'}`}
                  />
                  {status.monthly_conversation_count >= status.max_monthly_conversations ? (
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium">Monthly limit reached — upgrade to continue AI conversations</p>
                  ) : status.conversations_near_limit ? (
                    <p className="text-xs text-orange-600 dark:text-orange-400">Approaching limit — {status.max_monthly_conversations - status.monthly_conversation_count} remaining this month</p>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{status.max_monthly_conversations - status.monthly_conversation_count} conversations remaining this month</p>
                  )}
                </div>
              )}

              {/* Email Send Quota */}
              {status.max_monthly_emails != null && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium dark:text-white flex items-center gap-2">
                      <Mail className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                      Email Sends (this month)
                    </span>
                    <span className={`text-sm font-medium ${status.emails_near_limit ? 'text-orange-600 dark:text-orange-400' : 'dark:text-gray-400'}`}>
                      {status.monthly_email_count.toLocaleString()} / {status.max_monthly_emails.toLocaleString()}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(100, (status.monthly_email_count / status.max_monthly_emails) * 100)}
                    className={`h-2 ${status.emails_near_limit ? '[&>div]:bg-orange-500' : '[&>div]:bg-violet-500'}`}
                  />
                  {status.monthly_email_count >= status.max_monthly_emails ? (
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium">Monthly email limit reached — upgrade to send more</p>
                  ) : status.emails_near_limit ? (
                    <p className="text-xs text-orange-600 dark:text-orange-400">{(status.max_monthly_emails - status.monthly_email_count).toLocaleString()} sends remaining this month</p>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{(status.max_monthly_emails - status.monthly_email_count).toLocaleString()} sends remaining this month</p>
                  )}
                </div>
              )}

              {/* Storage Quota */}
              {status.max_storage_bytes != null && (
                <div className="space-y-2">
                  {(() => {
                    const usedGB = (status.total_storage_bytes / (1024 ** 3)).toFixed(2);
                    const maxGB = (status.max_storage_bytes / (1024 ** 3)).toFixed(1);
                    const pct = Math.min(100, (status.total_storage_bytes / status.max_storage_bytes) * 100);
                    const atLimit = status.total_storage_bytes >= status.max_storage_bytes;
                    return (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium dark:text-white flex items-center gap-2">
                            <HardDrive className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                            Storage Used
                          </span>
                          <span className={`text-sm font-medium ${status.storage_near_limit ? 'text-orange-600 dark:text-orange-400' : 'dark:text-gray-400'}`}>
                            {usedGB} GB / {maxGB} GB
                          </span>
                        </div>
                        <Progress
                          value={pct}
                          className={`h-2 ${atLimit ? '[&>div]:bg-red-500' : status.storage_near_limit ? '[&>div]:bg-orange-500' : '[&>div]:bg-teal-500'}`}
                        />
                        {atLimit ? (
                          <p className="text-xs text-red-600 dark:text-red-400 font-medium">Storage full — delete files or upgrade your plan</p>
                        ) : status.storage_near_limit ? (
                          <p className="text-xs text-orange-600 dark:text-orange-400">{((status.max_storage_bytes - status.total_storage_bytes) / (1024 ** 3)).toFixed(2)} GB remaining</p>
                        ) : (
                          <p className="text-xs text-gray-500 dark:text-gray-400">{((status.max_storage_bytes - status.total_storage_bytes) / (1024 ** 3)).toFixed(2)} GB free</p>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Billing Period Info */}
              {status.current_period_end && !status.is_trial && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {t('billing.nextBillingDate')}: {new Date(status.current_period_end).toLocaleDateString()}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500 dark:text-slate-400">{t('billing.couldNotLoadStatus')}</p>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Available Plans Section (Cloud Mode Only) */}
      {!isOnPremise && (() => {
        const sortedPlans = [...(plans ?? [])].sort((a, b) => {
          const aEnt = a.price === 0 && a.name.toLowerCase().includes('enterprise');
          const bEnt = b.price === 0 && b.name.toLowerCase().includes('enterprise');
          if (aEnt) return 1;
          if (bEnt) return -1;
          return a.price - b.price;
        });
        const enterprisePlan = sortedPlans.find(p => p.price === 0 && p.name.toLowerCase().includes('enterprise'));
        const regularPlans = sortedPlans.filter(p => !(p.price === 0 && p.name.toLowerCase().includes('enterprise')));

        const getHighlights = (plan: SubscriptionPlan) => {
          const key = plan.name.toLowerCase();
          for (const [k, v] of Object.entries(PLAN_HIGHLIGHTS)) {
            if (key.includes(k)) return v;
          }
          if (!plan.features) return [];
          return plan.features.split(',').filter(f => f.trim() && f.trim() !== 'all').slice(0, 5).map(f => FEATURE_LABELS[f.trim()] ?? f.trim());
        };

        const getTagline = (plan: SubscriptionPlan) => {
          const key = plan.name.toLowerCase();
          for (const [k, v] of Object.entries(PLAN_TAGLINES)) {
            if (key.includes(k)) return v;
          }
          return plan.description || '';
        };

        const isGrowth = (p: SubscriptionPlan) => p.name.toLowerCase().includes('growth');
        const isPro = (p: SubscriptionPlan) => p.name.toLowerCase().includes('pro') && !p.name.toLowerCase().includes('enterprise');

        const getDisplayPrice = (plan: SubscriptionPlan) => {
          if (plan.price === 0) return 0;
          return billingPeriod === 'annual'
            ? Math.round(plan.price * (1 - ANNUAL_DISCOUNT))
            : plan.price;
        };

        return (
          <div className="space-y-6">
            {/* Header + toggle */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Choose your plan</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Start free. Scale as you grow. Cancel anytime.</p>
              </div>

              {/* Billing period toggle */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={() => setBillingPeriod('monthly')}
                  className={`text-sm font-medium transition-colors cursor-pointer ${billingPeriod === 'monthly' ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annual' : 'monthly')}
                  className="relative w-12 h-6 rounded-full bg-violet-600 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                  aria-label="Toggle billing period"
                >
                  <motion.div
                    layout
                    animate={{ x: billingPeriod === 'annual' ? 24 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
                  />
                </button>
                <button
                  onClick={() => setBillingPeriod('annual')}
                  className={`text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${billingPeriod === 'annual' ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}
                >
                  Annual
                  <AnimatePresence>
                    {billingPeriod === 'annual' && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                        className="text-[10px] font-bold bg-emerald-500 text-white px-1.5 py-0.5 rounded-full"
                      >
                        2 months free
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </div>
            </div>

            {/* Plan cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-stretch">
              {regularPlans.map((plan) => {
                const isCurrentPlan = status?.plan_id === plan.id;
                const highlighted = isGrowth(plan);
                const dark = isPro(plan);
                const highlights = getHighlights(plan);
                const tagline = getTagline(plan);
                const displayName = getDisplayName(plan.name);
                const displayPrice = getDisplayPrice(plan);

                return (
                  <motion.div
                    key={plan.id}
                    layout
                    className={`relative flex flex-col rounded-2xl border transition-shadow duration-200
                      ${highlighted
                        ? 'border-violet-400 ring-2 ring-violet-400/30 shadow-2xl shadow-violet-100/70 dark:shadow-violet-900/30 -mt-3'
                        : dark
                          ? 'border-slate-700 bg-slate-900 shadow-lg'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md'
                      }`}
                    style={highlighted ? {
                      background: 'linear-gradient(135deg, rgba(245,243,255,1) 0%, rgba(237,233,254,0.6) 100%)',
                    } : undefined}
                  >
                    {/* Most Popular badge */}
                    {highlighted && (
                      <div className="absolute -top-4 left-0 right-0 flex justify-center">
                        <span className="bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                          <Sparkles className="h-3 w-3" /> Most Popular
                        </span>
                      </div>
                    )}
                    {isCurrentPlan && (
                      <div className="absolute -top-4 right-4">
                        <span className="bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow">
                          <CheckCircle2 className="h-3 w-3 inline mr-1" />Current
                        </span>
                      </div>
                    )}

                    <div className={`p-6 ${highlighted ? 'pt-8' : 'pt-6'}`}>
                      <h3 className={`text-lg font-bold mb-1 ${dark ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                        {displayName}
                      </h3>
                      <p className={`text-xs leading-relaxed mb-5 ${dark ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>
                        {tagline}
                      </p>

                      {/* Price */}
                      <div className="mb-5">
                        {plan.price === 0 ? (
                          <div className="flex items-baseline gap-1.5">
                            <span className={`text-4xl font-black ${dark ? 'text-white' : 'text-slate-900 dark:text-white'}`}>Free</span>
                            <span className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-400'}`}>14-day trial</span>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-baseline gap-1">
                              <span className={`text-4xl font-black tracking-tight ${dark ? 'text-white' : highlighted ? 'text-violet-700 dark:text-violet-400' : 'text-slate-900 dark:text-white'}`}>
                                {plan.currency === 'INR' ? '₹' : '$'}{displayPrice.toLocaleString()}
                              </span>
                              <span className={`text-sm ml-1 ${dark ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>/mo</span>
                            </div>
                            <AnimatePresence mode="wait">
                              <motion.p
                                key={billingPeriod}
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 4 }}
                                transition={{ duration: 0.15 }}
                                className={`text-xs mt-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}
                              >
                                {billingPeriod === 'annual'
                                  ? `Billed ₹${(displayPrice * 12).toLocaleString()}/yr · save ₹${(plan.price * 12 * ANNUAL_DISCOUNT).toLocaleString()}`
                                  : `Billed monthly · switch to annual and save 20%`}
                              </motion.p>
                            </AnimatePresence>
                          </>
                        )}
                      </div>

                      {/* CTA */}
                      {isCurrentPlan ? (
                        <button
                          disabled
                          className={`w-full py-2.5 rounded-xl text-sm font-semibold border-2 flex items-center justify-center gap-1.5 cursor-default
                            ${dark ? 'border-emerald-500 text-emerald-400' : 'border-emerald-500 text-emerald-600 dark:text-emerald-400'}`}
                        >
                          <CheckCircle2 className="h-4 w-4" /> Current Plan
                        </button>
                      ) : plan.price === 0 ? (
                        <button
                          onClick={() => createSubscription(plan.id)}
                          disabled={isCreatingSubscription}
                          className="w-full py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {isCreatingSubscription ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                          Start for Free
                        </button>
                      ) : (
                        <div className="space-y-2">
                          {/* Show trial CTA only if user has no subscription record at all */}
                          {(plan.trial_days ?? 0) > 0 && !status ? (
                            <>
                              <button
                                onClick={() => createSubscription(plan.id)}
                                disabled={isCreatingSubscription}
                                className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer
                                  ${highlighted
                                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-200 dark:shadow-violet-900/40'
                                    : dark
                                    ? 'bg-white text-slate-900 hover:bg-slate-100'
                                    : 'bg-slate-800 text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600'
                                  }`}
                              >
                                {isCreatingSubscription ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                Start {plan.trial_days}-day Free Trial
                              </button>
                              <button
                                onClick={() => createSubscription(plan.id)}
                                disabled={isCreatingSubscription}
                                className={`w-full py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center justify-center gap-1 cursor-pointer
                                  ${dark
                                    ? 'border-slate-600 text-slate-400 hover:text-white hover:border-slate-400'
                                    : 'border-slate-200 text-slate-400 hover:text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:text-slate-500 dark:hover:text-slate-300'
                                  }`}
                              >
                                Subscribe directly, skip trial →
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => createSubscription(plan.id)}
                              disabled={isCreatingSubscription}
                              className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer
                                ${highlighted
                                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg'
                                  : dark
                                  ? 'bg-white text-slate-900 hover:bg-slate-100'
                                  : 'bg-slate-800 text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600'
                                }`}
                            >
                              {isCreatingSubscription ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                              {status?.status === 'trial' ? 'Upgrade Now' : 'Subscribe Now'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className={`mx-6 border-t ${dark ? 'border-slate-700' : highlighted ? 'border-violet-200/60' : 'border-slate-100 dark:border-slate-800'}`} />

                    <div className="p-6 pt-4 flex-1">
                      <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${dark ? 'text-slate-500' : highlighted ? 'text-violet-400' : 'text-slate-400'}`}>
                        What's included
                      </p>
                      <ul className="space-y-2.5">
                        {highlights.map((h, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className={`h-4 w-4 flex-shrink-0 mt-0.5 ${highlighted ? 'text-violet-500' : dark ? 'text-slate-400' : 'text-emerald-500'}`} />
                            <span className={`text-xs leading-relaxed ${dark ? 'text-slate-300' : 'text-slate-600 dark:text-slate-400'}`}>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Trust signal */}
            <p className="text-center text-xs text-slate-400 dark:text-slate-500">
              No credit card required &nbsp;·&nbsp; 14-day free trial &nbsp;·&nbsp; Cancel anytime
            </p>

            {/* Enterprise Banner */}
            {enterprisePlan && (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 p-8">
                <div className="absolute inset-0 pointer-events-none" style={{background: 'radial-gradient(ellipse at 15% 50%, rgba(139,92,246,0.12) 0%, transparent 60%), radial-gradient(ellipse at 85% 50%, rgba(59,130,246,0.10) 0%, transparent 60%)'}} />
                <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="h-4 w-4 text-amber-400" />
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Enterprise</span>
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2">Built for your team. Deployed your way.</h3>
                    <p className="text-slate-400 text-sm max-w-lg leading-relaxed">
                      Unlimited agents, dedicated infrastructure, SSO, custom SLAs, white-labelling, and a named customer success manager. Built around your scale.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {['Unlimited Agents', 'SSO / SAML', 'Custom SLAs', 'White-label', 'Dedicated CSM'].map(f => (
                        <span key={f} className="text-xs bg-white/10 text-slate-300 px-2.5 py-1 rounded-full border border-white/10">{f}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-3 shrink-0">
                    <div className="text-center">
                      <p className="text-4xl font-black text-white">Custom</p>
                      <p className="text-slate-400 text-xs mt-0.5">Tailored to your scale</p>
                    </div>
                    <button
                      onClick={() => window.location.href = 'mailto:sales@heygenally.com'}
                      className="px-8 py-3 rounded-xl bg-white text-slate-900 font-bold text-sm hover:bg-slate-100 transition-all shadow-xl whitespace-nowrap cursor-pointer"
                    >
                      Talk to Sales →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}
      </div>

      {/* ── Cancellation Reason Modal ────────────────────────────────── */}
      <Dialog open={showCancelModal} onOpenChange={(open) => { if (!open) setShowCancelModal(false); }}>
        <DialogContent className="dark:bg-slate-900 dark:border-slate-700 rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="dark:text-white flex items-center gap-2 text-slate-800">
              <HeartCrack className="h-5 w-5 text-red-500" />
              Before you go…
            </DialogTitle>
            <DialogDescription className="dark:text-slate-400 text-slate-500">
              We're sorry to see you leave. Could you tell us why?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {/* Reason pills */}
            <div className="flex flex-wrap gap-2">
              {CANCEL_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setCancelReason(reason)}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    cancelReason === reason
                      ? 'bg-red-600 border-red-600 text-white shadow-sm'
                      : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-red-400 dark:hover:border-red-500'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            {/* "Other" free text */}
            {cancelReason === 'Other' && (
              <Textarea
                placeholder="Tell us more…"
                value={cancelOtherText}
                onChange={(e) => setCancelOtherText(e.target.value)}
                rows={3}
                className="dark:bg-slate-800 dark:border-slate-600 dark:text-white rounded-xl resize-none"
              />
            )}

            {/* Pause offer */}
            <div className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">Not ready to leave?</p>
              <p className="text-sm text-amber-700 dark:text-amber-400 mb-3">
                Pause your subscription for 1 month instead — we'll keep your data and settings safe.
              </p>
              <button
                type="button"
                onClick={() => {
                  toast.info('Pause feature coming soon');
                  setShowCancelModal(false);
                }}
                className="text-sm font-medium text-amber-700 dark:text-amber-300 underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-100 transition-colors"
              >
                Pause for 1 month
              </button>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="rounded-xl dark:border-slate-600 dark:text-slate-300 order-2 sm:order-1"
              onClick={() => setShowCancelModal(false)}
            >
              Keep my plan
            </Button>
            <Button
              disabled={!cancelReason || isCancelling}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl order-1 sm:order-2"
              onClick={async () => {
                // Fire cancellation reason feedback — fire-and-forget
                if (cancelReason) {
                  authFetch('/api/v1/billing/cancellation-feedback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason: cancelReason, notes: cancelOtherText }),
                  }).catch(() => {/* ignore errors */});
                }
                cancelSubscription();
                setShowCancelModal(false);
              }}
            >
              {isCancelling ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cancelling…
                </span>
              ) : (
                'Cancel subscription'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer — ToS + Privacy links (required by Razorpay merchant terms) */}
      <div className="border-t border-slate-200 dark:border-slate-800 mt-8 pt-6 pb-2 text-center">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          By subscribing you agree to our{' '}
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-violet-600 transition-colors">Terms of Service</a>
          {' '}and{' '}
          <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-violet-600 transition-colors">Privacy Policy</a>.
          {' '}Payments are processed securely by Razorpay. Cancel anytime.
        </p>
      </div>
    </div>
  );
};
