import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Plus, Search, MoreHorizontal, Trash2, Copy, Eye, ExternalLink,
  FormInput, Loader2, BarChart2, Code2, Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  getForms, deleteForm, createForm, getSubmissions,
  CaptureForm, FormSubmission,
} from '@/services/formService';

const FRONTEND_BASE = window.location.origin;

const STATUS_COLOR: Record<string, string> = {
  active:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  paused:   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  archived: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

export default function FormsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [forms, setForms] = useState<CaptureForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const [submissionsOpen, setSubmissionsOpen] = useState(false);
  const [activeForm, setActiveForm] = useState<CaptureForm | null>(null);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  const [embedOpen, setEmbedOpen] = useState(false);
  const [embedForm, setEmbedForm] = useState<CaptureForm | null>(null);

  useEffect(() => { fetchForms(); }, []);

  const fetchForms = async () => {
    try {
      setLoading(true);
      setForms(await getForms());
    } catch {
      toast({ title: t('captureforms.toast.errorTitle'), description: t('captureforms.toast.loadError'), variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const form = await createForm({
        name: newName,
        fields: [
          { id: 'name', type: 'name', label: 'Full Name', required: true, width: 'full' },
          { id: 'email', type: 'email', label: 'Email Address', required: true, width: 'full' },
        ],
        settings: {
          submit_label: 'Submit',
          submit_message: "Thank you! We'll be in touch.",
          create_contact: true,
          create_lead: false,
          primary_color: '#6366f1',
          bg_color: '#ffffff',
          font_family: 'Inter',
        },
      });
      toast({ title: t('captureforms.toast.createdTitle'), description: t('captureforms.toast.createdDesc') });
      setCreateOpen(false);
      setNewName('');
      navigate(`/dashboard/crm/forms/${form.id}`);
    } catch {
      toast({ title: t('captureforms.toast.errorTitle'), description: t('captureforms.toast.createError'), variant: 'destructive' });
    } finally { setCreating(false); }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteForm(id);
      setForms(prev => prev.filter(f => f.id !== id));
      toast({ title: t('captureforms.toast.deletedTitle') });
    } catch {
      toast({ title: t('captureforms.toast.errorTitle'), description: t('captureforms.toast.deleteError'), variant: 'destructive' });
    }
  };

  const openSubmissions = async (form: CaptureForm) => {
    setActiveForm(form);
    setSubmissionsOpen(true);
    setLoadingSubmissions(true);
    try {
      setSubmissions(await getSubmissions(form.id));
    } catch {} finally { setLoadingSubmissions(false); }
  };

  const copyEmbedCode = (form: CaptureForm) => {
    const code = `<iframe src="${FRONTEND_BASE}/f/${form.slug}" width="100%" height="600" frameborder="0" style="border:none;border-radius:8px;"></iframe>`;
    navigator.clipboard.writeText(code);
    toast({ title: t('captureforms.toast.copiedTitle'), description: t('captureforms.toast.embedCopied') });
  };

  const filtered = forms.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="h-full flex flex-col overflow-hidden app-surface">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <FormInput className="h-5 w-5 text-violet-500" />
              {t('captureforms.title')}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t('captureforms.subtitle')}
            </p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
          >
            <Plus className="h-4 w-4" /> {t('captureforms.newForm')}
          </Button>
        </div>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('captureforms.searchPlaceholder')} className="pl-9 h-9 text-sm" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-48"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
            <div className="h-12 w-12 rounded-full bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
              <FormInput className="h-6 w-6 text-violet-500" />
            </div>
            <div>
              <p className="font-medium">{t('captureforms.empty.title')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('captureforms.empty.subtitle')}</p>
            </div>
            <Button onClick={() => setCreateOpen(true)} variant="outline" size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> {t('captureforms.newForm')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(form => (
              <div key={form.id} className="bg-card border border-border rounded-xl p-4 hover:border-violet-300 dark:hover:border-violet-700 transition-colors group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm truncate">{form.name}</h3>
                      <Badge className={`text-[10px] px-2 py-0 capitalize ${STATUS_COLOR[form.status]}`} variant="secondary">
                        {form.status}
                      </Badge>
                    </div>
                    {form.description && <p className="text-xs text-muted-foreground line-clamp-1">{form.description}</p>}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => navigate(`/dashboard/crm/forms/${form.id}`)}>
                        <Pencil className="h-3.5 w-3.5 mr-2" /> {t('captureforms.actions.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openSubmissions(form)}>
                        <BarChart2 className="h-3.5 w-3.5 mr-2" /> {t('captureforms.actions.viewSubmissions')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setEmbedForm(form); setEmbedOpen(true); }}>
                        <Code2 className="h-3.5 w-3.5 mr-2" /> {t('captureforms.actions.getEmbedCode')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.open(`/f/${form.slug}`, '_blank')}>
                        <ExternalLink className="h-3.5 w-3.5 mr-2" /> {t('captureforms.actions.preview')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(form.id)}>
                        <Trash2 className="h-3.5 w-3.5 mr-2" /> {t('captureforms.actions.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  <span>{t('captureforms.card.fields', { count: form.fields.length })}</span>
                  <span>{t('captureforms.card.submissions', { count: form.submission_count })}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-7 text-xs flex-1 gap-1" onClick={() => navigate(`/dashboard/crm/forms/${form.id}`)}>
                    <Pencil className="h-3 w-3" /> {t('captureforms.actions.edit')}
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs px-2" title={t('captureforms.actions.getEmbedCode')} onClick={() => { setEmbedForm(form); setEmbedOpen(true); }}>
                    <Code2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs px-2" title={t('captureforms.actions.preview')} onClick={() => window.open(`/f/${form.slug}`, '_blank')}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{t('captureforms.dialog.title')}</DialogTitle></DialogHeader>
          <div className="py-2 space-y-1.5">
            <Label className="text-sm">{t('captureforms.dialog.nameLabel')} <span className="text-destructive">*</span></Label>
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder={t('captureforms.dialog.namePlaceholder')}
              className="text-sm"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>{t('captureforms.dialog.cancel')}</Button>
            <Button onClick={handleCreate} disabled={!newName.trim() || creating}
              className="gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white">
              {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              {t('captureforms.dialog.createBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Embed code dialog */}
      <Dialog open={embedOpen} onOpenChange={setEmbedOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Code2 className="h-4 w-4" /> {t('captureforms.embedDialog.title')}</DialogTitle></DialogHeader>
          {embedForm && (
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">{t('captureforms.embedDialog.iframeLabel')}</Label>
                <pre className="bg-slate-900 text-slate-100 text-xs p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
{`<iframe
  src="${FRONTEND_BASE}/f/${embedForm.slug}"
  width="100%"
  height="600"
  frameborder="0"
  style="border:none;border-radius:8px;"
></iframe>`}
                </pre>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">{t('captureforms.embedDialog.directLinkLabel')}</Label>
                <div className="flex items-center gap-2">
                  <Input value={`${FRONTEND_BASE}/f/${embedForm.slug}`} readOnly className="text-xs font-mono" />
                  <Button size="sm" variant="outline" className="flex-shrink-0 gap-1" onClick={() => {
                    navigator.clipboard.writeText(`${FRONTEND_BASE}/f/${embedForm.slug}`);
                    toast({ title: t('captureforms.toast.copiedTitle') });
                  }}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => embedForm && copyEmbedCode(embedForm)} className="gap-1.5">
              <Copy className="h-3.5 w-3.5" /> {t('captureforms.embedDialog.copyIframe')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submissions sheet */}
      <Sheet open={submissionsOpen} onOpenChange={setSubmissionsOpen}>
        <SheetContent className="w-full sm:w-[560px] sm:max-w-[560px] flex flex-col p-0">
          <SheetHeader className="px-5 py-4 border-b border-border flex-shrink-0">
            <SheetTitle className="text-base">
              {t('captureforms.submissions.sheetTitle', { name: activeForm?.name })}
              <Badge variant="secondary" className="ml-2 text-xs">{submissions.length}</Badge>
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            {loadingSubmissions ? (
              <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : submissions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">{t('captureforms.submissions.empty')}</p>
            ) : (
              <div className="divide-y divide-border">
                {submissions.map(s => (
                  <div key={s.id} className="px-5 py-3">
                    <p className="text-[10px] text-muted-foreground mb-1.5">
                      {new Date(s.submitted_at).toLocaleString()}
                    </p>
                    <div className="space-y-0.5">
                      {Object.entries(s.data).map(([k, v]) => (
                        <div key={k} className="flex gap-2 text-xs">
                          <span className="text-muted-foreground w-28 flex-shrink-0 capitalize">{k.replace(/_/g, ' ')}:</span>
                          <span className="text-foreground">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
