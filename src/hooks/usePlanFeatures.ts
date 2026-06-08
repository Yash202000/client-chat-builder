import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';

interface BillingStatus {
  plan_features: string[];
  status: string;
  is_trial: boolean;
  plan_name: string | null;
  // User quota
  user_limit: number;
  current_user_count: number;
  users_near_limit: boolean;
  grace_period_end: string | null;
  // Conversation quota
  monthly_conversation_count: number;
  max_monthly_conversations: number | null;
  conversations_near_limit: boolean;
  // Email quota
  monthly_email_count: number;
  max_monthly_emails: number | null;
  emails_near_limit: boolean;
  // Storage quota
  total_storage_bytes: number;
  max_storage_bytes: number | null;
  storage_near_limit: boolean;
}

const FALLBACK: BillingStatus = {
  plan_features: [], status: 'unknown', is_trial: false, plan_name: null,
  user_limit: 0, current_user_count: 0, users_near_limit: false, grace_period_end: null,
  monthly_conversation_count: 0, max_monthly_conversations: null, conversations_near_limit: false,
  monthly_email_count: 0, max_monthly_emails: null, emails_near_limit: false,
  total_storage_bytes: 0, max_storage_bytes: null, storage_near_limit: false,
};

export const usePlanFeatures = () => {
  const { authFetch, user } = useAuth();

  const { data, isLoading } = useQuery<BillingStatus>({
    queryKey: ['billingStatus'],
    queryFn: async () => {
      const res = await authFetch('/api/v1/billing/status');
      if (!res.ok) return FALLBACK;
      return res.json();
    },
    enabled: !!user,
    staleTime: 60 * 1000,
  });

  const planFeatures: string[] = data?.plan_features ?? [];
  const isSubscriptionExpired = !isLoading && !!data && planFeatures.length === 0;

  const hasFeature = (feature: string): boolean => {
    if (isLoading || !data) return true;
    return planFeatures.includes('all') || planFeatures.includes(feature);
  };

  return {
    planFeatures,
    hasFeature,
    isLoading,
    isSubscriptionExpired,
    planName: data?.plan_name ?? null,
    isTrial: data?.is_trial ?? false,
    // User quota
    usersNearLimit: data?.users_near_limit ?? false,
    gracePeriodEnd: data?.grace_period_end ?? null,
    // Conversation quota
    monthlyConversationCount: data?.monthly_conversation_count ?? 0,
    maxMonthlyConversations: data?.max_monthly_conversations ?? null,
    conversationsNearLimit: data?.conversations_near_limit ?? false,
    // Email quota
    monthlyEmailCount: data?.monthly_email_count ?? 0,
    maxMonthlyEmails: data?.max_monthly_emails ?? null,
    emailsNearLimit: data?.emails_near_limit ?? false,
    // Storage quota
    totalStorageBytes: data?.total_storage_bytes ?? 0,
    maxStorageBytes: data?.max_storage_bytes ?? null,
    storageNearLimit: data?.storage_near_limit ?? false,
  };
};
