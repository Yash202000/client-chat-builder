import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, Plus, Search, LayoutGrid,
  ChevronUp, ChevronDown, Loader2, MoreVertical, Trash2,
  Bug, CheckSquare, Bookmark, Zap, GitBranch, X,
  ArrowRight, Paperclip, User, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────────────────

interface Status { id: number; name: string; color: string; category: string; }
interface IssueType { id: number; name: string; icon?: string; color: string; }
interface TicketUser { id: number; full_name?: string; email?: string; }
interface ScreenField { field: string; label: string; required: boolean; }
interface WorkflowTransition {
  id: number; name: string;
  from_status_id?: number | null;
  to_status_id: number; to_status?: Status;
  screen_fields?: ScreenField[];
  post_actions?: Record<string, any>;
}

interface Ticket {
  id: number; ticket_number: string; title: string; priority: string;
  status?: Status; issue_type?: IssueType; assignee?: TicketUser; reporter?: TicketUser;
  due_date?: string; comment_count?: number; created_at: string; labels?: string[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_BADGE: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-blue-100 text-blue-700 border-blue-200',
  none: 'bg-muted text-muted-foreground border-transparent',
};

const ISSUE_ICONS: Record<string, any> = {
  bug: Bug, task: CheckSquare, story: Bookmark, epic: Zap, 'sub-task': GitBranch,
};

// ── Transition Dialog ─────────────────────────────────────────────────────────

interface TransitionDialogProps {
  open: boolean; onOpenChange: (v: boolean) => void;
  transition: WorkflowTransition | null;
  ticketId: number; teamMembers: TicketUser[];
  onDone: () => void;
}

function TransitionDialog({ open, onOpenChange, transition, ticketId, teamMembers, onDone }: TransitionDialogProps) {
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
      await axios.post(`/api/v1/tickets/${ticketId}/attachments`, fd, { headers: headers() });
      toast.success('Attachment uploaded'); setFv('attachment', file.name);
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Upload failed'); }
    finally { setUploadingFile(false); e.target.value = ''; }
  };

