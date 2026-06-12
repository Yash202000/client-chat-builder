import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MoreHorizontal, Edit, Trash2, Code, PlusCircle, Eye, Search,
  X, MessageSquare, Globe, Instagram, Mail, ArrowLeft, Users,
  Cpu, Zap, Bot, ChevronRight, Filter
} from "lucide-react";
import { Permission } from "@/components/Permission";
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Agent, Session } from "@/types";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { ConversationDetail } from "./ConversationDetail";
import { CreateAgentDialog } from "@/components/CreateAgentDialog";
import { API_BASE_URL } from "@/config/api";
import { useTranslation } from 'react-i18next';
import { useI18n } from '@/hooks/useI18n';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";

// ─── Agent avatar gradient palette ───────────────────────────────────────────
const AGENT_PALETTES = [
  { gradient: 'from-violet-500 to-purple-700', ring: 'ring-violet-500/20', badge: 'bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800' },
  { gradient: 'from-blue-500 to-indigo-700', ring: 'ring-blue-500/20', badge: 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
  { gradient: 'from-emerald-500 to-teal-700', ring: 'ring-emerald-500/20', badge: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  { gradient: 'from-orange-500 to-rose-600', ring: 'ring-orange-500/20', badge: 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800' },
  { gradient: 'from-sky-500 to-cyan-700', ring: 'ring-sky-500/20', badge: 'bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800' },
  { gradient: 'from-fuchsia-500 to-pink-700', ring: 'ring-fuchsia-500/20', badge: 'bg-fuchsia-50 dark:bg-fuchsia-950/30 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-800' },
  { gradient: 'from-violet-500 to-yellow-600', ring: 'ring-violet-500/20', badge: 'bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800' },
  { gradient: 'from-lime-500 to-green-700', ring: 'ring-lime-500/20', badge: 'bg-lime-50 dark:bg-lime-950/30 text-lime-700 dark:text-lime-300 border-lime-200 dark:border-lime-800' },
];

const getAgentPalette = (name: string) => {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AGENT_PALETTES[hash % AGENT_PALETTES.length];
};

// ─── Card animation variants ──────────────────────────────────────────────────
const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1], delay: i * 0.045 },
  }),
};

