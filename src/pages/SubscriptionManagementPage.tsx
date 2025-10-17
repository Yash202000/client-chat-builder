import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SubscriptionPlan } from "@/types";
import { PlusCircle, Edit, Trash2 } from "lucide-react";

export const SubscriptionManagementPage = () => {
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
      toast({ title: "Subscription plan created successfully!" });
      setIsCreatePlanDialogOpen(false);
      setFormData({ name: "", price: 0, currency: "USD", features: "", is_active: true });
    },
    onError: (error) => {
      toast({ title: "Failed to create plan", description: error.message, variant: "destructive" });
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
      toast({ title: "Subscription plan updated successfully!" });
      setIsEditPlanDialogOpen(false);
      setCurrentPlan(null);
    },
    onError: (error) => {
      toast({ title: "Failed to update plan", description: error.message, variant: "destructive" });
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
      toast({ title: "Subscription plan deleted successfully!" });
    },
    onError: (error) => {
      toast({ title: "Failed to delete plan", description: error.message, variant: "destructive" });
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
    <div className="flex items-center justify-center py-12">
      <div className="flex items-center gap-2 text-muted-foreground dark:text-gray-400">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-600 dark:border-amber-400"></div>
        <span>Loading subscription plans...</span>
      </div>
    </div>
  );
  if (isError) return (
    <div className="text-center py-12">
      <div className="text-red-600 dark:text-red-400">Error loading subscription plans.</div>
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      <header>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-2">
          💳 Subscription Plans
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">Manage pricing plans and subscription tiers for your platform</p>
      </header>

      <Card className="card-shadow-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
          <CardTitle className="text-2xl font-bold dark:text-white">All Plans</CardTitle>
          <Button onClick={() => setIsCreatePlanDialogOpen(true)} className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all">
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Plan
          </Button>
        </CardHeader>
        <CardContent className="pt-6">
        {plans && plans.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <TableHead className="dark:text-gray-300">Name</TableHead>
                <TableHead className="dark:text-gray-300">Price</TableHead>
                <TableHead className="dark:text-gray-300">Features</TableHead>
                <TableHead className="dark:text-gray-300">Active</TableHead>
                <TableHead className="text-right dark:text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id} className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <TableCell className="font-medium dark:text-white">{plan.name}</TableCell>
                  <TableCell className="dark:text-gray-300">
                    <span className="font-semibold text-amber-600 dark:text-amber-400">{plan.price} {plan.currency}</span>
                  </TableCell>
                  <TableCell className="dark:text-gray-300">{plan.features}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      plan.is_active
                        ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {plan.is_active ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="mr-2 dark:border-slate-600 dark:text-white dark:hover:bg-slate-700" onClick={() => handleEditClick(plan)}>
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
          <div className="text-center py-12 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/50 dark:to-orange-900/50 mb-4">
              <PlusCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">No subscription plans found</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Create your first plan to get started!</p>
          </div>
        )}
      </CardContent>
    </Card>

      {/* Create Plan Dialog */}
      <Dialog open={isCreatePlanDialogOpen} onOpenChange={setIsCreatePlanDialogOpen}>
        <DialogContent className="dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Create New Subscription Plan</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="dark:text-gray-300">Plan Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                placeholder="e.g., Premium Plan"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price" className="dark:text-gray-300">Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  required
                  className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                  placeholder="29.99"
                />
              </div>
              <div>
                <Label htmlFor="currency" className="dark:text-gray-300">Currency</Label>
                <Input
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                  placeholder="USD"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="features" className="dark:text-gray-300">Features (comma-separated)</Label>
              <Textarea
                id="features"
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                placeholder="Unlimited agents, Priority support, Custom integrations"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                className="dark:bg-slate-700"
              />
              <Label htmlFor="is_active" className="dark:text-gray-300">Active</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreatePlanDialogOpen(false)} className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700">
                Cancel
              </Button>
              <Button type="submit" disabled={createPlanMutation.isPending} className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white">
                {createPlanMutation.isPending ? "Creating..." : "Create Plan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Dialog */}
      <Dialog open={isEditPlanDialogOpen} onOpenChange={setIsEditPlanDialogOpen}>
        <DialogContent className="dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Edit Subscription Plan</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name" className="dark:text-gray-300">Plan Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-price" className="dark:text-gray-300">Price</Label>
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
                <Label htmlFor="edit-currency" className="dark:text-gray-300">Currency</Label>
                <Input
                  id="edit-currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-features" className="dark:text-gray-300">Features (comma-separated)</Label>
              <Textarea
                id="edit-features"
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                className="dark:bg-slate-700"
              />
              <Label htmlFor="edit-is_active" className="dark:text-gray-300">Active</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditPlanDialogOpen(false)} className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700">
                Cancel
              </Button>
              <Button type="submit" disabled={updatePlanMutation.isPending} className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white">
                {updatePlanMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
