import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  Plus, Loader2, ArrowLeft, List, Search,
  Calendar, MessageSquare, X, Bug, CheckSquare, Bookmark, Zap, GitBranch,
  ArrowRight, Paperclip, User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CustomFieldInput, CustomFieldDefinition, HierarchyNodeOption } from '@/components/CustomFieldInput';

interface Status {
  id: number;
  name: string;
  color: string;
  category: 'todo' | 'in_progress' | 'done';
  position: number;
}

interface IssueType {
  id: number;
  name: string;
  icon?: string;
  color: string;
}

interface TicketUser {
  id: number;
  full_name?: string;
  email?: string;
}

interface Ticket {
  id: number;
  ticket_number: string;
  title: string;
  priority: string;
  status?: Status;
  issue_type?: IssueType;
  assignee?: TicketUser;
  due_date?: string;
  comment_count?: number;
  attachment_count?: number;
  labels?: string[];
  position: number;
}

interface ScreenField { field: string; label: string; required: boolean; }
interface WorkflowTransition {
  id: number;
  name: string;
  from_status_id?: number | null;
  to_status_id: number;
  to_status?: Status;
  screen_fields?: ScreenField[];
  post_actions?: Record<string, any>;
}

interface Project {
  id: number;
  name: string;
  key: string;
  color?: string;
  default_workflow?: {
    statuses: Status[];
    transitions: WorkflowTransition[];
  };
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  none: 'bg-muted text-muted-foreground',
};

const ISSUE_ICONS: Record<string, any> = {
  bug: Bug, task: CheckSquare, story: Bookmark, epic: Zap, 'sub-task': GitBranch,
};

function IssueIcon({ type }: { type?: IssueType }) {
  if (!type) return <CheckSquare className="w-3 h-3" style={{ color: '#6366f1' }} />;
  const Icon = ISSUE_ICONS[type.name.toLowerCase()] || CheckSquare;
  return <Icon className="w-3 h-3" style={{ color: type.color }} />;
}

function PriorityDot({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#3b82f6', none: '#94a3b8',
  };
  return <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: colors[priority] || '#94a3b8' }} />;
}

