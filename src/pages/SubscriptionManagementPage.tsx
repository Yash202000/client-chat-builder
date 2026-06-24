import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SubscriptionPlan } from "@/types";
import { PlusCircle, Edit, Trash2, Loader2, CreditCard, Bot, Users, BarChart3, Zap, HardDrive, Mail, BookOpen, Globe, BadgeCheck, AlertCircle } from "lucide-react";
import { useI18n } from '@/hooks/useI18n';

// ── Helpers ──────────────────────────────────────────────────────────────────

const formatBytes = (bytes: number) => {
  if (!bytes) return "Unlimited";
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(0)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
};

const PLAN_COLORS: Record<string, string> = {
  spark: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  starter: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  growth: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  pro: "bg-slate-800 text-white dark:bg-slate-700 dark:text-white",
  enterprise: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

const getPlanColor = (name: string) => {
  const key = name.toLowerCase();
  for (const [k, v] of Object.entries(PLAN_COLORS)) {
    if (key.includes(k)) return v;
  }
  return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300";
};

// ── Default form state ────────────────────────────────────────────────────────

const DEFAULT_FORM = {
  name: "",
  price: 0,
  currency: "INR",
  features: "",
  is_active: true,
  razorpay_plan_id: "",
  default_user_limit: 5,
  trial_days: 14,
  warn_threshold: 0,
  addon_seat_cap: 0,
  addon_seat_price_usd: 0,
  addon_seat_price_inr: 0,
  grace_period_days: 3,
  description: "",
  billing_interval: "month",
  max_agents: 0,
  max_active_agents: 0,
  max_monthly_conversations: 0,
  max_kb_upload_bytes: 0,
  max_knowledge_bases: 0,
  max_channels: 0,
  max_contacts: 0,
  max_leads: 0,
  max_workflows: 0,
  max_campaigns: 0,
  max_monthly_emails: 0,
  max_storage_bytes: 0,
};

type FormData = typeof DEFAULT_FORM;

// ── Shared form fields ────────────────────────────────────────────────────────

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-slate-400 dark:text-slate-500">{hint}</p>}
    </div>
  );
}

function NumericInput({
  id, value, onChange, placeholder, min = 0,
}: { id: string; value: number; onChange: (v: number) => void; placeholder?: string; min?: number }) {
  return (
    <Input
      id={id}
      type="number"
      min={min}
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value) || 0)}
      placeholder={placeholder ?? "0 = unlimited"}
      className="h-9 text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white"
    />
  );
}

function SectionLabel({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <div className="h-6 w-6 rounded-md bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
        <Icon className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
      </div>
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</span>
      <Separator className="flex-1 ml-1" />
    </div>
  );
}

// ── Plan Form Modal ───────────────────────────────────────────────────────────

interface PlanFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  submitLabel: string;
  pendingLabel: string;
  isRTL: boolean;
}

