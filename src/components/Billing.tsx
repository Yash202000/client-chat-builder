import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { CheckCircle2, CreditCard, Loader2, Crown, Zap, Users, AlertTriangle, Clock, Shield, Key, Building2, XCircle } from "lucide-react";
import { useI18n } from '@/hooks/useI18n';
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useEffect } from "react";

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
  cancel_at_period_end: boolean;
  razorpay_customer_id: string | null;
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

export const Billing = () => {
  const { t, isRTL } = useI18n();
  const { authFetch, companyId, user } = useAuth();
  const queryClient = useQueryClient();

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
        color: "#3b82f6", // Blue color matching the app theme
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
  const userLimitPercentage = status ? (status.current_user_count / status.user_limit) * 100 : 0;
  const isAtUserLimit = status?.users_remaining === 0;
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
    <div className="min-h-full bg-slate-50 dark:bg-slate-950" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
            <CreditCard className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{t('billing.title')}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t('billing.subtitle')}</p>
          </div>
        </div>
      </div>
      <div className="px-6 py-6 space-y-6">

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
        <Alert variant="destructive" className="border-blue-500 bg-blue-50 dark:bg-blue-950/50">
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
        <Alert variant="destructive" className="border-blue-500 bg-blue-50 dark:bg-blue-950/50">
          <Users className="h-4 w-4" />
          <AlertTitle>{t('billing.userLimitReached')}</AlertTitle>
          <AlertDescription>
            {t('billing.userLimitReachedDesc')}
          </AlertDescription>
        </Alert>
      )}

      {/* On-Premise License Section */}
      {isOnPremise && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
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
                      <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
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
                        <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        Instance User Limit
                      </span>
                      <span className={`text-sm font-medium ${isLicenseAtUserLimit ? 'text-red-600 dark:text-red-400' : 'dark:text-gray-400'}`}>
                        {licenseStatus.current_user_count} / {licenseStatus.max_users} users
                      </span>
                    </div>
                    <Progress
                      value={licenseUserLimitPercentage}
                      className={`h-2 ${isLicenseAtUserLimit ? '[&>div]:bg-red-500' : '[&>div]:bg-blue-500'}`}
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
                        <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
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
                      className="h-2 [&>div]:bg-blue-500"
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
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
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
                    <Crown className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold dark:text-white">
                      {status.plan_name || (status.is_trial ? t('billing.freeTrial') : t('billing.noPlan'))}
                    </p>
                    <p className={`text-sm capitalize flex items-center gap-1 mt-1 ${isRTL ? 'flex-row-reverse' : ''} ${
                      status.status === 'active' ? 'text-green-600 dark:text-green-400' :
                      status.status === 'trial' ? 'text-blue-600 dark:text-blue-400' :
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
                      onClick={() => cancelSubscription()}
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
                    <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    {t('billing.userLimit')}
                  </span>
                  <span className={`text-sm font-medium ${isAtUserLimit ? 'text-red-600 dark:text-red-400' : 'dark:text-gray-400'}`}>
                    {status.current_user_count} / {status.user_limit} {t('billing.users')}
                  </span>
                </div>
                <Progress
                  value={userLimitPercentage}
                  className={`h-2 ${isAtUserLimit ? '[&>div]:bg-red-500' : '[&>div]:bg-blue-500'}`}
                />
                {!isAtUserLimit && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('billing.usersRemaining', { count: status.users_remaining })}
                  </p>
                )}
              </div>

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
      {!isOnPremise && (
      <div>
        <div className="mb-6">
          <h2 className={`text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            {t('billing.availablePlans')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t('billing.choosePlan')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans?.map((plan, index) => {
            const isCurrentPlan = status?.plan_id === plan.id;
            const isPremium = index === plans.length - 1 && plans.length > 1;

            return (
              <div
                key={plan.id}
                className={`flex flex-col relative overflow-hidden rounded-xl border bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-300 ${
                  isPremium ? 'border-blue-300 dark:border-blue-700 ring-1 ring-blue-200 dark:ring-blue-800' : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {isPremium && (
                  <div className={`absolute top-0 ${isRTL ? 'left-0 rounded-br-lg' : 'right-0 rounded-bl-lg'} bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold px-3 py-1`}>
                    {t('billing.popular')}
                  </div>
                )}
                {isCurrentPlan && (
                  <div className={`absolute top-0 ${isRTL ? 'right-0 rounded-bl-lg' : 'left-0 rounded-br-lg'} bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs font-semibold px-3 py-1`}>
                    {t('billing.current')}
                  </div>
                )}
                <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                      {isPremium ? (
                        <Crown className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{plan.name}</h3>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{plan.description}</p>
                </div>
                <div className="flex-grow p-6">
                  <div className="mb-4">
                    <p className="text-4xl font-bold text-slate-900 dark:text-white">
                      {plan.currency === 'INR' ? '₹' : '$'}{plan.price}
                    </p>
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                      /{plan.billing_interval === 'year' ? t('billing.perYear') : t('billing.perMonth')}
                    </span>
                  </div>
                  <div className="mb-4 text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {t('billing.upToUsers', { count: plan.default_user_limit })}
                  </div>
                  <ul className="space-y-3">
                    {plan.features && typeof plan.features === 'string'
                      ? plan.features.split(',').map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{feature.trim()}</span>
                          </li>
                        ))
                      : null}
                  </ul>
                </div>
                <div className="p-6 pt-0 border-t border-slate-200 dark:border-slate-800">
                  <Button
                    className={`w-full rounded-lg ${
                      isPremium
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                        : 'dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700'
                    }`}
                    onClick={() => createSubscription(plan.id)}
                    disabled={isCreatingSubscription || isCurrentPlan}
                  >
                    {isCreatingSubscription ? (
                      <>
                        <Loader2 className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} animate-spin`} />
                        {t('billing.redirecting')}
                      </>
                    ) : isCurrentPlan ? (
                      <>
                        <CheckCircle2 className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        {t('billing.currentPlan')}
                      </>
                    ) : status?.plan_id ? (
                      t('billing.switchPlan')
                    ) : (
                      t('billing.choosePlanButton')
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}
      </div>
    </div>
  );
};
