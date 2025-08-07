import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

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

  if (isLoadingPlans || isLoadingStatus) return <div>Loading billing information...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Subscription & Billing</h2>
        <p className="text-gray-600">Manage your plan and view billing details.</p>
      </div>

      {/* Current Plan Section */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
        </CardHeader>
        <CardContent>
          {status ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-semibold">{status.plan}</p>
                <p className="text-sm text-green-600 capitalize">{status.status}</p>
              </div>
              <Button variant="outline">Manage Subscription</Button>
            </div>
          ) : (
            <p>Could not load subscription status.</p>
          )}
        </CardContent>
      </Card>

      {/* Available Plans Section */}
      <div>
        <h3 className="text-xl font-bold mb-4">Available Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans?.map((plan) => (
            <Card key={plan.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-4xl font-bold mb-4">
                  ${plan.price} <span className="text-lg font-normal text-gray-500">/ month</span>
                </p>
                <ul className="space-y-2">
                  {plan.features && typeof plan.features === 'string' 
                    ? plan.features.split(',').map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                          <span>{feature.trim()}</span>
                        </li>
                      ))
                    : null}
                </ul>
              </CardContent>
              <div className="p-6 pt-0">
                <Button 
                  className="w-full" 
                  onClick={() => createCheckout(plan.id)}
                  disabled={isCreatingCheckout || status?.plan === plan.name}
                >
                  {isCreatingCheckout ? "Redirecting..." : (status?.plan === plan.name ? "Current Plan" : "Choose Plan")}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