  const submit = async () => {
    for (const sf of fields) {
      if (sf.required && sf.field !== 'comment' && !fieldValues[sf.field]) {
        toast.error(`${sf.label} is required`); return;
      }
      if (sf.required && sf.field === 'comment' && !comment.trim()) {
        toast.error('Comment is required'); return;
      }
    }
    setLoading(true);
    try {
      await axios.post(`/api/v1/tickets/${ticketId}/transition`, {
        transition_id: transition.id,
        comment: comment || undefined,
        field_values: Object.keys(fieldValues).length > 0 ? fieldValues : undefined,
      }, { headers: headers() });
      toast.success(`Moved to ${transition.to_status?.name || 'new status'}`);
      onOpenChange(false); onDone();
    } catch (e: any) { toast.error(e.response?.data?.detail || 'Transition failed'); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="font-semibold">{transition.name}</span>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            {transition.to_status && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full text-white"
                style={{ backgroundColor: transition.to_status.color }}>
                <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
                {transition.to_status.name}
              </span>
            )}
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

// ── Status Cell ───────────────────────────────────────────────────────────────

interface StatusCellProps {
  ticket: Ticket;
  statuses: Status[];
  transitions: WorkflowTransition[];
  onTransitionSelect: (ticket: Ticket, transition: WorkflowTransition) => void;
  onDirectStatusChange: (ticket: Ticket, statusId: number) => void;
}

function StatusCell({ ticket, statuses, transitions, onTransitionSelect, onDirectStatusChange }: StatusCellProps) {
  const [open, setOpen] = useState(false);

  // All statuses except the current one — same as board columns
  const targetStatuses = statuses.filter(s => s.id !== ticket.status?.id);

  const handleClick = (targetStatus: Status, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    // Find a matching transition (from current status or wildcard)
    const transition = transitions.find(t =>
      (t.from_status_id === ticket.status?.id || t.from_status_id == null) &&
      t.to_status_id === targetStatus.id
    );
    const hasFields = transition?.screen_fields && transition.screen_fields.length > 0;
    const hasPostActions = transition?.post_actions && Object.keys(transition.post_actions).length > 0;
    if (transition && (hasFields || hasPostActions)) {
      // Has screen fields or post-actions — open the dialog
      onTransitionSelect(ticket, transition);
    } else {
      // No transition defined, or transition with no fields — direct status update
      onDirectStatusChange(ticket, targetStatus.id);
    }
  };

  if (!ticket.status) return <span className="text-xs text-muted-foreground">—</span>;

  if (targetStatuses.length === 0) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ticket.status.color }} />
        <span className="text-xs">{ticket.status.name}</span>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild onClick={e => e.stopPropagation()}>
        <button className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-muted/60 transition-colors group -ml-2">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ticket.status.color }} />
          <span className="text-xs">{ticket.status.name}</span>
          <ChevronRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-60 transition-opacity" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-1.5" align="start" onClick={e => e.stopPropagation()}>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
          Move to
        </p>
        <div className="space-y-0.5">
          {targetStatuses.map(s => {
            const transition = transitions.find(t =>
              (t.from_status_id === ticket.status?.id || t.from_status_id == null) &&
              t.to_status_id === s.id
            );
            const fieldCount = transition?.screen_fields?.length || 0;
            return (
              <button key={s.id}
                className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-muted/60 transition-colors text-left"
                onClick={e => handleClick(s, e)}>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-sm flex-1">{s.name}</span>
                {fieldCount > 0 && (
                  <span className="text-[10px] text-muted-foreground bg-muted px-1 py-0.5 rounded">
                    {fieldCount} field{fieldCount > 1 ? 's' : ''}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TicketListPage() {
  const { projectKey } = useParams<{ projectKey: string }>();
  const navigate = useNavigate();
  const [projectId, setProjectId] = useState<number | null>(null);
  const [projectName, setProjectName] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [transitions, setTransitions] = useState<WorkflowTransition[]>([]);
  const [issueTypes, setIssueTypes] = useState<IssueType[]>([]);
  const [teamMembers, setTeamMembers] = useState<TicketUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [sortField, setSortField] = useState<'created_at' | 'priority' | 'due_date'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Transition dialog state
  const [pendingTransition, setPendingTransition] = useState<{ ticket: Ticket; transition: WorkflowTransition } | null>(null);

  const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken')}` });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [projRes, typesRes, usersRes] = await Promise.all([
        axios.get('/api/v1/tickets/projects', { headers: headers() }),
        axios.get('/api/v1/tickets/issue-types', { headers: headers() }),
        axios.get('/api/v1/users/', { headers: headers() }),
      ]);
      const proj = projRes.data.find((p: any) => p.key === projectKey);
      if (!proj) { toast.error('Project not found'); navigate('/dashboard/tickets'); return; }
      setProjectId(proj.id);
      setProjectName(proj.name);
      setStatuses(proj.default_workflow?.statuses || []);
      setTransitions(proj.default_workflow?.transitions || []);
      setIssueTypes(typesRes.data);
      setTeamMembers(usersRes.data || []);

      const ticketsRes = await axios.get('/api/v1/tickets/', {
        headers: headers(),
        params: { project_id: proj.id, limit: 500 },
      });
      setTickets(ticketsRes.data);
    } catch {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [projectKey]);

  useEffect(() => { load(); }, [load]);

  // Fetch a single ticket and splice it back into the list (no full reload)
  const refreshTicket = async (ticketId: number) => {
    try {
      const res = await axios.get(`/api/v1/tickets/${ticketId}`, { headers: headers() });
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, ...res.data } : t));
    } catch { /* silent — list still shows stale data rather than breaking */ }
  };

  const directStatusChange = async (ticket: Ticket, statusId: number) => {
    const targetStatus = statuses.find(s => s.id === statusId);
    // Optimistic update — swap status immediately, no flicker
    setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, status: targetStatus } : t));
    try {
      await axios.put(`/api/v1/tickets/${ticket.id}`, { status_id: statusId }, { headers: headers() });
      toast.success(`Moved to ${targetStatus?.name || 'new status'}`);
    } catch (e: any) {
      // Revert on failure
      setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, status: ticket.status } : t));
      toast.error(e.response?.data?.detail || 'Failed to update status');
    }
  };

  const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, none: 4 };

  const filtered = tickets
    .filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.ticket_number.toLowerCase().includes(search.toLowerCase()))
    .filter(t => !filterStatus || String(t.status?.id) === filterStatus)
    .filter(t => !filterPriority || t.priority === filterPriority)
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === 'priority') cmp = (PRIORITY_ORDER[a.priority] || 4) - (PRIORITY_ORDER[b.priority] || 4);
      else if (sortField === 'due_date') cmp = (a.due_date || '').localeCompare(b.due_date || '');
      else cmp = a.created_at.localeCompare(b.created_at);
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const deleteTicket = async (id: number) => {
    if (!confirm('Delete this ticket?')) return;
    try {
      await axios.delete(`/api/v1/tickets/${id}`, { headers: headers() });
      toast.success('Ticket deleted');
      setTickets(prev => prev.filter(t => t.id !== id));
    } catch { toast.error('Failed to delete ticket'); }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 text-muted-foreground opacity-40" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-foreground" />
      : <ChevronDown className="w-3 h-3 text-foreground" />;
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="flex flex-col h-full">
      {/* Transition Dialog */}
      <TransitionDialog
        open={!!pendingTransition}
        onOpenChange={v => { if (!v) setPendingTransition(null); }}
        transition={pendingTransition?.transition ?? null}
        ticketId={pendingTransition?.ticket.id ?? 0}
        teamMembers={teamMembers}
        onDone={() => pendingTransition && refreshTicket(pendingTransition.ticket.id)}
      />

      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-3 border-b bg-background flex-shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/dashboard/tickets')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <span className="font-semibold">{projectName}</span>
        <Badge variant="secondary" className="text-xs">{projectKey}</Badge>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
            <Input className="pl-8 h-8 w-48 text-sm" placeholder="Search..." value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={filterStatus || '__all__'} onValueChange={v => setFilterStatus(v === '__all__' ? '' : v)}>
            <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Statuses</SelectItem>
              {statuses.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterPriority || '__all__'} onValueChange={v => setFilterPriority(v === '__all__' ? '' : v)}>
            <SelectTrigger className="h-8 w-28 text-xs"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All</SelectItem>
              {['critical', 'high', 'medium', 'low', 'none'].map(p => (
                <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(search || filterStatus || filterPriority) && (
            <Button variant="ghost" size="icon" className="h-8 w-8"
              onClick={() => { setSearch(''); setFilterStatus(''); setFilterPriority(''); }}>
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-8"
            onClick={() => navigate(`/dashboard/tickets/${projectKey}/board`)}>
            <LayoutGrid className="w-3.5 h-3.5 mr-1.5" />Board
          </Button>
          <Button size="sm" className="h-8"
            onClick={() => navigate(`/dashboard/tickets/${projectKey}/board`)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />Create
          </Button>
        </div>
      </div>

      {/* Count */}
      <div className="px-6 py-2 text-sm text-muted-foreground border-b">
        {filtered.length} ticket{filtered.length !== 1 ? 's' : ''}
        {(search || filterStatus || filterPriority) && ' (filtered)'}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="w-28">Type</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="w-36 cursor-pointer select-none" onClick={() => toggleSort('priority')}>
                <div className="flex items-center gap-1">Priority <SortIcon field="priority" /></div>
              </TableHead>
              <TableHead className="w-44">Status</TableHead>
              <TableHead className="w-36">Assignee</TableHead>
              <TableHead className="w-32 cursor-pointer select-none" onClick={() => toggleSort('due_date')}>
                <div className="flex items-center gap-1">Due <SortIcon field="due_date" /></div>
              </TableHead>
              <TableHead className="w-32 cursor-pointer select-none" onClick={() => toggleSort('created_at')}>
                <div className="flex items-center gap-1">Created <SortIcon field="created_at" /></div>
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                  No tickets found
                </TableCell>
              </TableRow>
            )}
            {filtered.map(ticket => {
              const IssueIcon = ISSUE_ICONS[ticket.issue_type?.name?.toLowerCase() || ''] || CheckSquare;
              return (
                <TableRow key={ticket.id} className="cursor-pointer hover:bg-accent/50"
                  onClick={() => navigate(`/dashboard/tickets/${projectKey}/${ticket.ticket_number}`)}>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <IssueIcon className="w-3.5 h-3.5 flex-shrink-0"
                        style={{ color: ticket.issue_type?.color || '#6366f1' }} />
                      <span className="text-xs font-mono text-muted-foreground">{ticket.ticket_number}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start gap-2">
                      <span className="font-medium text-sm line-clamp-1">{ticket.title}</span>
                      {ticket.labels && ticket.labels.slice(0, 2).map(l => (
                        <span key={l} className="text-xs bg-muted px-1.5 py-0.5 rounded flex-shrink-0">{l}</span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full capitalize border', PRIORITY_BADGE[ticket.priority])}>
                      {ticket.priority}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusCell
                      ticket={ticket}
                      statuses={statuses}
                      transitions={transitions}
                      onTransitionSelect={(t, tr) => setPendingTransition({ ticket: t, transition: tr })}
                      onDirectStatusChange={directStatusChange}
                    />
                  </TableCell>
                  <TableCell>
                    {ticket.assignee ? (
                      <div className="flex items-center gap-1.5">
                        <Avatar className="w-5 h-5">
                          <AvatarFallback className="text-xs">
                            {ticket.assignee.full_name?.[0] || ticket.assignee.email?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs truncate max-w-20">
                          {ticket.assignee.full_name || ticket.assignee.email}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {ticket.due_date ? (
                      <span className={cn('text-xs', new Date(ticket.due_date) < new Date() ? 'text-red-500 font-medium' : 'text-muted-foreground')}>
                        {new Date(ticket.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {new Date(ticket.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreVertical className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-destructive"
                          onClick={e => { e.stopPropagation(); deleteTicket(ticket.id); }}>
                          <Trash2 className="w-3.5 h-3.5 mr-2" />Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
