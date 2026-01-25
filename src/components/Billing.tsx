import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { CheckCircle2, CreditCard, Loader2, Crown, Zap, Users, AlertTriangle, Clock, ExternalLink, Shield, Key, Building2 } from "lucide-react";
import { useI18n } from '@/hooks/useI18n';
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  stripe_customer_id: string | null;
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

export const Billing = () => {
  const { t, isRTL } = useI18n();
  const { authFetch, companyId } = useAuth();

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

  // 3. Mutation to create a checkout session
  const { mutate: createCheckout, isPending: isCreatingCheckout } = useMutation({
    mutationFn: async (planId: number) => {
      const response = await authFetch(`/api/v1/billing/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: planId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create checkout session");
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Redirect to Stripe checkout
      window.location.href = data.url;
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // 4. Mutation to create a portal session
  const { mutate: createPortalSession, isPending: isCreatingPortal } = useMutation({
    mutationFn: async () => {
      const response = await authFetch(`/api/v1/billing/create-portal-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create portal session");
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Redirect to Stripe portal
      window.location.href = data.url;
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  if (isLoadingLicense || (!isOnPremise && (isLoadingPlans || isLoadingStatus))) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-2 text-muted-foreground dark:text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin text-amber-600 dark:text-amber-400" />
          <span>{t('billing.loading')}</span>
        </div>
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
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <header>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent mb-2">
          {t('billing.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">{t('billing.subtitle')}</p>
      </header>

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
        <Alert variant="destructive" className="border-amber-500 bg-amber-50 dark:bg-amber-950/50">
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
        <Alert variant="destructive" className="border-amber-500 bg-amber-50 dark:bg-amber-950/50">
          <Users className="h-4 w-4" />
          <AlertTitle>{t('billing.userLimitReached')}</AlertTitle>
          <AlertDescription>
            {t('billing.userLimitReachedDesc')}
          </AlertDescription>
        </Alert>
      )}

      {/* On-Premise License Section */}
      {isOnPremise && (
        <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-800">
          <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="dark:text-white flex items-center gap-2">
                  <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  On-Premise License
                </CardTitle>
                <CardDescription className="dark:text-gray-400">Enterprise license for self-hosted deployment</CardDescription>
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
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {licenseStatus && licenseStatus.status !== "not_activated" ? (
              <>
                <div className={`flex flex-col md:flex-row md:items-center ${isRTL ? 'md:flex-row-reverse' : ''} md:justify-between gap-4`}>
                  <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/50 dark:to-yellow-900/50 rounded-xl flex items-center justify-center shadow-sm">
                      <Building2 className="h-8 w-8 text-amber-600 dark:text-amber-400" />
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
                        <Users className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        Instance User Limit
                      </span>
                      <span className={`text-sm font-medium ${isLicenseAtUserLimit ? 'text-red-600 dark:text-red-400' : 'dark:text-gray-400'}`}>
                        {licenseStatus.current_user_count} / {licenseStatus.max_users} users
                      </span>
                    </div>
                    <Progress
                      value={licenseUserLimitPercentage}
                      className={`h-2 ${isLicenseAtUserLimit ? '[&>div]:bg-red-500' : '[&>div]:bg-amber-500'}`}
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
                        <Building2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
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
                      className="h-2 [&>div]:bg-amber-500"
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
              <div className="text-center py-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                <Key className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">No license activated</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">Contact your administrator to activate a license.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cloud Mode - Current Plan Section */}
      {!isOnPremise && (
      <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-800">
        <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="dark:text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                {t('billing.currentPlan')}
              </CardTitle>
              <CardDescription className="dark:text-gray-400">{t('billing.activeSubscription')}</CardDescription>
            </div>
            {status?.is_trial && status?.trial_days_remaining !== null && (
              <Badge variant="outline" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-blue-300">
                <Clock className="h-3 w-3 mr-1" />
                {t('billing.trialDaysRemaining', { days: status.trial_days_remaining })}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {status ? (
            <>
              <div className={`flex flex-col md:flex-row md:items-center ${isRTL ? 'md:flex-row-reverse' : ''} md:justify-between gap-4`}>
                <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/50 dark:to-yellow-900/50 rounded-xl flex items-center justify-center shadow-sm">
                    <Crown className="h-8 w-8 text-amber-600 dark:text-amber-400" />
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
                  {status.stripe_customer_id && (
                    <Button
                      variant="outline"
                      className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700"
                      onClick={() => createPortalSession()}
                      disabled={isCreatingPortal}
                    >
                      {isCreatingPortal ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <ExternalLink className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                          {t('billing.manageSubscription')}
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
                    <Users className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    {t('billing.userLimit')}
                  </span>
                  <span className={`text-sm font-medium ${isAtUserLimit ? 'text-red-600 dark:text-red-400' : 'dark:text-gray-400'}`}>
                    {status.current_user_count} / {status.user_limit} {t('billing.users')}
                  </span>
                </div>
                <Progress
                  value={userLimitPercentage}
                  className={`h-2 ${isAtUserLimit ? '[&>div]:bg-red-500' : '[&>div]:bg-amber-500'}`}
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
            <div className="text-center py-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50">
              <p className="text-gray-600 dark:text-gray-400">{t('billing.couldNotLoadStatus')}</p>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Available Plans Section (Cloud Mode Only) */}
      {!isOnPremise && (
      <div>
        <div className="mb-6">
          <h2 className={`text-2xl font-bold dark:text-white flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Zap className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            {t('billing.availablePlans')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{t('billing.choosePlan')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans?.map((plan, index) => {
            const isCurrentPlan = status?.plan_id === plan.id;
            const isPremium = index === plans.length - 1 && plans.length > 1;

            return (
              <Card
                key={plan.id}
                className={`flex flex-col relative overflow-hidden border-slate-200 dark:border-slate-700 dark:bg-slate-800 transition-all duration-300 hover:shadow-xl ${
                  isPremium ? 'ring-2 ring-amber-500 dark:ring-amber-400' : ''
                }`}
              >
                {isPremium && (
                  <div className={`absolute top-0 ${isRTL ? 'left-0 rounded-br-lg' : 'right-0 rounded-bl-lg'} bg-gradient-to-r from-amber-600 to-yellow-600 text-white text-xs font-semibold px-3 py-1`}>
                    {t('billing.popular')}
                  </div>
                )}
                {isCurrentPlan && (
                  <div className={`absolute top-0 ${isRTL ? 'right-0 rounded-bl-lg' : 'left-0 rounded-br-lg'} bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs font-semibold px-3 py-1`}>
                    {t('billing.current')}
                  </div>
                )}
                <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/50 dark:to-yellow-900/50 rounded-lg flex items-center justify-center shadow-sm">
                      {isPremium ? (
                        <Crown className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                      ) : (
                        <Zap className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                      )}
                    </div>
                    <CardTitle className="dark:text-white">{plan.name}</CardTitle>
                  </div>
                  <CardDescription className="dark:text-gray-400">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow pt-6">
                  <div className="mb-4">
                    <p className="text-5xl font-bold dark:text-white">
                      ${plan.price}
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
                </CardContent>
                <div className="p-6 pt-0 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                  <Button
                    className={`w-full ${
                      isPremium
                        ? 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white shadow-lg hover:shadow-xl'
                        : 'dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600'
                    }`}
                    onClick={() => createCheckout(plan.id)}
                    disabled={isCreatingCheckout || isCurrentPlan}
                  >
                    {isCreatingCheckout ? (
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
              </Card>
            );
          })}
        </div>
      </div>
      )}
    </div>
  );
};
