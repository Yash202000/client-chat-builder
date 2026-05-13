import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Plus, Save, Loader2, Trash2, GripVertical,
  Mail, MessageSquare, CheckSquare, Clock, Users, Play, Pause,
  ChevronDown, ChevronUp, UserPlus, X, Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import {
  getSequence, updateSequence, enrollContacts, getEnrollments, unenrollContact, updateEnrollmentStatus,
  Sequence, SequenceStep, SequenceEnrollment,
} from '@/services/sequenceService';
import { getTemplates, Template } from '@/services/templateService';
import axios from 'axios';
const getAuthHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken')}` });

const STEP_TYPES = [
  { value: 'email',    labelKey: 'sequences.editor.stepTypes.email',     icon: Mail,           color: 'text-blue-500'   },
  { value: 'sms',      labelKey: 'sequences.editor.stepTypes.sms',       icon: MessageSquare,  color: 'text-green-500'  },
  { value: 'whatsapp', labelKey: 'sequences.editor.stepTypes.whatsapp',  icon: MessageSquare,  color: 'text-emerald-500'},
  { value: 'task',     labelKey: 'sequences.editor.stepTypes.task',      icon: CheckSquare,    color: 'text-amber-500'  },
  { value: 'wait',     labelKey: 'sequences.editor.stepTypes.wait',      icon: Clock,          color: 'text-slate-400'  },
];

const CONDITIONS = [
  { value: 'always',          labelKey: 'sequences.editor.conditions.always' },
  { value: 'if_not_opened',   labelKey: 'sequences.editor.conditions.ifNotOpened' },
  { value: 'if_not_clicked',  labelKey: 'sequences.editor.conditions.ifNotClicked' },
  { value: 'if_not_replied',  labelKey: 'sequences.editor.conditions.ifNotReplied' },
];

const STATUS_COLORS: Record<string, string> = {
  active:      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  paused:      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  completed:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  unsubscribed:'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  failed:      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function StepIcon({ type, className }: { type: string; className?: string }) {
  const meta = STEP_TYPES.find(t => t.value === type) ?? STEP_TYPES[0];
  const Icon = meta.icon;
  return <Icon className={`h-4 w-4 ${meta.color} ${className ?? ''}`} />;
}

function DelayBadge({ days, hours }: { days: number; hours: number }) {
  const { t } = useTranslation();
  if (days === 0 && hours === 0) return <span className="text-xs text-muted-foreground">{t('sequences.editor.delay.immediately')}</span>;
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  return (
    <span className="text-xs text-muted-foreground flex items-center gap-1">
      <Clock className="h-3 w-3" /> {t('sequences.editor.delay.after', { delay: parts.join(' ') })}
    </span>
  );
}

interface StepCardProps {
  step: SequenceStep;
  index: number;
  total: number;
  templates: Template[];
  onChange: (index: number, step: SequenceStep) => void;
  onDelete: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

function StepCard({ step, index, total, templates, onChange, onDelete, onMoveUp, onMoveDown }: StepCardProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);
  const typeMeta = STEP_TYPES.find(t => t.value === step.step_type) ?? STEP_TYPES[0];
  const emailTemplates = templates.filter(t => t.template_type === step.step_type || (step.step_type === 'email' && t.template_type === 'email'));

