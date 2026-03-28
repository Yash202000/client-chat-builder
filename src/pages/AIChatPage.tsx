
import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAgents } from '@/services/agentService';
import { postChatMessage, getAIChatSessions, getSessionMessages } from '@/services/aiChatService';
import { Agent } from '@/types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, MessageCircle, Loader2, Sparkles, Plus, Clock, Search } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '@/lib/utils';
import { useI18n } from '@/hooks/useI18n';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  id: number;
  message: string;
  sender: 'user' | 'agent';
  timestamp: string;
}

interface SessionSummary {
  conversation_id: string;
  agent_id: number | null;
  agent_name: string | null;
  last_message: string | null;
  last_message_at: string | null;
  message_count: number;
  created_at: string;
}

const parseUTCDate = (ts: string) =>
  new Date(ts.endsWith('Z') || ts.includes('+') ? ts : ts + 'Z');

// Skeleton for session list loading
const SessionSkeleton = () => (
  <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-700 space-y-2">
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 rounded-lg skeleton flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-3/4 rounded skeleton" />
        <div className="h-2.5 w-1/2 rounded skeleton" />
      </div>
    </div>
  </div>
);

const AIChatPage: React.FC = () => {
  const { t, isRTL } = useI18n();
  const queryClient = useQueryClient();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: agents, isLoading: isLoadingAgents } = useQuery<Agent[]>({
    queryKey: ['agents'],
    queryFn: getAgents,
  });

  const { data: sessions, isLoading: isLoadingSessions } = useQuery<SessionSummary[]>({
    queryKey: ['ai-chat-sessions'],
    queryFn: getAIChatSessions,
    refetchInterval: 10000,
  });

  const mutation = useMutation({
    mutationFn: (message: string) => postChatMessage(message, conversationId, selectedAgent?.id),
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { id: Date.now(), message: data.message, sender: 'agent', timestamp: new Date().toISOString() }]);
      if (!conversationId && data.session_id) {
        setConversationId(data.session_id);
      }
      queryClient.invalidateQueries({ queryKey: ['ai-chat-sessions'] });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    const userMessage: ChatMessage = {
      id: Date.now(),
      message: inputValue,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    mutation.mutate(inputValue);
    setInputValue('');
  };

  const handleLoadSession = async (session: SessionSummary) => {
    setConversationId(session.conversation_id);
    setMessages([]);
    if (session.agent_id && agents) {
      const agent = agents.find(a => a.id === session.agent_id);
      setSelectedAgent(agent || null);
    } else {
      setSelectedAgent(null);
    }
    try {
      const msgs = await getSessionMessages(session.conversation_id);
      setMessages(msgs.map((m: any) => ({
        id: m.id,
        message: m.message,
        sender: m.sender as 'user' | 'agent',
        timestamp: m.timestamp || new Date().toISOString(),
      })));
    } catch (e) {
      console.error('Failed to load session messages', e);
    }
  };

  const handleNewChat = () => {
    setConversationId(undefined);
    setMessages([]);
    setSelectedAgent(null);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filteredSessions = sessions?.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.agent_name?.toLowerCase().includes(q) ||
      s.last_message?.toLowerCase().includes(q)
    );
  }) ?? [];

  return (
    <div className="h-full flex bg-slate-50 dark:bg-slate-950 overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <Card className="w-72 flex-shrink-0 rounded-none flex flex-col h-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">

        {/* Header */}
        <CardHeader className="border-b border-slate-200 dark:border-slate-800 py-4 px-4 flex-shrink-0 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold dark:text-white">{t('aiChat.title')}</CardTitle>
                <p className="text-xs text-muted-foreground">{t('aiChat.subtitle')}</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold px-2.5 py-1 rounded-full text-xs">
              {sessions?.length ?? 0}
            </Badge>
          </div>

          {/* Search */}
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <Input
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl h-9 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            />
          </div>

          {/* Agent selector */}
          <Select
            value={selectedAgent ? String(selectedAgent.id) : ''}
            onValueChange={(value) => setSelectedAgent(value === 'none' ? null : (agents?.find(a => a.id === parseInt(value)) || null))}
          >
            <SelectTrigger className="h-9 text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white rounded-xl">
              <SelectValue placeholder={t('aiChat.chooseAgent')} />
            </SelectTrigger>
            <SelectContent className="dark:bg-slate-800 dark:border-slate-700 rounded-xl">
              {isLoadingAgents ? (
                <SelectItem value="loading" disabled>{t('common.loading')}</SelectItem>
              ) : (
                <>
                  <SelectItem value="none" className="dark:text-gray-400">No Agent (Default)</SelectItem>
                  {agents?.map(agent => (
                    <SelectItem key={agent.id} value={String(agent.id)} className="dark:text-white dark:focus:bg-slate-700">
                      {agent.name}
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>

          {/* New Chat */}
          <Button
            onClick={handleNewChat}
            variant="outline"
            className="w-full h-9 text-sm gap-1.5 rounded-xl border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
          >
            <Plus className="h-3.5 w-3.5" />
            New Chat
          </Button>
        </CardHeader>

        {/* Sessions list */}
        <CardContent className="flex-1 overflow-y-auto p-3 space-y-1.5">
          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1 pb-1">
            Recent Chats
          </p>
          {isLoadingSessions ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => <SessionSkeleton key={i} />)}
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-3">
                <MessageCircle className="h-5 w-5 text-indigo-300 dark:text-indigo-600" />
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">No conversations yet</p>
            </div>
          ) : (
            filteredSessions.map((session, idx) => {
              const isActive = conversationId === session.conversation_id;
              return (
                <motion.button
                  key={session.conversation_id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.2 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleLoadSession(session)}
                  className={cn(
                    'w-full text-left p-3 rounded-xl border transition-all duration-200',
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 ring-1 ring-indigo-500/20'
                      : 'bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-600'
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={cn(
                      'h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0',
                      isActive ? 'bg-indigo-100 dark:bg-indigo-900/40' : 'bg-slate-100 dark:bg-slate-700'
                    )}>
                      <Bot className={cn('h-4 w-4', isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400')} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={cn(
                          'text-xs font-semibold truncate max-w-[110px]',
                          isActive ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-800 dark:text-slate-100'
                        )}>
                          {session.agent_name || 'AI Assistant'}
                        </span>
                        {session.last_message_at && (
                          <span className="text-[10px] text-slate-400 flex-shrink-0 ml-1">
                            {formatDistanceToNow(parseUTCDate(session.last_message_at), { addSuffix: false })}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate leading-snug">
                        {session.last_message || 'No messages'}
                      </p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <Clock className="h-2.5 w-2.5 text-slate-300 dark:text-slate-600" />
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">{session.message_count} messages</span>
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* ── Chat Area ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900">

        {/* Chat Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 flex-shrink-0">
          <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
            <Bot className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-800 dark:text-white">
              {selectedAgent ? selectedAgent.name : t('aiChat.aiAssistant')}
            </h3>
            <p className="text-[11px] text-slate-400">
              {conversationId ? `Session · ${conversationId.slice(0, 8)}…` : t('aiChat.alwaysHereToHelp')}
            </p>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 bg-slate-50 dark:bg-slate-950">
          <div className="px-4 py-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="h-20 w-20 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-5">
                  <Sparkles className="h-10 w-10 text-indigo-400 dark:text-indigo-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{t('aiChat.startConversation')}</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm text-sm leading-relaxed">
                  {selectedAgent ? t('aiChat.chatWithAgent', { agentName: selectedAgent.name }) : t('aiChat.selectAgentToBegin')}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map(msg => (
                  <div key={msg.id} className={cn('flex items-end gap-2.5', msg.sender === 'user' ? 'justify-end' : 'justify-start')}>

                    {/* Agent avatar */}
                    {msg.sender === 'agent' && (
                      <div className="h-7 w-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0 mb-5">
                        <Bot className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                    )}

                    <div className={cn('flex flex-col max-w-[80%]', msg.sender === 'user' ? 'items-end' : 'items-start')}>
                      {/* Bubble */}
                      <div className={cn(
                        'px-4 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed',
                        msg.sender === 'user'
                          ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-br-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-sm'
                      )}>
                        {msg.sender === 'user' ? (
                          <p className="whitespace-pre-wrap">{msg.message}</p>
                        ) : (
                          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-pre:my-2 prose-pre:p-0 prose-code:text-pink-500 dark:prose-code:text-pink-400 prose-code:bg-slate-100 dark:prose-code:bg-slate-700 prose-code:px-1 prose-code:rounded prose-headings:mt-2 prose-headings:mb-1">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                code({ node, className, children, ...props }: any) {
                                  const match = /language-(\w+)/.exec(className || '');
                                  const isBlock = !props.inline;
                                  return isBlock && match ? (
                                    <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" className="rounded-lg text-xs !my-2">
                                      {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                  ) : (
                                    <code className={className} {...props}>{children}</code>
                                  );
                                },
                              }}
                            >
                              {msg.message}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                      {/* Timestamp */}
                      <span className={cn('text-[10px] mt-1 px-1', msg.sender === 'user' ? 'text-slate-400' : 'text-slate-400')}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* User avatar */}
                    {msg.sender === 'user' && (
                      <div className="h-7 w-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0 mb-5">
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">{t('aiChat.you')}</span>
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing indicator */}
                {mutation.isPending && (
                  <div className="flex items-end gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0 mb-5">
                      <Bot className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="h-1.5 w-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="h-1.5 w-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input bar */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2.5">
            <Input
              placeholder={t('aiChat.typeYourMessage')}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 h-10"
              disabled={mutation.isPending}
            />
            <Button
              type="submit"
              disabled={mutation.isPending || !inputValue.trim()}
              className="rounded-xl h-10 px-5 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white shadow-sm shadow-indigo-500/25 gap-2"
            >
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIChatPage;
