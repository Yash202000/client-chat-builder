import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  DollarSign,
  Star,
  Calendar,
  Edit,
  Trash2,
  Target,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  History,
  MoreVertical,
  Zap,
  Award,
  Timer,
  CalendarDays,
  Globe,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { TagSelector } from '@/components/TagSelector';
import { EntityNotes } from '@/components/EntityNotes';
import { cn } from '@/lib/utils';
import { CustomFieldInput, CustomFieldDefinition, formatCustomFieldValue } from '@/components/CustomFieldInput';

interface WorkflowStatus {
  id: number;
  name: string;
  color: string;
  category?: string;
}

interface WorkflowTransition {
  id: number;
  name: string;
  from_status_id?: number;
  to_status_id?: number;
  screen_fields?: any[];
}

interface Lead {
  id: number;
  contact_id: number;
  contact?: {
    id: number;
    name: string;
    email: string;
    phone_number?: string;
    company_id: number;
    lead_source?: string;
    lifecycle_stage?: string;
    do_not_contact: boolean;
    opt_in_status: string;
    created_at?: string;
    updated_at?: string;
  };
  stage?: string;
  previous_stage?: string;
  score: number;
  deal_value?: number;
  qualification_status: string;
  qualification_data?: Record<string, any>;
  source?: string;
  assignee_id?: number;
  campaign_id?: number;
  expected_close_date?: string;
  actual_close_date?: string;
  won_reason?: string;
  lost_reason?: string;
  notes?: string;
  tags?: Array<{ id: number; name: string; color: string }>;
  tag_ids?: number[];
  custom_fields?: Record<string, any>;
  stage_changed_at?: string;
  last_scored_at?: string;
  created_at: string;
  updated_at: string;
  workflow_id?: number;
  status_id?: number;
  status?: WorkflowStatus;
  available_transitions?: WorkflowTransition[];
}

interface LeadScore {
  id: number;
  lead_id: number;
  score_type: string;
  score_value: number;
  reason?: string;
  created_at: string;
}

const getScoreColor = (score: number) => {
  if (score >= 70) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 40) return 'text-violet-600 dark:text-violet-400';
  return 'text-red-600 dark:text-red-400';
};

