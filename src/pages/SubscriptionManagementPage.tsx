import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SubscriptionPlan } from "@/types";
import { PlusCircle, Edit, Trash2, Loader2, CreditCard } from "lucide-react";
import { useI18n } from '@/hooks/useI18n';

export const SubscriptionManagementPage = () => {
  const { t, isRTL } = useI18n();
  const { authFetch } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isCreatePlanDialogOpen, setIsCreatePlanDialogOpen] = useState(false);
  const [isEditPlanDialogOpen, setIsEditPlanDialogOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    currency: "USD",
    features: "",
    is_active: true,
    razorpay_plan_id: "",
    default_user_limit: 5,
    trial_days: 14,
    description: "",
    billing_interval: "month",
  });

  const { data: plans, isLoading, isError } = useQuery<SubscriptionPlan[]>({ 
    queryKey: ['subscriptionPlans'], 
    queryFn: async () => {
      const response = await authFetch("/api/v1/subscription/plans/");
      if (!response.ok) {
        throw new Error("Failed to fetch subscription plans");
      }
      return response.json();
    }
  });

  const createPlanMutation = useMutation({
    mutationFn: async (newPlan: Omit<SubscriptionPlan, 'id' | 'created_at' | 'updated_at'>) => {
      const response = await authFetch("/api/v1/subscription/plans/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPlan),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create plan");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptionPlans'] });
      toast({ title: t('subscriptionPlans.planCreatedSuccess') });
      setIsCreatePlanDialogOpen(false);
      setFormData({
        name: "",
        price: 0,
        currency: "USD",
        features: "",
        is_active: true,
        razorpay_plan_id: "",
        default_user_limit: 5,
        trial_days: 14,
        description: "",
        billing_interval: "month",
      });
    },
    onError: (error) => {
      toast({ title: t('subscriptionPlans.planCreatedError'), description: error.message, variant: "destructive" });
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: async (updatedPlan: SubscriptionPlan) => {
      const response = await authFetch(`/api/v1/subscription/plans/${updatedPlan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPlan),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update plan");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptionPlans'] });
      toast({ title: t('subscriptionPlans.planUpdatedSuccess') });
      setIsEditPlanDialogOpen(false);
      setCurrentPlan(null);
    },
    onError: (error) => {
      toast({ title: t('subscriptionPlans.planUpdatedError'), description: error.message, variant: "destructive" });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (planId: number) => {
      const response = await authFetch(`/api/v1/subscription/plans/${planId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to delete plan");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptionPlans'] });
      toast({ title: t('subscriptionPlans.planDeletedSuccess') });
    },
    onError: (error) => {
      toast({ title: t('subscriptionPlans.planDeletedError'), description: error.message, variant: "destructive" });
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPlanMutation.mutate(formData);
  };

  const handleEditClick = (plan: SubscriptionPlan) => {
    setCurrentPlan(plan);
    setFormData({
      name: plan.name,
      price: plan.price,
      currency: plan.currency,
      features: plan.features || "",
      is_active: plan.is_active,
      razorpay_plan_id: plan.razorpay_plan_id || "",
      default_user_limit: plan.default_user_limit || 5,
      trial_days: plan.trial_days || 14,
      description: plan.description || "",
      billing_interval: plan.billing_interval || "month",
    });
    setIsEditPlanDialogOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPlan) {
      updatePlanMutation.mutate({
        ...currentPlan,
        ...formData,
      });
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-64">
      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
    </div>
  );
  if (isError) return (
    <div className="text-center py-12">
      <div className="text-red-600 dark:text-red-400">{t('subscriptionPlans.errorLoading')}</div>
    </div>
  );

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-6">
        <div className={`flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${isRTL ? 'lg:flex-row-reverse' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{t('subscriptionPlans.title')}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t('subscriptionPlans.subtitle')}</p>
            </div>
          </div>
          <Button onClick={() => setIsCreatePlanDialogOpen(true)} className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl h-9 px-4 text-sm">
            <PlusCircle className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} /> {t('subscriptionPlans.createNewPlan')}
          </Button>
        </div>
      </div>
      <div className="px-6 py-6">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">{t('subscriptionPlans.allPlans')}</h3>
          </div>
          <div className="p-6">
        {plans && plans.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <TableHead className="dark:text-gray-300">{t('subscriptionPlans.name')}</TableHead>
                <TableHead className="dark:text-gray-300">{t('subscriptionPlans.price')}</TableHead>
                <TableHead className="dark:text-gray-300">Razorpay ID</TableHead>
                <TableHead className="dark:text-gray-300">Users/Trial</TableHead>
                <TableHead className="dark:text-gray-300">{t('subscriptionPlans.active')}</TableHead>
                <TableHead className={`${isRTL ? 'text-left' : 'text-right'} dark:text-gray-300`}>{t('subscriptionPlans.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id} className="border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <TableCell className="font-medium dark:text-white">
                    <div>
                      <div className="font-semibold">{plan.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {plan.billing_interval === 'year' ? 'Yearly' : 'Monthly'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="dark:text-gray-300">
                    <span className="font-semibold text-amber-600 dark:text-amber-400">{plan.price} {plan.currency}</span>
                  </TableCell>
                  <TableCell className="dark:text-gray-300">
                    <div className="text-xs font-mono">
                      {plan.razorpay_plan_id ? (
                        <span className="text-blue-600 dark:text-blue-400">{plan.razorpay_plan_id}</span>
                      ) : (
                        <span className="text-red-500">Not Set</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="dark:text-gray-300">
                    <div className="text-xs">
                      <div>{plan.default_user_limit || 5} users</div>
                      <div className="text-gray-500 dark:text-gray-400">{plan.trial_days || 0} day trial</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      plan.is_active
                        ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {plan.is_active ? t('subscriptionPlans.activeStatus') : t('subscriptionPlans.inactiveStatus')}
                    </span>
                  </TableCell>
                  <TableCell className={isRTL ? 'text-left' : 'text-right'}>
                    <Button variant="outline" size="sm" className={`${isRTL ? 'ml-2' : 'mr-2'} dark:border-slate-600 dark:text-white dark:hover:bg-slate-700`} onClick={() => handleEditClick(plan)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" className="bg-red-600 hover:bg-red-700" onClick={() => deletePlanMutation.mutate(plan.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12">
            <div className="h-14 w-14 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-7 h-7 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">{t('subscriptionPlans.noPlansFound')}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('subscriptionPlans.createFirstPlan')}</p>
          </div>
        )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={isCreatePlanDialogOpen} onOpenChange={setIsCreatePlanDialogOpen}>
        <DialogContent className="rounded-xl dark:bg-slate-900 dark:border-slate-800" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className="dark:text-white">{t('subscriptionPlans.createDialogTitle')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="dark:text-gray-300">{t('subscriptionPlans.planName')}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                placeholder={t('subscriptionPlans.planNamePlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="description" className="dark:text-gray-300">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                placeholder="Brief description of the plan"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price" className="dark:text-gray-300">{t('subscriptionPlans.priceLabel')}</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  required
                  className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                  placeholder={t('subscriptionPlans.pricePlaceholder')}
                />
              </div>
              <div>
                <Label htmlFor="currency" className="dark:text-gray-300">{t('subscriptionPlans.currency')}</Label>
                <Input
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                  placeholder={t('subscriptionPlans.currencyPlaceholder')}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="razorpay_plan_id" className="dark:text-gray-300">
                Razorpay Plan ID <span className="text-amber-500">*</span>
              </Label>
              <Input
                id="razorpay_plan_id"
                value={formData.razorpay_plan_id}
                onChange={(e) => setFormData({ ...formData, razorpay_plan_id: e.target.value })}
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                placeholder="plan_XXXXXXXXXXXXX"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Create plan in Razorpay Dashboard first, then paste the Plan ID here
              </p>
            </div>
            <div>
              <Label htmlFor="features" className="dark:text-gray-300">{t('subscriptionPlans.featuresLabel')}</Label>
              <Textarea
                id="features"
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                placeholder={t('subscriptionPlans.featuresPlaceholder')}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="default_user_limit" className="dark:text-gray-300">User Limit</Label>
                <Input
                  id="default_user_limit"
                  type="number"
                  min="1"
                  value={formData.default_user_limit}
                  onChange={(e) => setFormData({ ...formData, default_user_limit: parseInt(e.target.value) })}
                  className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                  placeholder="5"
                />
              </div>
              <div>
                <Label htmlFor="trial_days" className="dark:text-gray-300">Trial Days</Label>
                <Input
                  id="trial_days"
                  type="number"
                  min="0"
                  value={formData.trial_days}
                  onChange={(e) => setFormData({ ...formData, trial_days: parseInt(e.target.value) })}
                  className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                  placeholder="14"
                />
              </div>
              <div>
                <Label htmlFor="billing_interval" className="dark:text-gray-300">Billing Interval</Label>
                <select
                  id="billing_interval"
                  value={formData.billing_interval}
                  onChange={(e) => setFormData({ ...formData, billing_interval: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                >
                  <option value="month">Monthly</option>
                  <option value="year">Yearly</option>
                </select>
              </div>
            </div>
            <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                className="dark:bg-slate-700"
              />
              <Label htmlFor="is_active" className="dark:text-gray-300">{t('subscriptionPlans.activeLabel')}</Label>
            </div>
            <DialogFooter className={isRTL ? 'flex-row-reverse' : ''}>
              <Button type="button" variant="outline" onClick={() => setIsCreatePlanDialogOpen(false)} className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700">
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={createPlanMutation.isPending} className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white">
                {createPlanMutation.isPending ? t('subscriptionPlans.creating') : t('subscriptionPlans.createPlan')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Dialog */}
      <Dialog open={isEditPlanDialogOpen} onOpenChange={setIsEditPlanDialogOpen}>
        <DialogContent className="rounded-xl dark:bg-slate-900 dark:border-slate-800" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className="dark:text-white">{t('subscriptionPlans.editDialogTitle')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name" className="dark:text-gray-300">{t('subscriptionPlans.planName')}</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div>
              <Label htmlFor="edit-description" className="dark:text-gray-300">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                placeholder="Brief description of the plan"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-price" className="dark:text-gray-300">{t('subscriptionPlans.priceLabel')}</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  required
                  className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                />
              </div>
              <div>
                <Label htmlFor="edit-currency" className="dark:text-gray-300">{t('subscriptionPlans.currency')}</Label>
                <Input
                  id="edit-currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-razorpay_plan_id" className="dark:text-gray-300">
                Razorpay Plan ID <span className="text-amber-500">*</span>
              </Label>
              <Input
                id="edit-razorpay_plan_id"
                value={formData.razorpay_plan_id}
                onChange={(e) => setFormData({ ...formData, razorpay_plan_id: e.target.value })}
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                placeholder="plan_XXXXXXXXXXXXX"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Create plan in Razorpay Dashboard first, then paste the Plan ID here
              </p>
            </div>
            <div>
              <Label htmlFor="edit-features" className="dark:text-gray-300">{t('subscriptionPlans.featuresLabel')}</Label>
              <Textarea
                id="edit-features"
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-default_user_limit" className="dark:text-gray-300">User Limit</Label>
                <Input
                  id="edit-default_user_limit"
                  type="number"
                  min="1"
                  value={formData.default_user_limit}
                  onChange={(e) => setFormData({ ...formData, default_user_limit: parseInt(e.target.value) })}
                  className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                  placeholder="5"
                />
              </div>
              <div>
                <Label htmlFor="edit-trial_days" className="dark:text-gray-300">Trial Days</Label>
                <Input
                  id="edit-trial_days"
                  type="number"
                  min="0"
                  value={formData.trial_days}
                  onChange={(e) => setFormData({ ...formData, trial_days: parseInt(e.target.value) })}
                  className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                  placeholder="14"
                />
              </div>
              <div>
                <Label htmlFor="edit-billing_interval" className="dark:text-gray-300">Billing Interval</Label>
                <select
                  id="edit-billing_interval"
                  value={formData.billing_interval}
                  onChange={(e) => setFormData({ ...formData, billing_interval: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                >
                  <option value="month">Monthly</option>
                  <option value="year">Yearly</option>
                </select>
              </div>
            </div>
            <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
              <Switch
                id="edit-is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                className="dark:bg-slate-700"
              />
              <Label htmlFor="edit-is_active" className="dark:text-gray-300">{t('subscriptionPlans.activeLabel')}</Label>
            </div>
            <DialogFooter className={isRTL ? 'flex-row-reverse' : ''}>
              <Button type="button" variant="outline" onClick={() => setIsEditPlanDialogOpen(false)} className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700">
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={updatePlanMutation.isPending} className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white">
                {updatePlanMutation.isPending ? t('subscriptionPlans.saving') : t('subscriptionPlans.saveChanges')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