export const AgentList = () => {
  const { t } = useTranslation();
  const { isRTL } = useI18n();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [agentSearch, setAgentSearch] = useState('');
  const { authFetch, user } = useAuth();
  const companyId = user?.company_id;

  // Filter states for conversations view
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');

  const isWebChannel = (channel?: string) =>
    !channel || channel === 'web' || channel === 'websocket' || channel === 'web_chat';

  const { data: agents, isLoading, isError } = useQuery<Agent[]>({
    queryKey: ['agents', companyId],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/agents/`);
      if (!response.ok) throw new Error("Failed to fetch agents");
      return response.json();
    },
    enabled: !!companyId,
  });

  const { data: sessions, isLoading: isLoadingSessions } = useQuery<Session[]>({
    queryKey: ['sessions', selectedAgent?.id],
    queryFn: async () => {
      if (!selectedAgent) return [];
      const response = await authFetch(`/api/v1/conversations/${selectedAgent.id}/sessions`);
      if (!response.ok) throw new Error("Failed to fetch sessions");
      return response.json();
    },
    enabled: !!selectedAgent,
  });

  const { data: users } = useQuery({
    queryKey: ['users', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const response = await authFetch(`/api/v1/users/`);
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
    enabled: !!companyId && !!selectedAgent,
  });

  const availableChannels = useMemo(() => {
    if (!sessions) return [];
    return [...new Set(sessions.map(s => s.channel).filter(Boolean))];
  }, [sessions]);

  const availableStatuses = useMemo(() => {
    if (!sessions) return [];
    return [...new Set(sessions.map(s => s.status).filter(Boolean))];
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    return sessions.filter(session => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          session.conversation_id?.toLowerCase().includes(query) ||
          session.contact_name?.toLowerCase().includes(query) ||
          session.contact_phone?.toLowerCase().includes(query) ||
          session.first_message_content?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      if (statusFilter !== 'all' && session.status !== statusFilter) return false;
      if (channelFilter !== 'all' && session.channel !== channelFilter) return false;
      if (assigneeFilter !== 'all') {
        if (assigneeFilter === 'unassigned' && session.assignee_id) return false;
        if (assigneeFilter !== 'unassigned' && session.assignee_id !== parseInt(assigneeFilter)) return false;
      }
      return true;
    });
  }, [sessions, searchQuery, statusFilter, channelFilter, assigneeFilter]);

  const filteredAgents = useMemo(() => {
    if (!agents) return [];
    if (!agentSearch) return agents;
    const q = agentSearch.toLowerCase();
    return agents.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.llm_provider?.toLowerCase().includes(q) ||
      a.model_name?.toLowerCase().includes(q)
    );
  }, [agents, agentSearch]);

  const getChannelIcon = (channel: string) => {
    switch (channel?.toLowerCase()) {
      case 'whatsapp': return (
        <svg className="h-4 w-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      );
      case 'web': return <Globe className="h-4 w-4 text-blue-500" />;
      case 'instagram': return <Instagram className="h-4 w-4 text-pink-500" />;
      case 'messenger': return (
        <svg className="h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.301 2.246.464 3.443.464 6.627 0 12-4.974 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.259L19.752 8l-6.561 6.963z" />
        </svg>
      );
      case 'telegram': return (
        <svg className="h-4 w-4 text-sky-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      );
      case 'gmail': return <Mail className="h-4 w-4 text-red-500" />;
      default: return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusConfig = (status: string) => {
    const map: Record<string, { bg: string; text: string; dot: string }> = {
      active:   { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
      inactive: { bg: 'bg-muted', text: 'text-muted-foreground', dot: 'bg-muted-foreground' },
      assigned: { bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' },
      pending:  { bg: 'bg-violet-50 dark:bg-violet-950/30', text: 'text-violet-700 dark:text-violet-400', dot: 'bg-violet-500' },
      resolved: { bg: 'bg-violet-50 dark:bg-violet-950/30', text: 'text-violet-700 dark:text-violet-400', dot: 'bg-violet-500' },
      archived: { bg: 'bg-muted', text: 'text-muted-foreground', dot: 'bg-muted-foreground' },
    };
    return map[status] || map.inactive;
  };

  const clearFilters = () => {
    setSearchQuery(''); setStatusFilter('all'); setChannelFilter('all'); setAssigneeFilter('all');
  };
  const hasActiveFilters = searchQuery || statusFilter !== 'all' || channelFilter !== 'all' || assigneeFilter !== 'all';

  const deleteAgentMutation = useMutation({
    mutationFn: (agentId: number) => authFetch(`/api/v1/agents/${agentId}`, { method: "DELETE" }),
    onSuccess: (res) => {
      if (!res.ok) throw new Error('Failed to delete agent');
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast({ title: t('agents.agentDeleted') });
    },
    onError: (error: any) => {
      toast({ title: t('agents.deleteFailed'), description: error.message, variant: "destructive" });
    },
  });

  const handleCopyEmbedCode = (agentId: number) => {
    const embedCode = `<script\n    src="${API_BASE_URL}/widget/widget.js"\n    id="heygenally-widget-script"\n    data-agent-id="${agentId}"\n    data-company-id="${companyId}"\n    data-backend-url="${API_BASE_URL}">\n</script>\n<div id="heygenally-widget"></div>`;
    navigator.clipboard.writeText(embedCode);
    toast({ title: t('agents.embedCodeCopied') });
  };

  // ─── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-6 w-32 bg-muted rounded-md animate-pulse" />
          <div className="h-9 w-28 bg-muted rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-52 rounded-xl bg-muted animate-pulse" style={{ animationDelay: `${i * 0.07}s` }} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
          <Bot className="h-7 w-7 text-destructive" />
        </div>
        <p className="text-base font-medium text-foreground mb-1">{t('agents.error')}</p>
        <p className="text-sm text-muted-foreground">Could not load agents. Please try again.</p>
      </div>
    );
  }

  // ─── Conversation detail view ─────────────────────────────────────────────
  if (selectedAgent && selectedSessionId) {
    return (
      <ConversationDetail
        agentId={selectedAgent.id}
        sessionId={selectedSessionId}
        readOnly={true}
        onBack={() => setSelectedSessionId(null)}
      />
    );
  }

  // ─── Sessions view ─────────────────────────────────────────────────────────
  if (selectedAgent) {
    const palette = getAgentPalette(selectedAgent.name);
    return (
      <div className="space-y-4 sm:space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setSelectedAgent(null); clearFilters(); }}
            className="h-9 w-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${palette.gradient} flex items-center justify-center flex-shrink-0`}>
            <span className="text-white text-xs font-bold">{selectedAgent.name.substring(0, 2).toUpperCase()}</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground leading-tight">
              {t('agents.conversationsFor', { name: selectedAgent.name })}
            </h2>
            <p className="text-xs text-muted-foreground">
              {filteredSessions.length} of {sessions?.length || 0} conversations
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center p-3 rounded-xl border border-border app-surface">
          <div className="relative w-full sm:flex-1 sm:min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={t('conversations.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm bg-background border-border"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="flex-1 sm:flex-none sm:w-[130px] h-8 text-sm bg-background border-border">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {availableStatuses.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="flex-1 sm:flex-none sm:w-[130px] h-8 text-sm bg-background border-border">
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              {availableChannels.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="flex-1 sm:flex-none sm:w-[150px] h-8 text-sm bg-background border-border">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {users?.map((u: any) => (
                <SelectItem key={u.id} value={u.id.toString()}>{u.first_name || u.email}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="h-8 px-3 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1.5">
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>

        {/* Sessions list */}
        <div className="rounded-xl border border-border app-surface overflow-hidden">
          {isLoadingSessions ? (
            <div className="p-8 text-center">
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}
              </div>
            </div>
          ) : filteredSessions.length > 0 ? (
            <div className="divide-y divide-border">
              {filteredSessions.filter(s => s.conversation_id).map((session) => {
                const assignee = users?.find((u: any) => u.id === session.assignee_id);
                const sc = getStatusConfig(session.status);
                return (
                  <div
                    key={session.conversation_id}
                    onClick={() => setSelectedSessionId(session.conversation_id)}
                    className="group flex items-center gap-3 px-4 py-3.5 row-hover-active cursor-pointer"
                  >
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      {getChannelIcon(session.channel)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-foreground truncate">
                          {session.contact_name || session.contact_phone || `Session ${session.conversation_id.substring(0, 8)}…`}
                        </span>
                        {isWebChannel(session.channel) && session.is_client_connected && (
                          <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        )}
                      </div>
                      {session.first_message_content && (
                        <p className="text-xs text-muted-foreground truncate">{session.first_message_content}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium', sc.bg, sc.text)}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', sc.dot)} />
                        <span className="hidden sm:inline">{session.status}</span>
                      </span>
                      {assignee && (
                        <span className="text-xs text-muted-foreground hidden sm:block">
                          {assignee.first_name || assignee.email}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground hidden sm:block">
                        {session.last_message_timestamp && formatDistanceToNow(new Date(session.last_message_timestamp), { addSuffix: true })}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center">
              <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                {hasActiveFilters ? 'No matching conversations' : t('agents.noConversations')}
              </p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-primary hover:underline mt-1">Clear filters</button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Main agents grid ──────────────────────────────────────────────────────
  const totalAgents = agents?.length || 0;
  const activeAgents = agents?.filter(a => a.status === 'active').length || 0;
  const inactiveAgents = agents?.filter(a => a.status !== 'active').length || 0;

  return (
    <>
      <CreateAgentDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />

      {/* ── Stats + actions bar ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 sm:mb-6">
        {/* Stats pills */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted border border-border">
            <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground tabular-nums">{totalAgents}</span>
            <span className="text-xs text-muted-foreground">total</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">{activeAgents}</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-500">active</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted border border-border">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
            <span className="text-sm font-semibold text-foreground tabular-nums">{inactiveAgents}</span>
            <span className="text-xs text-muted-foreground">inactive</span>
          </div>
        </div>

        {/* Search + create */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search agents…"
              value={agentSearch}
              onChange={(e) => setAgentSearch(e.target.value)}
              className="pl-8 h-9 w-full sm:w-52 text-sm bg-background border-border"
            />
            {agentSearch && (
              <button onClick={() => setAgentSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Permission permission="agent:create">
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              size="sm"
              className="h-9 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shrink-0"
            >
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">{t('agents.createAgent')}</span>
            </Button>
          </Permission>
        </div>
      </div>

      {/* ── Agent cards grid ─────────────────────────────────────────────────── */}
      {filteredAgents.length === 0 ? (
        agentSearch ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4 border border-border">
              <Bot className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-base font-medium text-foreground mb-1">No agents match your search</p>
            <p className="text-sm text-muted-foreground">Try a different search term</p>
          </div>
        ) : (
          <div className="space-y-8 py-6">
            {/* Hero prompt */}
            <div className="text-center">
              <div className="inline-flex h-16 w-16 rounded-2xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 items-center justify-center mb-4">
                <Bot className="h-8 w-8 text-violet-500" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Build your first AI agent</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                Agents handle customer conversations 24/7. Give it a name, a persona, and connect it to a channel — done in minutes.
              </p>
              <Permission permission="agent:create">
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="gap-2 bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-200 dark:shadow-violet-900/30"
                >
                  <PlusCircle className="h-4 w-4" />
                  Create your first agent
                </Button>
              </Permission>
            </div>

            {/* How it works steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              {[
                { step: '1', icon: Bot, title: 'Create an agent', desc: 'Name it, write a persona, pick a language model', color: 'text-violet-500 bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800' },
                { step: '2', icon: Globe, title: 'Connect a channel', desc: 'Website chat, WhatsApp, Instagram, email and more', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' },
                { step: '3', icon: MessageSquare, title: 'Go live', desc: 'Test with the preview, then embed on your site', color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
              ].map(({ step, icon: Icon, title, desc, color }) => (
                <div key={step} className="flex flex-col items-center text-center p-5 rounded-xl border border-border app-surface">
                  <div className={`h-10 w-10 rounded-xl border flex items-center justify-center mb-3 ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Step {step}</span>
                  <p className="text-sm font-semibold text-foreground mb-1">{title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            {/* Ghost sample cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 opacity-40 pointer-events-none select-none" aria-hidden="true">
              {[
                { name: 'Sales Assistant', status: 'active', model: 'GPT-4o', sessions: 142 },
                { name: 'Support Bot', status: 'active', model: 'Claude Sonnet', sessions: 89 },
                { name: 'Lead Qualifier', status: 'inactive', model: 'GPT-4o Mini', sessions: 0 },
              ].map((ghost) => (
                <div key={ghost.name} className="rounded-xl border border-border app-surface overflow-hidden">
                  <div className="h-0.5 w-full bg-gradient-to-r from-violet-400 to-purple-500" />
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-9 w-9 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-violet-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{ghost.name}</p>
                        <p className="text-xs text-muted-foreground">{ghost.model}</p>
                      </div>
                      <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full ${ghost.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                        {ghost.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MessageSquare className="h-3 w-3" />
                      <span>{ghost.sessions} conversations</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-muted-foreground -mt-4">Sample preview — your agents will appear here</p>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredAgents.map((agent, i) => {
              const palette = getAgentPalette(agent.name);
              const isActive = agent.status === 'active';

              return (
                <motion.div
                  key={agent.id}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  layout
                >
                  <div
                    className={cn(
                      'group relative flex flex-col rounded-xl border border-border app-surface overflow-hidden',
                      'transition-all duration-200 hover:border-border/80 hover:shadow-md hover:shadow-black/5 dark:hover:shadow-black/20',
                      'cursor-pointer'
                    )}
                    onClick={() => navigate(`/dashboard/builder/${agent.id}`)}
                  >
                    {/* Top accent line */}
                    <div className={cn('h-0.5 w-full bg-gradient-to-r', palette.gradient)} />

                    {/* Card body */}
                    <div className="flex flex-col flex-1 p-4 gap-3">

                      {/* Agent identity row */}
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          <div className={cn(
                            'h-12 w-12 rounded-xl bg-gradient-to-br flex items-center justify-center',
                            palette.gradient
                          )}>
                            <span className="text-white text-sm font-bold tracking-wide">
                              {agent.name.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                          {isActive && (
                            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-card" />
                          )}
                        </div>

                        {/* Name + status */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-0.5">
                            <p className="text-sm font-semibold text-foreground leading-tight truncate group-hover:text-primary transition-colors">
                              {agent.name}
                            </p>
                            <span className={cn(
                              'flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
                              isActive
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                                : 'bg-muted text-muted-foreground border-border'
                            )}>
                              <span className={cn('h-1.5 w-1.5 rounded-full', isActive ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground')} />
                              {isActive ? t('agents.active') : t('agents.inactive')}
                            </span>
                          </div>

                          {/* Provider + model */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {agent.llm_provider && (
                              <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium border', palette.badge)}>
                                <Zap className="h-2.5 w-2.5" />
                                <span className="capitalize">{agent.llm_provider}</span>
                              </span>
                            )}
                            {agent.model_name && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium bg-muted border border-border text-muted-foreground font-mono">
                                {agent.model_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Prompt preview */}
                      {agent.prompt && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {agent.prompt}
                        </p>
                      )}
                    </div>

                    {/* Card footer */}
                    <div
                      className="flex items-center justify-between gap-2 px-4 py-2.5 border-t border-border bg-muted/30"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1">
                        {/* View conversations */}
                        <button
                          onClick={() => setSelectedAgent(agent)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title={t('agents.viewConversations')}
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          Conversations
                        </button>

                        {/* Edit */}
                        <Permission permission="agent:update">
                          <button
                            onClick={() => navigate(`/dashboard/builder/${agent.id}`)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title={t('agents.editAgent')}
                          >
                            <Edit className="h-3.5 w-3.5" />
                            Edit
                          </button>
                        </Permission>
                      </div>

                      {/* More actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem onClick={() => setSelectedAgent(agent)} className="cursor-pointer gap-2">
                            <Eye className="h-4 w-4" />
                            {t('agents.viewConversations')}
                          </DropdownMenuItem>
                          <Permission permission="agent:update">
                            <DropdownMenuItem onClick={() => navigate(`/dashboard/builder/${agent.id}`)} className="cursor-pointer gap-2">
                              <Edit className="h-4 w-4" />
                              {t('agents.editAgent')}
                            </DropdownMenuItem>
                          </Permission>
                          <DropdownMenuItem onClick={() => handleCopyEmbedCode(agent.id)} className="cursor-pointer gap-2">
                            <Code className="h-4 w-4" />
                            {t('agents.copyEmbedCode')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <Permission permission="agent:delete">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                  className="text-destructive focus:text-destructive cursor-pointer gap-2"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  {t('agents.delete')}
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{t('agents.deleteConfirmTitle')}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t('agents.deleteConfirmDesc', { name: agent.name })}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{t('agents.cancel')}</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteAgentMutation.mutate(agent.id)}
                                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                  >
                                    {t('agents.delete')}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </Permission>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </>
  );
};