export default function TicketBoardPage() {
  const { projectKey } = useParams<{ projectKey: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [transitions, setTransitions] = useState<WorkflowTransition[]>([]);
  const [issueTypes, setIssueTypes] = useState<IssueType[]>([]);
  const [teamMembers, setTeamMembers] = useState<TicketUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createStatusId, setCreateStatusId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: '', description: '', priority: 'medium', issue_type_id: '', assignee_id: '',
  });
  const [newTicketCF, setNewTicketCF] = useState<Record<string, any>>({});
  const [customFieldDefs, setCustomFieldDefs] = useState<CustomFieldDefinition[]>([]);
  const [hierarchyNodes, setHierarchyNodes] = useState<HierarchyNodeOption[]>([]);

  // Transition dialog state
  const [pendingDrop, setPendingDrop] = useState<{
    ticketId: number; newStatusId: number; destIndex: number;
    transition: WorkflowTransition;
  } | null>(null);
  const [transitionComment, setTransitionComment] = useState('');
  const [transitionFieldValues, setTransitionFieldValues] = useState<Record<string, any>>({});
  const [executingTransition, setExecutingTransition] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken')}` });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [projRes, typesRes, usersRes] = await Promise.all([
        axios.get('/api/v1/tickets/projects', { headers: headers() }),
        axios.get('/api/v1/tickets/issue-types', { headers: headers() }),
        axios.get('/api/v1/users/', { headers: headers() }),
      ]);
      const proj = projRes.data.find((p: Project) => p.key === projectKey);
      if (!proj) { toast.error('Project not found'); navigate('/dashboard/tickets'); return; }

      setProject(proj);

      // Load custom fields scoped to this project + hierarchy nodes
      const [cfRes, htRes] = await Promise.all([
        axios.get('/api/v1/custom-fields/', { headers: headers(), params: { entity_type: 'ticket', project_id: proj.id } }).catch(() => ({ data: [] })),
        axios.get('/api/v1/hierarchy/types', { headers: headers() }).catch(() => ({ data: [] })),
      ]);
      setCustomFieldDefs(cfRes.data || []);
      const types: { id: number; name: string }[] = htRes.data || [];
      const nodeResponses = await Promise.all(
        types.map((t: { id: number }) => axios.get(`/api/v1/hierarchy/types/${t.id}/nodes`, { headers: headers() }).catch(() => ({ data: [] })))
      );
      setHierarchyNodes(nodeResponses.flatMap((r: any) => r.data));
      setIssueTypes(typesRes.data);
      setTeamMembers(usersRes.data || []);

      const wfStatuses = proj.default_workflow?.statuses || [];
      setStatuses(wfStatuses.sort((a: Status, b: Status) => a.position - b.position));
      setTransitions(proj.default_workflow?.transitions || []);

      const ticketsRes = await axios.get('/api/v1/tickets/', {
        headers: headers(),
        params: { project_id: proj.id, limit: 500 },
      });
      setTickets(ticketsRes.data);
    } catch {
      toast.error('Failed to load board');
    } finally {
      setLoading(false);
    }
  }, [projectKey]);

  useEffect(() => { load(); }, [load]);

  const ticketsByStatus = (statusId: number) => {
    return tickets
      .filter(t => t.status?.id === statusId)
      .filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.ticket_number.toLowerCase().includes(search.toLowerCase()))
      .filter(t => !filterAssignee || String(t.assignee?.id) === filterAssignee)
      .filter(t => !filterPriority || t.priority === filterPriority)
      .sort((a, b) => a.position - b.position);
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const ticketId = parseInt(draggableId);
    const newStatusId = parseInt(destination.droppableId);
    const oldStatusId = parseInt(source.droppableId);

    if (newStatusId === oldStatusId) return;

    // Find matching transition (from current status or wildcard "from any")
    const matchedTransition = transitions.find(tr =>
      tr.to_status_id === newStatusId &&
      (tr.from_status_id === null || tr.from_status_id === undefined || tr.from_status_id === oldStatusId)
    );

    const hasScreenFields = matchedTransition?.screen_fields && matchedTransition.screen_fields.length > 0;

    if (matchedTransition && hasScreenFields) {
      // Show transition dialog — don't move yet
      setTransitionComment('');
      setTransitionFieldValues({});
      setPendingDrop({ ticketId, newStatusId, destIndex: destination.index, transition: matchedTransition });
    } else {
      // No screen fields needed — move directly (with transition id if we have one, else plain status update)
      applyMove(ticketId, newStatusId, destination.index, matchedTransition?.id);
    }
  };

  const applyMove = async (ticketId: number, newStatusId: number, destIndex: number, transitionId?: number) => {
    setTickets(prev => prev.map(t =>
      t.id === ticketId
        ? { ...t, status: statuses.find(s => s.id === newStatusId) || t.status, position: destIndex }
        : t
    ));
    try {
      if (transitionId) {
        await axios.post(`/api/v1/tickets/${ticketId}/transition`,
          { transition_id: transitionId },
          { headers: headers() });
      } else {
        await axios.put(`/api/v1/tickets/${ticketId}`,
          { status_id: newStatusId, position: destIndex },
          { headers: headers() });
      }
    } catch {
      toast.error('Failed to move ticket');
      load();
    }
  };

  const submitTransitionDrop = async () => {
    if (!pendingDrop) return;
    const { ticketId, newStatusId, destIndex, transition } = pendingDrop;

    // Validate required fields
    const fields = transition.screen_fields || [];
    for (const sf of fields) {
      if (!sf.required) continue;
      if (sf.field === 'comment' && (!transitionComment || !transitionComment.trim())) {
        toast.error(`"${sf.label}" is required`); return;
      }
      if (sf.field === 'attachment' && !transitionFieldValues.attachment) {
        toast.error(`"${sf.label}" is required`); return;
      }
      if (!['comment', 'attachment'].includes(sf.field) &&
          (transitionFieldValues[sf.field] === undefined || transitionFieldValues[sf.field] === null || transitionFieldValues[sf.field] === '')) {
        toast.error(`"${sf.label}" is required`); return;
      }
    }

    setExecutingTransition(true);
    try {
      await axios.post(`/api/v1/tickets/${ticketId}/transition`, {
        transition_id: transition.id,
        comment: transitionComment || undefined,
        field_values: Object.keys(transitionFieldValues).length > 0 ? transitionFieldValues : undefined,
      }, { headers: headers() });

      toast.success(`Moved to ${transition.to_status?.name || 'new status'}`);
      setPendingDrop(null);
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Transition failed');
    } finally {
      setExecutingTransition(false);
    }
  };

  const handleTransitionAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingDrop) return;
    setUploadingAttachment(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      await axios.post(`/api/v1/tickets/${pendingDrop.ticketId}/attachments`, fd, { headers: headers() });
      toast.success('Attachment uploaded');
      setTransitionFieldValues(prev => ({ ...prev, attachment: file.name }));
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploadingAttachment(false);
      e.target.value = '';
    }
  };

  const openCreateInColumn = (statusId: number) => {
    setCreateStatusId(statusId);
    setNewTicket({ title: '', description: '', priority: 'medium', issue_type_id: '', assignee_id: '' });
    setNewTicketCF({});
    setShowCreate(true);
  };

  const submitCreate = async () => {
    if (!newTicket.title.trim() || !project) return;
    setCreating(true);
    try {
      const cfPayload = Object.fromEntries(Object.entries(newTicketCF).filter(([, v]) => v != null && v !== ''));
      await axios.post('/api/v1/tickets/', {
        project_id: project.id,
        title: newTicket.title,
        description: newTicket.description || undefined,
        priority: newTicket.priority,
        status_id: createStatusId || undefined,
        issue_type_id: newTicket.issue_type_id ? parseInt(newTicket.issue_type_id) : undefined,
        assignee_id: newTicket.assignee_id ? parseInt(newTicket.assignee_id) : undefined,
        custom_fields: Object.keys(cfPayload).length > 0 ? cfPayload : undefined,
      }, { headers: headers() });
      toast.success('Ticket created');
      setShowCreate(false);
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to create ticket');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  const hasFilters = search || filterAssignee || filterPriority;

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-6 py-3 border-b bg-background flex-shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/dashboard/tickets')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: project?.color || '#6366f1' }}>
            {project?.key?.[0]}
          </div>
          <span className="font-semibold">{project?.name}</span>
          <Badge variant="secondary" className="text-xs">{project?.key}</Badge>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
            <Input className="pl-8 h-8 w-48 text-sm" placeholder="Search tickets..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={filterPriority || '__all__'} onValueChange={v => setFilterPriority(v === '__all__' ? '' : v)}>
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Priorities</SelectItem>
              {['critical', 'high', 'medium', 'low', 'none'].map(p => (
                <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="icon" className="h-8 w-8"
              onClick={() => { setSearch(''); setFilterAssignee(''); setFilterPriority(''); }}>
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-8"
            onClick={() => navigate(`/dashboard/tickets/${projectKey}/list`)}>
            <List className="w-3.5 h-3.5 mr-1.5" />List
          </Button>
          <Button variant="outline" size="sm" className="h-8"
            onClick={() => navigate(`/dashboard/tickets/${projectKey}/backlog`)}>
            Backlog
          </Button>
          <Button variant="outline" size="sm" className="h-8"
            onClick={() => navigate(`/dashboard/tickets/${projectKey}/analytics`)}>
            Analytics
          </Button>
          <Button size="sm" className="h-8" onClick={() => openCreateInColumn(statuses[0]?.id)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />Create
          </Button>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-3 p-4 h-full" style={{ minWidth: `${statuses.length * 280 + 32}px` }}>
            {statuses.map(status => {
              const columnTickets = ticketsByStatus(status.id);
              return (
                <div key={status.id} className="flex flex-col w-64 flex-shrink-0">
                  {/* Column header */}
                  <div className="flex items-center justify-between mb-2 px-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: status.color }} />
                      <span className="text-sm font-medium">{status.name}</span>
                      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                        {columnTickets.length}
                      </span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6"
                      onClick={() => openCreateInColumn(status.id)}>
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  {/* Cards */}
                  <Droppable droppableId={String(status.id)}>
                    {(provided, snapshot) => (
                      <div ref={provided.innerRef} {...provided.droppableProps}
                        className={cn(
                          'flex-1 overflow-y-auto space-y-2 rounded-lg p-1 min-h-[200px] transition-colors',
                          snapshot.isDraggingOver ? 'bg-accent/50' : 'bg-muted/30'
                        )}>
                        {columnTickets.map((ticket, index) => (
                          <Draggable key={ticket.id} draggableId={String(ticket.id)} index={index}>
                            {(drag, snap) => (
                              <div ref={drag.innerRef} {...drag.draggableProps} {...drag.dragHandleProps}
                                className={cn(
                                  'bg-background border rounded-lg p-3 cursor-pointer hover:shadow-sm transition-shadow text-sm',
                                  snap.isDragging && 'shadow-md rotate-1'
                                )}
                                onClick={() => navigate(`/dashboard/tickets/${projectKey}/${ticket.ticket_number}`)}>
                                <div className="flex items-start gap-2 mb-2">
                                  <IssueIcon type={ticket.issue_type} />
                                  <span className="text-xs text-muted-foreground font-mono flex-shrink-0">
                                    {ticket.ticket_number}
                                  </span>
                                </div>
                                <p className="font-medium leading-snug line-clamp-2 mb-2">{ticket.title}</p>
                                {ticket.labels && ticket.labels.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-2">
                                    {ticket.labels.slice(0, 3).map(l => (
                                      <span key={l} className="text-xs bg-muted px-1.5 py-0.5 rounded">{l}</span>
                                    ))}
                                  </div>
                                )}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <PriorityDot priority={ticket.priority} />
                                    <span className={cn('text-xs px-1.5 py-0.5 rounded-full capitalize', PRIORITY_COLORS[ticket.priority])}>
                                      {ticket.priority}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    {(ticket.comment_count || 0) > 0 && (
                                      <div className="flex items-center gap-0.5 text-xs">
                                        <MessageSquare className="w-3 h-3" />
                                        {ticket.comment_count}
                                      </div>
                                    )}
                                    {ticket.due_date && (
                                      <div className="flex items-center gap-0.5 text-xs">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(ticket.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                      </div>
                                    )}
                                    {ticket.assignee && (
                                      <Avatar className="w-5 h-5">
                                        <AvatarFallback className="text-xs">
                                          {ticket.assignee.full_name?.[0] || ticket.assignee.email?.[0] || '?'}
                                        </AvatarFallback>
                                      </Avatar>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {columnTickets.length === 0 && !snapshot.isDraggingOver && (
                          <div className="text-center text-xs text-muted-foreground py-4">
                            No tickets
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>

      {/* Transition Dialog (board drag-drop) */}
      <Dialog open={!!pendingDrop} onOpenChange={v => { if (!v) setPendingDrop(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{pendingDrop?.transition.name}</span>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              {pendingDrop?.transition.to_status && (
                <span className="px-2 py-0.5 rounded-full text-xs text-white font-medium"
                  style={{ backgroundColor: pendingDrop.transition.to_status.color }}>
                  {pendingDrop.transition.to_status.name}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {(pendingDrop?.transition.screen_fields || []).map(sf => {
              if (sf.field === 'priority') return (
                <div key={sf.field} className="space-y-1.5">
                  <Label>{sf.label}{sf.required && <span className="text-destructive ml-0.5">*</span>}</Label>
                  <Select value={transitionFieldValues.priority || ''}
                    onValueChange={v => setTransitionFieldValues(p => ({ ...p, priority: v }))}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select priority" /></SelectTrigger>
                    <SelectContent>
                      {['critical', 'high', 'medium', 'low', 'none'].map(p => (
                        <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
              if (sf.field === 'assignee_id') return (
                <div key={sf.field} className="space-y-1.5">
                  <Label>{sf.label}{sf.required && <span className="text-destructive ml-0.5">*</span>}</Label>
                  <Select value={transitionFieldValues.assignee_id ? String(transitionFieldValues.assignee_id) : '__none__'}
                    onValueChange={v => setTransitionFieldValues(p => ({ ...p, assignee_id: v === '__none__' ? null : parseInt(v) }))}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Unassigned</SelectItem>
                      {teamMembers.map(u => (
                        <SelectItem key={u.id} value={String(u.id)}>{u.full_name || u.email}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
              if (sf.field === 'due_date') return (
                <div key={sf.field} className="space-y-1.5">
                  <Label>{sf.label}{sf.required && <span className="text-destructive ml-0.5">*</span>}</Label>
                  <Input type="date" className="h-8 text-sm"
                    value={transitionFieldValues.due_date || ''}
                    onChange={e => setTransitionFieldValues(p => ({ ...p, due_date: e.target.value }))} />
                </div>
              );
              if (sf.field === 'attachment') return (
                <div key={sf.field} className="space-y-1.5">
                  <Label>{sf.label}{sf.required && <span className="text-destructive ml-0.5">*</span>}</Label>
                  <label className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md border text-sm cursor-pointer hover:bg-muted/50',
                    uploadingAttachment && 'opacity-50 pointer-events-none',
                    transitionFieldValues.attachment && 'border-green-500 bg-green-50',
                  )}>
                    {uploadingAttachment
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Paperclip className="w-3.5 h-3.5" />}
                    <span>{transitionFieldValues.attachment || (uploadingAttachment ? 'Uploading…' : 'Click to attach file')}</span>
                    <input type="file" className="hidden" onChange={handleTransitionAttach} disabled={uploadingAttachment} />
                  </label>
                </div>
              );
              // comment handled below
              return null;
            })}

            {/* Comment field */}
            {(() => {
              const commentField = pendingDrop?.transition.screen_fields?.find(f => f.field === 'comment');
              const hasOtherFields = (pendingDrop?.transition.screen_fields || []).filter(f => f.field !== 'comment').length > 0;
              return (
                <div className="space-y-1.5">
                  <Label>
                    {commentField?.label || 'Comment'}
                    {commentField?.required
                      ? <span className="text-destructive ml-0.5">*</span>
                      : <span className="text-muted-foreground font-normal ml-1">(optional)</span>}
                  </Label>
                  <Textarea placeholder="Add a comment about this transition…" rows={3}
                    value={transitionComment} onChange={e => setTransitionComment(e.target.value)} />
                </div>
              );
            })()}

            {/* Post-action hint */}
            {pendingDrop?.transition.post_actions?.assign_to &&
              pendingDrop.transition.post_actions.assign_to.type !== 'none' && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-700">
                <User className="w-3.5 h-3.5 flex-shrink-0" />
                <span>
                  After transition: ticket will be assigned to{' '}
                  {pendingDrop.transition.post_actions.assign_to.type === 'reporter' ? 'the reporter' :
                   pendingDrop.transition.post_actions.assign_to.type === 'role'
                     ? `role "${pendingDrop.transition.post_actions.assign_to.value}"`
                     : 'nobody'}
                </span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDrop(null)}>Cancel</Button>
            <Button onClick={submitTransitionDrop} disabled={executingTransition}
              style={pendingDrop?.transition.to_status ? { backgroundColor: pendingDrop.transition.to_status.color } : {}}>
              {executingTransition ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {pendingDrop?.transition.name}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg flex flex-col max-h-[90vh]">
          <DialogHeader className="shrink-0">
            <DialogTitle>Create Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1 overflow-y-auto flex-1 pr-1">
            <div>
              <Input placeholder="Ticket title *" value={newTicket.title}
                onChange={e => setNewTicket(t => ({ ...t, title: e.target.value }))}
                autoFocus />
            </div>
            <Textarea placeholder="Description (optional)" rows={3} value={newTicket.description}
              onChange={e => setNewTicket(t => ({ ...t, description: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select value={newTicket.issue_type_id} onValueChange={v => setNewTicket(t => ({ ...t, issue_type_id: v }))}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Issue type" />
                  </SelectTrigger>
                  <SelectContent>
                    {issueTypes.map(it => (
                      <SelectItem key={it.id} value={String(it.id)}>{it.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Priority</Label>
                <Select value={newTicket.priority} onValueChange={v => setNewTicket(t => ({ ...t, priority: v }))}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['critical', 'high', 'medium', 'low', 'none'].map(p => (
                      <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Assignee</Label>
              <Select value={newTicket.assignee_id || '__none__'} onValueChange={v => setNewTicket(t => ({ ...t, assignee_id: v === '__none__' ? '' : v }))}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Unassigned</SelectItem>
                  {teamMembers.map(u => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.full_name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {customFieldDefs.length > 0 && (
              <div className="space-y-3 pt-2 border-t">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Custom Fields</p>
                {customFieldDefs.map(def => (
                  <div key={def.id} className="space-y-1">
                    <Label className="text-xs">{def.label}{def.required && <span className="text-red-500 ml-0.5">*</span>}</Label>
                    <CustomFieldInput
                      definition={def}
                      value={newTicketCF[def.name] ?? null}
                      onChange={v => setNewTicketCF(cf => ({ ...cf, [def.name]: v }))}
                      hierarchyNodes={hierarchyNodes}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter className="shrink-0 pt-2 border-t">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={submitCreate} disabled={creating || !newTicket.title.trim()}>
              {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
