
import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAgents } from '@/services/agentService';
import { postChatMessage, getAIChatSessions, getSessionMessages } from '@/services/aiChatService';
import { Agent } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useI18n } from '@/hooks/useI18n';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Bot, MessageCircle, Loader2, Sparkles,
  Plus, Search, ChevronDown, ChevronLeft, Menu,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

/* ─── types ─────────────────────────────────────────────────────── */
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

/* ─── helpers ────────────────────────────────────────────────────── */
const parseUTCDate = (ts: string) =>
  new Date(ts.endsWith('Z') || ts.includes('+') ? ts : ts + 'Z');

const initials = (name: string) =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

/* ─── keyframes ─────────────────────────────────────────────────── */
const STYLES = `
  @keyframes dot-pulse {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
    40%            { transform: scale(1);   opacity: 1;   }
  }
  @keyframes msg-in-left {
    from { opacity: 0; transform: translateX(-10px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes msg-in-right {
    from { opacity: 0; transform: translateX(10px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes fade-up {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .msg-left  { animation: msg-in-left  0.22s ease both; }
  .msg-right { animation: msg-in-right 0.22s ease both; }
  .fade-up   { animation: fade-up 0.3s ease both; }
  .dot-1 { animation: dot-pulse 1.4s ease-in-out 0ms   infinite; }
  .dot-2 { animation: dot-pulse 1.4s ease-in-out 200ms infinite; }
  .dot-3 { animation: dot-pulse 1.4s ease-in-out 400ms infinite; }
  .timestamp-reveal { opacity: 0; transition: opacity 0.15s; }
  .msg-group:hover .timestamp-reveal { opacity: 1; }
  .session-item { transition: all 0.15s ease; }
  .composer-area:focus { outline: none; }
`;

/* ─── SessionSkeleton ────────────────────────────────────────────── */
const SessionSkeleton = ({ delay = 0 }: { delay?: number }) => (
  <div
    className="px-3 py-2.5 rounded-lg space-y-2"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex items-center gap-2.5">
      <div className="h-7 w-7 rounded-lg bg-muted animate-pulse flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-2.5 w-3/5 rounded-full bg-muted animate-pulse" />
        <div className="h-2 w-4/5 rounded-full bg-muted animate-pulse" />
      </div>
    </div>
  </div>
);

/* ─── TypingIndicator ────────────────────────────────────────────── */
const TypingIndicator = () => (
  <div className="flex items-end gap-2.5 msg-left">
    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mb-0.5">
      <Bot className="h-3.5 w-3.5 text-muted-foreground" />
    </div>
    <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-card border border-border shadow-sm">
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-muted-foreground dot-1" />
        <span className="h-2 w-2 rounded-full bg-muted-foreground dot-2" />
        <span className="h-2 w-2 rounded-full bg-muted-foreground dot-3" />
      </div>
    </div>
  </div>
);

/* ─── EmptyState ─────────────────────────────────────────────────── */
// SUGGESTIONS is now built inside the component using t() so it reacts to language changes

const EmptyState = ({
  agentName,
  onSuggest,
  title,
  subtitle,
  suggestions,
}: {
  agentName?: string;
  onSuggest: (text: string) => void;
  title: string;
  subtitle: string;
  suggestions: string[];
}) => (
  <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 fade-up">
    {/* Icon stack */}
    <div className="relative h-16 w-16 mb-6">
      <div className="absolute inset-0 rounded-2xl bg-muted rotate-6 opacity-50" />
      <div className="absolute inset-0 rounded-2xl bg-muted rotate-3 opacity-70" />
      <div className="relative h-16 w-16 rounded-2xl bg-card border border-border flex items-center justify-center shadow-sm">
        <Sparkles className="h-7 w-7 text-primary" />
      </div>
    </div>

    <h2 className="text-xl font-semibold text-foreground mb-1.5 tracking-tight">
      {title}
    </h2>
    <p className="text-sm text-muted-foreground text-center max-w-xs mb-8 leading-relaxed">
      {subtitle}
    </p>

    {/* Suggestion chips */}
    <div className="grid grid-cols-2 gap-2 w-full max-w-md">
      {suggestions.map((s, i) => (
        <button
          key={i}
          onClick={() => onSuggest(s)}
          className={cn(
            'text-left px-3.5 py-3 rounded-xl border border-border bg-card',
            'text-xs text-muted-foreground hover:text-foreground hover:bg-muted hover:border-border/80',
            'transition-all duration-150 shadow-sm',
          )}
          style={{ animationDelay: `${i * 60}ms` }}
        >
          {s}
        </button>
      ))}
    </div>
  </div>
);

