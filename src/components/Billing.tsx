import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { CheckCircle2, CreditCard, Loader2, Crown, Zap } from "lucide-react";

export const Billing = () => {
  const { authFetch, companyId } = useAuth();

  // 1. Fetch available subscription plans
  const { data: plans, isLoading: isLoadingPlans } = useQuery({
    queryKey: ['subscriptionPlans'],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/billing/plans`);
      if (!response.ok) throw new Error("Failed to fetch plans");
      return response.json();
    },
  });

  // 2. Fetch the company's current subscription status
  const { data: status, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['billingStatus', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const response = await authFetch(`/api/v1/billing/status`);
      if (!response.ok) throw new Error("Failed to fetch billing status");
      return response.json();
    },
    enabled: !!companyId,
  });

  // 3. Mutation to create a checkout session
  const { mutate: createCheckout, isPending: isCreatingCheckout } = useMutation({
    mutationFn: async (planId) => {
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
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (isLoadingPlans || isLoadingStatus) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-2 text-muted-foreground dark:text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin text-amber-600 dark:text-amber-400" />
          <span>Loading billing information...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      <header>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent mb-2">
          💳 Subscription & Billing
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">Manage your plan and view billing details</p>
      </header>

      {/* Current Plan Section */}
      <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-800">
        <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
          <CardTitle className="dark:text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            Current Plan
          </CardTitle>
          <CardDescription className="dark:text-gray-400">Your active subscription</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {status ? (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/50 dark:to-yellow-900/50 rounded-xl flex items-center justify-center shadow-sm">
                  <Crown className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold dark:text-white">{status.plan}</p>
                  <p className="text-sm text-green-600 dark:text-green-400 capitalize flex items-center gap-1 mt-1">
                    <CheckCircle2 className="h-4 w-4" />
                    {status.status}
                  </p>
                </div>
              </div>
              <Button variant="outline" className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700">
                Manage Subscription
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50">
              <p className="text-gray-600 dark:text-gray-400">Could not load subscription status.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Plans Section */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
            <Zap className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            Available Plans
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Choose the perfect plan for your needs</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans?.map((plan, index) => {
            const isCurrentPlan = status?.plan === plan.name;
            const isPremium = index === plans.length - 1 && plans.length > 1;

            return (
              <Card
                key={plan.id}
                className={`flex flex-col relative overflow-hidden border-slate-200 dark:border-slate-700 dark:bg-slate-800 transition-all duration-300 hover:shadow-xl ${
                  isPremium ? 'ring-2 ring-amber-500 dark:ring-amber-400' : ''
                }`}
              >
                {isPremium && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-600 to-yellow-600 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
                    Popular
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute top-0 left-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs font-semibold px-3 py-1 rounded-br-lg">
                    Current
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
                  <div className="mb-6">
                    <p className="text-5xl font-bold dark:text-white">
                      ${plan.price}
                    </p>
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400">per month</span>
                  </div>
                  <ul className="space-y-3">
                    {plan.features && typeof plan.features === 'string'
                      ? plan.features.split(',').map((feature, index) => (
                          <li key={index} className="flex items-start gap-2">
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
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Redirecting...
                      </>
                    ) : isCurrentPlan ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Current Plan
                      </>
                    ) : (
                      'Choose Plan'
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