  return (
    <div className="relative">
      {/* Connector line */}
      {index < total - 1 && (
        <div className="absolute left-[1.85rem] top-full w-px h-4 bg-border z-10" />
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Step header */}
        <div
          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors"
          onClick={() => setExpanded(e => !e)}
        >
          {/* Drag handle placeholder */}
          <GripVertical className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />

          {/* Step number bubble */}
          <div className="h-7 w-7 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-violet-600 dark:text-violet-400">{index + 1}</span>
          </div>

          <StepIcon type={step.step_type} />

          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-foreground capitalize">{t(typeMeta.labelKey)}</span>
            {step.subject && (
              <span className="text-xs text-muted-foreground ml-2 truncate">— {step.subject}</span>
            )}
          </div>

          <DelayBadge days={step.delay_days} hours={step.delay_hours} />

          <div className="flex items-center gap-1 ml-2" onClick={e => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onMoveUp(index)} disabled={index === 0}>
              <ChevronUp className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onMoveDown(index)} disabled={index === total - 1}>
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => onDelete(index)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
        </div>

        {/* Step body */}
        {expanded && (
          <div className="px-4 pb-4 pt-1 border-t border-border space-y-3">
            <div className="grid grid-cols-3 gap-3">
              {/* Type */}
              <div className="space-y-1">
                <Label className="text-xs">{t('sequences.editor.step.type')}</Label>
                <Select value={step.step_type} onValueChange={v => onChange(index, { ...step, step_type: v as any })}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STEP_TYPES.map(st => (
                      <SelectItem key={st.value} value={st.value} className="text-xs">{t(st.labelKey)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Delay days */}
              <div className="space-y-1">
                <Label className="text-xs">{t('sequences.editor.step.delayDays')}</Label>
                <Input
                  type="number"
                  min={0}
                  value={step.delay_days}
                  onChange={e => onChange(index, { ...step, delay_days: parseInt(e.target.value) || 0 })}
                  className="h-8 text-xs"
                />
              </div>
              {/* Delay hours */}
              <div className="space-y-1">
                <Label className="text-xs">{t('sequences.editor.step.delayHours')}</Label>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={step.delay_hours}
                  onChange={e => onChange(index, { ...step, delay_hours: parseInt(e.target.value) || 0 })}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {step.step_type !== 'wait' && step.step_type !== 'task' && (
              <>
                {/* Template picker */}
                <div className="space-y-1">
                  <Label className="text-xs">{t('sequences.editor.step.templateOptional')}</Label>
                  <Select
                    value={step.template_id?.toString() ?? 'none'}
                    onValueChange={v => onChange(index, { ...step, template_id: v === 'none' ? null : parseInt(v) })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder={t('sequences.editor.step.selectTemplate')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="text-xs text-muted-foreground">{t('sequences.editor.step.noTemplate')}</SelectItem>
                      {emailTemplates.map(tmpl => (
                        <SelectItem key={tmpl.id} value={tmpl.id.toString()} className="text-xs">{tmpl.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Subject */}
                {(step.step_type === 'email' || !step.template_id) && (
                  <div className="space-y-1">
                    <Label className="text-xs">
                      {step.step_type === 'email'
                        ? t('sequences.editor.step.subject')
                        : t('sequences.editor.step.subjectCaption')}
                    </Label>
                    <Input
                      value={step.subject ?? ''}
                      onChange={e => onChange(index, { ...step, subject: e.target.value })}
                      placeholder={t('sequences.editor.step.subjectPlaceholder')}
                      className="h-8 text-xs"
                    />
                  </div>
                )}

                {/* Body */}
                {!step.template_id && (
                  <div className="space-y-1">
                    <Label className="text-xs">{t('sequences.editor.step.body')}</Label>
                    <Textarea
                      value={step.body ?? ''}
                      onChange={e => onChange(index, { ...step, body: e.target.value })}
                      placeholder={t('sequences.editor.step.bodyPlaceholder')}
                      className="text-xs min-h-[80px] resize-none"
                    />
                  </div>
                )}
              </>
            )}

            {step.step_type === 'task' && (
              <div className="space-y-1">
                <Label className="text-xs">{t('sequences.editor.step.taskNote')}</Label>
                <Textarea
                  value={step.task_note ?? ''}
                  onChange={e => onChange(index, { ...step, task_note: e.target.value })}
                  placeholder={t('sequences.editor.step.taskNotePlaceholder')}
                  className="text-xs min-h-[72px] resize-none"
                />
              </div>
            )}

            {/* Condition */}
            {step.step_type !== 'wait' && step.step_type !== 'task' && index > 0 && (
              <div className="space-y-1">
                <Label className="text-xs">{t('sequences.editor.step.sendCondition')}</Label>
                <Select value={step.condition} onValueChange={v => onChange(index, { ...step, condition: v as any })}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map(c => (
                      <SelectItem key={c.value} value={c.value} className="text-xs">{t(c.labelKey)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

interface Contact {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
}

export default function SequenceEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [sequence, setSequence] = useState<Sequence | null>(null);
  const [steps, setSteps] = useState<SequenceStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState('');
  const [status, setStatus] = useState('draft');

  const [templates, setTemplates] = useState<Template[]>([]);
  const [enrollments, setEnrollments] = useState<SequenceEnrollment[]>([]);
  const [enrollSheetOpen, setEnrollSheetOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([]);
  const [enrolling, setEnrolling] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);

  useEffect(() => {
    fetchData();
    fetchTemplates();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const seq = await getSequence(parseInt(id!));
      setSequence(seq);
      setName(seq.name);
      setDescription(seq.description ?? '');
      setGoal(seq.goal ?? '');
      setStatus(seq.status);
      setSteps(seq.steps.map(s => ({ ...s })));
      const enrData = await getEnrollments(seq.id);
      setEnrollments(enrData);
    } catch {
      toast({ title: t('sequences.editor.toast.errorTitle'), description: t('sequences.editor.toast.loadFailed'), variant: 'destructive' });
      navigate('/dashboard/crm/sequences');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const data = await getTemplates();
      setTemplates(data);
    } catch {}
  };

  const fetchContacts = async () => {
    try {
      setLoadingContacts(true);
      const res = await axios.get('/api/v1/contacts/', { headers: getAuthHeaders(), params: { limit: 200 } });
      setContacts(res.data);
    } catch {} finally {
      setLoadingContacts(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setNameError(t('sequences.editor.validation.nameRequired'));
      toast({ title: t('sequences.editor.toast.nameRequiredTitle'), variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const updated = await updateSequence(parseInt(id!), {
        name,
        description: description || undefined,
        goal: goal || undefined,
        status,
        steps: steps.map((s, i) => ({
          step_order: i + 1,
          step_type: s.step_type,
          template_id: s.template_id ?? null,
          delay_days: s.delay_days,
          delay_hours: s.delay_hours,
          subject: s.subject,
          body: s.body,
          condition: s.condition,
          task_note: s.task_note,
        })),
      });
      setSequence(updated);
      toast({ title: t('sequences.editor.toast.savedTitle'), description: t('sequences.editor.toast.savedDescription') });
    } catch {
      toast({ title: t('sequences.editor.toast.errorTitle'), description: t('sequences.editor.toast.saveFailed'), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const addStep = () => {
    setSteps(prev => [...prev, {
      step_order: prev.length + 1,
      step_type: 'email',
      delay_days: prev.length === 0 ? 0 : 1,
      delay_hours: 0,
      condition: 'always',
    }]);
  };

  const updateStep = (index: number, step: SequenceStep) => {
    setSteps(prev => prev.map((s, i) => i === index ? step : s));
  };

  const deleteStep = (index: number) => {
    setSteps(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, step_order: i + 1 })));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setSteps(prev => {
      const arr = [...prev];
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      return arr.map((s, i) => ({ ...s, step_order: i + 1 }));
    });
  };

  const moveDown = (index: number) => {
    setSteps(prev => {
      if (index >= prev.length - 1) return prev;
      const arr = [...prev];
      [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
      return arr.map((s, i) => ({ ...s, step_order: i + 1 }));
    });
  };

  const handleEnrollOpen = () => {
    setEnrollSheetOpen(true);
    if (contacts.length === 0) fetchContacts();
  };

  const handleEnroll = async () => {
    if (selectedContactIds.length === 0) return;
    setEnrolling(true);
    try {
      const newEnrollments = await enrollContacts(parseInt(id!), selectedContactIds);
      setEnrollments(prev => [...newEnrollments, ...prev]);
      setSelectedContactIds([]);
      toast({ title: t('sequences.editor.toast.enrolledTitle'), description: t('sequences.editor.toast.enrolledDescription', { count: newEnrollments.length }) });
    } catch {
      toast({ title: t('sequences.editor.toast.errorTitle'), description: t('sequences.editor.toast.enrollFailed'), variant: 'destructive' });
    } finally {
      setEnrolling(false);
    }
  };

  const handleUnenroll = async (enrollmentId: number) => {
    try {
      await unenrollContact(parseInt(id!), enrollmentId);
      setEnrollments(prev => prev.filter(e => e.id !== enrollmentId));
      toast({ title: t('sequences.editor.toast.unenrolledTitle') });
    } catch {
      toast({ title: t('sequences.editor.toast.errorTitle'), description: t('sequences.editor.toast.unenrollFailed'), variant: 'destructive' });
    }
  };

  const handleEnrollmentStatus = async (enrollmentId: number, newStatus: string) => {
    try {
      await updateEnrollmentStatus(parseInt(id!), enrollmentId, newStatus);
      setEnrollments(prev => prev.map(e => e.id === enrollmentId ? { ...e, status: newStatus } : e));
    } catch {
      toast({ title: t('sequences.editor.toast.errorTitle'), description: t('sequences.editor.toast.statusUpdateFailed'), variant: 'destructive' });
    }
  };

  const filteredContacts = contacts.filter(c => {
    const fullName = `${c.first_name ?? ''} ${c.last_name ?? ''} ${c.email ?? ''}`.toLowerCase();
    return fullName.includes(contactSearch.toLowerCase());
  });

  const enrolledContactIds = new Set(
    enrollments.filter(e => e.status === 'active' || e.status === 'paused').map(e => e.contact_id)
  );

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const stats = sequence?.stats;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5 border-b border-border bg-card">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/dashboard/crm/sequences')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <Input
            value={name}
            onChange={e => { setName(e.target.value); if (e.target.value.trim()) setNameError(''); }}
            className={`h-8 text-sm font-semibold bg-transparent border-transparent hover:border-border focus:border-border px-2 w-full${nameError ? ' border-destructive' : ''}`}
            placeholder={t('sequences.editor.namePlaceholder')}
          />
          {nameError && <p className="text-xs text-destructive mt-1">{nameError}</p>}
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-8 w-28 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft" className="text-xs">{t('sequences.editor.statuses.draft')}</SelectItem>
            <SelectItem value="active" className="text-xs">{t('sequences.editor.statuses.active')}</SelectItem>
            <SelectItem value="paused" className="text-xs">{t('sequences.editor.statuses.paused')}</SelectItem>
            <SelectItem value="archived" className="text-xs">{t('sequences.editor.statuses.archived')}</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={handleEnrollOpen}
        >
          <UserPlus className="h-3.5 w-3.5" />
          {t('sequences.editor.enrollContactsButton')}
          {enrollments.length > 0 && (
            <Badge variant="secondary" className="ml-0.5 text-[10px] px-1.5 py-0">{enrollments.length}</Badge>
          )}
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white gap-1.5 h-8"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {t('sequences.editor.saveButton')}
        </Button>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Steps panel */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Stats strip */}
          {stats && stats.total_enrollments > 0 && (
            <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { labelKey: 'sequences.editor.stats.totalEnrolled', value: stats.total_enrollments, color: 'text-foreground' },
                { labelKey: 'sequences.editor.stats.active',        value: stats.active,            color: 'text-emerald-600' },
                { labelKey: 'sequences.editor.stats.completed',     value: stats.completed,         color: 'text-blue-600'    },
                { labelKey: 'sequences.editor.stats.paused',        value: stats.paused,            color: 'text-amber-600'   },
                { labelKey: 'sequences.editor.stats.failed',        value: stats.failed,            color: 'text-red-600'     },
              ].map(s => (
                <div key={s.labelKey} className="bg-card border border-border rounded-lg p-3 text-center">
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground">{t(s.labelKey)}</p>
                </div>
              ))}
            </div>
          )}

          {/* Description + goal */}
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">{t('sequences.editor.descriptionLabel')}</Label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={t('sequences.editor.descriptionPlaceholder')}
                className="text-xs resize-none min-h-[56px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t('sequences.editor.goalLabel')}</Label>
              <Input
                value={goal}
                onChange={e => setGoal(e.target.value)}
                placeholder={t('sequences.editor.goalPlaceholder')}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Steps */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              {t('sequences.editor.stepsHeading')} <span className="text-muted-foreground font-normal">({steps.length})</span>
            </h2>
          </div>

          {steps.length === 0 ? (
            <div className="border-2 border-dashed border-border rounded-xl p-10 flex flex-col items-center gap-3 text-center">
              <div className="h-10 w-10 rounded-full bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
                <Plus className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">{t('sequences.editor.emptyState.title')}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t('sequences.editor.emptyState.description')}</p>
              </div>
              <Button onClick={addStep} size="sm" variant="outline" className="gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" /> {t('sequences.editor.addFirstStepButton')}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {steps.map((step, i) => (
                <StepCard
                  key={i}
                  step={step}
                  index={i}
                  total={steps.length}
                  templates={templates}
                  onChange={updateStep}
                  onDelete={deleteStep}
                  onMoveUp={moveUp}
                  onMoveDown={moveDown}
                />
              ))}
            </div>
          )}

          {/* Add step button */}
          {steps.length > 0 && (
            <div className="mt-4 flex justify-center">
              <Button onClick={addStep} variant="outline" size="sm" className="gap-1.5 text-xs border-dashed">
                <Plus className="h-3.5 w-3.5" /> {t('sequences.editor.addStepButton')}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Enroll contacts sheet */}
      <Sheet open={enrollSheetOpen} onOpenChange={setEnrollSheetOpen}>
        <SheetContent className="w-full sm:w-[480px] sm:max-w-[480px] flex flex-col p-0">
          <SheetHeader className="px-5 py-4 border-b border-border flex-shrink-0">
            <SheetTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-violet-500" />
              {t('sequences.editor.enrollSheet.title')}
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Pick contacts */}
            <div className="px-5 py-4 border-b border-border flex-shrink-0">
              <p className="text-xs font-medium text-muted-foreground mb-3">{t('sequences.editor.enrollSheet.addNewContacts')}</p>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={contactSearch}
                  onChange={e => setContactSearch(e.target.value)}
                  placeholder={t('sequences.editor.enrollSheet.searchPlaceholder')}
                  className="pl-9 h-8 text-xs"
                />
              </div>

              {loadingContacts ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="max-h-44 overflow-y-auto space-y-1">
                  {filteredContacts.filter(c => !enrolledContactIds.has(c.id)).map(c => {
                    const isSelected = selectedContactIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => setSelectedContactIds(prev =>
                          isSelected ? prev.filter(x => x !== c.id) : [...prev, c.id]
                        )}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors text-xs ${
                          isSelected
                            ? 'bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800'
                            : 'hover:bg-muted'
                        }`}
                      >
                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0">
                          {(c.first_name?.[0] ?? c.email?.[0] ?? '?').toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {[c.first_name, c.last_name].filter(Boolean).join(' ') || c.email || t('sequences.editor.enrollSheet.contactFallback', { id: c.id })}
                          </p>
                          {c.email && <p className="text-muted-foreground truncate">{c.email}</p>}
                        </div>
                        {isSelected && <div className="h-4 w-4 rounded-full bg-violet-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-[8px] font-bold">✓</span>
                        </div>}
                      </button>
                    );
                  })}
                  {filteredContacts.filter(c => !enrolledContactIds.has(c.id)).length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      {enrolledContactIds.size > 0
                        ? t('sequences.editor.enrollSheet.allEnrolled')
                        : t('sequences.editor.enrollSheet.noContactsFound')}
                    </p>
                  )}
                </div>
              )}

              {selectedContactIds.length > 0 && (
                <Button
                  className="mt-3 w-full h-8 text-xs gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
                  onClick={handleEnroll}
                  disabled={enrolling}
                >
                  {enrolling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                  {t('sequences.editor.enrollSheet.enrollButton', { count: selectedContactIds.length })}
                </Button>
              )}
            </div>

            {/* Enrolled list */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <p className="text-xs font-medium text-muted-foreground mb-3">
                {t('sequences.editor.enrollSheet.enrolledHeading', { count: enrollments.length })}
              </p>
              {enrollments.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">{t('sequences.editor.enrollSheet.noEnrollments')}</p>
              ) : (
                <div className="space-y-2">
                  {enrollments.map(e => {
                    const c = e.contact;
                    const displayName = c
                      ? [c.first_name, c.last_name].filter(Boolean).join(' ') || c.email || t('sequences.editor.enrollSheet.contactFallback', { id: c.id })
                      : t('sequences.editor.enrollSheet.contactFallback', { id: e.contact_id });
                    return (
                      <div key={e.id} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-muted/40">
                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0">
                          {(displayName[0] ?? '?').toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{displayName}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {t('sequences.editor.enrollSheet.stepInfo', { step: e.current_step })} · {e.enrolled_at ? new Date(e.enrolled_at).toLocaleDateString() : ''}
                          </p>
                        </div>
                        <Badge className={`text-[10px] px-1.5 py-0 capitalize ${STATUS_COLORS[e.status] ?? ''}`} variant="secondary">
                          {e.status}
                        </Badge>
                        {e.status === 'active' ? (
                          <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0"
                            title={t('sequences.editor.enrollSheet.pauseTitle')}
                            onClick={() => handleEnrollmentStatus(e.id, 'paused')}>
                            <Pause className="h-3 w-3 text-amber-500" />
                          </Button>
                        ) : e.status === 'paused' ? (
                          <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0"
                            title={t('sequences.editor.enrollSheet.resumeTitle')}
                            onClick={() => handleEnrollmentStatus(e.id, 'active')}>
                            <Play className="h-3 w-3 text-emerald-500" />
                          </Button>
                        ) : null}
                        <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0 text-muted-foreground hover:text-destructive"
                          title={t('sequences.editor.enrollSheet.unenrollTitle')}
                          onClick={() => handleUnenroll(e.id)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
