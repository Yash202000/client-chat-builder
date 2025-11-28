import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Send,
  Plus,
  Search,
  MoreVertical,
  Play,
  Pause,
  Copy,
  Trash2,
  BarChart3,
  Users,
  Mail,
  MessageSquare,
  Phone,
  Target,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Zap,
  Eye,
  CalendarDays,
  List,
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';

interface Campaign {
  id: number;
  name: string;
  description?: string;
  campaign_type: string;
  status: string;
  total_contacts: number;
  contacts_reached: number;
  contacts_engaged: number;
  contacts_converted: number;
  total_revenue: number;
  actual_cost: number;
  created_at: string;
  start_date?: string;
  end_date?: string;
}

const CAMPAIGN_TYPE_ICONS: Record<string, any> = {
  email: Mail,
  sms: MessageSquare,
  whatsapp: MessageSquare,
  voice: Phone,
  multi_channel: Send,
};

const CAMPAIGN_TYPE_LABELS: Record<string, string> = {
  email: 'Email',
  sms: 'SMS',
  whatsapp: 'WhatsApp',
  voice: 'Voice',
  multi_channel: 'Multi-Channel',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  paused: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  archived: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function CampaignsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchCampaigns();
  }, [statusFilter, typeFilter]);

  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.type = typeFilter;
      const response = await axios.get('/api/v1/campaigns/', { params, headers });
      setCampaigns(response.data);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast({ title: 'Error', description: 'Failed to fetch campaigns', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleStartCampaign = async (campaignId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`/api/v1/campaigns/${campaignId}/start`, {}, { headers });
      toast({ title: 'Success', description: 'Campaign started successfully' });
      fetchCampaigns();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to start campaign', variant: 'destructive' });
    }
  };

  const handlePauseCampaign = async (campaignId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`/api/v1/campaigns/${campaignId}/pause`, {}, { headers });
      toast({ title: 'Success', description: 'Campaign paused successfully' });
      fetchCampaigns();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to pause campaign', variant: 'destructive' });
    }
  };

  const handleCloneCampaign = async (campaignId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`/api/v1/campaigns/${campaignId}/clone`, {}, { headers });
      toast({ title: 'Success', description: 'Campaign cloned successfully' });
      fetchCampaigns();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to clone campaign', variant: 'destructive' });
    }
  };

  const filteredCampaigns = campaigns.filter((campaign) =>
    campaign.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculateEngagementRate = (campaign: Campaign) => {
    if (campaign.contacts_reached === 0) return 0;
    return ((campaign.contacts_engaged / campaign.contacts_reached) * 100).toFixed(1);
  };

  const calculateConversionRate = (campaign: Campaign) => {
    if (campaign.contacts_reached === 0) return 0;
    return ((campaign.contacts_converted / campaign.contacts_reached) * 100).toFixed(1);
  };

  const calculateROI = (campaign: Campaign) => {
    if (campaign.actual_cost === 0) return 0;
    return (((campaign.total_revenue - campaign.actual_cost) / campaign.actual_cost) * 100).toFixed(1);
  };

  const totalReached = campaigns.reduce((sum, c) => sum + c.contacts_reached, 0);
  const totalRevenue = campaigns.reduce((sum, c) => sum + c.total_revenue, 0);
  const avgEngagement = campaigns.length > 0
    ? (campaigns.reduce((sum, c) => sum + parseFloat(String(calculateEngagementRate(c))), 0) / campaigns.length).toFixed(1)
    : 0;

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay, year, month };
  };

  const getCampaignsForDate = (date: Date) => {
    return filteredCampaigns.filter((campaign) => {
      if (!campaign.start_date) return false;
      const startDate = new Date(campaign.start_date);
      const endDate = campaign.end_date ? new Date(campaign.end_date) : startDate;
      return date >= new Date(startDate.setHours(0, 0, 0, 0)) &&
             date <= new Date(endDate.setHours(23, 59, 59, 999));
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const { daysInMonth, startingDay, year, month } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const metrics = [
    {
      title: t('crm.campaigns.stats.total'),
      value: campaigns.length,
      subtext: `${campaigns.filter((c) => c.status === 'active').length} ${t('crm.campaigns.status.active').toLowerCase()}`,
      icon: Send,
      gradient: 'from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50',
      iconColor: 'text-blue-600 dark:text-blue-400',
      trend: '+4',
      trendUp: true,
    },
    {
      title: t('crm.campaigns.metrics.reach'),
      value: totalReached.toLocaleString(),
      subtext: t('crm.campaigns.contactsReached'),
      icon: Users,
      gradient: 'from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-800/50',
      iconColor: 'text-purple-600 dark:text-purple-400',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: t('crm.campaigns.metrics.engagement'),
      value: `${avgEngagement}%`,
      subtext: t('crm.campaigns.engagementRate'),
      icon: Zap,
      gradient: 'from-yellow-100 to-yellow-200 dark:from-yellow-900/50 dark:to-yellow-800/50',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      trend: '+3.2%',
      trendUp: true,
    },
    {
      title: t('crm.campaigns.metrics.revenue'),
      value: `$${totalRevenue.toLocaleString()}`,
      subtext: t('crm.campaigns.fromAllCampaigns'),
      icon: DollarSign,
      gradient: 'from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/50',
      iconColor: 'text-green-600 dark:text-green-400',
      trend: '+18%',
      trendUp: true,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
            {t('crm.campaigns.title')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            {t('crm.campaigns.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('list')}
              className={cn(
                "h-8 px-3",
                viewMode === 'list'
                  ? "bg-white dark:bg-slate-700 shadow-sm"
                  : "hover:bg-transparent"
              )}
            >
              <List className="h-4 w-4 mr-1.5" />
              {t('crm.campaigns.views.list')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('calendar')}
              className={cn(
                "h-8 px-3",
                viewMode === 'calendar'
                  ? "bg-white dark:bg-slate-700 shadow-sm"
                  : "hover:bg-transparent"
              )}
            >
              <CalendarDays className="h-4 w-4 mr-1.5" />
              {t('crm.campaigns.views.calendar')}
            </Button>
          </div>
          <Button
            onClick={() => navigate('/dashboard/crm/campaigns/new')}
            className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('crm.campaigns.addCampaign')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {metrics.map((metric) => {
          const IconComponent = metric.icon;
          return (
            <Card key={metric.title} className="card-shadow-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${metric.gradient} flex items-center justify-center shadow-sm`}>
                    <IconComponent className={`h-6 w-6 ${metric.iconColor}`} />
                  </div>
                  <div className="flex items-center gap-1">
                    {metric.trendUp ? (
                      <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                    )}
                    <span className={`text-xs font-medium ${metric.trendUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {metric.trend}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    {metric.title}
                  </p>
                  <p className="text-2xl font-bold dark:text-white mb-1">{metric.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{metric.subtext}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t('crm.campaigns.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 dark:bg-slate-900 dark:border-slate-600"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] dark:bg-slate-900 dark:border-slate-600">
                <SelectValue placeholder={t('crm.campaigns.filters.byStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('crm.campaigns.filters.all')}</SelectItem>
                <SelectItem value="draft">{t('crm.campaigns.status.draft')}</SelectItem>
                <SelectItem value="active">{t('crm.campaigns.status.active')}</SelectItem>
                <SelectItem value="paused">{t('crm.campaigns.status.paused')}</SelectItem>
                <SelectItem value="completed">{t('crm.campaigns.status.completed')}</SelectItem>
                <SelectItem value="archived">{t('crm.campaigns.status.cancelled')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px] dark:bg-slate-900 dark:border-slate-600">
                <SelectValue placeholder={t('crm.campaigns.filters.byType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('crm.campaigns.filters.all')}</SelectItem>
                <SelectItem value="email">{t('crm.campaigns.types.email')}</SelectItem>
                <SelectItem value="sms">{t('crm.campaigns.types.sms')}</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="voice">{t('crm.leads.sources.phone')}</SelectItem>
                <SelectItem value="multi_channel">{t('crm.campaigns.multiChannel')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Table / Calendar */}
      {viewMode === 'list' ? (
      <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700">
              <TableHead className="font-semibold">{t('crm.campaigns.fields.name')}</TableHead>
              <TableHead className="font-semibold">{t('crm.campaigns.fields.type')}</TableHead>
              <TableHead className="font-semibold">{t('crm.campaigns.fields.status')}</TableHead>
              <TableHead className="font-semibold">{t('crm.campaigns.progress')}</TableHead>
              <TableHead className="font-semibold">{t('crm.campaigns.metrics.engagement')}</TableHead>
              <TableHead className="font-semibold">{t('crm.campaigns.metrics.conversionRate')}</TableHead>
              <TableHead className="font-semibold">{t('crm.campaigns.metrics.revenue')}</TableHead>
              <TableHead className="font-semibold">{t('crm.campaigns.metrics.roi')}</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCampaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12">
                  <div className="flex flex-col items-center">
                    <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
                      <Send className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">{t('crm.campaigns.noCampaigns')}</p>
                    <Button
                      variant="link"
                      className="mt-2 text-orange-600"
                      onClick={() => navigate('/dashboard/crm/campaigns/new')}
                    >
                      {t('crm.campaigns.noCampaignsMessage')}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredCampaigns.map((campaign) => {
                const Icon = CAMPAIGN_TYPE_ICONS[campaign.campaign_type] || Send;
                const roi = parseFloat(String(calculateROI(campaign)));
                return (
                  <TableRow
                    key={campaign.id}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                    onClick={() => navigate(`/dashboard/crm/campaigns/${campaign.id}`)}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium dark:text-white">{campaign.name}</div>
                        {campaign.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                            {campaign.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                          <Icon className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                        </div>
                        <span className="text-sm dark:text-gray-300">{CAMPAIGN_TYPE_LABELS[campaign.campaign_type]}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("border-0", STATUS_COLORS[campaign.status])}>
                        {campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-xs font-medium dark:text-white">
                          {campaign.contacts_reached}/{campaign.total_contacts}
                        </div>
                        <Progress
                          value={campaign.total_contacts > 0 ? (campaign.contacts_reached / campaign.total_contacts) * 100 : 0}
                          className="h-1.5 bg-slate-200 dark:bg-slate-700"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
                        <span className="font-medium dark:text-white">{calculateEngagementRate(campaign)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Target className="h-3.5 w-3.5 text-purple-500" />
                        <span className="font-medium dark:text-white">{calculateConversionRate(campaign)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        ${campaign.total_revenue.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "border-0",
                        roi > 0
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : roi < 0
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      )}>
                        {roi > 0 ? '+' : ''}{roi}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="dark:bg-slate-800 dark:border-slate-700">
                          <DropdownMenuLabel>{t('crm.common.actions')}</DropdownMenuLabel>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/crm/campaigns/${campaign.id}`); }}>
                            <Eye className="h-4 w-4 mr-2" />
                            {t('crm.common.view')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/crm/campaigns/${campaign.id}`); }}>
                            <BarChart3 className="h-4 w-4 mr-2" />
                            {t('crm.campaigns.actions.viewReport')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {campaign.status === 'draft' && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStartCampaign(campaign.id); }} className="text-green-600 dark:text-green-400">
                              <Play className="h-4 w-4 mr-2" />
                              {t('crm.campaigns.actions.launch')}
                            </DropdownMenuItem>
                          )}
                          {campaign.status === 'active' && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePauseCampaign(campaign.id); }} className="text-yellow-600 dark:text-yellow-400">
                              <Pause className="h-4 w-4 mr-2" />
                              {t('crm.campaigns.actions.pause')}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCloneCampaign(campaign.id); }}>
                            <Copy className="h-4 w-4 mr-2" />
                            {t('crm.campaigns.actions.duplicate')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600 dark:text-red-400" onClick={(e) => e.stopPropagation()}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t('crm.common.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
      ) : (
      /* Calendar View */
      <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-800">
        <CardContent className="p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold dark:text-white">{monthName}</h3>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(new Date())}
              >
                {t('crm.campaigns.calendar.today')}
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigateMonth('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Week Day Headers */}
            {weekDays.map((day) => (
              <div
                key={day}
                className="h-10 flex items-center justify-center text-sm font-medium text-gray-500 dark:text-gray-400"
              >
                {day}
              </div>
            ))}

            {/* Empty cells for days before month starts */}
            {Array.from({ length: startingDay }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="min-h-[120px] bg-slate-50 dark:bg-slate-900/30 rounded-lg p-2"
              />
            ))}

            {/* Calendar Days */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const date = new Date(year, month, day);
              const isToday = new Date().toDateString() === date.toDateString();
              const dayCampaigns = getCampaignsForDate(date);

              return (
                <div
                  key={day}
                  className={cn(
                    "min-h-[120px] rounded-lg p-2 border transition-colors",
                    isToday
                      ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                      : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  )}
                >
                  <div className={cn(
                    "text-sm font-medium mb-2",
                    isToday ? "text-orange-600 dark:text-orange-400" : "dark:text-white"
                  )}>
                    {day}
                  </div>
                  <div className="space-y-1">
                    <TooltipProvider>
                      {dayCampaigns.slice(0, 3).map((campaign) => {
                        const Icon = CAMPAIGN_TYPE_ICONS[campaign.campaign_type] || Send;
                        return (
                          <Tooltip key={campaign.id}>
                            <TooltipTrigger asChild>
                              <div
                                onClick={() => navigate(`/dashboard/crm/campaigns/${campaign.id}`)}
                                className={cn(
                                  "text-xs px-2 py-1 rounded cursor-pointer truncate flex items-center gap-1",
                                  campaign.status === 'active'
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                    : campaign.status === 'scheduled'
                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                    : campaign.status === 'draft'
                                    ? "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                                    : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                )}
                              >
                                <Icon className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{campaign.name}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs">
                              <div className="space-y-1">
                                <p className="font-semibold">{campaign.name}</p>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Clock className="h-3 w-3" />
                                  {campaign.start_date && formatTime(campaign.start_date)}
                                  {campaign.end_date && ` - ${formatTime(campaign.end_date)}`}
                                </div>
                                <Badge className={cn("text-xs", STATUS_COLORS[campaign.status])}>
                                  {t(`crm.campaigns.status.${campaign.status}`)}
                                </Badge>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </TooltipProvider>
                    {dayCampaigns.length > 3 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
                        +{dayCampaigns.length - 3} {t('crm.campaigns.calendar.more')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <span className="text-sm text-gray-500 dark:text-gray-400">{t('crm.campaigns.calendar.legend')}:</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">{t('crm.campaigns.status.active')}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">{t('crm.campaigns.status.scheduled')}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-slate-400" />
              <span className="text-xs text-gray-600 dark:text-gray-400">{t('crm.campaigns.status.draft')}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-yellow-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">{t('crm.campaigns.status.paused')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  );
}