/* ─── Main Component ─────────────────────────────────────────────── */
const AIChatPage: React.FC = () => {
  const { t, isRTL } = useI18n();
  const queryClient = useQueryClient();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* ── queries ── */
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
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), message: data.message, sender: 'agent', timestamp: new Date().toISOString() },
      ]);
      if (!conversationId && data.session_id) setConversationId(data.session_id);
      queryClient.invalidateQueries({ queryKey: ['ai-chat-sessions'] });
    },
  });

  /* ── handlers ── */
  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
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
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleLoadSession = async (session: SessionSummary) => {
    setConversationId(session.conversation_id);
    setMessages([]);
    setMobileSidebarOpen(false);
    if (session.agent_id && agents) {
      setSelectedAgent(agents.find(a => a.id === session.agent_id) || null);
    } else {
      setSelectedAgent(null);
    }
    try {
      const msgs = await getSessionMessages(session.conversation_id);
      setMessages(
        msgs.map((m: any) => ({
          id: m.id,
          message: m.message,
          sender: m.sender as 'user' | 'agent',
          timestamp: m.timestamp || new Date().toISOString(),
        }))
      );
    } catch (e) {
      console.error('Failed to load session messages', e);
    }
  };

  const handleNewChat = () => {
    setConversationId(undefined);
    setMessages([]);
    setSelectedAgent(null);
    setMobileSidebarOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /* ── auto-resize textarea ── */
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  };

  /* ── scroll to bottom ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, mutation.isPending]);

  /* ── filter sessions ── */
  const filteredSessions = (sessions ?? []).filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return s.agent_name?.toLowerCase().includes(q) || s.last_message?.toLowerCase().includes(q);
  });

  /* ── translated suggestion chips ── */
  const suggestions = [
    t('aiChat.emptyState.suggestions.summarise'),
    t('aiChat.emptyState.suggestions.draft'),
    t('aiChat.emptyState.suggestions.common'),
    t('aiChat.emptyState.suggestions.escalate'),
  ];

  return (
    <>
      <style>{STYLES}</style>
      <div
        className="h-full flex app-surface overflow-hidden"
        dir={isRTL ? 'rtl' : 'ltr'}
      >

        {/* ══════════════════ LEFT SIDEBAR ══════════════════ */}
        <aside className={cn(
          'flex-shrink-0 flex-col h-full bg-card border-r border-border',
          'md:flex md:w-[268px]',
          // On mobile: show as full-width overlay when open, or when no conversation is active
          (!conversationId || mobileSidebarOpen)
            ? 'flex w-full absolute inset-0 z-10 md:relative md:w-[268px] md:z-auto'
            : 'hidden md:flex',
        )}>

          {/* Sidebar header */}
          <div className="px-4 pt-4 pb-3 border-b border-border space-y-3 flex-shrink-0">

            {/* Title row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h1 className="text-sm font-semibold text-foreground leading-none">{t('aiChat.title')}</h1>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">
                    {(sessions?.length ?? 0) !== 1
                      ? t('aiChat.conversationCountPlural', { count: sessions?.length ?? 0 })
                      : t('aiChat.conversationCount', { count: sessions?.length ?? 0 })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {/* Mobile: close sidebar overlay */}
                {mobileSidebarOpen && (
                  <button
                    onClick={() => setMobileSidebarOpen(false)}
                    className={cn(
                      'md:hidden h-7 w-7 rounded-lg flex items-center justify-center',
                      'text-muted-foreground hover:text-foreground hover:bg-muted',
                      'transition-colors duration-150',
                    )}
                    title={t('aiChat.close')}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={handleNewChat}
                  className={cn(
                    'h-7 w-7 rounded-lg flex items-center justify-center',
                    'text-muted-foreground hover:text-foreground hover:bg-muted',
                    'transition-colors duration-150',
                  )}
                  title={t('aiChat.newChat')}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder={t('aiChat.searchPlaceholder')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={cn(
                  'w-full h-8 pl-8 pr-3 rounded-lg text-xs',
                  'bg-background border border-border text-foreground placeholder:text-muted-foreground',
                  'focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50',
                  'transition-all duration-150',
                )}
              />
            </div>

            {/* Agent picker */}
            <Select
              value={selectedAgent ? String(selectedAgent.id) : 'none'}
              onValueChange={v =>
                setSelectedAgent(v === 'none' ? null : (agents?.find(a => a.id === parseInt(v)) || null))
              }
            >
              <SelectTrigger className="h-8 text-xs border-border bg-background rounded-lg">
                <SelectValue placeholder={t('aiChat.selectAgentPlaceholder')} />
              </SelectTrigger>
              <SelectContent className="text-xs rounded-lg">
                {isLoadingAgents ? (
                  <SelectItem value="loading" disabled>{t('aiChat.loadingAgents')}</SelectItem>
                ) : (
                  <>
                    <SelectItem value="none">{t('aiChat.noAgent')}</SelectItem>
                    {agents?.map(a => (
                      <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Sessions list */}
          <div className="flex-1 overflow-y-auto py-2">
            {isLoadingSessions ? (
              <div className="space-y-0.5 px-2">
                {[0, 60, 120, 180].map(d => <SessionSkeleton key={d} delay={d} />)}
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <MessageCircle className="h-8 w-8 text-muted-foreground/30 mb-2.5" />
                <p className="text-xs text-muted-foreground">
                  {searchQuery ? t('aiChat.noMatchesFound') : t('aiChat.noConversationsYet')}
                </p>
              </div>
            ) : (
              <div className="px-2 space-y-0.5">
                {filteredSessions.map((session, idx) => {
                  const isActive = conversationId === session.conversation_id;
                  return (
                    <motion.button
                      key={session.conversation_id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.035, duration: 0.18 }}
                      onClick={() => handleLoadSession(session)}
                      className={cn(
                        'session-item w-full text-left px-3 py-2.5 rounded-lg group',
                        isActive
                          ? 'bg-primary/8 border-l-[2px] border-l-primary text-foreground'
                          : 'hover:bg-muted text-foreground border-l-[2px] border-l-transparent',
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={cn(
                          'h-6 w-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5',
                          isActive ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
                        )}>
                          <Bot className="h-3 w-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-medium truncate text-foreground leading-none">
                              {session.agent_name || t('aiChat.aiAssistantFallback')}
                            </span>
                            {session.last_message_at && (
                              <span className="text-[10px] text-muted-foreground flex-shrink-0 leading-none">
                                {formatDistanceToNow(parseUTCDate(session.last_message_at), { addSuffix: false })}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate mt-1 leading-snug">
                            {session.last_message || t('aiChat.noMessagesYet')}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>

          {/* New chat footer button */}
          <div className="px-3 py-3 border-t border-border flex-shrink-0">
            <button
              onClick={handleNewChat}
              className={cn(
                'w-full h-8 flex items-center justify-center gap-1.5 rounded-lg text-xs font-medium',
                'border border-dashed border-border text-muted-foreground',
                'hover:bg-muted hover:text-foreground hover:border-border/80',
                'transition-all duration-150',
              )}
            >
              <Plus className="h-3.5 w-3.5" />
              {t('aiChat.newConversation')}
            </button>
          </div>
        </aside>

        {/* ══════════════════ MAIN CHAT ══════════════════ */}
        <div className="flex-1 flex flex-col overflow-hidden app-surface">

          {/* Chat header */}
          <header className="flex-shrink-0 px-3 md:px-5 py-3 border-b border-border flex items-center gap-3 bg-card/80 backdrop-blur-sm">
            {/* Mobile sidebar toggle — only visible when a conversation is active */}
            {conversationId && (
              <button
                className="md:hidden flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
                onClick={() => setMobileSidebarOpen(true)}
                title={t('aiChat.showConversations')}
              >
                <Menu className="h-4 w-4" />
              </button>
            )}
            <div className={cn(
              'h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0',
              selectedAgent ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
            )}>
              {selectedAgent ? initials(selectedAgent.name) : <Bot className="h-4 w-4" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-foreground leading-none truncate">
                {selectedAgent ? selectedAgent.name : t('aiChat.aiAssistantFallback')}
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-none">
                {conversationId
                  ? t('aiChat.sessionLabel', { id: conversationId.slice(0, 8) })
                  : t('aiChat.readyToHelp')}
              </p>
            </div>

            {/* Right side: message count */}
            {messages.length > 0 && (
              <div className="ml-auto flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">
                  {messages.length !== 1
                    ? t('aiChat.messageCountPlural', { count: messages.length })
                    : t('aiChat.messageCount', { count: messages.length })}
                </span>
              </div>
            )}
          </header>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 py-6">
              {messages.length === 0 ? (
                <EmptyState
                  agentName={selectedAgent?.name}
                  onSuggest={text => {
                    setInputValue(text);
                    textareaRef.current?.focus();
                  }}
                  title={selectedAgent
                    ? t('aiChat.emptyState.chatWith', { name: selectedAgent.name })
                    : t('aiChat.emptyState.startConversation')}
                  subtitle={t('aiChat.emptyState.subtitle')}
                  suggestions={suggestions}
                />
              ) : (
                <div className="space-y-1">
                  <AnimatePresence>
                    {messages.map((msg, idx) => {
                      const isUser = msg.sender === 'user';
                      const prevSender = idx > 0 ? messages[idx - 1].sender : null;
                      const isGrouped = prevSender === msg.sender;
                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            'msg-group flex items-end gap-2.5',
                            isUser ? 'justify-end msg-right' : 'justify-start msg-left',
                            isGrouped ? 'mt-0.5' : 'mt-4',
                          )}
                        >
                          {/* Agent avatar */}
                          {!isUser && (
                            <div className={cn(
                              'h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5',
                              'bg-muted text-muted-foreground',
                              isGrouped && 'invisible',
                            )}>
                              {selectedAgent
                                ? <span className="text-[10px] font-bold">{initials(selectedAgent.name)}</span>
                                : <Bot className="h-3.5 w-3.5" />
                              }
                            </div>
                          )}

                          <div className={cn(
                            'flex flex-col max-w-[74%] gap-1',
                            isUser ? 'items-end' : 'items-start',
                          )}>
                            {/* Bubble */}
                            <div className={cn(
                              'px-4 py-2.5 text-sm leading-relaxed shadow-sm',
                              isUser
                                ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-sm'
                                : 'bg-card border border-border text-foreground rounded-2xl rounded-bl-sm',
                              isGrouped && isUser && 'rounded-br-2xl rounded-tr-sm',
                              isGrouped && !isUser && 'rounded-bl-2xl rounded-tl-sm',
                            )}>
                              {isUser ? (
                                <p className="whitespace-pre-wrap">{msg.message}</p>
                              ) : (
                                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-pre:my-2 prose-pre:p-0 prose-code:text-[0.82em] prose-headings:mt-2 prose-headings:mb-1">
                                  <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                      code({ node, className, children, ...props }: any) {
                                        const match = /language-(\w+)/.exec(className || '');
                                        const isBlock = !props.inline;
                                        return isBlock && match ? (
                                          <SyntaxHighlighter
                                            style={oneDark}
                                            language={match[1]}
                                            PreTag="div"
                                            className="rounded-lg text-xs !my-2"
                                          >
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

                            {/* Timestamp (hover reveal) */}
                            <span className={cn(
                              'timestamp-reveal text-[10px] text-muted-foreground px-1',
                            )}>
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          {/* User avatar */}
                          {isUser && (
                            <div className={cn(
                              'h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mb-0.5',
                              isGrouped && 'invisible',
                            )}>
                              <span className="text-[10px] font-bold text-primary">{t('aiChat.userAvatarLabel')}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </AnimatePresence>

                  {/* Typing indicator */}
                  {mutation.isPending && (
                    <div className="mt-4">
                      <TypingIndicator />
                    </div>
                  )}
                  <div ref={messagesEndRef} className="h-2" />
                </div>
              )}
            </div>
          </div>

          {/* ══ Composer ══ */}
          <div className="flex-shrink-0 px-4 pb-4 pt-2 bg-card/80 backdrop-blur-sm border-t border-border">
            <div className="max-w-3xl mx-auto">
              <div className={cn(
                'flex items-end gap-2.5 rounded-2xl border border-border bg-card',
                'focus-within:ring-1 focus-within:ring-primary/30 focus-within:border-primary/40',
                'shadow-sm transition-all duration-150 px-3 py-2',
              )}>
                <textarea
                  ref={textareaRef}
                  rows={1}
                  placeholder={t('aiChat.typeYourMessage') || 'Message… (Enter to send, Shift+Enter for newline)'}
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  disabled={mutation.isPending}
                  className={cn(
                    'composer-area flex-1 resize-none bg-transparent text-sm text-foreground',
                    'placeholder:text-muted-foreground min-h-[36px] max-h-[160px]',
                    'py-1.5 leading-relaxed',
                    'disabled:opacity-50',
                  )}
                  style={{ height: 'auto', overflowY: 'auto' }}
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={mutation.isPending || !inputValue.trim()}
                  className={cn(
                    'h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0',
                    'transition-all duration-150 mb-0.5',
                    inputValue.trim() && !mutation.isPending
                      ? 'bg-primary text-primary-foreground shadow-sm hover:opacity-90 active:scale-95'
                      : 'bg-muted text-muted-foreground cursor-not-allowed',
                  )}
                >
                  {mutation.isPending
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Send className="h-3.5 w-3.5" />
                  }
                </button>
              </div>

              <p className="text-[10px] text-muted-foreground/60 text-center mt-1.5">
                {t('aiChat.enterHint')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AIChatPage;
