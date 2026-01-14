import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Search,
  Mail,
  MessageSquare,
  Phone,
  Sparkles,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Eye,
  Filter,
  RefreshCw,
  FileText,
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
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { useToast } from '@/hooks/use-toast';
import {
  getTemplates,
  deleteTemplate,
  duplicateTemplate,
  Template,
} from '@/services/templateService';

const TYPE_ICONS: Record<string, any> = {
  email: Mail,
  sms: MessageSquare,
  whatsapp: MessageSquare,
  voice: Phone,
};

const TYPE_COLORS: Record<string, string> = {
  email: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  sms: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  whatsapp: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  voice: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

export default function TemplatesPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [duplicateName, setDuplicateName] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, [search, typeFilter, page]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await getTemplates({
        search: search || undefined,
        template_type: typeFilter !== 'all' ? typeFilter : undefined,
        page,
        page_size: 20,
      });
      setTemplates(response.templates);
      setTotal(response.total);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: t('crm.common.error'),
        description: t('crm.templates.fetchError', 'Failed to load templates'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTemplate) return;
    try {
      await deleteTemplate(selectedTemplate.id);
      toast({
        title: t('crm.common.success'),
        description: t('crm.templates.deleted', 'Template deleted successfully'),
      });
      fetchTemplates();
    } catch (error) {
      toast({
        title: t('crm.common.error'),
        description: t('crm.templates.deleteError', 'Failed to delete template'),
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedTemplate(null);
    }
  };

  const handleDuplicate = async () => {
    if (!selectedTemplate || !duplicateName) return;
    try {
      await duplicateTemplate(selectedTemplate.id, duplicateName);
      toast({
        title: t('crm.common.success'),
        description: t('crm.templates.duplicated', 'Template duplicated successfully'),
      });
      fetchTemplates();
    } catch (error) {
      toast({
        title: t('crm.common.error'),
        description: t('crm.templates.duplicateError', 'Failed to duplicate template'),
        variant: 'destructive',
      });
    } finally {
      setDuplicateDialogOpen(false);
      setSelectedTemplate(null);
      setDuplicateName('');
    }
  };

  const openDuplicateDialog = (template: Template) => {
    setSelectedTemplate(template);
    setDuplicateName(`${template.name} (Copy)`);
    setDuplicateDialogOpen(true);
  };

  const openDeleteDialog = (template: Template) => {
    setSelectedTemplate(template);
    setDeleteDialogOpen(true);
  };

  const openPreviewDialog = (template: Template) => {
    setSelectedTemplate(template);
    setPreviewDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const truncateText = (text: string | undefined, maxLength: number) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-xl shadow-purple-500/25">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              {t('crm.templates.title', 'Templates')}
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              {t('crm.templates.description', 'Create and manage reusable message templates')}
            </p>
          </div>
        </div>
        <Button
          onClick={() => navigate('/dashboard/crm/templates/new')}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('crm.templates.create', 'Create Template')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['email', 'sms', 'whatsapp', 'voice'].map((type) => {
          const count = templates.filter((t) => t.template_type === type).length;
          const Icon = TYPE_ICONS[type];
          const cardColors: Record<string, { border: string; bg: string; shadow: string; iconBg: string }> = {
            email: { border: 'border-blue-200/80 dark:border-blue-700/60', bg: 'from-white to-blue-50 dark:from-slate-800 dark:to-slate-900', shadow: 'shadow-blue-500/10 hover:shadow-blue-500/20', iconBg: 'from-blue-500 to-blue-600' },
            sms: { border: 'border-green-200/80 dark:border-green-700/60', bg: 'from-white to-green-50 dark:from-slate-800 dark:to-slate-900', shadow: 'shadow-green-500/10 hover:shadow-green-500/20', iconBg: 'from-green-500 to-green-600' },
            whatsapp: { border: 'border-emerald-200/80 dark:border-emerald-700/60', bg: 'from-white to-emerald-50 dark:from-slate-800 dark:to-slate-900', shadow: 'shadow-emerald-500/10 hover:shadow-emerald-500/20', iconBg: 'from-emerald-500 to-teal-600' },
            voice: { border: 'border-purple-200/80 dark:border-purple-700/60', bg: 'from-white to-purple-50 dark:from-slate-800 dark:to-slate-900', shadow: 'shadow-purple-500/10 hover:shadow-purple-500/20', iconBg: 'from-purple-500 to-indigo-600' },
          };
          const colors = cardColors[type];
          return (
            <div
              key={type}
              className={`p-5 rounded-2xl border ${colors.border} bg-gradient-to-br ${colors.bg} shadow-xl ${colors.shadow} hover:shadow-2xl hover:scale-[1.02] cursor-pointer transition-all duration-300`}
              onClick={() => setTypeFilter(type)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    {t(`crm.templates.types.${type}`, type)}
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{count}</p>
                </div>
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${colors.iconBg} flex items-center justify-center shadow-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 shadow-xl">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder={t('crm.templates.searchPlaceholder', 'Search templates...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 rounded-xl border-slate-200 dark:border-slate-600 dark:bg-slate-800/50 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px] rounded-xl border-slate-200 dark:border-slate-600 dark:bg-slate-800/50">
              <Filter className="h-4 w-4 mr-2 text-slate-400" />
              <SelectValue placeholder={t('crm.templates.filterByType', 'Filter by type')} />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="rounded-lg">{t('crm.common.all', 'All Types')}</SelectItem>
              <SelectItem value="email" className="rounded-lg">{t('crm.templates.types.email', 'Email')}</SelectItem>
              <SelectItem value="sms" className="rounded-lg">{t('crm.templates.types.sms', 'SMS')}</SelectItem>
              <SelectItem value="whatsapp" className="rounded-lg">{t('crm.templates.types.whatsapp', 'WhatsApp')}</SelectItem>
              <SelectItem value="voice" className="rounded-lg">{t('crm.templates.types.voice', 'Voice')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-purple-500/25">
            <RefreshCw className="h-6 w-6 text-white animate-spin" />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('crm.common.loading', 'Loading...')}</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 shadow-xl">
          <div className="p-12 text-center">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              {t('crm.templates.noTemplates', 'No templates found')}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              {t('crm.templates.noTemplatesMessage', 'Create your first template to get started')}
            </p>
            <Button
              onClick={() => navigate('/dashboard/crm/templates/new')}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-purple-500/25"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('crm.templates.create', 'Create Template')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => {
            const Icon = TYPE_ICONS[template.template_type];
            const cardColorMap: Record<string, string> = {
              email: 'border-blue-200/60 dark:border-blue-700/40',
              sms: 'border-green-200/60 dark:border-green-700/40',
              whatsapp: 'border-emerald-200/60 dark:border-emerald-700/40',
              voice: 'border-purple-200/60 dark:border-purple-700/40',
            };
            const iconBgMap: Record<string, string> = {
              email: 'from-blue-500 to-blue-600',
              sms: 'from-green-500 to-green-600',
              whatsapp: 'from-emerald-500 to-teal-600',
              voice: 'from-purple-500 to-indigo-600',
            };
            return (
              <div
                key={template.id}
                className={`rounded-2xl border ${cardColorMap[template.template_type] || 'border-slate-200/80 dark:border-slate-700/60'} bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all duration-300 overflow-hidden group`}
              >
                <div className="p-4 pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl bg-gradient-to-br ${iconBgMap[template.template_type] || 'from-purple-500 to-indigo-600'} shadow-md`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                          {template.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formatDate(template.updated_at)}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity rounded-lg h-8 w-8"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem onClick={() => openPreviewDialog(template)} className="rounded-lg">
                          <Eye className="h-4 w-4 mr-2 text-purple-500" />
                          {t('crm.common.preview', 'Preview')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => navigate(`/dashboard/crm/templates/${template.id}`)}
                          className="rounded-lg"
                        >
                          <Edit className="h-4 w-4 mr-2 text-slate-500" />
                          {t('crm.common.edit', 'Edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openDuplicateDialog(template)} className="rounded-lg">
                          <Copy className="h-4 w-4 mr-2 text-blue-500" />
                          {t('crm.templates.duplicate', 'Duplicate')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => openDeleteDialog(template)}
                          className="text-red-600 dark:text-red-400 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('crm.common.delete', 'Delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="px-4 pb-4">
                  {/* Preview area */}
                  <div
                    className="bg-slate-50/80 dark:bg-slate-900/50 rounded-xl p-3 mb-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[80px] border border-slate-200/60 dark:border-slate-700/40"
                    onClick={() => openPreviewDialog(template)}
                  >
                    {template.template_type === 'email' && template.html_body ? (
                      <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        <span>{t('crm.templates.htmlPreview', 'HTML Email')} - {t('crm.common.preview', 'Click to preview')}</span>
                      </div>
                    ) : (
                      <>
                        {template.subject && (
                          <p className="text-sm font-medium text-slate-900 dark:text-white mb-1 line-clamp-1">
                            {template.subject}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          {truncateText(template.body || template.voice_script, 80)}
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`rounded-lg ${TYPE_COLORS[template.template_type]}`}>
                        {t(`crm.templates.types.${template.template_type}`, template.template_type)}
                      </Badge>
                      {template.is_ai_generated && (
                        <Badge variant="outline" className="rounded-lg bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700">
                          <Sparkles className="h-3 w-3 mr-1" />
                          AI
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 rounded-lg text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        openPreviewDialog(template);
                      }}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      {t('crm.common.preview', 'Preview')}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl border-slate-200/80 dark:border-slate-700/60 dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-white">{selectedTemplate?.name}</DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              {t(`crm.templates.types.${selectedTemplate?.template_type}`, selectedTemplate?.template_type)} {t('crm.templates.template', 'Template')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTemplate?.subject && (
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {t('crm.templates.subject', 'Subject')}
                </label>
                <p className="mt-1 text-slate-900 dark:text-white">{selectedTemplate.subject}</p>
              </div>
            )}
            {selectedTemplate?.body && (
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {t('crm.templates.body', 'Body')}
                </label>
                <div className="mt-1 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/60 whitespace-pre-wrap text-slate-900 dark:text-white">
                  {selectedTemplate.body}
                </div>
              </div>
            )}
            {selectedTemplate?.html_body && (
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {t('crm.templates.htmlPreview', 'HTML Preview')}
                </label>
                <div className="mt-1 p-4 bg-white border border-slate-200 dark:border-slate-700 rounded-xl">
                  <iframe
                    srcDoc={selectedTemplate.html_body}
                    className="w-full h-64 border-0 rounded-lg"
                    title="HTML Preview"
                  />
                </div>
              </div>
            )}
            {selectedTemplate?.voice_script && (
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {t('crm.templates.voiceScript', 'Voice Script')}
                </label>
                <div className="mt-1 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/60 whitespace-pre-wrap text-slate-900 dark:text-white">
                  {selectedTemplate.voice_script}
                </div>
              </div>
            )}
            {selectedTemplate?.personalization_tokens && selectedTemplate.personalization_tokens.length > 0 && (
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {t('crm.templates.tokens', 'Personalization Tokens')}
                </label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedTemplate.personalization_tokens.map((token) => (
                    <Badge key={token} variant="secondary" className="rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                      {token}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)} className="rounded-xl">
              {t('crm.common.close', 'Close')}
            </Button>
            <Button
              onClick={() => {
                setPreviewDialogOpen(false);
                navigate(`/dashboard/crm/templates/${selectedTemplate?.id}`);
              }}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-purple-500/25"
            >
              <Edit className="h-4 w-4 mr-2" />
              {t('crm.common.edit', 'Edit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Dialog */}
      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent className="rounded-2xl border-slate-200/80 dark:border-slate-700/60 dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-white">{t('crm.templates.duplicateTemplate', 'Duplicate Template')}</DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              {t('crm.templates.duplicateDescription', 'Enter a name for the duplicated template')}
            </DialogDescription>
          </DialogHeader>
          <Input
            value={duplicateName}
            onChange={(e) => setDuplicateName(e.target.value)}
            placeholder={t('crm.templates.newName', 'New template name')}
            className="rounded-xl border-slate-200 dark:border-slate-600 dark:bg-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateDialogOpen(false)} className="rounded-xl">
              {t('crm.common.cancel', 'Cancel')}
            </Button>
            <Button onClick={handleDuplicate} disabled={!duplicateName} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/25">
              <Copy className="h-4 w-4 mr-2" />
              {t('crm.templates.duplicate', 'Duplicate')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold text-slate-900 dark:text-white">{t('crm.templates.deleteTitle', 'Delete Template')}</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 dark:text-slate-400">
              {t('crm.templates.deleteConfirm', 'Are you sure you want to delete this template? This action cannot be undone.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t('crm.common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl shadow-lg shadow-red-500/25"
            >
              {t('crm.common.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
