import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Mail,
  MessageSquare,
  Phone,
  Layers,
  Calendar,
  DollarSign,
  Users,
  Target,
  Edit,
  Trash2,
  Play,
  Pause,
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Clock,
  Send,
  MoreVertical,
  FileText,
  Sparkles,
  RefreshCw,
  GitBranch,
  Plus,
  Zap,
  ToggleLeft,
  ToggleRight,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';

interface Segment {
  id: number;
  name: string;
  description?: string;
  segment_type: string;
  contact_count: number;
  lead_count: number;
}

interface CampaignMessage {
  id: number;
  campaign_id: number;
  sequence_order: number;
  name?: string;
  message_type: string;
  template_id?: number;
  subject?: string;
  body?: string;
  html_body?: string;
  voice_script?: string;
  template?: {
    id: number;
    name: string;
    description?: string;
    template_type: string;
    is_ai_generated?: boolean;
    subject?: string;
    body?: string;
    personalization_tokens?: string[];
  };
}

interface Campaign {
  id: number;
  name: string;
  description?: string;
  campaign_type: string;
  status: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  actual_cost?: number;
  goal_type?: string;
  goal_value?: number;
  segment_id?: number;
  target_criteria?: Record<string, any>;
  total_contacts: number;
  contacts_reached: number;
  contacts_engaged: number;
  contacts_converted: number;
  total_revenue?: number;
  created_at: string;
  updated_at: string;
  last_run_at?: string;
}

const CAMPAIGN_TYPE_ICONS: Record<string, any> = {
  email: Mail,
  sms: MessageSquare,
  whatsapp: MessageSquare,
  voice: Phone,
  multi_channel: Layers,
};

interface SequenceTrigger {
  id: number;
  campaign_id: number;
  sequence_id: number;
  trigger_condition: string;
  delay_hours: number;
  is_active: boolean;
  last_fired_at?: string;
  enrolled_count: number;
  created_at: string;
  sequence?: { id: number; name: string; status: string };
}

