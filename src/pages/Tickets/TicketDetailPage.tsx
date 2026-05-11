import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, Loader2, Paperclip, User, Link2, ChevronRight, Plus,
  CheckSquare, Bug, Bookmark, Zap, GitBranch, Lock, Globe, Send, X,
  ArrowRight, Calendar, Clock, AlertTriangle, Eye, MoreHorizontal,
  Edit3, Flame, ChevronsUp, ChevronUp, ChevronDown, Minus, Tag,
  ExternalLink, FileText, Image, Film, Archive, Copy, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CustomFieldInput, CustomFieldDefinition, formatCustomFieldValue } from '@/components/CustomFieldInput';

// ── Types ────────────────────────────────────────────────────────────────────

interface Status { id: number; name: string; color: string; category: string; }
interface IssueType { id: number; name: string; icon?: string; color: string; }
interface TicketUser { id: number; full_name?: string; email?: string; profile_picture_url?: string; }
interface Comment { id: number; body: string; is_internal: boolean; created_at: string; author?: TicketUser; }
interface Activity { id: number; action: string; field_name?: string; old_value?: string; new_value?: string; created_at: string; actor?: TicketUser; metadata_?: Record<string, any>; }
interface ScreenField { field: string; label: string; required: boolean; }
interface Transition { id: number; name: string; to_status?: Status; screen_fields?: ScreenField[]; post_actions?: Record<string, any>; }
interface TicketSummary { id: number; ticket_number: string; title: string; status?: Status; issue_type?: IssueType; priority?: string; }
interface TicketLink { id: number; link_type: string; source_ticket?: TicketSummary; target_ticket?: TicketSummary; }
interface Attachment { id: number; file_name: string; file_url: string; file_size?: number; mime_type?: string; created_at: string; uploaded_by?: TicketUser; }

interface TicketDetail {
  id: number; ticket_number: string; title: string; description?: string;
  priority: string; status?: Status; issue_type?: IssueType;
  assignee?: TicketUser; reporter?: TicketUser;
  due_date?: string; start_date?: string; resolved_at?: string;
  story_points?: number; time_estimate?: number; time_spent?: number;
  labels?: string[]; created_at: string; updated_at: string;
  project?: { id: number; name: string; key: string; color?: string; };
  comments: Comment[]; attachments: Attachment[]; activities: Activity[];
  watchers: TicketUser[]; source_links: TicketLink[]; target_links: TicketLink[];
  sub_tickets: TicketSummary[]; parent?: TicketSummary;
  available_transitions: Transition[];
  custom_fields?: Record<string, any>;
}

// ── Constants ────────────────────────────────────────────────────────────────

const ISSUE_ICONS: Record<string, any> = {
  bug: Bug, task: CheckSquare, story: Bookmark, epic: Zap, 'sub-task': GitBranch,
};

