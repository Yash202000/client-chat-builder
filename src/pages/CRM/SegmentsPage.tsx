import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
  Users,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  Eye,
  RefreshCw,
  Layers,
  Database,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SegmentBuilder } from '@/components/SegmentBuilder';

interface SegmentCriteria {
  lifecycle_stages?: string[];
  lead_sources?: string[];
  lead_stages?: string[];
  tag_ids?: number[];
  score_min?: number;
  score_max?: number;
  opt_in_status?: string[];
  include_contacts?: boolean;
  include_leads?: boolean;
}

interface Segment {
  id: number;
  name: string;
  description?: string;
  segment_type: 'dynamic' | 'static';
  criteria?: SegmentCriteria;
  static_contact_ids?: number[];
  static_lead_ids?: number[];
  contact_count: number;
  lead_count: number;
  last_refreshed_at?: string;
  created_at: string;
  updated_at: string;
}

interface SegmentMember {
  id: number;
  type: 'contact' | 'lead';
  name?: string;
  email?: string;
  stage?: string;
  score?: number;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

export default function SegmentsPage() {
  const { t } = useTranslation();
  const [segments, setSegments] = useState<Segment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);
  const [segmentMembers, setSegmentMembers] = useState<SegmentMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    segment_type: 'dynamic' as 'dynamic' | 'static',
    criteria: {} as SegmentCriteria,
  });
  const [previewCount, setPreviewCount] = useState<{
    contact_count: number;
    lead_count: number;
    total_count: number;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSegments();
  }, []);

  const fetchSegments = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (searchQuery) params.search = searchQuery;
      if (typeFilter !== 'all') params.segment_type = typeFilter;

      const response = await axios.get('/api/v1/segments', {
        params,
        headers: getAuthHeaders(),
      });
      setSegments(response.data.segments || []);
    } catch (error) {
      console.error('Failed to fetch segments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPreview = async (criteria: SegmentCriteria) => {
    try {
      const response = await axios.post('/api/v1/segments/preview', criteria, {
        headers: getAuthHeaders(),
      });
      setPreviewCount(response.data);
    } catch (error) {
      console.error('Failed to fetch preview:', error);
    }
  };

  const fetchSegmentMembers = async (segmentId: number) => {
    setMembersLoading(true);
    try {
      const response = await axios.get(`/api/v1/segments/${segmentId}/members`, {
        headers: getAuthHeaders(),
      });
      setSegmentMembers(response.data.members || []);
    } catch (error) {
      console.error('Failed to fetch segment members:', error);
    } finally {
      setMembersLoading(false);
    }
  };

  const handleCreateSegment = async () => {
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      await axios.post(
        '/api/v1/segments',
        {
          name: formData.name,
          description: formData.description || null,
          segment_type: formData.segment_type,
          criteria: formData.segment_type === 'dynamic' ? formData.criteria : null,
        },
        { headers: getAuthHeaders() }
      );
      setIsCreateDialogOpen(false);
      resetForm();
      fetchSegments();
    } catch (error) {
      console.error('Failed to create segment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSegment = async () => {
    if (!selectedSegment || !formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      await axios.put(
        `/api/v1/segments/${selectedSegment.id}`,
        {
          name: formData.name,
          description: formData.description || null,
          segment_type: formData.segment_type,
          criteria: formData.segment_type === 'dynamic' ? formData.criteria : null,
        },
        { headers: getAuthHeaders() }
      );
      setIsEditDialogOpen(false);
      resetForm();
      fetchSegments();
    } catch (error) {
      console.error('Failed to update segment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSegment = async () => {
    if (!selectedSegment) return;

    try {
      await axios.delete(`/api/v1/segments/${selectedSegment.id}`, {
        headers: getAuthHeaders(),
      });
      setIsDeleteDialogOpen(false);
      setSelectedSegment(null);
      fetchSegments();
    } catch (error) {
      console.error('Failed to delete segment:', error);
    }
  };

  const handleRefreshSegment = async (segment: Segment) => {
    try {
      await axios.post(`/api/v1/segments/${segment.id}/refresh`, {}, {
        headers: getAuthHeaders(),
      });
      fetchSegments();
    } catch (error) {
      console.error('Failed to refresh segment:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      segment_type: 'dynamic',
      criteria: {},
    });
    setPreviewCount(null);
    setSelectedSegment(null);
  };

  const openEditDialog = (segment: Segment) => {
    setSelectedSegment(segment);
    setFormData({
      name: segment.name,
      description: segment.description || '',
      segment_type: segment.segment_type,
      criteria: segment.criteria || {},
    });
    if (segment.segment_type === 'dynamic' && segment.criteria) {
      fetchPreview(segment.criteria);
    }
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (segment: Segment) => {
    setSelectedSegment(segment);
    fetchSegmentMembers(segment.id);
    setIsViewDialogOpen(true);
  };

  const filteredSegments = segments.filter((segment) => {
    const matchesSearch = segment.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || segment.segment_type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Stats
  const totalSegments = segments.length;
  const dynamicSegments = segments.filter((s) => s.segment_type === 'dynamic').length;
  const staticSegments = segments.filter((s) => s.segment_type === 'static').length;
  const totalReach = segments.reduce((sum, s) => sum + s.contact_count + s.lead_count, 0);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-xl shadow-purple-500/25">
            <Layers className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">{t('crm.segments.title', 'Segments')}</h1>
            <p className="text-slate-600 dark:text-slate-400">
              {t('crm.segments.description', 'Create and manage audience segments for targeted campaigns')}
            </p>
          </div>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all">
          <Plus className="h-4 w-4 mr-2" />
          {t('crm.segments.create', 'Create Segment')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-purple-200/80 dark:border-purple-700/60 bg-gradient-to-br from-white to-purple-50 dark:from-slate-800 dark:to-slate-900 shadow-xl shadow-purple-500/10 hover:shadow-2xl hover:shadow-purple-500/20 hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                {t('crm.segments.totalSegments', 'Total Segments')}
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalSegments}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Layers className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-blue-200/80 dark:border-blue-700/60 bg-gradient-to-br from-white to-blue-50 dark:from-slate-800 dark:to-slate-900 shadow-xl shadow-blue-500/10 hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                {t('crm.segments.dynamicSegments', 'Dynamic')}
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{dynamicSegments}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Filter className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-green-200/80 dark:border-green-700/60 bg-gradient-to-br from-white to-green-50 dark:from-slate-800 dark:to-slate-900 shadow-xl shadow-green-500/10 hover:shadow-2xl hover:shadow-green-500/20 hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                {t('crm.segments.staticSegments', 'Static')}
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{staticSegments}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/25">
              <Database className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-indigo-200/80 dark:border-indigo-700/60 bg-gradient-to-br from-white to-indigo-50 dark:from-slate-800 dark:to-slate-900 shadow-xl shadow-indigo-500/10 hover:shadow-2xl hover:shadow-indigo-500/20 hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                {t('crm.segments.totalReach', 'Total Reach')}
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalReach}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 shadow-xl">
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder={t('crm.segments.searchPlaceholder', 'Search segments...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 rounded-xl border-slate-200 dark:border-slate-600 dark:bg-slate-800/50 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40 rounded-xl border-slate-200 dark:border-slate-600 dark:bg-slate-800/50">
              <SelectValue placeholder={t('crm.segments.filterByType', 'Filter by type')} />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="rounded-lg">{t('common.all', 'All')}</SelectItem>
              <SelectItem value="dynamic" className="rounded-lg">{t('crm.segments.dynamic', 'Dynamic')}</SelectItem>
              <SelectItem value="static" className="rounded-lg">{t('crm.segments.static', 'Static')}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchSegments} className="rounded-xl border-slate-200 dark:border-slate-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-300">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('common.refresh', 'Refresh')}
          </Button>
        </div>
      </div>

      {/* Segments Table */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 shadow-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-200/80 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/50">
              <TableHead className="text-slate-600 dark:text-slate-400 font-semibold">{t('crm.segments.name', 'Name')}</TableHead>
              <TableHead className="text-slate-600 dark:text-slate-400 font-semibold">{t('crm.segments.type', 'Type')}</TableHead>
              <TableHead className="text-center text-slate-600 dark:text-slate-400 font-semibold">{t('crm.contacts.title', 'Contacts')}</TableHead>
              <TableHead className="text-center text-slate-600 dark:text-slate-400 font-semibold">{t('crm.leads.title', 'Leads')}</TableHead>
              <TableHead className="text-slate-600 dark:text-slate-400 font-semibold">{t('crm.segments.lastRefreshed', 'Last Refreshed')}</TableHead>
              <TableHead className="text-right text-slate-600 dark:text-slate-400 font-semibold">{t('common.actions', 'Actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                      <RefreshCw className="h-5 w-5 text-white animate-spin" />
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('common.loading', 'Loading...')}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredSegments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center">
                      <Layers className="h-7 w-7 text-purple-500" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">{t('crm.segments.noSegments', 'No segments found')}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredSegments.map((segment) => (
                <TableRow key={segment.id} className="border-b border-slate-200/60 dark:border-slate-700/40 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <TableCell>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{segment.name}</p>
                      {segment.description && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-xs">
                          {segment.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`rounded-lg ${segment.segment_type === 'dynamic' ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700' : 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700'}`}>
                      {segment.segment_type === 'dynamic' ? (
                        <Filter className="h-3 w-3 mr-1" />
                      ) : (
                        <Database className="h-3 w-3 mr-1" />
                      )}
                      {segment.segment_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-medium text-slate-700 dark:text-slate-300">{segment.contact_count}</TableCell>
                  <TableCell className="text-center font-medium text-slate-700 dark:text-slate-300">{segment.lead_count}</TableCell>
                  <TableCell className="text-slate-500 dark:text-slate-400">
                    {segment.last_refreshed_at
                      ? new Date(segment.last_refreshed_at).toLocaleDateString()
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openViewDialog(segment)}
                        title={t('common.view', 'View')}
                        className="rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20"
                      >
                        <Eye className="h-4 w-4 text-purple-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRefreshSegment(segment)}
                        title={t('common.refresh', 'Refresh')}
                        className="rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      >
                        <RefreshCw className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(segment)}
                        title={t('common.edit', 'Edit')}
                        className="rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <Edit className="h-4 w-4 text-slate-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedSegment(segment);
                          setIsDeleteDialogOpen(true);
                        }}
                        title={t('common.delete', 'Delete')}
                        className="rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog
        open={isCreateDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setIsEditDialogOpen(false);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border-slate-200/80 dark:border-slate-700/60 dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-white">
              {isEditDialogOpen
                ? t('crm.segments.editSegment', 'Edit Segment')
                : t('crm.segments.createSegment', 'Create Segment')}
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              {t('crm.segments.dialogDescription', 'Define your audience segment criteria')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">{t('crm.segments.name', 'Name')}</Label>
                <Input
                  placeholder={t('crm.segments.namePlaceholder', 'e.g., High-value leads')}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="rounded-xl border-slate-200 dark:border-slate-600 dark:bg-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">{t('crm.segments.description', 'Description')}</Label>
                <Textarea
                  placeholder={t('crm.segments.descriptionPlaceholder', 'Describe this segment...')}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="rounded-xl border-slate-200 dark:border-slate-600 dark:bg-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">{t('crm.segments.type', 'Segment Type')}</Label>
                <Select
                  value={formData.segment_type}
                  onValueChange={(value: 'dynamic' | 'static') =>
                    setFormData({ ...formData, segment_type: value })
                  }
                >
                  <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-600 dark:bg-slate-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="dynamic" className="rounded-lg">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-blue-500" />
                        {t('crm.segments.dynamic', 'Dynamic')} -{' '}
                        {t('crm.segments.dynamicDescription', 'Auto-updates based on criteria')}
                      </div>
                    </SelectItem>
                    <SelectItem value="static" className="rounded-lg">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-green-500" />
                        {t('crm.segments.static', 'Static')} -{' '}
                        {t('crm.segments.staticDescription', 'Fixed list of members')}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dynamic Segment Builder */}
            {formData.segment_type === 'dynamic' && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">
                  {t('crm.segments.criteria', 'Segment Criteria')}
                </h3>
                <SegmentBuilder
                  criteria={formData.criteria}
                  onChange={(criteria) => {
                    setFormData({ ...formData, criteria });
                    fetchPreview(criteria);
                  }}
                  previewCount={previewCount || undefined}
                />
              </div>
            )}

            {/* Static Segment Info */}
            {formData.segment_type === 'static' && (
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  {t(
                    'crm.segments.staticInfo',
                    'Static segments contain a fixed list of contacts and leads. You can add members after creating the segment.'
                  )}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setIsEditDialogOpen(false);
                resetForm();
              }}
              className="rounded-xl"
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              onClick={isEditDialogOpen ? handleUpdateSegment : handleCreateSegment}
              disabled={!formData.name.trim() || isSubmitting}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-purple-500/25"
            >
              {isSubmitting
                ? t('common.saving', 'Saving...')
                : isEditDialogOpen
                ? t('common.save', 'Save')
                : t('common.create', 'Create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Members Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto rounded-2xl border-slate-200/80 dark:border-slate-700/60 dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-white">
              {selectedSegment?.name} - {t('crm.segments.members', 'Members')}
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              {selectedSegment?.contact_count} {t('crm.contacts.title', 'contacts')},{' '}
              {selectedSegment?.lead_count} {t('crm.leads.title', 'leads')}
            </DialogDescription>
          </DialogHeader>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('common.type', 'Type')}</TableHead>
                <TableHead>{t('common.name', 'Name')}</TableHead>
                <TableHead>{t('common.email', 'Email')}</TableHead>
                <TableHead>{t('crm.segments.stage', 'Stage')}</TableHead>
                <TableHead>{t('crm.segments.score', 'Score')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {membersLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    {t('common.loading', 'Loading...')}
                  </TableCell>
                </TableRow>
              ) : segmentMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {t('crm.segments.noMembers', 'No members in this segment')}
                  </TableCell>
                </TableRow>
              ) : (
                segmentMembers.map((member) => (
                  <TableRow key={`${member.type}-${member.id}`}>
                    <TableCell>
                      <Badge variant={member.type === 'contact' ? 'secondary' : 'default'}>
                        {member.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{member.name || '-'}</TableCell>
                    <TableCell>{member.email || '-'}</TableCell>
                    <TableCell>{member.stage || '-'}</TableCell>
                    <TableCell>{member.score ?? '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold text-slate-900 dark:text-white">
              {t('crm.segments.deleteTitle', 'Delete Segment')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 dark:text-slate-400">
              {t(
                'crm.segments.deleteDescription',
                'Are you sure you want to delete this segment? This action cannot be undone.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSegment}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl shadow-lg shadow-red-500/25"
            >
              {t('common.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
