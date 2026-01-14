import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Tag as TagIcon,
  Users,
  Target,
  RefreshCw,
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
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';

interface Tag {
  id: number;
  name: string;
  color: string;
  description?: string;
  entity_type: string;
  company_id: number;
  created_at: string;
  updated_at: string;
  lead_count: number;
  contact_count: number;
}

const COLOR_OPTIONS = [
  { value: '#EF4444', label: 'Red' },
  { value: '#F97316', label: 'Orange' },
  { value: '#F59E0B', label: 'Amber' },
  { value: '#EAB308', label: 'Yellow' },
  { value: '#84CC16', label: 'Lime' },
  { value: '#22C55E', label: 'Green' },
  { value: '#10B981', label: 'Emerald' },
  { value: '#14B8A6', label: 'Teal' },
  { value: '#06B6D4', label: 'Cyan' },
  { value: '#0EA5E9', label: 'Sky' },
  { value: '#3B82F6', label: 'Blue' },
  { value: '#6366F1', label: 'Indigo' },
  { value: '#8B5CF6', label: 'Violet' },
  { value: '#A855F7', label: 'Purple' },
  { value: '#D946EF', label: 'Fuchsia' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#6B7280', label: 'Gray' },
];

export default function TagsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    color: '#6B7280',
    description: '',
    entity_type: 'both',
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const response = await axios.get('/api/v1/tags/', { headers });
      setTags(response.data.tags);
    } catch (error) {
      console.error('Error fetching tags:', error);
      toast({
        title: t('crm.common.error'),
        description: t('crm.tags.fetchError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingTag(null);
    setFormData({
      name: '',
      color: '#6B7280',
      description: '',
      entity_type: 'both',
    });
    setDialogOpen(true);
  };

  const openEditDialog = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      color: tag.color,
      description: tag.description || '',
      entity_type: tag.entity_type,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: t('crm.common.error'),
        description: t('crm.tags.nameRequired'),
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const headers = getAuthHeaders();

      if (editingTag) {
        await axios.put(`/api/v1/tags/${editingTag.id}`, formData, { headers });
        toast({
          title: t('crm.common.success'),
          description: t('crm.tags.updated'),
        });
      } else {
        await axios.post('/api/v1/tags/', formData, { headers });
        toast({
          title: t('crm.common.success'),
          description: t('crm.tags.created'),
        });
      }

      setDialogOpen(false);
      fetchTags();
    } catch (error: any) {
      console.error('Error saving tag:', error);
      toast({
        title: t('crm.common.error'),
        description: error.response?.data?.detail || t('crm.tags.saveError'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTag) return;

    try {
      const headers = getAuthHeaders();
      await axios.delete(`/api/v1/tags/${deletingTag.id}`, { headers });
      toast({
        title: t('crm.common.success'),
        description: t('crm.tags.deleted'),
      });
      setDeleteDialogOpen(false);
      setDeletingTag(null);
      fetchTags();
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast({
        title: t('crm.common.error'),
        description: t('crm.tags.deleteError'),
        variant: 'destructive',
      });
    }
  };

  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalLeads = tags.reduce((sum, t) => sum + t.lead_count, 0);
  const totalContacts = tags.reduce((sum, t) => sum + t.contact_count, 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="relative">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-xl shadow-orange-500/25">
            <RefreshCw className="h-6 w-6 text-white animate-spin" />
          </div>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('crm.common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 shadow-xl shadow-orange-500/25">
            <TagIcon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              {t('crm.tags.title')}
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              {t('crm.tags.subtitle')}
            </p>
          </div>
        </div>
        <Button
          onClick={openCreateDialog}
          className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 transition-all"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('crm.tags.addTag')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl border border-orange-200/80 dark:border-orange-700/60 bg-gradient-to-br from-white to-orange-50 dark:from-slate-800 dark:to-slate-900 shadow-xl shadow-orange-500/10 hover:shadow-2xl hover:shadow-orange-500/20 hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                {t('crm.tags.stats.total')}
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{tags.length}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
              <TagIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-purple-200/80 dark:border-purple-700/60 bg-gradient-to-br from-white to-purple-50 dark:from-slate-800 dark:to-slate-900 shadow-xl shadow-purple-500/10 hover:shadow-2xl hover:shadow-purple-500/20 hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                {t('crm.tags.stats.taggedLeads')}
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalLeads}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Target className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-blue-200/80 dark:border-blue-700/60 bg-gradient-to-br from-white to-blue-50 dark:from-slate-800 dark:to-slate-900 shadow-xl shadow-blue-500/10 hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                {t('crm.tags.stats.taggedContacts')}
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalContacts}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 shadow-xl">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder={t('crm.tags.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 rounded-xl border-slate-200 dark:border-slate-600 dark:bg-slate-800/50 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>
      </div>

      {/* Tags Grid */}
      {filteredTags.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 shadow-xl">
          <div className="py-12">
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 flex items-center justify-center mb-4">
                <TagIcon className="h-8 w-8 text-orange-500" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 mb-2">{t('crm.tags.noTags')}</p>
              <Button
                variant="link"
                className="text-orange-600 hover:text-orange-700"
                onClick={openCreateDialog}
              >
                {t('crm.tags.createFirst')}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTags.map((tag) => (
            <div
              key={tag.id}
              className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="h-5 w-5 rounded-lg shadow-sm"
                    style={{ backgroundColor: tag.color }}
                  />
                  <h3 className="font-semibold text-slate-900 dark:text-white">{tag.name}</h3>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl">
                    <DropdownMenuItem onClick={() => openEditDialog(tag)} className="rounded-lg">
                      <Edit className="h-4 w-4 mr-2" />
                      {t('crm.common.edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setDeletingTag(tag);
                        setDeleteDialogOpen(true);
                      }}
                      className="text-red-600 dark:text-red-400 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t('crm.common.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {tag.description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">
                  {tag.description}
                </p>
              )}

              <div className="flex items-center gap-2 text-xs">
                <Badge variant="outline" className="rounded-lg border-slate-200 dark:border-slate-600">
                  {t(`crm.tags.entityTypes.${tag.entity_type}`)}
                </Badge>
              </div>

              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-700/60">
                <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                  <Target className="h-3.5 w-3.5 text-purple-500" />
                  <span>{tag.lead_count} {t('crm.tags.leads')}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                  <Users className="h-3.5 w-3.5 text-blue-500" />
                  <span>{tag.contact_count} {t('crm.tags.contacts')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl dark:bg-slate-800 border-slate-200/80 dark:border-slate-700/60">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-white">
              {editingTag ? t('crm.tags.editTag') : t('crm.tags.addTag')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-700 dark:text-slate-300">{t('crm.tags.fields.name')} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('crm.tags.namePlaceholder')}
                className="rounded-xl dark:bg-slate-900 dark:border-slate-600 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">{t('crm.tags.fields.color')}</Label>
              <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/60">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`h-8 w-8 rounded-lg border-2 transition-all shadow-sm ${
                      formData.color === color.value
                        ? 'border-slate-900 dark:border-white scale-110 ring-2 ring-offset-2 ring-slate-400'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-700 dark:text-slate-300">{t('crm.tags.fields.description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('crm.tags.descriptionPlaceholder')}
                rows={2}
                className="rounded-xl dark:bg-slate-900 dark:border-slate-600 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="entity_type" className="text-slate-700 dark:text-slate-300">{t('crm.tags.fields.entityType')}</Label>
              <Select
                value={formData.entity_type}
                onValueChange={(value) => setFormData({ ...formData, entity_type: value })}
              >
                <SelectTrigger className="rounded-xl dark:bg-slate-900 dark:border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="both" className="rounded-lg">{t('crm.tags.entityTypes.both')}</SelectItem>
                  <SelectItem value="lead" className="rounded-lg">{t('crm.tags.entityTypes.lead')}</SelectItem>
                  <SelectItem value="contact" className="rounded-lg">{t('crm.tags.entityTypes.contact')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">
              {t('crm.common.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-xl shadow-lg shadow-orange-500/25"
            >
              {saving ? t('crm.common.saving') : (editingTag ? t('crm.common.save') : t('crm.common.create'))}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold text-slate-900 dark:text-white">{t('crm.tags.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 dark:text-slate-400">
              {t('crm.tags.deleteConfirmDesc', { name: deletingTag?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t('crm.common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl shadow-lg shadow-red-500/25"
            >
              {t('crm.common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
