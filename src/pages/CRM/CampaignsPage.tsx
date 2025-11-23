import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  draft: 'bg-gray-100 text-gray-800',
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-blue-100 text-blue-800',
  archived: 'bg-red-100 text-red-800',
};

export default function CampaignsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    fetchCampaigns();
  }, [statusFilter, typeFilter]);

  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const params: any = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (typeFilter !== 'all') {
        params.type = typeFilter;
      }
      const response = await axios.get('/api/v1/campaigns/', { params, headers });
      setCampaigns(response.data);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch campaigns',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartCampaign = async (campaignId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      await axios.post(`/api/v1/campaigns/${campaignId}/start`, {}, { headers });
      toast({
        title: 'Success',
        description: 'Campaign started successfully',
      });
      fetchCampaigns();
    } catch (error) {
      console.error('Error starting campaign:', error);
      toast({
        title: 'Error',
        description: 'Failed to start campaign',
        variant: 'destructive',
      });
    }
  };

  const handlePauseCampaign = async (campaignId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      await axios.post(`/api/v1/campaigns/${campaignId}/pause`, {}, { headers });
      toast({
        title: 'Success',
        description: 'Campaign paused successfully',
      });
      fetchCampaigns();
    } catch (error) {
      console.error('Error pausing campaign:', error);
      toast({
        title: 'Error',
        description: 'Failed to pause campaign',
        variant: 'destructive',
      });
    }
  };

  const handleCloneCampaign = async (campaignId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const response = await axios.post(`/api/v1/campaigns/${campaignId}/clone`, {}, { headers });
      toast({
        title: 'Success',
        description: 'Campaign cloned successfully',
      });
      fetchCampaigns();
    } catch (error) {
      console.error('Error cloning campaign:', error);
      toast({
        title: 'Error',
        description: 'Failed to clone campaign',
        variant: 'destructive',
      });
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Send className="h-8 w-8" />
            Campaigns
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage multi-channel marketing campaigns
          </p>
        </div>
        <Button onClick={() => navigate('/dashboard/crm/campaigns/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
            <p className="text-xs text-muted-foreground">
              {campaigns.filter((c) => c.status === 'active').length} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reached</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.reduce((sum, c) => sum + c.contacts_reached, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Contacts reached</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.length > 0
                ? (
                    campaigns.reduce((sum, c) => sum + parseFloat(calculateEngagementRate(c)), 0) /
                    campaigns.length
                  ).toFixed(1)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">Engagement rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${campaigns.reduce((sum, c) => sum + c.total_revenue, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">From all campaigns</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="voice">Voice</SelectItem>
            <SelectItem value="multi_channel">Multi-Channel</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Campaigns Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Contacts</TableHead>
              <TableHead>Engagement</TableHead>
              <TableHead>Conversion</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead>ROI</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCampaigns.map((campaign) => {
              const Icon = CAMPAIGN_TYPE_ICONS[campaign.campaign_type];
              return (
                <TableRow
                  key={campaign.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/dashboard/crm/campaigns/${campaign.id}`)}
                >
                  <TableCell>
                    <div>
                      <div className="font-medium">{campaign.name}</div>
                      {campaign.description && (
                        <div className="text-sm text-muted-foreground">
                          {campaign.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {Icon && <Icon className="h-4 w-4" />}
                      {CAMPAIGN_TYPE_LABELS[campaign.campaign_type]}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_COLORS[campaign.status]}>
                      {campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {campaign.contacts_reached}/{campaign.total_contacts}
                      </div>
                      <Progress
                        value={
                          campaign.total_contacts > 0
                            ? (campaign.contacts_reached / campaign.total_contacts) * 100
                            : 0
                        }
                        className="h-1 mt-1"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-muted-foreground" />
                      {calculateEngagementRate(campaign)}%
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3 text-muted-foreground" />
                      {calculateConversionRate(campaign)}%
                    </div>
                  </TableCell>
                  <TableCell>${campaign.total_revenue.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge
                      variant={parseFloat(calculateROI(campaign)) > 0 ? 'default' : 'secondary'}
                    >
                      {calculateROI(campaign)}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/dashboard/crm/campaigns/${campaign.id}`);
                          }}
                        >
                          <BarChart3 className="h-4 w-4 mr-2" />
                          View Analytics
                        </DropdownMenuItem>
                        {campaign.status === 'draft' && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartCampaign(campaign.id);
                            }}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Start Campaign
                          </DropdownMenuItem>
                        )}
                        {campaign.status === 'active' && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePauseCampaign(campaign.id);
                            }}
                          >
                            <Pause className="h-4 w-4 mr-2" />
                            Pause Campaign
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCloneCampaign(campaign.id);
                          }}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Clone Campaign
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