const TRIGGER_CONDITIONS = [
  { value: 'on_send',        label: 'When campaign sends — enroll all' },
  { value: 'on_completion',  label: 'When contact completes campaign' },
  { value: 'if_opened',      label: 'If contact opened an email' },
  { value: 'if_not_opened',  label: 'If contact never opened' },
  { value: 'if_clicked',     label: 'If contact clicked a link' },
  { value: 'if_not_clicked', label: 'If contact never clicked' },
  { value: 'if_replied',     label: 'If contact replied' },
  { value: 'if_not_replied', label: 'If contact never replied' },
];

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  paused: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  completed: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  archived: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
};

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [segment, setSegment] = useState<Segment | null>(null);
  const [campaignMessages, setCampaignMessages] = useState<CampaignMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Sequence triggers
  const [triggers, setTriggers] = useState<SequenceTrigger[]>([]);
  const [sequences, setSequences] = useState<{ id: number; name: string }[]>([]);
  const [triggerDialogOpen, setTriggerDialogOpen] = useState(false);
  const [triggerForm, setTriggerForm] = useState({ sequence_id: '', trigger_condition: 'on_completion', delay_hours: 0 });
  const [savingTrigger, setSavingTrigger] = useState(false);
  const [firingTrigger, setFiringTrigger] = useState<number | null>(null);

  useEffect(() => {
    fetchCampaign();
  }, [id]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return { Authorization: `Bearer ${token}` };
  };

  const fetchCampaign = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const response = await axios.get(`/api/v1/campaigns/${id}`, { headers });
      setCampaign(response.data);

      // If campaign has a segment_id, fetch segment details
      if (response.data.segment_id) {
        try {
          const segmentResponse = await axios.get(`/api/v1/segments/${response.data.segment_id}`, { headers });
          setSegment(segmentResponse.data);
        } catch (segmentError) {
          console.error('Error fetching segment:', segmentError);
        }
      }

      // Fetch campaign messages
      try {
        const messagesResponse = await axios.get(`/api/v1/campaigns/${id}/messages`, { headers });
        setCampaignMessages(messagesResponse.data || []);
      } catch (messagesError) {
        console.error('Error fetching campaign messages:', messagesError);
      }
    } catch (error) {
      console.error('Error fetching campaign:', error);
      toast({
        title: t('crm.common.error'),
        description: t('crm.campaigns.fetchError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTriggers = async () => {
    try {
      const headers = getAuthHeaders();
      const res = await axios.get(`/api/v1/campaigns/${id}/sequence-triggers`, { headers });
      setTriggers(res.data);
    } catch {}
  };

  const fetchSequences = async () => {
    if (sequences.length > 0) return;
    try {
      const headers = getAuthHeaders();
      const res = await axios.get('/api/v1/sequences/', { headers });
      setSequences(res.data.map((s: any) => ({ id: s.id, name: s.name })));
    } catch {}
  };

  const handleAddTrigger = async () => {
    if (!triggerForm.sequence_id) return;
    setSavingTrigger(true);
    try {
      const headers = getAuthHeaders();
      const res = await axios.post(`/api/v1/campaigns/${id}/sequence-triggers`, {
        sequence_id: parseInt(triggerForm.sequence_id),
        trigger_condition: triggerForm.trigger_condition,
        delay_hours: triggerForm.delay_hours,
      }, { headers });
      setTriggers(prev => [...prev, res.data]);
      setTriggerDialogOpen(false);
      setTriggerForm({ sequence_id: '', trigger_condition: 'on_completion', delay_hours: 0 });
      toast({ title: 'Trigger added', description: 'Sequence trigger configured' });
    } catch {
      toast({ title: 'Error', description: 'Failed to add trigger', variant: 'destructive' });
    } finally { setSavingTrigger(false); }
  };

  const handleFireTrigger = async (triggerId: number) => {
    setFiringTrigger(triggerId);
    try {
      const headers = getAuthHeaders();
      const res = await axios.post(`/api/v1/campaigns/${id}/sequence-triggers/${triggerId}/fire`, {}, { headers });
      toast({ title: 'Fired', description: res.data.message });
      fetchTriggers();
    } catch {
      toast({ title: 'Error', description: 'Failed to fire trigger', variant: 'destructive' });
    } finally { setFiringTrigger(null); }
  };

  const handleDeleteTrigger = async (triggerId: number) => {
    try {
      const headers = getAuthHeaders();
      await axios.delete(`/api/v1/campaigns/${id}/sequence-triggers/${triggerId}`, { headers });
      setTriggers(prev => prev.filter(t => t.id !== triggerId));
      toast({ title: 'Deleted' });
    } catch {
      toast({ title: 'Error', description: 'Failed to delete trigger', variant: 'destructive' });
    }
  };

  const handleToggleTrigger = async (trigger: SequenceTrigger) => {
    try {
      const headers = getAuthHeaders();
      const res = await axios.put(`/api/v1/campaigns/${id}/sequence-triggers/${trigger.id}`,
        { is_active: !trigger.is_active }, { headers });
      setTriggers(prev => prev.map(t => t.id === trigger.id ? res.data : t));
    } catch {
      toast({ title: 'Error', description: 'Failed to update trigger', variant: 'destructive' });
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      setActionLoading(true);
      const headers = getAuthHeaders();

      if (newStatus === 'active' && campaign?.status === 'draft') {
        // Launching campaign - need to enroll contacts first, then start

        // Step 1: Auto-enroll contacts from segment/criteria
        let enrolledCount = 0;
        let totalEnrolled = 0;
        try {
          const enrollResponse = await axios.post(`/api/v1/campaigns/${id}/enroll-from-criteria`, {}, { headers });
          enrolledCount = enrollResponse.data?.enrolled_count || 0;
          totalEnrolled = enrollResponse.data?.total_enrolled || enrolledCount;
        } catch (enrollError: any) {
        }

        // Use total_enrolled (includes existing enrollments) for the check
        if (totalEnrolled === 0) {
          toast({
            title: t('crm.campaigns.noContacts', 'No contacts to target'),
            description: t('crm.campaigns.noContactsDesc', 'Please configure the target audience (segment or filter criteria) before launching.'),
            variant: 'destructive',
          });
          setActionLoading(false);
          return;
        }

        // Use totalEnrolled for display
        enrolledCount = totalEnrolled;

        // Step 2: Start the campaign (this activates enrollments and schedules messages)
        const startResponse = await axios.post(`/api/v1/campaigns/${id}/start`, {}, { headers });

        if (startResponse.data.success) {
          setCampaign(prev => prev ? { ...prev, status: 'active' } : null);

          // Check if campaign is scheduled for future or started immediately
          if (startResponse.data.status === 'scheduled') {
            const scheduledDate = new Date(startResponse.data.scheduled_for);
            toast({
              title: t('crm.campaigns.scheduled', 'Campaign Scheduled'),
              description: t('crm.campaigns.scheduledDesc', `Campaign will start at ${scheduledDate.toLocaleString()}. ${enrolledCount} contacts enrolled.`),
            });
          } else {
            toast({
              title: t('crm.common.success'),
              description: t('crm.campaigns.launchedWithCount', `Campaign launched! ${enrolledCount} contacts enrolled.`),
            });
          }
          // Refresh to get updated metrics
          fetchCampaign();
        }
      } else if (newStatus === 'active' && (campaign?.status === 'paused' || campaign?.status === 'active')) {
        // Resuming paused campaign or re-launching active campaign with no enrollments

        // First check if there are enrollments, if not, enroll contacts
        let enrolledCount = campaign?.total_contacts || 0;

        if (enrolledCount === 0) {
          // Try to enroll contacts first
          try {
            const enrollResponse = await axios.post(`/api/v1/campaigns/${id}/enroll-from-criteria`, {}, { headers });
            enrolledCount = enrollResponse.data?.enrolled_count || 0;
          } catch (enrollError: any) {
          }

          if (enrolledCount === 0) {
            toast({
              title: t('crm.campaigns.noContacts', 'No contacts to target'),
              description: t('crm.campaigns.noContactsDesc', 'Please configure the target audience (segment or filter criteria) before launching.'),
              variant: 'destructive',
            });
            setActionLoading(false);
            return;
          }
        }

        if (campaign?.status === 'paused') {
          await axios.post(`/api/v1/campaigns/${id}/resume`, {}, { headers });
        }

        // Start/restart the campaign to process queue
        const startResponse = await axios.post(`/api/v1/campaigns/${id}/start`, {}, { headers });

        setCampaign(prev => prev ? { ...prev, status: 'active' } : null);

        // Check if campaign is scheduled for future or started immediately
        if (startResponse.data.status === 'scheduled') {
          const scheduledDate = new Date(startResponse.data.scheduled_for);
          toast({
            title: t('crm.campaigns.scheduled', 'Campaign Scheduled'),
            description: t('crm.campaigns.scheduledDesc', `Campaign will start at ${scheduledDate.toLocaleString()}. ${enrolledCount} contacts enrolled.`),
          });
        } else {
          toast({
            title: t('crm.common.success'),
            description: enrolledCount > 0
              ? t('crm.campaigns.launchedWithCount', `Campaign launched! ${enrolledCount} contacts enrolled.`)
              : t('crm.campaigns.resumed', 'Campaign resumed'),
          });
        }
        fetchCampaign();
      } else if (newStatus === 'paused') {
        // Pausing campaign
        await axios.post(`/api/v1/campaigns/${id}/pause`, {}, { headers });
        setCampaign(prev => prev ? { ...prev, status: 'paused' } : null);
        toast({
          title: t('crm.common.success'),
          description: t('crm.campaigns.paused', 'Campaign paused'),
        });
      } else {
        // Other status changes (completed, etc.)
        await axios.patch(`/api/v1/campaigns/${id}`, { status: newStatus }, { headers });
        setCampaign(prev => prev ? { ...prev, status: newStatus } : null);
        toast({
          title: t('crm.common.success'),
          description: t('crm.campaigns.statusUpdated'),
        });
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: t('crm.common.error'),
        description: error.response?.data?.detail || t('crm.campaigns.updateError'),
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setActionLoading(true);
      const headers = getAuthHeaders();
      await axios.delete(`/api/v1/campaigns/${id}`, { headers });
      toast({
        title: t('crm.common.success'),
        description: t('crm.campaigns.deleted'),
      });
      navigate('/dashboard/crm/campaigns');
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({
        title: t('crm.common.error'),
        description: t('crm.campaigns.deleteError'),
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleRelaunch = async () => {
    try {
      setActionLoading(true);
      const headers = getAuthHeaders();

      // Call relaunch endpoint to reset campaign
      const response = await axios.post(`/api/v1/campaigns/${id}/relaunch`, {}, { headers });

      if (response.data.success) {
        setCampaign(prev => prev ? { ...prev, status: 'draft' } : null);
        toast({
          title: t('crm.campaigns.relaunchReady', 'Ready to Re-launch'),
          description: t('crm.campaigns.relaunchReadyDesc', 'Campaign has been reset. You can now launch it again.'),
        });
        fetchCampaign();
      }
    } catch (error: any) {
      console.error('Error re-launching campaign:', error);
      toast({
        title: t('crm.common.error'),
        description: error.response?.data?.detail || t('crm.campaigns.relaunchError', 'Failed to re-launch campaign'),
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    // Backend returns UTC dates - ensure proper parsing
    // If the date string doesn't have timezone info, append 'Z' to treat it as UTC
    let normalizedDateString = dateString;
    if (!dateString.endsWith('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
      normalizedDateString = dateString + 'Z';
    }
    const date = new Date(normalizedDateString);
    // Format in local timezone with date and time
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const getEngagementRate = () => {
    if (!campaign || campaign.contacts_reached === 0) return 0;
    return Math.round((campaign.contacts_engaged / campaign.contacts_reached) * 100);
  };

  const getConversionRate = () => {
    if (!campaign || campaign.contacts_reached === 0) return 0;
    return Math.round((campaign.contacts_converted / campaign.contacts_reached) * 100);
  };

  const getProgress = () => {
    if (!campaign || campaign.total_contacts === 0) return 0;
    return Math.round((campaign.contacts_reached / campaign.total_contacts) * 100);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">{t('crm.campaigns.notFound')}</p>
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard/crm/campaigns')}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('crm.campaigns.backToCampaigns')}
          </Button>
        </div>
      </div>
    );
  }

  const TypeIcon = CAMPAIGN_TYPE_ICONS[campaign.campaign_type.toLowerCase()] || Mail;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard/crm/campaigns')}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
              <TypeIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold dark:text-white">{campaign.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={STATUS_COLORS[campaign.status.toLowerCase()]}>
                  {t(`crm.campaigns.status.${campaign.status.toLowerCase()}`)}
                </Badge>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t(`crm.campaigns.types.${campaign.campaign_type.toLowerCase()}`)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {campaign.status === 'draft' && (
            <Button
              onClick={() => handleStatusChange('active')}
              disabled={actionLoading}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
            >
              <Play className="h-4 w-4 mr-2" />
              {t('crm.campaigns.actions.launch')}
            </Button>
          )}
          {campaign.status === 'active' && (
            <Button
              variant="outline"
              onClick={() => handleStatusChange('paused')}
              disabled={actionLoading}
            >
              <Pause className="h-4 w-4 mr-2" />
              {t('crm.campaigns.actions.pause')}
            </Button>
          )}
          {campaign.status === 'paused' && (
            <Button
              onClick={() => handleStatusChange('active')}
              disabled={actionLoading}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
            >
              <Play className="h-4 w-4 mr-2" />
              {t('crm.campaigns.actions.resume')}
            </Button>
          )}
          {campaign.status === 'completed' && (
            <Button
              onClick={handleRelaunch}
              disabled={actionLoading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('crm.campaigns.actions.relaunch', 'Re-launch')}
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/dashboard/crm/campaigns/${id}/edit`)}>
                <Edit className="h-4 w-4 mr-2" />
                {t('crm.campaigns.editCampaign')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('completed')}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {t('crm.campaigns.markComplete')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteDialogOpen(true)}
                className="text-red-600 dark:text-red-400"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('crm.campaigns.deleteCampaign')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Description */}
      {campaign.description && (
        <p className="text-gray-600 dark:text-gray-400">{campaign.description}</p>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('crm.campaigns.metrics.reach')}</p>
                <p className="text-2xl font-bold dark:text-white">{campaign.contacts_reached}</p>
                <p className="text-xs text-gray-400">{t('crm.campaigns.detail.of')} {campaign.total_contacts} {t('crm.campaigns.detail.contacts')}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <Progress value={getProgress()} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('crm.campaigns.engagementRate')}</p>
                <p className="text-2xl font-bold dark:text-white">{getEngagementRate()}%</p>
                <p className="text-xs text-gray-400">{campaign.contacts_engaged} {t('crm.campaigns.detail.engaged')}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('crm.campaigns.metrics.conversionRate')}</p>
                <p className="text-2xl font-bold dark:text-white">{getConversionRate()}%</p>
                <p className="text-xs text-gray-400">{campaign.contacts_converted} {t('crm.campaigns.metrics.converted')}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('crm.campaigns.metrics.revenue')}</p>
                <p className="text-2xl font-bold dark:text-white">{formatCurrency(campaign.total_revenue)}</p>
                <p className="text-xs text-gray-400">{t('crm.campaigns.detail.spent')}: {formatCurrency(campaign.actual_cost)}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details Tabs */}
      <Tabs defaultValue="overview" className="space-y-4" onValueChange={v => { if (v === 'sequences') { fetchTriggers(); fetchSequences(); } }}>
        <TabsList className="bg-slate-100 dark:bg-slate-800">
          <TabsTrigger value="overview">{t('crm.campaigns.detail.overview')}</TabsTrigger>
          <TabsTrigger value="analytics">{t('crm.campaigns.detail.analytics')}</TabsTrigger>
          <TabsTrigger value="contacts">{t('crm.campaigns.detail.contacts')}</TabsTrigger>
          <TabsTrigger value="sequences" className="flex items-center gap-1.5">
            <GitBranch className="h-3.5 w-3.5" /> Sequences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="text-lg dark:text-white">{t('crm.campaigns.create.campaignDetails')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{t('crm.campaigns.fields.type')}</span>
                  <span className="font-medium dark:text-white">
                    {t(`crm.campaigns.types.${campaign.campaign_type.toLowerCase()}`)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{t('crm.campaigns.create.goalType')}</span>
                  <span className="font-medium dark:text-white">
                    {campaign.goal_type ? t(`crm.campaigns.goals.${campaign.goal_type}`) : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{t('crm.campaigns.create.goalTarget')}</span>
                  <span className="font-medium dark:text-white">{campaign.goal_value || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{t('crm.campaigns.fields.budget')}</span>
                  <span className="font-medium dark:text-white">{formatCurrency(campaign.budget)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="text-lg dark:text-white">{t('crm.campaigns.create.scheduleAndBudget')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{t('crm.campaigns.fields.startDate')}</span>
                  <span className="font-medium dark:text-white">{formatDate(campaign.start_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{t('crm.campaigns.fields.endDate')}</span>
                  <span className="font-medium dark:text-white">{formatDate(campaign.end_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{t('crm.campaigns.detail.lastRun')}</span>
                  <span className="font-medium dark:text-white">{formatDate(campaign.last_run_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{t('crm.campaigns.detail.created')}</span>
                  <span className="font-medium dark:text-white">{formatDate(campaign.created_at)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Target Audience Card */}
          <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="text-lg dark:text-white flex items-center gap-2">
                <Target className="h-5 w-5" />
                {t('crm.campaigns.create.audience', 'Target Audience')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {segment ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                      <Layers className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium dark:text-white">{segment.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {segment.segment_type === 'dynamic'
                          ? t('crm.segments.dynamic', 'Dynamic Segment')
                          : t('crm.segments.static', 'Static Segment')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium dark:text-white">
                        {segment.contact_count + segment.lead_count} {t('crm.campaigns.detail.members', 'members')}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {segment.contact_count} {t('crm.contacts.title', 'contacts')}, {segment.lead_count} {t('crm.leads.title', 'leads')}
                      </p>
                    </div>
                  </div>
                  {segment.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{segment.description}</p>
                  )}
                </div>
              ) : campaign.target_criteria && Object.keys(campaign.target_criteria).length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    {t('crm.campaigns.detail.filterCriteria', 'Custom filter criteria applied')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {campaign.target_criteria.lifecycle_stages && (
                      <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20">
                        {t('crm.segments.criteria.lifecycleStages', 'Lifecycle')}: {campaign.target_criteria.lifecycle_stages.join(', ')}
                      </Badge>
                    )}
                    {campaign.target_criteria.lead_stages && (
                      <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20">
                        {t('crm.segments.criteria.leadStages', 'Lead Stage')}: {campaign.target_criteria.lead_stages.join(', ')}
                      </Badge>
                    )}
                    {campaign.target_criteria.tag_ids && (
                      <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20">
                        {t('crm.segments.criteria.tags', 'Tags')}: {campaign.target_criteria.tag_ids.length} {t('crm.common.selected', 'selected')}
                      </Badge>
                    )}
                    {(campaign.target_criteria.score_min || campaign.target_criteria.score_max) && (
                      <Badge variant="outline" className="bg-orange-50 dark:bg-orange-900/20">
                        {t('crm.segments.criteria.score', 'Score')}: {campaign.target_criteria.score_min || 0} - {campaign.target_criteria.score_max || 100}
                      </Badge>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t('crm.campaigns.detail.noAudience', 'No audience selected')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Message Template Card */}
          <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="text-lg dark:text-white flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t('crm.campaigns.create.messageTemplate', 'Message Template')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {campaignMessages.length > 0 ? (
                <div className="space-y-4">
                  {campaignMessages.map((message) => (
                    <div
                      key={message.id}
                      className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-900 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium dark:text-white">
                            {message.name || `Message ${message.sequence_order}`}
                          </h4>
                          {message.template_id && (
                            <Badge variant="secondary" className="text-xs">
                              <Sparkles className="h-3 w-3 mr-1" />
                              {t('crm.templates.usingTemplate', 'Template')}
                            </Badge>
                          )}
                        </div>
                        <Badge variant="outline">{message.message_type}</Badge>
                      </div>

                      {message.subject && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            {t('crm.templates.subject', 'Subject')}
                          </p>
                          <p className="text-sm dark:text-gray-300">{message.subject}</p>
                        </div>
                      )}

                      {message.body && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            {t('crm.templates.body', 'Body')}
                          </p>
                          <p className="text-sm dark:text-gray-300 line-clamp-3">{message.body}</p>
                        </div>
                      )}

                      {message.voice_script && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            {t('crm.templates.voiceScript', 'Voice Script')}
                          </p>
                          <p className="text-sm dark:text-gray-300 line-clamp-3">{message.voice_script}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t('crm.campaigns.detail.noTemplate', 'No message template configured')}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => navigate(`/dashboard/crm/campaigns/${id}/edit`)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {t('crm.campaigns.detail.addTemplate', 'Add Template')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-800">
            <CardContent className="p-12 text-center">
              <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">{t('crm.campaigns.detail.analyticsComingSoon')}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts">
          <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-800">
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">{t('crm.campaigns.detail.contactsComingSoon')}</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Sequences tab ── */}
        <TabsContent value="sequences" className="space-y-4">
          <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg dark:text-white flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-violet-500" />
                  Sequence Triggers
                </CardTitle>
                <CardDescription className="mt-1">
                  Automatically enroll contacts into sales sequences based on how they engage with this campaign.
                </CardDescription>
              </div>
              <Button
                size="sm"
                className="gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
                onClick={() => setTriggerDialogOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" /> Add Trigger
              </Button>
            </CardHeader>
            <CardContent>
              {triggers.length === 0 ? (
                <div className="text-center py-10">
                  <div className="h-12 w-12 rounded-full bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center mx-auto mb-3">
                    <GitBranch className="h-6 w-6 text-violet-500" />
                  </div>
                  <p className="font-medium text-sm text-foreground">No triggers configured</p>
                  <p className="text-xs text-muted-foreground mt-1 mb-4">
                    Add a trigger to auto-enroll contacts into a sequence based on campaign behavior
                  </p>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setTriggerDialogOpen(true)}>
                    <Plus className="h-3.5 w-3.5" /> Add first trigger
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {triggers.map(trigger => {
                    const condLabel = TRIGGER_CONDITIONS.find(c => c.value === trigger.trigger_condition)?.label ?? trigger.trigger_condition;
                    return (
                      <div key={trigger.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-muted/20">
                        {/* Condition icon */}
                        <div className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 ${trigger.is_active ? 'bg-violet-100 dark:bg-violet-900/30' : 'bg-muted'}`}>
                          <Zap className={`h-4 w-4 ${trigger.is_active ? 'text-violet-500' : 'text-muted-foreground'}`} />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-medium text-foreground">{condLabel}</span>
                            {!trigger.is_active && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Paused</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <GitBranch className="h-3 w-3" />
                              {trigger.sequence?.name ?? `Sequence #${trigger.sequence_id}`}
                            </span>
                            {trigger.delay_hours > 0 && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> after {trigger.delay_hours}h
                              </span>
                            )}
                            {trigger.enrolled_count > 0 && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" /> {trigger.enrolled_count} enrolled
                              </span>
                            )}
                            {trigger.last_fired_at && (
                              <span>Last fired {new Date(trigger.last_fired_at).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1.5"
                            disabled={firingTrigger === trigger.id}
                            onClick={() => handleFireTrigger(trigger.id)}
                            title="Apply now — enroll matching contacts"
                          >
                            {firingTrigger === trigger.id
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : <Play className="h-3 w-3 text-emerald-500" />
                            }
                            Apply now
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title={trigger.is_active ? 'Pause trigger' : 'Enable trigger'}
                            onClick={() => handleToggleTrigger(trigger)}
                          >
                            {trigger.is_active
                              ? <ToggleRight className="h-4 w-4 text-violet-500" />
                              : <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                            }
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteTrigger(trigger.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* How it works */}
          <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-800 bg-violet-50/30 dark:bg-violet-900/10">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-violet-700 dark:text-violet-400 mb-2">How triggers work</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>• <strong>Add a trigger</strong> — pick a condition and a sequence to enroll contacts into</p>
                <p>• <strong>Apply now</strong> — immediately checks campaign contacts and enrolls those matching the condition</p>
                <p>• <strong>Contacts already active</strong> in the sequence are skipped automatically</p>
                <p>• Triggers can be paused/re-enabled without losing configuration</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add trigger dialog */}
      <Dialog open={triggerDialogOpen} onOpenChange={setTriggerDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-violet-500" /> Add Sequence Trigger
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Condition <span className="text-destructive">*</span></Label>
              <Select value={triggerForm.trigger_condition} onValueChange={v => setTriggerForm(p => ({ ...p, trigger_condition: v }))}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRIGGER_CONDITIONS.map(c => (
                    <SelectItem key={c.value} value={c.value} className="text-sm">{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Enroll into sequence <span className="text-destructive">*</span></Label>
              <Select value={triggerForm.sequence_id} onValueChange={v => setTriggerForm(p => ({ ...p, sequence_id: v }))}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select a sequence…" />
                </SelectTrigger>
                <SelectContent>
                  {sequences.map(s => (
                    <SelectItem key={s.id} value={s.id.toString()} className="text-sm">{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Delay (hours)</Label>
              <input
                type="number"
                min={0}
                value={triggerForm.delay_hours}
                onChange={e => setTriggerForm(p => ({ ...p, delay_hours: parseInt(e.target.value) || 0 }))}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <p className="text-[11px] text-muted-foreground">
                0 = enroll immediately when condition is met
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTriggerDialogOpen(false)}>Cancel</Button>
            <Button
              disabled={!triggerForm.sequence_id || savingTrigger}
              onClick={handleAddTrigger}
              className="gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
            >
              {savingTrigger ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Add Trigger
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('crm.campaigns.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('crm.campaigns.deleteConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('crm.common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('crm.common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