const PRIORITY_CONFIG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  critical: { icon: Flame,      color: 'text-red-600',    bg: 'bg-red-50 border-red-200',    label: 'Critical' },
  high:     { icon: ChevronsUp, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', label: 'High' },
  medium:   { icon: ChevronUp,  color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200',  label: 'Medium' },
  low:      { icon: ChevronDown,color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200',    label: 'Low' },
  none:     { icon: Minus,      color: 'text-slate-400',  bg: 'bg-muted border-muted',          label: 'None' },
};

const FIELD_LABELS: Record<string, string> = {
  title: 'Title', description: 'Description', priority: 'Priority',
  assignee_id: 'Assignee', status_id: 'Status', status: 'Status',
  due_date: 'Due Date', start_date: 'Start Date', resolved_at: 'Resolved At',
  story_points: 'Story Points', time_estimate: 'Estimate', time_spent: 'Time Spent',
  labels: 'Labels', parent_id: 'Parent',
};

const FILE_ICONS: Record<string, any> = {
  'image': Image, 'video': Film, 'audio': Film,
  'application/pdf': FileText, 'application/zip': Archive,
};

function getFileIcon(mime?: string) {
  if (!mime) return FileText;
  const base = mime.split('/')[0];
  return FILE_ICONS[mime] || FILE_ICONS[base] || FileText;
}

function fmtMinutes(mins?: number | null) {
  if (!mins) return null;
  const h = Math.floor(mins / 60), m = mins % 60;
  return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

function fmtDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtRelative(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return fmtDate(d);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function UserAvatar({ user, size = 'sm' }: { user?: TicketUser; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'lg' ? 'w-9 h-9' : size === 'md' ? 'w-7 h-7' : 'w-6 h-6';
  const txt = size === 'lg' ? 'text-sm' : 'text-xs';
  const initials = user?.full_name
    ? user.full_name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
    : user?.email?.[0]?.toUpperCase() || '?';
  return (
    <Avatar className={cls}>
      <AvatarFallback className={cn(txt, 'font-medium bg-indigo-100 text-indigo-700')}>{initials}</AvatarFallback>
    </Avatar>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.none;
  const Icon = cfg.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded border', cfg.bg, cfg.color)}>
      <Icon className="w-3 h-3" />{cfg.label}
    </span>
  );
}

function StatusBadge({ status }: { status?: Status }) {
  if (!status) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full text-white"
      style={{ backgroundColor: status.color }}>
      <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
      {status.name}
    </span>
  );
}

function ActivityItem({ act }: { act: Activity }) {
  const actor = act.actor?.full_name || act.actor?.email || 'System';
  const time = fmtRelative(act.created_at);

  const body = (() => {
    if (act.action === 'created') return <span>created this ticket</span>;
    if (act.action === 'transitioned') return (
      <span className="flex items-center gap-1.5 flex-wrap">
        <span>moved to</span>
        {act.old_value && <span className="px-1.5 py-0.5 rounded bg-muted text-xs line-through text-muted-foreground">{act.old_value}</span>}
        {act.old_value && act.new_value && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
        {act.new_value && (
          <span className="px-2 py-0.5 rounded-full text-white text-xs font-medium"
            style={{ backgroundColor: act.metadata_?.to_status_color || '#6366f1' }}>
            {act.new_value}
          </span>
        )}
      </span>
    );
    if (act.action === 'commented') return <span>added a comment</span>;
    if (act.action === 'attachment_added') return <span>attached <strong>{act.new_value || 'a file'}</strong></span>;
    if (act.action === 'attachment_removed') return <span>removed attachment <strong>{act.old_value || 'a file'}</strong></span>;
    if (act.action === 'updated' && act.field_name) {
      const label = FIELD_LABELS[act.field_name] || act.field_name;
      return (
        <span className="flex items-center gap-1.5 flex-wrap">
          <span>changed <strong>{label}</strong></span>
          {act.old_value && <span className="px-1.5 py-0.5 rounded bg-muted text-xs line-through text-muted-foreground">{act.old_value}</span>}
          {act.new_value && <><ArrowRight className="w-3 h-3 text-muted-foreground" /><span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-xs font-medium">{act.new_value}</span></>}
        </span>
      );
    }
    return <span>{act.action.replace(/_/g, ' ')}</span>;
  })();

  return (
    <div className="flex gap-3 group">
      <div className="flex flex-col items-center flex-shrink-0">
        <UserAvatar user={act.actor} size="sm" />
        <div className="w-px flex-1 bg-border mt-1 group-last:hidden" />
      </div>
      <div className="pb-4 flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground">{actor}</span>
          <span className="text-sm text-muted-foreground">{body}</span>
          <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap">
            {new Date(act.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Transition Dialog ─────────────────────────────────────────────────────────

interface TransitionDialogProps {
  open: boolean; onOpenChange: (v: boolean) => void;
  transition: Transition | null; ticket: TicketDetail;
  teamMembers: TicketUser[];
  customFieldDefs: CustomFieldDefinition[];
  onExecute: (id: number, fv: Record<string, any>, comment: string) => Promise<void>;
}

function TransitionDialog({ open, onOpenChange, transition, ticket, teamMembers, customFieldDefs, onExecute }: TransitionDialogProps) {
  const [comment, setComment] = useState('');
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken')}` });

  useEffect(() => { if (open) { setComment(''); setFieldValues({}); } }, [open]);
  if (!transition) return null;

  const fields = transition.screen_fields || [];
  const hasCommentField = fields.some(f => f.field === 'comment');
  const otherFields = fields.filter(f => f.field !== 'comment');
  const setFv = (k: string, v: any) => setFieldValues(p => ({ ...p, [k]: v }));

  const handleAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingFile(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      await axios.post(`/api/v1/tickets/${ticket.id}/attachments`, fd, { headers: headers() });
      toast.success('Attachment uploaded'); setFv('attachment', file.name);
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Upload failed'); }
    finally { setUploadingFile(false); e.target.value = ''; }
  };

  const submit = async () => {
    setLoading(true);
    try { await onExecute(transition.id, fieldValues, comment); onOpenChange(false); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="font-semibold">{transition.name}</span>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <StatusBadge status={transition.to_status} />
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          {otherFields.map(sf => {
            if (sf.field === 'priority') return (
              <div key={sf.field} className="space-y-1.5">
                <Label className="text-sm font-medium">{sf.label}{sf.required && <span className="text-destructive ml-0.5">*</span>}</Label>
                <Select value={fieldValues.priority || ''} onValueChange={v => setFv('priority', v)}>
                  <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                  <SelectContent>{['critical','high','medium','low','none'].map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            );
            if (sf.field === 'assignee_id') return (
              <div key={sf.field} className="space-y-1.5">
                <Label className="text-sm font-medium">{sf.label}{sf.required && <span className="text-destructive ml-0.5">*</span>}</Label>
                <Select value={fieldValues.assignee_id ? String(fieldValues.assignee_id) : '__none__'}
                  onValueChange={v => setFv('assignee_id', v === '__none__' ? null : parseInt(v))}>
                  <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Unassigned</SelectItem>
                    {teamMembers.map(u => <SelectItem key={u.id} value={String(u.id)}>{u.full_name || u.email}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            );
            if (sf.field === 'due_date') return (
              <div key={sf.field} className="space-y-1.5">
                <Label className="text-sm font-medium">{sf.label}{sf.required && <span className="text-destructive ml-0.5">*</span>}</Label>
                <Input type="date" value={fieldValues.due_date || ''} onChange={e => setFv('due_date', e.target.value)} />
              </div>
            );
            if (sf.field === 'attachment') return (
              <div key={sf.field} className="space-y-1.5">
                <Label className="text-sm font-medium">{sf.label}{sf.required && <span className="text-destructive ml-0.5">*</span>}</Label>
                <label className={cn('flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 border-dashed text-sm cursor-pointer hover:bg-muted/40 transition-colors',
                  uploadingFile && 'opacity-50 pointer-events-none', fieldValues.attachment && 'border-green-400 bg-green-50')}>
                  {uploadingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                  <span>{fieldValues.attachment || 'Click to attach a file'}</span>
                  <input type="file" className="hidden" onChange={handleAttach} disabled={uploadingFile} />
                </label>
              </div>
            );
            // custom field — look up definition for proper input type
            const cfDef = customFieldDefs.find(d => d.name === sf.field);
            if (cfDef) return (
              <div key={sf.field} className="space-y-1.5">
                <Label className="text-sm font-medium">{sf.label}{sf.required && <span className="text-destructive ml-0.5">*</span>}</Label>
                <CustomFieldInput
                  definition={cfDef}
                  value={fieldValues[sf.field] ?? null}
                  onChange={v => setFv(sf.field, v)}
                  users={teamMembers.map(u => ({ id: u.id, full_name: u.full_name, email: u.email ?? '' }))}
                />
              </div>
            );
            return (
              <div key={sf.field} className="space-y-1.5">
                <Label className="text-sm font-medium">{sf.label}{sf.required && <span className="text-destructive ml-0.5">*</span>}</Label>
                <Input value={fieldValues[sf.field] || ''} onChange={e => setFv(sf.field, e.target.value)} />
              </div>
            );
          })}

          {(hasCommentField || fields.length === 0) && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                {hasCommentField ? (fields.find(f => f.field === 'comment')?.label || 'Comment') : 'Comment'}
                {fields.find(f => f.field === 'comment')?.required
                  ? <span className="text-destructive ml-0.5">*</span>
                  : <span className="text-muted-foreground font-normal text-xs ml-1">(optional)</span>}
              </Label>
              <Textarea placeholder="Add a comment about this transition…" rows={3}
                value={comment} onChange={e => setComment(e.target.value)} className="resize-none" />
            </div>
          )}

          {transition.post_actions?.assign_to && transition.post_actions.assign_to.type !== 'none' && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
              <User className="w-3.5 h-3.5 flex-shrink-0" />
              <span>After transition: auto-assigned to <strong>
                {transition.post_actions.assign_to.type === 'reporter' ? 'reporter' :
                 transition.post_actions.assign_to.type === 'role' ? `role "${transition.post_actions.assign_to.value}"` : 'nobody'}
              </strong></span>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={loading}
            className="text-white"
            style={transition.to_status ? { backgroundColor: transition.to_status.color, borderColor: transition.to_status.color } : {}}>
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {transition.name}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Sidebar field row ─────────────────────────────────────────────────────────

function SidebarField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-2 items-start py-2.5 border-b last:border-0">
      <span className="text-xs text-muted-foreground font-medium pt-0.5 leading-tight">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TicketDetailPage() {
  const { projectKey, ticketNumber } = useParams<{ projectKey: string; ticketNumber: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<TicketUser[]>([]);
  const [customFieldDefs, setCustomFieldDefs] = useState<CustomFieldDefinition[]>([]);

  // Edit states
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState('');
  const [editingEstimate, setEditingEstimate] = useState(false);
  const [estimateDraft, setEstimateDraft] = useState('');

  // Comment
  const [comment, setComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentFocused, setCommentFocused] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<'comments' | 'activity' | 'attachments'>('comments');
  const [uploadingFile, setUploadingFile] = useState(false);

  // Transition dialog
  const [transitionDialog, setTransitionDialog] = useState<Transition | null>(null);

  // Link dialog
  const [showAddLink, setShowAddLink] = useState(false);
  const [linkSearch, setLinkSearch] = useState('');
  const [linkSearchResults, setLinkSearchResults] = useState<TicketSummary[]>([]);
  const [linkType, setLinkType] = useState('relates_to');
  const [searchingLinks, setSearchingLinks] = useState(false);

  // Parent picker
  const [showParentPicker, setShowParentPicker] = useState(false);
  const [parentSearch, setParentSearch] = useState('');
  const [parentSearchResults, setParentSearchResults] = useState<TicketSummary[]>([]);

  // Copy state
  const [copied, setCopied] = useState(false);

  const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken')}` });

  const load = useCallback(async () => {
    try {
      const [ticketsRes, usersRes, cfDefsRes] = await Promise.all([
        axios.get('/api/v1/tickets/', { headers: headers(), params: { limit: 500 } }),
        axios.get('/api/v1/users/', { headers: headers() }),
        axios.get('/api/v1/custom-fields/', { headers: headers(), params: { entity_type: 'ticket' } }).catch(() => ({ data: [] })),
      ]);
      const found = ticketsRes.data.find((t: any) => t.ticket_number === ticketNumber);
      if (!found) { toast.error('Ticket not found'); navigate(`/dashboard/tickets/${projectKey}/board`); return; }
      const detailRes = await axios.get(`/api/v1/tickets/${found.id}`, { headers: headers() });
      setTicket(detailRes.data);
      setTeamMembers(usersRes.data || []);
      setCustomFieldDefs(cfDefsRes.data || []);
    } catch { toast.error('Failed to load ticket'); }
    finally { setLoading(false); }
  }, [ticketNumber]);

  useEffect(() => { load(); }, [load]);

  const update = async (data: Record<string, any>) => {
    if (!ticket) return;
    try {
      const res = await axios.put(`/api/v1/tickets/${ticket.id}`, data, { headers: headers() });
      setTicket(prev => prev ? { ...prev, ...res.data } : null);
      await load();
    } catch { toast.error('Failed to update ticket'); }
  };

  const executeTransition = async (transitionId: number, fieldValues: Record<string, any>, transitionComment: string) => {
    if (!ticket) return;
    try {
      await axios.post(`/api/v1/tickets/${ticket.id}/transition`, {
        transition_id: transitionId,
        comment: transitionComment || undefined,
        field_values: Object.keys(fieldValues).length > 0 ? fieldValues : undefined,
      }, { headers: headers() });
      const t = ticket.available_transitions.find(tr => tr.id === transitionId);
      toast.success(`Moved to ${t?.to_status?.name || 'new status'}`);
      load();
    } catch (e: any) { toast.error(e.response?.data?.detail || 'Transition failed'); throw e; }
  };

  const openTransition = (t: Transition) => {
    if ((t.screen_fields && t.screen_fields.length > 0) || (t.post_actions && Object.keys(t.post_actions).length > 0)) {
      setTransitionDialog(t);
    } else {
      executeTransition(t.id, {}, '');
    }
  };

  const submitComment = async () => {
    if (!comment.trim() || !ticket) return;
    setSubmittingComment(true);
    try {
      await axios.post(`/api/v1/tickets/${ticket.id}/comments`, { body: comment, is_internal: isInternal }, { headers: headers() });
      setComment(''); setCommentFocused(false); load();
    } catch { toast.error('Failed to add comment'); }
    finally { setSubmittingComment(false); }
  };

  const uploadAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !ticket) return;
    setUploadingFile(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      await axios.post(`/api/v1/tickets/${ticket.id}/attachments`, fd, { headers: headers() });
      toast.success('File uploaded'); load();
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Upload failed'); }
    finally { setUploadingFile(false); e.target.value = ''; }
  };

  const deleteAttachment = async (id: number) => {
    if (!ticket || !confirm('Remove this attachment?')) return;
    try { await axios.delete(`/api/v1/tickets/${ticket.id}/attachments/${id}`, { headers: headers() }); load(); }
    catch { toast.error('Failed to remove attachment'); }
  };

  const searchTickets = async (q: string, setter: (r: TicketSummary[]) => void, setLoading_: (v: boolean) => void) => {
    if (!q.trim() || !ticket) { setter([]); return; }
    setLoading_(true);
    try {
      const res = await axios.get('/api/v1/tickets/', { headers: headers(), params: { project_id: ticket.project?.id, search: q, limit: 10 } });
      setter(res.data.filter((t: any) => t.id !== ticket.id));
    } catch { setter([]); }
    finally { setLoading_(false); }
  };

  const addLink = async (targetId: number) => {
    if (!ticket) return;
    try {
      await axios.post(`/api/v1/tickets/${ticket.id}/links`, { target_ticket_id: targetId, link_type: linkType }, { headers: headers() });
      toast.success('Link added'); setShowAddLink(false); setLinkSearch(''); setLinkSearchResults([]); load();
    } catch (e: any) { toast.error(e.response?.data?.detail || 'Failed to add link'); }
  };

  const removeLink = async (linkId: number) => {
    if (!ticket) return;
    try { await axios.delete(`/api/v1/tickets/${ticket.id}/links/${linkId}`, { headers: headers() }); load(); }
    catch { toast.error('Failed to remove link'); }
  };

  const setParent = async (parentId: number | null) => {
    await update({ parent_id: parentId });
    setShowParentPicker(false); setParentSearch(''); setParentSearchResults([]);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );
  if (!ticket) return null;

  const IssueIcon = ISSUE_ICONS[ticket.issue_type?.name?.toLowerCase() || ''] || CheckSquare;
  const allLinks = [...(ticket.source_links || []), ...(ticket.target_links || [])];
  const isOverdue = ticket.due_date && new Date(ticket.due_date) < new Date() && !ticket.resolved_at;
  const isEpic = ticket.issue_type?.name?.toLowerCase() === 'epic';

  return (
    <TooltipProvider>
      {/* ── Transition Dialog ── */}
      <TransitionDialog open={!!transitionDialog} onOpenChange={v => { if (!v) setTransitionDialog(null); }}
        transition={transitionDialog} ticket={ticket} teamMembers={teamMembers}
        customFieldDefs={customFieldDefs} onExecute={executeTransition} />

      {/* ── Add Link Dialog ── */}
      <Dialog open={showAddLink} onOpenChange={v => { setShowAddLink(v); if (!v) { setLinkSearch(''); setLinkSearchResults([]); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Link2 className="w-4 h-4" />Link to Ticket</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Link type</Label>
              <Select value={linkType} onValueChange={setLinkType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[['blocks','Blocks'],['is_blocked_by','Is blocked by'],['duplicates','Duplicates'],['is_duplicated_by','Is duplicated by'],['relates_to','Relates to'],['clones','Clones']].map(([v,l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Search ticket</Label>
              <Input placeholder="Ticket number or title…" value={linkSearch} autoFocus
                onChange={e => { setLinkSearch(e.target.value); searchTickets(e.target.value, setLinkSearchResults, setSearchingLinks); }} />
            </div>
            {searchingLinks && <p className="text-xs text-muted-foreground">Searching…</p>}
            {linkSearchResults.length > 0 && (
              <div className="border rounded-lg divide-y max-h-52 overflow-y-auto">
                {linkSearchResults.map(r => {
                  const RIcon = ISSUE_ICONS[r.issue_type?.name?.toLowerCase() || ''] || CheckSquare;
                  return (
                    <button key={r.id} className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-muted/50 text-left text-sm"
                      onClick={() => addLink(r.id)}>
                      <RIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: r.issue_type?.color || '#6366f1' }} />
                      <span className="font-mono text-xs text-muted-foreground">{r.ticket_number}</span>
                      <span className="flex-1 truncate">{r.title}</span>
                      {r.status && <span className="text-[10px] px-1.5 py-0.5 rounded-full text-white flex-shrink-0" style={{ backgroundColor: r.status.color }}>{r.status.name}</span>}
                    </button>
                  );
                })}
              </div>
            )}
            {linkSearch && !searchingLinks && linkSearchResults.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">No tickets found</p>}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowAddLink(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Parent Picker Dialog ── */}
      <Dialog open={showParentPicker} onOpenChange={v => { setShowParentPicker(v); if (!v) { setParentSearch(''); setParentSearchResults([]); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" />Set Parent Epic</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <Input placeholder="Search by ticket number or title…" value={parentSearch} autoFocus
              onChange={e => { setParentSearch(e.target.value); searchTickets(e.target.value, setParentSearchResults, () => {}); }} />
            {ticket.parent && (
              <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/5 text-sm"
                onClick={() => setParent(null)}>
                <X className="w-3.5 h-3.5" />Remove parent epic
              </button>
            )}
            {parentSearchResults.length > 0 && (
              <div className="border rounded-lg divide-y max-h-52 overflow-y-auto">
                {parentSearchResults.map(r => {
                  const RIcon = ISSUE_ICONS[r.issue_type?.name?.toLowerCase() || ''] || CheckSquare;
                  return (
                    <button key={r.id} className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-muted/50 text-left text-sm"
                      onClick={() => setParent(r.id)}>
                      <RIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: r.issue_type?.color || '#6366f1' }} />
                      <span className="font-mono text-xs text-muted-foreground">{r.ticket_number}</span>
                      <span className="flex-1 truncate">{r.title}</span>
                      {r.issue_type && <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{r.issue_type.name}</span>}
                    </button>
                  );
                })}
              </div>
            )}
            {parentSearch && parentSearchResults.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">No tickets found</p>}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowParentPicker(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col h-full bg-background">
        {/* ── Sticky Header ── */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10 flex-shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => navigate(`/dashboard/tickets/${projectKey}/board`)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-1 text-sm text-muted-foreground min-w-0">
            <button className="hover:text-foreground transition-colors truncate max-w-[120px]"
              onClick={() => navigate('/dashboard/tickets')}>
              Projects
            </button>
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
            <button className="hover:text-foreground transition-colors truncate max-w-[140px]"
              onClick={() => navigate(`/dashboard/tickets/${projectKey}/board`)}>
              {ticket.project?.name}
            </button>
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="font-mono text-foreground font-medium">{ticket.ticket_number}</span>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={copyLink}>
                  {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy link</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-[1200px] mx-auto flex gap-0">

            {/* ── Left Column ── */}
            <div className="flex-1 min-w-0 px-8 py-6 space-y-6">

              {/* Issue meta + title */}
              <div className="space-y-3">
                {/* Parent epic breadcrumb */}
                {ticket.parent && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <button className="hover:text-foreground hover:underline font-medium"
                      onClick={() => navigate(`/dashboard/tickets/${projectKey}/${ticket.parent?.ticket_number}`)}>
                      {ticket.parent.ticket_number} · {ticket.parent.title}
                    </button>
                  </div>
                )}

                {/* Type + number + badges row */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold border"
                    style={{ borderColor: ticket.issue_type?.color + '40', color: ticket.issue_type?.color, backgroundColor: ticket.issue_type?.color + '12' }}>
                    <IssueIcon className="w-3.5 h-3.5" />
                    {ticket.issue_type?.name || 'Task'}
                  </div>
                  <span className="font-mono text-xs text-muted-foreground font-medium">{ticket.ticket_number}</span>
                  <PriorityBadge priority={ticket.priority} />
                  {isOverdue && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded border bg-red-50 border-red-200 text-red-600">
                      <AlertTriangle className="w-3 h-3" />Overdue
                    </span>
                  )}
                </div>

                {/* Title */}
                {editingTitle ? (
                  <div className="space-y-2">
                    <Input autoFocus value={titleDraft}
                      onChange={e => setTitleDraft(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { update({ title: titleDraft }); setEditingTitle(false); } if (e.key === 'Escape') setEditingTitle(false); }}
                      className="text-xl font-bold border-none shadow-none px-0 focus-visible:ring-0 h-auto py-0" />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => { update({ title: titleDraft }); setEditingTitle(false); }}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingTitle(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <h1 className="text-2xl font-bold leading-tight tracking-tight cursor-text hover:text-primary/90 transition-colors group flex items-start gap-2"
                    onClick={() => { setTitleDraft(ticket.title); setEditingTitle(true); }}>
                    {ticket.title}
                    <Edit3 className="w-4 h-4 opacity-0 group-hover:opacity-40 mt-1 flex-shrink-0" />
                  </h1>
                )}

                {/* Status + Transitions row */}
                <div className="flex items-center gap-3 flex-wrap">
                  <StatusBadge status={ticket.status} />
                  {ticket.available_transitions.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {ticket.available_transitions.map(t => (
                        <button key={t.id}
                          className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-all hover:opacity-90 active:scale-95"
                          style={{ borderColor: t.to_status?.color + '60', color: t.to_status?.color, backgroundColor: t.to_status?.color + '12' }}
                          onClick={() => openTransition(t)}>
                          <ArrowRight className="w-3 h-3" />
                          {t.name}
                          {t.screen_fields && t.screen_fields.length > 0 && <span className="opacity-50">·</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</Label>
                  {!editingDesc && (
                    <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                      onClick={() => { setDescDraft(ticket.description || ''); setEditingDesc(true); }}>
                      <Edit3 className="w-3 h-3" />Edit
                    </button>
                  )}
                </div>
                {editingDesc ? (
                  <div className="space-y-2">
                    <Textarea value={descDraft} onChange={e => setDescDraft(e.target.value)}
                      rows={6} placeholder="Describe this ticket…" className="resize-y text-sm" autoFocus />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => { update({ description: descDraft }); setEditingDesc(false); }}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingDesc(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className={cn(
                    'min-h-[60px] rounded-lg text-sm leading-relaxed cursor-text transition-colors',
                    ticket.description ? 'text-foreground' : 'text-muted-foreground italic'
                  )}
                    onClick={() => { setDescDraft(ticket.description || ''); setEditingDesc(true); }}>
                    {ticket.description
                      ? <pre className="font-sans whitespace-pre-wrap">{ticket.description}</pre>
                      : 'Click to add a description…'}
                  </div>
                )}
              </div>

              {/* Labels */}
              {ticket.labels && ticket.labels.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                  {ticket.labels.map(l => (
                    <span key={l} className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-muted/80 text-muted-foreground border">{l}</span>
                  ))}
                </div>
              )}

              {/* Child Tickets (Epics) */}
              {isEpic && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Child Tickets <span className="font-normal normal-case">({ticket.sub_tickets?.length || 0})</span>
                    </Label>
                    <Button variant="ghost" size="sm" className="h-6 text-xs gap-1 text-muted-foreground hover:text-foreground"
                      onClick={() => navigate(`/dashboard/tickets/${projectKey}/board`)}>
                      <Plus className="w-3 h-3" />Add child
                    </Button>
                  </div>
                  {(!ticket.sub_tickets || ticket.sub_tickets.length === 0) ? (
                    <div className="py-4 text-center border-2 border-dashed rounded-lg">
                      <p className="text-sm text-muted-foreground">No child tickets yet</p>
                    </div>
                  ) : (
                    <div className="rounded-lg border divide-y overflow-hidden">
                      {ticket.sub_tickets.map(child => {
                        const CI = ISSUE_ICONS[child.issue_type?.name?.toLowerCase() || ''] || CheckSquare;
                        const pc = PRIORITY_CONFIG[child.priority || 'none'];
                        const PI = pc?.icon || Minus;
                        return (
                          <button key={child.id}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors text-left"
                            onClick={() => navigate(`/dashboard/tickets/${projectKey}/${child.ticket_number}`)}>
                            <CI className="w-4 h-4 flex-shrink-0" style={{ color: child.issue_type?.color || '#6366f1' }} />
                            <span className="font-mono text-xs text-muted-foreground">{child.ticket_number}</span>
                            <span className="flex-1 text-sm truncate">{child.title}</span>
                            <PI className={cn('w-3.5 h-3.5 flex-shrink-0', pc?.color || 'text-slate-400')} />
                            {child.status && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full text-white flex-shrink-0"
                                style={{ backgroundColor: child.status.color }}>{child.status.name}</span>
                            )}
                            <ExternalLink className="w-3 h-3 text-muted-foreground/40 flex-shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Linked Tickets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Linked Tickets {allLinks.length > 0 && <span className="font-normal normal-case">({allLinks.length})</span>}
                  </Label>
                  <Button variant="ghost" size="sm" className="h-6 text-xs gap-1 text-muted-foreground hover:text-foreground"
                    onClick={() => { setShowAddLink(true); setLinkSearch(''); setLinkSearchResults([]); }}>
                    <Plus className="w-3 h-3" />Add link
                  </Button>
                </div>
                {allLinks.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-1">No links</p>
                ) : (
                  <div className="rounded-lg border divide-y overflow-hidden">
                    {allLinks.map(link => {
                      const other = link.source_ticket?.id === ticket.id ? link.target_ticket : link.source_ticket;
                      const OI = ISSUE_ICONS[other?.issue_type?.name?.toLowerCase() || ''] || CheckSquare;
                      return (
                        <div key={link.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 group">
                          <OI className="w-4 h-4 flex-shrink-0" style={{ color: other?.issue_type?.color || '#6366f1' }} />
                          <span className="text-xs text-muted-foreground capitalize whitespace-nowrap font-medium bg-muted px-1.5 py-0.5 rounded">
                            {link.link_type.replace(/_/g, ' ')}
                          </span>
                          <button className="font-mono text-xs text-primary hover:underline"
                            onClick={() => navigate(`/dashboard/tickets/${projectKey}/${other?.ticket_number}`)}>
                            {other?.ticket_number}
                          </button>
                          <span className="flex-1 text-sm truncate text-foreground">{other?.title}</span>
                          {other?.status && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full text-white flex-shrink-0"
                              style={{ backgroundColor: other.status.color }}>{other.status.name}</span>
                          )}
                          <Button variant="ghost" size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive flex-shrink-0"
                            onClick={() => removeLink(link.id)}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Comments / Attachments / Activity tabs */}
              <div className="space-y-4">
                {/* Tab bar */}
                <div className="flex gap-0 border-b">
                  {(['comments', 'attachments', 'activity'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className={cn(
                        'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                        activeTab === tab
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
                      )}>
                      {tab === 'comments' && <>Comments {ticket.comments.length > 0 && <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">{ticket.comments.length}</span>}</>}
                      {tab === 'attachments' && <>Attachments {(ticket.attachments?.length || 0) > 0 && <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">{ticket.attachments.length}</span>}</>}
                      {tab === 'activity' && 'Activity'}
                    </button>
                  ))}
                </div>

                {/* Comments tab */}
                {activeTab === 'comments' && (
                  <div className="space-y-5">
                    {ticket.comments.map(c => (
                      <div key={c.id} className={cn('flex gap-3', c.is_internal && 'opacity-80')}>
                        <UserAvatar user={c.author} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className={cn('rounded-xl p-4 border',
                            c.is_internal ? 'bg-amber-50/60 border-amber-200/60' : 'bg-muted/40 border-border')}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-semibold">{c.author?.full_name || c.author?.email}</span>
                              {c.is_internal && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">
                                  <Lock className="w-2.5 h-2.5" />Internal
                                </span>
                              )}
                              <span className="ml-auto text-xs text-muted-foreground">
                                {new Date(c.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{c.body}</p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Add comment */}
                    <div className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <User className="w-3.5 h-3.5 text-indigo-600" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <Textarea
                          placeholder="Add a comment…"
                          value={comment}
                          onChange={e => setComment(e.target.value)}
                          onFocus={() => setCommentFocused(true)}
                          rows={commentFocused ? 4 : 2}
                          className="resize-none transition-all text-sm"
                        />
                        {(commentFocused || comment) && (
                          <div className="flex items-center justify-between">
                            <Button variant={isInternal ? 'secondary' : 'ghost'} size="sm" className="h-7 text-xs gap-1.5"
                              onClick={() => setIsInternal(!isInternal)}>
                              {isInternal ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                              {isInternal ? 'Internal Note' : 'Public Comment'}
                            </Button>
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost" className="h-7 text-xs"
                                onClick={() => { setComment(''); setCommentFocused(false); }}>Cancel</Button>
                              <Button size="sm" className="h-7 text-xs gap-1.5"
                                onClick={submitComment} disabled={!comment.trim() || submittingComment}>
                                {submittingComment ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                Save
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Attachments tab */}
                {activeTab === 'attachments' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <label className={cn('flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed text-sm cursor-pointer hover:bg-muted/40 hover:border-muted-foreground/30 transition-colors font-medium', uploadingFile && 'opacity-50 pointer-events-none')}>
                        {uploadingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                        {uploadingFile ? 'Uploading…' : 'Attach a file'}
                        <input type="file" className="hidden" onChange={uploadAttachment} disabled={uploadingFile} />
                      </label>
                      <span className="text-xs text-muted-foreground">Files saved to Drive → Tickets/{ticket.project?.key}/{ticket.ticket_number}</span>
                    </div>
                    {(!ticket.attachments || ticket.attachments.length === 0) ? (
                      <div className="py-8 text-center border-2 border-dashed rounded-lg">
                        <Paperclip className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No attachments yet</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2">
                        {ticket.attachments.map(a => {
                          const FIcon = getFileIcon(a.mime_type);
                          const isImg = a.mime_type?.startsWith('image/');
                          return (
                            <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 group transition-colors">
                              <div className="w-9 h-9 rounded-lg bg-background border flex items-center justify-center flex-shrink-0">
                                <FIcon className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <a href={a.file_url} target="_blank" rel="noopener noreferrer"
                                  className="text-sm font-medium hover:underline text-foreground flex items-center gap-1 truncate">
                                  {a.file_name}
                                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-60 flex-shrink-0" />
                                </a>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {a.file_size ? `${(a.file_size / 1024).toFixed(1)} KB · ` : ''}
                                  {a.uploaded_by?.full_name || a.uploaded_by?.email} · {fmtDate(a.created_at)}
                                </p>
                              </div>
                              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                                onClick={() => deleteAttachment(a.id)}>
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Activity tab */}
                {activeTab === 'activity' && (
                  <div className="space-y-0 pt-1">
                    {ticket.activities.length === 0 ? (
                      <div className="py-8 text-center">
                        <p className="text-sm text-muted-foreground">No activity yet</p>
                      </div>
                    ) : (
                      ticket.activities.map(act => <ActivityItem key={act.id} act={act} />)
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Right Sidebar ── */}
            <div className="w-72 flex-shrink-0 border-l bg-muted/20 px-5 py-6">
              <div className="space-y-0">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Details</p>

                <SidebarField label="Assignee">
                  <Select value={String(ticket.assignee?.id || '__none__')}
                    onValueChange={v => update({ assignee_id: v === '__none__' ? null : parseInt(v) })}>
                    <SelectTrigger className="h-7 text-xs border-none shadow-none px-0 hover:bg-muted/50 rounded focus:ring-0 [&>svg]:opacity-40">
                      <SelectValue>
                        {ticket.assignee ? (
                          <div className="flex items-center gap-1.5">
                            <UserAvatar user={ticket.assignee} size="sm" />
                            <span>{ticket.assignee.full_name || ticket.assignee.email}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <div className="w-5 h-5 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                              <User className="w-2.5 h-2.5" />
                            </div>
                            <span>Unassigned</span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Unassigned</SelectItem>
                      {teamMembers.map(u => (
                        <SelectItem key={u.id} value={String(u.id)}>
                          <div className="flex items-center gap-2">
                            <UserAvatar user={u} size="sm" />
                            {u.full_name || u.email}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </SidebarField>

                <SidebarField label="Reporter">
                  {ticket.reporter ? (
                    <div className="flex items-center gap-1.5">
                      <UserAvatar user={ticket.reporter} size="sm" />
                      <span className="text-xs">{ticket.reporter.full_name || ticket.reporter.email}</span>
                    </div>
                  ) : <span className="text-xs text-muted-foreground">—</span>}
                </SidebarField>

                <SidebarField label="Priority">
                  <Select value={ticket.priority} onValueChange={v => update({ priority: v })}>
                    <SelectTrigger className="h-7 text-xs border-none shadow-none px-0 hover:bg-muted/50 rounded focus:ring-0 [&>svg]:opacity-40">
                      <SelectValue><PriorityBadge priority={ticket.priority} /></SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRIORITY_CONFIG).map(([v, cfg]) => {
                        const PI = cfg.icon;
                        return (
                          <SelectItem key={v} value={v}>
                            <div className="flex items-center gap-2">
                              <PI className={cn('w-3.5 h-3.5', cfg.color)} />
                              {cfg.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </SidebarField>

                {/* Parent Epic */}
                {!isEpic && (
                  <SidebarField label="Parent Epic">
                    {ticket.parent ? (
                      <div className="flex items-center gap-1.5 group">
                        <Zap className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        <button className="text-xs font-mono text-primary hover:underline flex-1 text-left truncate"
                          onClick={() => navigate(`/dashboard/tickets/${projectKey}/${ticket.parent?.ticket_number}`)}>
                          {ticket.parent.ticket_number}
                        </button>
                        <div className="opacity-0 group-hover:opacity-100 flex gap-0.5">
                          <button className="text-muted-foreground hover:text-primary p-0.5"
                            onClick={() => { setShowParentPicker(true); setParentSearch(''); setParentSearchResults([]); }}>
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button className="text-muted-foreground hover:text-destructive p-0.5" onClick={() => setParent(null)}>
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                        onClick={() => { setShowParentPicker(true); setParentSearch(''); setParentSearchResults([]); }}>
                        <Plus className="w-3 h-3" />Link to epic
                      </button>
                    )}
                  </SidebarField>
                )}

                <SidebarField label="Due Date">
                  <div className="space-y-0.5">
                    <Input type="date" className="h-7 text-xs border-none shadow-none px-0 bg-transparent focus-visible:ring-0 hover:bg-muted/50 rounded cursor-pointer"
                      value={ticket.due_date ? ticket.due_date.slice(0, 10) : ''}
                      onChange={e => update({ due_date: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                    {isOverdue && <p className="text-[10px] text-red-500 font-medium flex items-center gap-1"><AlertTriangle className="w-2.5 h-2.5" />Overdue</p>}
                  </div>
                </SidebarField>

                <SidebarField label="Estimate">
                  {editingEstimate ? (
                    <div className="flex gap-1 items-center">
                      <Input type="number" min="0" step="0.5" autoFocus
                        className="h-6 text-xs w-20 py-0 px-1.5"
                        value={estimateDraft}
                        onChange={e => setEstimateDraft(e.target.value)}
                        onBlur={() => {
                          const hrs = parseFloat(estimateDraft);
                          update({ time_estimate: isNaN(hrs) || hrs <= 0 ? null : Math.round(hrs * 60) });
                          setEditingEstimate(false);
                        }}
                        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setEditingEstimate(false); }}
                      />
                      <span className="text-xs text-muted-foreground">h</span>
                    </div>
                  ) : (
                    <button className="text-xs text-left hover:text-primary flex items-center gap-1"
                      onClick={() => { setEstimateDraft(ticket.time_estimate ? String(ticket.time_estimate / 60) : ''); setEditingEstimate(true); }}>
                      {ticket.time_estimate
                        ? <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-muted-foreground" />{fmtMinutes(ticket.time_estimate)}</span>
                        : <span className="text-muted-foreground flex items-center gap-1"><Plus className="w-3 h-3" />Add estimate</span>}
                    </button>
                  )}
                </SidebarField>

                {ticket.time_spent != null && ticket.time_spent > 0 && (
                  <SidebarField label="Time Spent">
                    <span className="text-xs flex items-center gap-1"><Clock className="w-3 h-3 text-muted-foreground" />{fmtMinutes(ticket.time_spent)}</span>
                  </SidebarField>
                )}

                {ticket.story_points != null && (
                  <SidebarField label="Story Points">
                    <span className="text-xs font-medium">{ticket.story_points}</span>
                  </SidebarField>
                )}

                <Separator className="my-3" />

                <SidebarField label="Created">
                  <span className="text-xs">{fmtDate(ticket.created_at)}</span>
                </SidebarField>

                <SidebarField label="Updated">
                  <span className="text-xs text-muted-foreground">{fmtRelative(ticket.updated_at)}</span>
                </SidebarField>

                {ticket.resolved_at && (
                  <SidebarField label="Resolved">
                    <span className="text-xs text-green-600 font-medium">{fmtDate(ticket.resolved_at)}</span>
                  </SidebarField>
                )}

                {/* Watchers */}
                {ticket.watchers.length > 0 && (
                  <>
                    <Separator className="my-3" />
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Eye className="w-3 h-3" />Watchers ({ticket.watchers.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {ticket.watchers.map(w => (
                          <Tooltip key={w.id}>
                            <TooltipTrigger>
                              <UserAvatar user={w} size="sm" />
                            </TooltipTrigger>
                            <TooltipContent>{w.full_name || w.email}</TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Custom Fields */}
                {customFieldDefs.length > 0 && (
                  <>
                    <Separator className="my-3" />
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Custom Fields</p>
                      {customFieldDefs.map(def => (
                        <SidebarField key={def.id} label={def.label}>
                          <span className="text-sm">{formatCustomFieldValue(ticket.custom_fields?.[def.name], def)}</span>
                        </SidebarField>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
