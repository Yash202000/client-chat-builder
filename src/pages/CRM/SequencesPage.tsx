import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Plus, Search, MoreHorizontal, Play, Pause, Archive, Trash2,
  Mail, MessageSquare, Phone, CheckSquare, Clock, Users, Loader2,
  GitBranch, TrendingUp,
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  getSequences, createSequence, updateSequence, deleteSequence,
  SequenceListItem,
} from '@/services/sequenceService';

const STATUS_COLORS: Record<string, string> = {
  draft:    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  active:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  paused:   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  archived: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};

const STEP_TYPE_ICON: Record<string, React.ElementType> = {
  email:    Mail,
  sms:      MessageSquare,
  whatsapp: MessageSquare,
  task:     CheckSquare,
  wait:     Clock,
};

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className={`text-sm font-semibold ${color}`}>{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

export default function SequencesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [sequences, setSequences] = useState<SequenceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', goal: '' });

  useEffect(() => { fetchSequences(); }, []);

  const fetchSequences = async () => {
    try {
      setLoading(true);
      const data = await getSequences();
      setSequences(data);
    } catch {
      toast({ title: t('sequences.toast.errorTitle'), description: t('sequences.toast.loadError'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      const seq = await createSequence({
        name: form.name,
        description: form.description || undefined,
        goal: form.goal || undefined,
        status: 'draft',
        steps: [],
      });
      toast({ title: t('sequences.toast.createdTitle'), description: t('sequences.toast.createdDesc') });
      setCreateOpen(false);
      setForm({ name: '', description: '', goal: '' });
      navigate(`/dashboard/crm/sequences/${seq.id}`);
    } catch {
      toast({ title: t('sequences.toast.errorTitle'), description: t('sequences.toast.createError'), variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await updateSequence(id, { status });
      setSequences(prev => prev.map(s => s.id === id ? { ...s, status } : s));
      toast({ title: t('sequences.toast.updatedTitle'), description: t('sequences.toast.updatedDesc', { status }) });
    } catch {
      toast({ title: t('sequences.toast.errorTitle'), description: t('sequences.toast.updateError'), variant: 'destructive' });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSequence(id);
      setSequences(prev => prev.filter(s => s.id !== id));
      toast({ title: t('sequences.toast.deletedTitle'), description: t('sequences.toast.deletedDesc') });
    } catch {
      toast({ title: t('sequences.toast.errorTitle'), description: t('sequences.toast.deleteError'), variant: 'destructive' });
    }
  };

  const filtered = sequences.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-violet-500" />
              {t('sequences.title')}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t('sequences.subtitle')}
            </p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
          >
            <Plus className="h-4 w-4" /> {t('sequences.newSequence')}
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('sequences.searchPlaceholder')}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-32 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('sequences.filter.allStatuses')}</SelectItem>
              <SelectItem value="draft">{t('sequences.status.draft')}</SelectItem>
              <SelectItem value="active">{t('sequences.status.active')}</SelectItem>
              <SelectItem value="paused">{t('sequences.status.paused')}</SelectItem>
              <SelectItem value="archived">{t('sequences.status.archived')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
            <div className="h-12 w-12 rounded-full bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
              <GitBranch className="h-6 w-6 text-violet-500" />
            </div>
            <div>
              <p className="font-medium text-foreground">{t('sequences.empty.title')}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t('sequences.empty.subtitle')}
              </p>
            </div>
            <Button onClick={() => setCreateOpen(true)} variant="outline" size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> {t('sequences.newSequence')}
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map(seq => {
              const stats = seq.stats;
              return (
                <div
                  key={seq.id}
                  className="bg-card border border-border rounded-xl p-4 hover:border-violet-300 dark:hover:border-violet-700 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/dashboard/crm/sequences/${seq.id}`)}
                >
                  <div className="flex items-start gap-4">
                    {/* Left: info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground text-sm truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                          {seq.name}
                        </h3>
                        <Badge className={`text-[10px] px-2 py-0 capitalize font-medium ${STATUS_COLORS[seq.status]}`} variant="secondary">
                          {seq.status}
                        </Badge>
                      </div>
                      {seq.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{seq.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <GitBranch className="h-3 w-3" />
                          {t('sequences.card.steps', { count: seq.step_count })}
                        </span>
                        {seq.goal && (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {seq.goal}
                          </span>
                        )}
                        {stats && stats.total_enrollments > 0 && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {t('sequences.card.enrolled', { count: stats.total_enrollments })}
                          </span>
                        )}
                      </div>
                      {seq.tags && seq.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {seq.tags.slice(0, 4).map(t => (
                            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right: stats + actions */}
                    <div className="flex items-center gap-6 flex-shrink-0">
                      {stats && stats.total_enrollments > 0 && (
                        <div className="flex items-center gap-4 pr-4 border-r border-border">
                          <StatPill label={t('sequences.stats.active')} value={stats.active} color="text-emerald-600" />
                          <StatPill label={t('sequences.stats.done')} value={stats.completed} color="text-blue-600" />
                          <StatPill label={t('sequences.stats.paused')} value={stats.paused} color="text-amber-600" />
                        </div>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={e => { e.stopPropagation(); navigate(`/dashboard/crm/sequences/${seq.id}`); }}>
                            {t('sequences.actions.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {seq.status === 'draft' || seq.status === 'paused' ? (
                            <DropdownMenuItem onClick={e => { e.stopPropagation(); handleStatusChange(seq.id, 'active'); }}>
                              <Play className="h-3.5 w-3.5 mr-2 text-emerald-500" /> {t('sequences.actions.activate')}
                            </DropdownMenuItem>
                          ) : seq.status === 'active' ? (
                            <DropdownMenuItem onClick={e => { e.stopPropagation(); handleStatusChange(seq.id, 'paused'); }}>
                              <Pause className="h-3.5 w-3.5 mr-2 text-amber-500" /> {t('sequences.actions.pause')}
                            </DropdownMenuItem>
                          ) : null}
                          {seq.status !== 'archived' && (
                            <DropdownMenuItem onClick={e => { e.stopPropagation(); handleStatusChange(seq.id, 'archived'); }}>
                              <Archive className="h-3.5 w-3.5 mr-2" /> {t('sequences.actions.archive')}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={e => { e.stopPropagation(); handleDelete(seq.id); }}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" /> {t('sequences.actions.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('sequences.dialog.title')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm">{t('sequences.dialog.nameLabel')} <span className="text-destructive">*</span></Label>
              <Input
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder={t('sequences.dialog.namePlaceholder')}
                className="text-sm"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">{t('sequences.dialog.descriptionLabel')}</Label>
              <Textarea
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder={t('sequences.dialog.descriptionPlaceholder')}
                className="text-sm resize-none min-h-[72px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">{t('sequences.dialog.goalLabel')}</Label>
              <Input
                value={form.goal}
                onChange={e => setForm(p => ({ ...p, goal: e.target.value }))}
                placeholder={t('sequences.dialog.goalPlaceholder')}
                className="text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>{t('sequences.dialog.cancel')}</Button>
            <Button
              onClick={handleCreate}
              disabled={!form.name.trim() || creating}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white gap-1.5"
            >
              {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              {t('sequences.dialog.createBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
