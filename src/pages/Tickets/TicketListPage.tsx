import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, Plus, Search, LayoutGrid, Filter, SortAsc,
  ChevronUp, ChevronDown, Loader2, MoreVertical, Trash2,
  Calendar, Bug, CheckSquare, Bookmark, Zap, GitBranch, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Status { id: number; name: string; color: string; category: string; }
interface IssueType { id: number; name: string; icon?: string; color: string; }
interface TicketUser { id: number; full_name?: string; email?: string; }

interface Ticket {
  id: number;
  ticket_number: string;
  title: string;
  priority: string;
  status?: Status;
  issue_type?: IssueType;
  assignee?: TicketUser;
  reporter?: TicketUser;
  due_date?: string;
  comment_count?: number;
  created_at: string;
  labels?: string[];
}

const PRIORITY_BADGE: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200',
  low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200',
  none: 'bg-muted text-muted-foreground',
};

const ISSUE_ICONS: Record<string, any> = {
  bug: Bug, task: CheckSquare, story: Bookmark, epic: Zap, 'sub-task': GitBranch,
};

export default function TicketListPage() {
  const { projectKey } = useParams<{ projectKey: string }>();
  const navigate = useNavigate();
  const [projectId, setProjectId] = useState<number | null>(null);
  const [projectName, setProjectName] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [issueTypes, setIssueTypes] = useState<IssueType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [sortField, setSortField] = useState<'created_at' | 'priority' | 'due_date'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken')}` });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [projRes, typesRes] = await Promise.all([
        axios.get('/api/v1/tickets/projects', { headers: headers() }),
        axios.get('/api/v1/tickets/issue-types', { headers: headers() }),
      ]);
      const proj = projRes.data.find((p: any) => p.key === projectKey);
      if (!proj) { toast.error('Project not found'); navigate('/dashboard/tickets'); return; }
      setProjectId(proj.id);
      setProjectName(proj.name);
      setStatuses(proj.default_workflow?.statuses || []);
      setIssueTypes(typesRes.data);

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
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Statuses</SelectItem>
              {statuses.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterPriority || '__all__'} onValueChange={v => setFilterPriority(v === '__all__' ? '' : v)}>
            <SelectTrigger className="h-8 w-28 text-xs">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
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
              <TableHead className="w-36">Status</TableHead>
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
                    {ticket.status && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ticket.status.color }} />
                        <span className="text-xs">{ticket.status.name}</span>
                      </div>
                    )}
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
