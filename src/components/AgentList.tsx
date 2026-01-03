import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, Edit, Trash2, Code, PlusCircle, Eye, Search, Filter, X, MessageSquare, Phone, Globe, Instagram, Mail, Send, ArrowLeft, Users, Clock } from "lucide-react";
import { Permission } from "@/components/Permission";
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Agent, Session } from "@/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { ConversationDetail } from "./ConversationDetail";
import { API_BASE_URL } from "@/config/api";
import { useTranslation } from 'react-i18next';
import { useI18n } from '@/hooks/useI18n';

export const AgentList = () => {
  const { t } = useTranslation();
  const { isRTL } = useI18n();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const { authFetch, user } = useAuth();
  const companyId = user?.company_id;

  // Filter states for conversations view
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');

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

  // Fetch users for assignee filter
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

  // Get unique channels from sessions
  const availableChannels = useMemo(() => {
    if (!sessions) return [];
    const channels = [...new Set(sessions.map(s => s.channel).filter(Boolean))];
    return channels;
  }, [sessions]);

  // Get unique statuses from sessions
  const availableStatuses = useMemo(() => {
    if (!sessions) return [];
    const statuses = [...new Set(sessions.map(s => s.status).filter(Boolean))];
    return statuses;
  }, [sessions]);

  // Filter sessions based on filters
  const filteredSessions = useMemo(() => {
    if (!sessions) return [];

    return sessions.filter(session => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          session.conversation_id?.toLowerCase().includes(query) ||
          session.contact_name?.toLowerCase().includes(query) ||
          session.contact_phone?.toLowerCase().includes(query) ||
          session.first_message_content?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && session.status !== statusFilter) {
        return false;
      }

      // Channel filter
      if (channelFilter !== 'all' && session.channel !== channelFilter) {
        return false;
      }

      // Assignee filter
      if (assigneeFilter !== 'all') {
        if (assigneeFilter === 'unassigned' && session.assignee_id) return false;
        if (assigneeFilter !== 'unassigned' && session.assignee_id !== parseInt(assigneeFilter)) return false;
      }

      return true;
    });
  }, [sessions, searchQuery, statusFilter, channelFilter, assigneeFilter]);

  // Helper function to get channel icon
  const getChannelIcon = (channel: string) => {
    switch (channel?.toLowerCase()) {
      case 'whatsapp': return (
        <svg className="h-4 w-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      );
      case 'web': return <Globe className="h-4 w-4 text-blue-500" />;
      case 'instagram': return <Instagram className="h-4 w-4 text-pink-500" />;
      case 'messenger': return (
        <svg className="h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.301 2.246.464 3.443.464 6.627 0 12-4.974 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.259L19.752 8l-6.561 6.963z"/>
        </svg>
      );
      case 'telegram': return (
        <svg className="h-4 w-4 text-sky-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
      );
      case 'gmail': return <Mail className="h-4 w-4 text-red-500" />;
      case 'twilio_voice': return (
        <svg className="h-4 w-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.381 0 0 5.381 0 12s5.381 12 12 12 12-5.381 12-12S18.619 0 12 0zM9.75 6.75a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm4.5 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm-4.5 7.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm4.5 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"/>
        </svg>
      );
      case 'freeswitch': return (
        <svg className="h-4 w-4 text-purple-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57a1.02 1.02 0 0 0-1.02.24l-2.2 2.2a15.045 15.045 0 0 1-6.59-6.59l2.2-2.21a.96.96 0 0 0 .25-1A11.36 11.36 0 0 1 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1zM12 3v10l3-3h6V3h-9z"/>
        </svg>
      );
      default: return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', dot: 'bg-green-500' },
      inactive: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-400', dot: 'bg-gray-500' },
      assigned: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' },
      pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', dot: 'bg-yellow-500' },
      resolved: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', dot: 'bg-purple-500' },
      archived: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-400', dot: 'bg-slate-500' },
    };
    const config = statusConfig[status] || statusConfig.inactive;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
        {status}
      </span>
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setChannelFilter('all');
    setAssigneeFilter('all');
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
      toast({
        title: t('agents.deleteFailed'),
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  const handleCopyEmbedCode = (agentId: number) => {
    const backendUrl = API_BASE_URL;
    const embedCode = `<script
    src="${backendUrl}/widget/widget.js"
    id="agent-connect-widget-script"
    data-agent-id="${agentId}"
    data-company-id="${companyId}"
    data-backend-url="${backendUrl}">
</script>
<div id="agentconnect-widget"></div>`;
    navigator.clipboard.writeText(embedCode);
    toast({ title: t('agents.embedCodeCopied') });
  };

  if (isLoading) return <div>{t('agents.loading')}</div>;
  if (isError) return <div>{t('agents.error')}</div>;

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

  if (selectedAgent) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                setSelectedAgent(null);
                clearFilters();
              }}
              variant="ghost"
              size="icon"
              className="hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold dark:text-white">{t('agents.conversationsFor', { name: selectedAgent.name })}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {filteredSessions.length} of {sessions?.length || 0} conversations
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3 items-center">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t('conversations.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {availableStatuses.map(status => (
                    <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Channel Filter */}
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger className="w-[140px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  {availableChannels.map(channel => (
                    <SelectItem key={channel} value={channel} className="capitalize">{channel}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Assignee Filter */}
              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger className="w-[160px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {users?.map((u: any) => (
                    <SelectItem key={u.id} value={u.id.toString()}>
                      {u.first_name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500 hover:text-gray-700">
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sessions List */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardContent className="p-0">
            {isLoadingSessions ? (
              <div className="p-8 text-center text-gray-500">{t('agents.loadingConversations')}</div>
            ) : filteredSessions.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredSessions.filter(s => s.conversation_id).map((session) => {
                  const assignee = users?.find((u: any) => u.id === session.assignee_id);

                  return (
                    <div
                      key={session.conversation_id}
                      onClick={() => setSelectedSessionId(session.conversation_id)}
                      className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {/* Channel Icon */}
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                            {getChannelIcon(session.channel)}
                          </div>

                          {/* Main Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-900 dark:text-white truncate">
                                {session.contact_name || session.contact_phone || `Session ${session.conversation_id.substring(0, 8)}...`}
                              </span>
                              {session.is_client_connected && (
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Online"></span>
                              )}
                            </div>

                            {session.first_message_content && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate mb-2">
                                {session.first_message_content}
                              </p>
                            )}

                            <div className="flex items-center gap-2 flex-wrap">
                              {getStatusBadge(session.status)}
                              <span className="text-xs text-gray-400 capitalize">{session.channel}</span>
                              {session.reopen_count > 0 && (
                                <span className="text-xs text-orange-500">🔄 Reopened {session.reopen_count}x</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right Side - Time & Assignee */}
                        <div className="flex-shrink-0 text-right">
                          <div className="text-xs text-gray-400 mb-1">
                            {session.last_message_timestamp && formatDistanceToNow(new Date(session.last_message_timestamp), { addSuffix: true })}
                          </div>
                          {assignee && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Users className="h-3 w-3" />
                              <span>{assignee.first_name || assignee.email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center">
                <MessageSquare className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {hasActiveFilters ? 'No conversations match your filters' : t('agents.noConversations')}
                </p>
                {hasActiveFilters && (
                  <Button variant="link" onClick={clearFilters} className="mt-2">
                    Clear filters
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Stats Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800 card-shadow">
          <CardContent className="pt-6">
            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div>
                <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">{t('agents.totalAgents')}</p>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {agents?.length || 0}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800 card-shadow">
          <CardContent className="pt-6">
            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div>
                <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">{t('agents.active')}</p>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {agents?.filter(a => a.status === 'active').length || 0}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800 card-shadow">
          <CardContent className="pt-6">
            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div>
                <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">{t('agents.inactive')}</p>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  {agents?.filter(a => a.status !== 'active').length || 0}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                <span className="text-2xl">💤</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agents Table Card */}
      <Card className="card-shadow bg-white dark:bg-slate-800">
        <CardHeader className="border-b border-slate-200 dark:border-slate-700">
          <div className={`flex justify-between items-center`}>
            <div>
              <CardTitle className="text-2xl dark:text-white">{t('agents.yourAgents')}</CardTitle>
              <CardDescription className="text-base">{t('agents.manageAgents')}</CardDescription>
            </div>
            <Permission permission="agent:create">
              <Button
                onClick={() => navigate('/dashboard/builder')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white btn-hover-lift"
              >
                <PlusCircle className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('agents.createAgent')}
              </Button>
            </Permission>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900">
                <TableRow>
                  <TableHead className="font-semibold dark:text-gray-300">{t('agents.agentName')}</TableHead>
                  <TableHead className="font-semibold dark:text-gray-300">{t('agents.llmProvider')}</TableHead>
                  <TableHead className="font-semibold dark:text-gray-300">{t('agents.model')}</TableHead>
                  <TableHead className="font-semibold dark:text-gray-300">{t('agents.status')}</TableHead>
                  <TableHead className={`font-semibold dark:text-gray-300 text-left`}>{t('agents.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents?.map((agent) => (
                  <TableRow key={agent.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <TableCell>
                      <div className={`flex items-center gap-3`}>
                        <Avatar className="h-10 w-10 bg-gradient-to-br from-purple-600 to-pink-600 text-white border-2 border-white dark:border-slate-700 shadow-md">
                          <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white font-semibold">
                            {agent.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold dark:text-white">{agent.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{agent.prompt}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="dark:text-gray-300">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-sm font-medium">
                        {agent.llm_provider}
                      </span>
                    </TableCell>
                    <TableCell className="dark:text-gray-300">
                      <span className="text-sm font-medium">{agent.model_name}</span>
                    </TableCell>
                    <TableCell>
                      {agent.status === 'active' ? (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <span className={`w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full animate-pulse ${isRTL ? 'ml-2' : 'mr-2'}`}></span>
                          {t('agents.active')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {t('agents.inactive')}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className={isRTL ? 'text-left' : 'text-right'}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="hover:bg-slate-100 dark:hover:bg-slate-700">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem onClick={() => setSelectedAgent(agent)} className="cursor-pointer">
                            <Eye className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                            {t('agents.viewConversations')}
                          </DropdownMenuItem>
                          <Permission permission="agent:update">
                            <DropdownMenuItem onClick={() => navigate(`/dashboard/builder/${agent.id}`)} className="cursor-pointer">
                              <Edit className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                              {t('agents.editAgent')}
                            </DropdownMenuItem>
                          </Permission>
                          <DropdownMenuItem onClick={() => handleCopyEmbedCode(agent.id)} className="cursor-pointer">
                            <Code className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                            {t('agents.copyEmbedCode')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <Permission permission="agent:delete">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 cursor-pointer">
                                  <Trash2 className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                  {t('agents.delete')}
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-white dark:bg-slate-800">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="dark:text-white">{t('agents.deleteConfirmTitle')}</AlertDialogTitle>
                                  <AlertDialogDescription className="dark:text-gray-400">
                                    {t('agents.deleteConfirmDesc', { name: agent.name })}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="dark:bg-slate-700 dark:text-gray-300">{t('agents.cancel')}</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteAgentMutation.mutate(agent.id)}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                  >
                                    {t('agents.delete')}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </Permission>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
};