const getScoreGradient = (score: number) => {
  if (score >= 70) return 'from-emerald-500 to-emerald-600';
  if (score >= 40) return 'from-violet-500 to-violet-600';
  return 'from-red-500 to-red-600';
};

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [lead, setLead] = useState<Lead | null>(null);
  const [scores, setScores] = useState<LeadScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transitionDialogOpen, setTransitionDialogOpen] = useState(false);
  const [pendingTransition, setPendingTransition] = useState<WorkflowTransition | null>(null);
  const [transitionComment, setTransitionComment] = useState('');
  const [transitionFieldValues, setTransitionFieldValues] = useState<Record<string, any>>({});
  const [transitionSaving, setTransitionSaving] = useState(false);
  const [customFieldDefs, setCustomFieldDefs] = useState<CustomFieldDefinition[]>([]);
  const [users, setUsers] = useState<{ id: number; full_name?: string; email: string }[]>([]);
  const [editData, setEditData] = useState({
    deal_value: '',
    source: '',
    notes: '',
    expected_close_date: '',
  });
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  useEffect(() => {
    if (id) {
      fetchLead();
      fetchScores();
    }
  }, [id]);

  const fetchLead = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };
      const [response, cfRes, usersRes] = await Promise.all([
        axios.get(`/api/v1/leads/${id}`, { headers }),
        axios.get('/api/v1/custom-fields/', { headers, params: { entity_type: 'lead' } }).catch(() => ({ data: [] })),
        axios.get('/api/v1/users/', { headers }).catch(() => ({ data: [] })),
      ]);
      setLead(response.data);
      setCustomFieldDefs(cfRes.data || []);
      setUsers(usersRes.data || []);
      setEditData({
        deal_value: response.data.deal_value?.toString() || '',
        source: response.data.source || '',
        notes: response.data.notes || '',
        expected_close_date: response.data.expected_close_date?.split('T')[0] || '',
      });
      const tagIds = response.data.tag_ids || response.data.tags?.map((t: any) => t.id) || [];
      setSelectedTagIds(tagIds);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch lead details', variant: 'destructive' });
      navigate('/dashboard/crm/leads');
    } finally {
      setLoading(false);
    }
  };

  const fetchScores = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`/api/v1/leads/${id}/scores`, { headers });
      setScores(response.data.scores || []);
    } catch {}
  };

  const handleTransition = async () => {
    if (!pendingTransition) return;
    setTransitionSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };
      const fv = Object.keys(transitionFieldValues).length > 0 ? transitionFieldValues : undefined;
      await axios.post(
        `/api/v1/leads/${id}/transition`,
        { transition_id: pendingTransition.id, comment: transitionComment || undefined, field_values: fv },
        { headers }
      );
      toast({ title: 'Status updated', description: `Moved to "${pendingTransition.name}"` });
      setTransitionDialogOpen(false);
      setTransitionComment('');
      setTransitionFieldValues({});
      setPendingTransition(null);
      fetchLead();
    } catch {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    } finally {
      setTransitionSaving(false);
    }
  };

  const handleUpdateLead = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(
        `/api/v1/leads/${id}`,
        {
          deal_value: editData.deal_value ? parseFloat(editData.deal_value) : null,
          source: editData.source || null,
          notes: editData.notes || null,
          expected_close_date: editData.expected_close_date || null,
        },
        { headers }
      );
      toast({ title: 'Lead updated' });
      setEditDialogOpen(false);
      fetchLead();
    } catch {
      toast({ title: 'Error', description: 'Failed to update lead', variant: 'destructive' });
    }
  };

  const handleQualifyLead = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`/api/v1/leads/${id}/qualify`, {}, { headers });
      toast({ title: 'Lead qualified' });
      fetchLead();
      fetchScores();
    } catch {
      toast({ title: 'Error', description: 'Failed to qualify lead', variant: 'destructive' });
    }
  };

  const handleDeleteLead = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`/api/v1/leads/${id}`, { headers });
      toast({ title: 'Lead deleted' });
      navigate('/dashboard/crm/leads');
    } catch {
      toast({ title: 'Error', description: 'Failed to delete lead', variant: 'destructive' });
    }
  };

  const handleTagsChange = async (tagIds: number[]) => {
    setSelectedTagIds(tagIds);
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };
      const currentTagIds = selectedTagIds;
      const tagsToAdd = tagIds.filter(i => !currentTagIds.includes(i));
      const tagsToRemove = currentTagIds.filter(i => !tagIds.includes(i));
      for (const tagId of tagsToAdd) {
        await axios.post(`/api/v1/tags/${tagId}/assign`, { entity_type: 'lead', entity_ids: [parseInt(id!)] }, { headers });
      }
      for (const tagId of tagsToRemove) {
        await axios.post(`/api/v1/tags/${tagId}/unassign`, { entity_type: 'lead', entity_ids: [parseInt(id!)] }, { headers });
      }
      toast({ title: 'Tags updated' });
    } catch {
      toast({ title: 'Error', description: 'Failed to update tags', variant: 'destructive' });
      fetchLead();
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const getDaysInStatus = () => {
    if (!lead?.stage_changed_at) return 0;
    return Math.floor((new Date().getTime() - new Date(lead.stage_changed_at).getTime()) / (1000 * 60 * 60 * 24));
  };

  const getTotalAge = () => {
    if (!lead?.created_at) return 0;
    return Math.floor((new Date().getTime() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground">Loading lead details...</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] gap-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <User className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold">Lead not found</h2>
        <Button onClick={() => navigate('/dashboard/crm/leads')}>
          <ArrowLeft className="h-4 w-4 mr-2" />Back to Leads
        </Button>
      </div>
    );
  }

  const statusColor = lead.status?.color || '#6366f1';

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border shadow-sm">
        <div className="relative p-6">
          {/* Back & Actions */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/crm/leads')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Leads
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
                <Edit className="h-4 w-4 mr-2" />Edit
              </Button>
              <Button variant="outline" size="sm" onClick={handleQualifyLead}>
                <Target className="h-4 w-4 mr-2" />Auto-Qualify
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => setDeleteDialogOpen(true)}>
                    <Trash2 className="h-4 w-4 mr-2" />Delete Lead
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Lead Info */}
          <div className="flex items-start gap-5">
            <Avatar className="h-16 w-16 border-2 border-white dark:border-slate-700 shadow-md">
              <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                {getInitials(lead.contact?.name || 'Unknown')}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold truncate">
                  {lead.contact?.name || 'Unknown Contact'}
                </h1>
                {lead.status ? (
                  <Badge
                    className="font-medium border"
                    style={{ backgroundColor: statusColor + '20', color: statusColor, borderColor: statusColor + '50' }}
                  >
                    {lead.status.name}
                  </Badge>
                ) : lead.stage ? (
                  <Badge variant="secondary" className="font-medium capitalize">{lead.stage}</Badge>
                ) : null}
                {lead.qualification_status === 'qualified' && (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">
                    <ShieldCheck className="h-3 w-3 mr-1" />Qualified
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                {lead.contact?.email && (
                  <span className="flex items-center gap-1.5"><Mail className="h-4 w-4" />{lead.contact.email}</span>
                )}
                {lead.contact?.phone_number && (
                  <span className="flex items-center gap-1.5"><Phone className="h-4 w-4" />{lead.contact.phone_number}</span>
                )}
                {lead.source && (
                  <span className="flex items-center gap-1.5"><Globe className="h-4 w-4" />{lead.source}</span>
                )}
              </div>

              {/* Quick Stats */}
              <div className="flex items-center gap-6 mt-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className={cn("flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br", getScoreGradient(lead.score))}>
                    <Star className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Score</p>
                    <p className={cn("font-bold", getScoreColor(lead.score))}>{lead.score}/100</p>
                  </div>
                </div>

                {lead.deal_value && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
                      <DollarSign className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Deal Value</p>
                      <p className="font-bold text-emerald-600 dark:text-emerald-400">${lead.deal_value.toLocaleString()}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                    <Timer className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Days in Status</p>
                    <p className="font-bold">{getDaysInStatus()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600">
                    <CalendarDays className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Age</p>
                    <p className="font-bold">{getTotalAge()} days</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Transitions */}
        {lead.available_transitions && lead.available_transitions.length > 0 && (
          <div className="border-t bg-slate-50/50 dark:bg-slate-800/50 px-6 py-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Move to:</span>
              {lead.available_transitions.map(t => (
                <Button
                  key={t.id}
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1.5"
                  onClick={() => { setPendingTransition(t); setTransitionDialogOpen(true); }}
                >
                  <ArrowRight className="h-3 w-3" />
                  {t.name}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
              <TabsTrigger value="overview" className="gap-2">
                <User className="h-4 w-4" />Overview
              </TabsTrigger>
              <TabsTrigger value="scoring" className="gap-2">
                <Award className="h-4 w-4" />Scoring
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-2">
                <History className="h-4 w-4" />Activity
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/50">
                      <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    Lead Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-1 p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        <span className="text-xs font-medium">Deal Value</span>
                      </div>
                      <p className="font-semibold">
                        {lead.deal_value ? `$${lead.deal_value.toLocaleString()}` : 'Not set'}
                      </p>
                    </div>

                    <div className="space-y-1 p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Globe className="h-4 w-4" />
                        <span className="text-xs font-medium">Source</span>
                      </div>
                      <p className="font-semibold capitalize">{lead.source || 'Unknown'}</p>
                    </div>

                    <div className="space-y-1 p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Star className="h-4 w-4" />
                        <span className="text-xs font-medium">Score</span>
                      </div>
                      <p className={cn("font-semibold", getScoreColor(lead.score))}>{lead.score}/100</p>
                    </div>

                    <div className="space-y-1 p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <ShieldCheck className="h-4 w-4" />
                        <span className="text-xs font-medium">Qualification</span>
                      </div>
                      <Badge variant={lead.qualification_status === 'qualified' ? 'default' : 'secondary'} className="capitalize">
                        {lead.qualification_status}
                      </Badge>
                    </div>

                    <div className="space-y-1 p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span className="text-xs font-medium">Expected Close</span>
                      </div>
                      <p className="font-semibold">{formatDate(lead.expected_close_date)}</p>
                    </div>

                    <div className="space-y-1 p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs font-medium">Status Changed</span>
                      </div>
                      <p className="font-semibold text-sm">{formatDate(lead.stage_changed_at)}</p>
                    </div>
                  </div>

                  {lead.notes && (
                    <div className="mt-4 p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <MessageSquare className="h-4 w-4" />
                        <span className="text-xs font-medium">Notes</span>
                      </div>
                      <p className="text-sm">{lead.notes}</p>
                    </div>
                  )}

                  {lead.won_reason && (
                    <div className="mt-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                      <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-xs font-medium">Won Reason</span>
                      </div>
                      <p className="text-sm">{lead.won_reason}</p>
                    </div>
                  )}

                  {lead.lost_reason && (
                    <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                      <div className="flex items-center gap-2 mb-2 text-red-600 dark:text-red-400">
                        <XCircle className="h-4 w-4" />
                        <span className="text-xs font-medium">Lost Reason</span>
                      </div>
                      <p className="text-sm">{lead.lost_reason}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-900/50">
                      <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-medium">{lead.contact?.email || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="font-medium">{lead.contact?.phone_number || '-'}</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Lead Source</p>
                        <p className="font-medium capitalize">{lead.contact?.lead_source || '-'}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Lifecycle Stage</p>
                        <p className="font-medium capitalize">{lead.contact?.lifecycle_stage || '-'}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Opt-in Status</p>
                        <p className="font-medium capitalize">{lead.contact?.opt_in_status || '-'}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Do Not Contact</p>
                        <p className={cn("font-medium", lead.contact?.do_not_contact ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400")}>
                          {lead.contact?.do_not_contact ? 'Yes' : 'No'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="scoring" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-violet-100 dark:bg-violet-900/50">
                        <Award className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                      </div>
                      Score Breakdown
                    </CardTitle>
                    <div className="text-right">
                      <p className={cn("text-2xl font-bold", getScoreColor(lead.score))}>{lead.score}/100</p>
                      {lead.last_scored_at && (
                        <p className="text-xs text-muted-foreground">Last scored: {formatDate(lead.last_scored_at)}</p>
                      )}
                    </div>
                  </div>
                  <Progress value={lead.score} className="mt-3" />
                </CardHeader>
                <CardContent>
                  {scores.length > 0 ? (
                    <div className="space-y-3">
                      {scores.map((score) => (
                        <div key={score.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <Zap className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium capitalize">{score.score_type.replace(/_/g, ' ')}</p>
                              {score.reason && <p className="text-sm text-muted-foreground">{score.reason}</p>}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold">{score.score_value}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(score.created_at)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                        <Award className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">No scoring history available.</p>
                      <Button variant="outline" size="sm" className="mt-3" onClick={handleQualifyLead}>
                        <Target className="h-4 w-4 mr-2" />Run Auto-Qualify
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4 mt-4">
              <EntityNotes leadId={lead.id} />

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-indigo-100 dark:bg-indigo-900/50">
                      <History className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                          <History className="h-5 w-5 text-primary" />
                        </div>
                        <div className="w-0.5 flex-1 bg-border mt-2" />
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-medium">Lead Created</p>
                        <p className="text-sm text-muted-foreground">{formatDateTime(lead.created_at)}</p>
                      </div>
                    </div>

                    {lead.stage_changed_at && lead.status && (
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center border-2"
                            style={{ backgroundColor: statusColor + '20', borderColor: statusColor + '50' }}
                          >
                            <TrendingUp className="h-5 w-5" style={{ color: statusColor }} />
                          </div>
                          <div className="w-0.5 flex-1 bg-border mt-2" />
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="font-medium">
                            Status: <span style={{ color: statusColor }}>{lead.status.name}</span>
                          </p>
                          <p className="text-sm text-muted-foreground">{formatDateTime(lead.stage_changed_at)}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border-2 border-muted-foreground/20">
                          <Clock className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Last Updated</p>
                        <p className="text-sm text-muted-foreground">{formatDateTime(lead.updated_at)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className={cn("h-2 bg-gradient-to-r", getScoreGradient(lead.score))} />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Star className="h-4 w-4" />Lead Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-2">
                <p className={cn("text-4xl font-bold", getScoreColor(lead.score))}>{lead.score}</p>
                <p className="text-sm text-muted-foreground">out of 100</p>
              </div>
              <Progress value={lead.score} className="mt-2" />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>Cold</span><span>Warm</span><span>Hot</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4" />Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Timer className="h-4 w-4" />Days in Status
                </span>
                <span className="font-bold">{getDaysInStatus()}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />Total Age
                </span>
                <span className="font-bold">{getTotalAge()} days</span>
              </div>
              {lead.deal_value && (
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />Deal Value
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    ${lead.deal_value.toLocaleString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <TagSelector entityType="lead" selectedTagIds={selectedTagIds} onTagsChange={handleTagsChange} />
            </CardContent>
          </Card>

          {customFieldDefs.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Custom Fields</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {customFieldDefs.map(def => (
                  <div key={def.id} className="flex justify-between text-sm p-2 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground">{def.label}</span>
                    <span className="font-medium">{formatCustomFieldValue(lead.custom_fields?.[def.name], def)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />Edit Lead
            </DialogTitle>
            <DialogDescription>Update lead information and details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deal_value" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />Deal Value
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="deal_value"
                  type="number"
                  className="pl-7"
                  placeholder="0.00"
                  value={editData.deal_value}
                  onChange={(e) => setEditData({ ...editData, deal_value: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="source" className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />Source
              </Label>
              <Select value={editData.source} onValueChange={(value) => setEditData({ ...editData, source: value })}>
                <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                <SelectContent>
                  {['website', 'referral', 'social_media', 'email_campaign', 'cold_call', 'event', 'partner', 'other'].map(s => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected_close_date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />Expected Close Date
              </Label>
              <Input
                id="expected_close_date"
                type="date"
                value={editData.expected_close_date}
                onChange={(e) => setEditData({ ...editData, expected_close_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />Notes
              </Label>
              <Textarea
                id="notes"
                placeholder="Add notes about this lead..."
                value={editData.notes}
                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateLead}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transition Dialog */}
      <Dialog open={transitionDialogOpen} onOpenChange={open => {
        setTransitionDialogOpen(open);
        if (!open) { setTransitionComment(''); setTransitionFieldValues({}); setPendingTransition(null); }
      }}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5" />
              Move to: {pendingTransition?.name}
            </DialogTitle>
            <DialogDescription>Confirm moving this lead to the next status.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Custom screen_fields */}
            {(pendingTransition?.screen_fields || [])
              .filter((sf: any) => sf.field !== 'comment')
              .map((sf: any) => {
                const cfDef = customFieldDefs.find(d => d.name === sf.field);
                return (
                  <div key={sf.field} className="space-y-1.5">
                    <Label className="text-sm font-medium">
                      {sf.label}
                      {sf.required && <span className="text-destructive ml-0.5">*</span>}
                    </Label>
                    {cfDef ? (
                      <CustomFieldInput
                        definition={cfDef}
                        value={transitionFieldValues[sf.field] ?? null}
                        onChange={v => setTransitionFieldValues(p => ({ ...p, [sf.field]: v }))}
                        users={users}
                      />
                    ) : (
                      <Input
                        value={transitionFieldValues[sf.field] ?? ''}
                        onChange={e => setTransitionFieldValues(p => ({ ...p, [sf.field]: e.target.value }))}
                      />
                    )}
                  </div>
                );
              })}
            <div className="space-y-2">
              <Label htmlFor="transition_comment">Comment (optional)</Label>
              <Textarea
                id="transition_comment"
                placeholder="Add a note about this status change..."
                value={transitionComment}
                onChange={(e) => setTransitionComment(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setTransitionDialogOpen(false); setTransitionComment(''); setTransitionFieldValues({}); setPendingTransition(null); }}>
              Cancel
            </Button>
            <Button onClick={handleTransition} disabled={transitionSaving}>
              {transitionSaving ? 'Saving...' : `Move to ${pendingTransition?.name}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />Delete Lead
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this lead? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLead} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