function PlanFormModal({
  open, onOpenChange, title, formData, setFormData, onSubmit, isPending, submitLabel, pendingLabel, isRTL,
}: PlanFormModalProps) {
  const set = (patch: Partial<FormData>) => setFormData((prev) => ({ ...prev, ...patch }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl rounded-2xl dark:bg-slate-900 dark:border-slate-700 p-0 gap-0 overflow-hidden"
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Modal header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-violet-50 to-slate-50 dark:from-violet-950/30 dark:to-slate-900">
          <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-violet-600" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Fill in the details below. Set limits to 0 for unlimited.
          </DialogDescription>
        </div>

        <form onSubmit={onSubmit}>
          <ScrollArea className="max-h-[68vh]">
            <div className="px-6 py-5">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="w-full mb-5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl h-auto">
                  <TabsTrigger value="basic" className="flex-1 text-xs rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">
                    Basic Info
                  </TabsTrigger>
                  <TabsTrigger value="limits" className="flex-1 text-xs rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">
                    Usage Limits
                  </TabsTrigger>
                  <TabsTrigger value="addons" className="flex-1 text-xs rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">
                    Addons
                  </TabsTrigger>
                  <TabsTrigger value="features" className="flex-1 text-xs rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">
                    Features
                  </TabsTrigger>
                </TabsList>

                {/* ── Tab: Basic Info ── */}
                <TabsContent value="basic" className="space-y-4 mt-0">
                  <FieldRow>
                    <Field label="Plan Name" hint="Shown to customers on pricing page">
                      <Input
                        value={formData.name}
                        onChange={(e) => set({ name: e.target.value })}
                        required
                        placeholder="e.g. Growth"
                        className="h-9 text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                      />
                    </Field>
                    <Field label="Billing Interval">
                      <Select value={formData.billing_interval} onValueChange={(v) => set({ billing_interval: v })}>
                        <SelectTrigger className="h-9 text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="month">Monthly</SelectItem>
                          <SelectItem value="year">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </FieldRow>

                  <Field label="Description" hint="Optional tagline shown on the plan card">
                    <Textarea
                      value={formData.description}
                      onChange={(e) => set({ description: e.target.value })}
                      placeholder="e.g. Turn conversations into customers, automatically."
                      rows={2}
                      className="text-sm resize-none dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                    />
                  </Field>

                  <FieldRow>
                    <Field label="Price">
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        value={formData.price}
                        onChange={(e) => set({ price: parseFloat(e.target.value) || 0 })}
                        required
                        placeholder="0.00"
                        className="h-9 text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                      />
                    </Field>
                    <Field label="Currency">
                      <Select value={formData.currency} onValueChange={(v) => set({ currency: v })}>
                        <SelectTrigger className="h-9 text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INR">INR (₹)</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </FieldRow>

                  <Field
                    label="Razorpay Plan ID"
                    hint="Create the plan in Razorpay Dashboard → Subscriptions → Plans first, then paste the ID here."
                  >
                    <div className="relative">
                      <Input
                        value={formData.razorpay_plan_id}
                        onChange={(e) => set({ razorpay_plan_id: e.target.value })}
                        placeholder="plan_XXXXXXXXXXXXX"
                        className="h-9 text-sm font-mono dark:bg-slate-800 dark:border-slate-600 dark:text-white pr-8"
                      />
                      {formData.razorpay_plan_id && (
                        <BadgeCheck className="absolute right-2.5 top-2.5 h-4 w-4 text-emerald-500" />
                      )}
                    </div>
                  </Field>

                  <FieldRow>
                    <Field label="User Limit" hint="Max team members on this plan">
                      <NumericInput id="user_limit" value={formData.default_user_limit} min={1} onChange={(v) => set({ default_user_limit: v })} placeholder="5" />
                    </Field>
                    <Field label="Trial Days" hint="Free trial length in days">
                      <NumericInput id="trial_days" value={formData.trial_days} onChange={(v) => set({ trial_days: v })} placeholder="14" />
                    </Field>
                  </FieldRow>

                  <FieldRow>
                    <Field label="Warn Threshold" hint="Alert user when team reaches this size">
                      <NumericInput id="warn_threshold" value={formData.warn_threshold} onChange={(v) => set({ warn_threshold: v })} placeholder="0" />
                    </Field>
                    <Field label="Grace Period (days)" hint="Days of access after payment fails">
                      <NumericInput id="grace_period" value={formData.grace_period_days} onChange={(v) => set({ grace_period_days: v })} placeholder="3" />
                    </Field>
                  </FieldRow>

                  <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 bg-slate-50 dark:bg-slate-800/50">
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-white">Active Plan</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Inactive plans won't show on pricing page</p>
                    </div>
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(v) => set({ is_active: v })}
                    />
                  </div>
                </TabsContent>

                {/* ── Tab: Usage Limits ── */}
                <TabsContent value="limits" className="space-y-4 mt-0">
                  <SectionLabel icon={Bot} label="AI & Agents" />
                  <FieldRow>
                    <Field label="Max Total Agents">
                      <NumericInput id="max_agents" value={formData.max_agents} onChange={(v) => set({ max_agents: v })} />
                    </Field>
                    <Field label="Max Active (Published) Agents">
                      <NumericInput id="max_active_agents" value={formData.max_active_agents} onChange={(v) => set({ max_active_agents: v })} />
                    </Field>
                    <Field label="Max Monthly Conversations">
                      <NumericInput id="max_conv" value={formData.max_monthly_conversations} onChange={(v) => set({ max_monthly_conversations: v })} />
                    </Field>
                    <Field label="Max Knowledge Bases">
                      <NumericInput id="max_kbs" value={formData.max_knowledge_bases} onChange={(v) => set({ max_knowledge_bases: v })} />
                    </Field>
                  </FieldRow>

                  <Field label="Max KB Upload Size" hint={`Currently: ${formatBytes(formData.max_kb_upload_bytes)}`}>
                    <NumericInput id="max_kb_bytes" value={formData.max_kb_upload_bytes} onChange={(v) => set({ max_kb_upload_bytes: v })} placeholder="e.g. 26214400 = 25 MB" />
                  </Field>

                  <SectionLabel icon={Users} label="Team & Channels" />
                  <Field label="Max Team Chat Channels">
                    <NumericInput id="max_channels" value={formData.max_channels} onChange={(v) => set({ max_channels: v })} />
                  </Field>

                  <SectionLabel icon={BarChart3} label="CRM & Automation" />
                  <FieldRow>
                    <Field label="Max Contacts">
                      <NumericInput id="max_contacts" value={formData.max_contacts} onChange={(v) => set({ max_contacts: v })} />
                    </Field>
                    <Field label="Max Leads">
                      <NumericInput id="max_leads" value={formData.max_leads} onChange={(v) => set({ max_leads: v })} />
                    </Field>
                    <Field label="Max Workflows">
                      <NumericInput id="max_workflows" value={formData.max_workflows} onChange={(v) => set({ max_workflows: v })} />
                    </Field>
                    <Field label="Max Campaigns">
                      <NumericInput id="max_campaigns" value={formData.max_campaigns} onChange={(v) => set({ max_campaigns: v })} />
                    </Field>
                  </FieldRow>

                  <SectionLabel icon={HardDrive} label="Outreach & Storage" />
                  <FieldRow>
                    <Field label="Max Monthly Emails">
                      <NumericInput id="max_emails" value={formData.max_monthly_emails} onChange={(v) => set({ max_monthly_emails: v })} placeholder="e.g. 25000" />
                    </Field>
                    <Field label="Max Storage" hint={`Currently: ${formatBytes(formData.max_storage_bytes)}`}>
                      <NumericInput id="max_storage" value={formData.max_storage_bytes} onChange={(v) => set({ max_storage_bytes: v })} placeholder="e.g. 2147483648 = 2 GB" />
                    </Field>
                  </FieldRow>
                </TabsContent>

                {/* ── Tab: Addons ── */}
                <TabsContent value="addons" className="space-y-4 mt-0">
                  <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/10 px-4 py-3 flex gap-2.5">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                      Addon seats let customers purchase additional team members beyond the base user limit. Set Max Addon Seats to 0 to disable addons for this plan.
                    </p>
                  </div>

                  <Field label="Max Addon Seats" hint="Maximum extra seats purchasable — 0 disables addons">
                    <NumericInput id="addon_cap" value={formData.addon_seat_cap} onChange={(v) => set({ addon_seat_cap: v })} placeholder="0" />
                  </Field>

                  <FieldRow>
                    <Field label="Addon Seat Price (USD)" hint="Price per additional seat in USD">
                      <Input
                        type="number" min={0} step="0.01"
                        value={formData.addon_seat_price_usd}
                        onChange={(e) => set({ addon_seat_price_usd: parseFloat(e.target.value) || 0 })}
                        placeholder="5.00"
                        className="h-9 text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                      />
                    </Field>
                    <Field label="Addon Seat Price (INR)" hint="Price per additional seat in INR">
                      <Input
                        type="number" min={0} step="1"
                        value={formData.addon_seat_price_inr}
                        onChange={(e) => set({ addon_seat_price_inr: parseFloat(e.target.value) || 0 })}
                        placeholder="400"
                        className="h-9 text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                      />
                    </Field>
                  </FieldRow>
                </TabsContent>

                {/* ── Tab: Features ── */}
                <TabsContent value="features" className="space-y-4 mt-0">
                  <div className="rounded-xl border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/10 px-4 py-3 flex gap-2.5">
                    <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                      Enter comma-separated feature keys. These control which features are enabled for this plan.
                      Example: <code className="font-mono bg-blue-100 dark:bg-blue-900/40 px-1 rounded">conversations,agents,knowledge_base,crm,social,reports</code>
                    </p>
                  </div>
                  <Field label="Feature Keys" hint="Comma-separated list of feature identifiers">
                    <Textarea
                      value={formData.features}
                      onChange={(e) => set({ features: e.target.value })}
                      placeholder="conversations, agents, knowledge_base, contacts, leads, campaigns, workflows, reports, social, api_vault, voice_lab, ai_tools"
                      rows={5}
                      className="text-sm font-mono resize-none dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                    />
                  </Field>
                  {formData.features && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {formData.features.split(',').map(f => f.trim()).filter(Boolean).map((f) => (
                        <span key={f} className="text-[11px] bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-full font-medium">
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>

          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}
              className="rounded-xl h-9 text-sm dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}
              className="rounded-xl h-9 text-sm bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-200 dark:shadow-violet-900/30">
              {isPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />{pendingLabel}</> : submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export const SubscriptionManagementPage = () => {
  const { t, isRTL } = useI18n();
  const { authFetch } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SubscriptionPlan | null>(null);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);

  const { data: plans, isLoading, isError } = useQuery<SubscriptionPlan[]>({
    queryKey: ['subscriptionPlans'],
    queryFn: async () => {
      const response = await authFetch("/api/v1/subscription/plans/");
      if (!response.ok) throw new Error("Failed to fetch subscription plans");
      return response.json();
    },
  });

  const createPlanMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await authFetch("/api/v1/subscription/plans/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Failed to create plan");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptionPlans'] });
      toast({ title: "Plan created successfully" });
      setIsCreateOpen(false);
      setFormData(DEFAULT_FORM);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create plan", description: error.message, variant: "destructive" });
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: async (data: SubscriptionPlan & FormData) => {
      const response = await authFetch(`/api/v1/subscription/plans/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Failed to update plan");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptionPlans'] });
      toast({ title: "Plan updated successfully" });
      setIsEditOpen(false);
      setCurrentPlan(null);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update plan", description: error.message, variant: "destructive" });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (planId: number) => {
      const response = await authFetch(`/api/v1/subscription/plans/${planId}`, { method: "DELETE" });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Failed to delete plan");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptionPlans'] });
      toast({ title: "Plan deleted" });
      setDeleteTarget(null);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete plan", description: error.message, variant: "destructive" });
    },
  });

  const openEdit = (plan: SubscriptionPlan) => {
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
      warn_threshold: plan.warn_threshold || 0,
      addon_seat_cap: plan.addon_seat_cap || 0,
      addon_seat_price_usd: plan.addon_seat_price_usd || 0,
      addon_seat_price_inr: plan.addon_seat_price_inr || 0,
      grace_period_days: plan.grace_period_days || 0,
      description: plan.description || "",
      billing_interval: plan.billing_interval || "month",
      max_agents: plan.max_agents || 0,
      max_active_agents: plan.max_active_agents || 0,
      max_monthly_conversations: plan.max_monthly_conversations || 0,
      max_kb_upload_bytes: plan.max_kb_upload_bytes || 0,
      max_knowledge_bases: plan.max_knowledge_bases || 0,
      max_channels: plan.max_channels || 0,
      max_contacts: plan.max_contacts || 0,
      max_leads: plan.max_leads || 0,
      max_workflows: plan.max_workflows || 0,
      max_campaigns: plan.max_campaigns || 0,
      max_monthly_emails: plan.max_monthly_emails || 0,
      max_storage_bytes: plan.max_storage_bytes || 0,
    });
    setIsEditOpen(true);
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-64">
      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
    </div>
  );
  if (isError) return (
    <div className="text-center py-12">
      <p className="text-red-600 dark:text-red-400">{t('subscriptionPlans.errorLoading')}</p>
    </div>
  );

  return (
    <div className="min-h-full app-surface" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* ── Header ── */}
      <div className="bg-card/80 backdrop-blur-sm border-b border-border px-6 py-5">
        <div className={`flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${isRTL ? 'lg:flex-row-reverse' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-200 dark:shadow-violet-900/30">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                {t('subscriptionPlans.title')}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {t('subscriptionPlans.subtitle')}
              </p>
            </div>
          </div>
          <Button
            onClick={() => { setFormData(DEFAULT_FORM); setIsCreateOpen(true); }}
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl h-9 px-4 text-sm shadow-md shadow-violet-200 dark:shadow-violet-900/30 cursor-pointer"
          >
            <PlusCircle className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
            {t('subscriptionPlans.createNewPlan')}
          </Button>
        </div>
      </div>

      {/* ── Plans Table ── */}
      <div className="px-6 py-6">
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t('subscriptionPlans.allPlans')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{plans?.length ?? 0} plans configured</p>
            </div>
          </div>

          {plans && plans.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide pl-6">Plan</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Price</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Razorpay ID</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Users · Trial</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Limits</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...(plans ?? [])].sort((a, b) => a.price - b.price).map((plan) => (
                    <TableRow key={plan.id} className="border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-2.5">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${getPlanColor(plan.name)}`}>
                            {plan.name}
                          </span>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {plan.billing_interval === 'year' ? 'Yearly' : 'Monthly'}
                          </span>
                        </div>
                        {plan.description && (
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-[200px] truncate">{plan.description}</p>
                        )}
                      </TableCell>

                      <TableCell>
                        <span className="text-sm font-bold text-violet-600 dark:text-violet-400">
                          {plan.price === 0 ? 'Free' : `${plan.currency === 'INR' ? '₹' : '$'}${plan.price.toLocaleString()}`}
                        </span>
                        {plan.price > 0 && (
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 ml-1">/{plan.billing_interval === 'year' ? 'yr' : 'mo'}</span>
                        )}
                      </TableCell>

                      <TableCell>
                        {plan.razorpay_plan_id ? (
                          <div className="flex items-center gap-1">
                            <BadgeCheck className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                            <code className="text-[11px] text-blue-600 dark:text-blue-400 font-mono truncate max-w-[130px]">{plan.razorpay_plan_id}</code>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                            <span className="text-[11px] text-red-500 dark:text-red-400">Not set</span>
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded">
                            <Users className="h-3 w-3" />{plan.default_user_limit || 5}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded">
                            {plan.trial_days || 0}d trial
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {plan.max_agents ? (
                            <span className="text-[10px] bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded">
                              {plan.max_agents} agents
                            </span>
                          ) : null}
                          {plan.max_monthly_conversations ? (
                            <span className="text-[10px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">
                              {plan.max_monthly_conversations.toLocaleString()} conv
                            </span>
                          ) : null}
                          {plan.max_contacts ? (
                            <span className="text-[10px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded">
                              {plan.max_contacts.toLocaleString()} contacts
                            </span>
                          ) : null}
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold ${
                          plan.is_active
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${plan.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {plan.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>

                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline" size="sm"
                            onClick={() => openEdit(plan)}
                            className="h-8 w-8 p-0 rounded-lg dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="destructive" size="sm"
                            onClick={() => setDeleteTarget(plan)}
                            className="h-8 w-8 p-0 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 dark:border-red-800 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="h-14 w-14 rounded-2xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-7 h-7 text-violet-400" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">{t('subscriptionPlans.noPlansFound')}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">{t('subscriptionPlans.createFirstPlan')}</p>
              <Button
                onClick={() => { setFormData(DEFAULT_FORM); setIsCreateOpen(true); }}
                className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl cursor-pointer"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Create your first plan
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── Create Modal ── */}
      <PlanFormModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Create New Plan"
        formData={formData}
        setFormData={setFormData}
        onSubmit={(e) => { e.preventDefault(); createPlanMutation.mutate(formData); }}
        isPending={createPlanMutation.isPending}
        submitLabel="Create Plan"
        pendingLabel="Creating…"
        isRTL={isRTL}
      />

      {/* ── Edit Modal ── */}
      <PlanFormModal
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        title={`Edit Plan — ${currentPlan?.name ?? ''}`}
        formData={formData}
        setFormData={setFormData}
        onSubmit={(e) => {
          e.preventDefault();
          if (currentPlan) updatePlanMutation.mutate({ ...currentPlan, ...formData });
        }}
        isPending={updatePlanMutation.isPending}
        submitLabel="Save Changes"
        pendingLabel="Saving…"
        isRTL={isRTL}
      />

      {/* ── Delete Confirmation ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent className="rounded-2xl dark:bg-slate-900 dark:border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900 dark:text-white flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-red-500" /> Delete Plan
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 dark:text-slate-400">
              Are you sure you want to delete <strong className="text-slate-700 dark:text-slate-200">{deleteTarget?.name}</strong>?
              This cannot be undone. Existing subscribers on this plan will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl dark:border-slate-600 dark:text-slate-300">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deletePlanMutation.mutate(deleteTarget.id)}
              disabled={deletePlanMutation.isPending}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white"
            >
              {deletePlanMutation.isPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Deleting…</> : 'Yes, delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
