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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';

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
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

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

  const handleStatusChange = async (newStatus: string) => {
    try {
      setActionLoading(true);
      const headers = getAuthHeaders();
      await axios.patch(`/api/v1/campaigns/${id}`, { status: newStatus }, { headers });
      setCampaign(prev => prev ? { ...prev, status: newStatus } : null);
      toast({
        title: t('crm.common.success'),
        description: t('crm.campaigns.statusUpdated'),
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: t('crm.common.error'),
        description: t('crm.campaigns.updateError'),
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-slate-100 dark:bg-slate-800">
          <TabsTrigger value="overview">{t('crm.campaigns.detail.overview')}</TabsTrigger>
          <TabsTrigger value="analytics">{t('crm.campaigns.detail.analytics')}</TabsTrigger>
          <TabsTrigger value="contacts">{t('crm.campaigns.detail.contacts')}</TabsTrigger>
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
      </Tabs>

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
