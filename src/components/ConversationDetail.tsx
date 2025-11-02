import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChatMessage, User, Contact } from '@/types';
import { Paperclip, Send, CornerDownRight, Book, CheckCircle, Users, Video, Bot, Mic, MessageSquare, Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

import { VideoCallModal } from './VideoCallModal';
import { ConversationSidebar } from './ConversationSidebar';
import { useAuth } from "@/hooks/useAuth";
import { Label } from './ui/label';
import { useVoiceConnection } from '@/hooks/use-voice-connection';
import { getWebSocketUrl } from '@/config/api';
import { useTranslation } from 'react-i18next';
import { useI18n } from '@/hooks/useI18n';

interface ConversationDetailProps {
  sessionId: string;
  agentId: number;
}

export const ConversationDetail: React.FC<ConversationDetailProps> = ({ sessionId, agentId }) => {
  const { t } = useTranslation();
  const { isRTL } = useI18n();
  const queryClient = useQueryClient();
  const companyId = 1; // Hardcoded company ID
  const [message, setMessage] = useState('');
  const [note, setNote] = useState('');
  const [isCallModalOpen, setCallModalOpen] = useState(false);
  const [isAiEnabled, setIsAiEnabled] = useState(true);
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ws = useRef<WebSocket | null>(null);
  const { authFetch, token } = useAuth();
  const { isRecording, startRecording, stopRecording } = useVoiceConnection(agentId, sessionId);

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const { data: sessionDetails } = useQuery({
    queryKey: ['sessionDetails', sessionId],
    queryFn: async () => {
      const res = await authFetch(`/api/v1/conversations/${agentId}/sessions/${sessionId}`);
      if (!res.ok) throw new Error('Failed to fetch session details');
      return res.json();
    },
    enabled: !!sessionId,
  });

  // Update isAiEnabled when sessionDetails changes
  useEffect(() => {
    if (sessionDetails?.is_ai_enabled !== undefined) {
      setIsAiEnabled(sessionDetails.is_ai_enabled);
    }
  }, [sessionDetails?.is_ai_enabled]);

  const toggleAiMutation = useMutation({
    mutationFn: (enabled: boolean) => authFetch(`/api/v1/conversations/${sessionId}/toggle-ai`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_ai_enabled: enabled }),
    }).then(res => { if (!res.ok) throw new Error('Failed to update AI status'); return res.json() }),
    onSuccess: (data) => {
      setIsAiEnabled(data.is_ai_enabled);
      queryClient.invalidateQueries({ queryKey: ['sessionDetails', sessionId] });
      toast({
        title: t('conversations.detail.toasts.success'),
        description: data.is_ai_enabled ? t('conversations.detail.toasts.aiEnabled') : t('conversations.detail.toasts.aiDisabled'),
        variant: 'success'
      });
    },
    onError: (e: Error) => toast({ title: t('conversations.detail.toasts.error'), description: e.message, variant: 'destructive' }),
  });

  const { data: messages, isLoading } = useQuery<ChatMessage[]>({
    queryKey: ['messages', agentId, sessionId, companyId],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/conversations/${agentId}/${sessionId}`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    },
    enabled: !!sessionId && !!agentId,
  });

  useEffect(() => {
    if (sessionId && agentId && token) {
      ws.current = new WebSocket(`${getWebSocketUrl()}/api/v1/ws/${agentId}/${sessionId}?user_type=agent&token=${token}`);
      ws.current.onmessage = (event) => {
        const newMessage = JSON.parse(event.data);

        // Filter out ping/pong messages
        if (newMessage.type === 'ping' || newMessage.type === 'pong') {
          return;
        }

        queryClient.setQueryData<ChatMessage[]>(['messages', agentId, sessionId, companyId], (oldMessages = []) => {
          if (oldMessages.some(msg => msg.id === newMessage.id)) {
            return oldMessages;
          }
          return [...oldMessages, newMessage];
        });
      };
      return () => ws.current?.close();
    }
  }, [sessionId, agentId, companyId, queryClient, token]);

  const { data: users } = useQuery<User[]>({
    queryKey: ['users', companyId],
    queryFn: () => authFetch(`/api/v1/users/`).then(res => res.json()),
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: (newMessage: { message: string, message_type: string, sender: string, token?: string }) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(newMessage));
            return Promise.resolve();
        }
        return Promise.reject(new Error("WebSocket is not connected."));
    },
    onSuccess: () => {
        setMessage('');
        setNote('');
    },
    onError: (e: Error) => toast({ title: t('conversations.detail.toasts.error'), description: e.message, variant: 'destructive' }),
  });

  const statusMutation = useMutation({
    mutationFn: (newStatus: string) => authFetch(`/api/v1/conversations/${sessionId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', agentId] });
      queryClient.invalidateQueries({ queryKey: ['sessions', companyId] });
      queryClient.invalidateQueries({ queryKey: ['sessionDetails', sessionId] });
      toast({
        title: t('conversations.detail.toasts.statusUpdated'),
        description: t('conversations.detail.toasts.statusUpdatedDesc'),
        variant: 'success'
      });
    },
    onError: (e: Error) => toast({ title: t('conversations.detail.toasts.error'), description: e.message, variant: 'destructive' }),
  });

  const startCallMutation = useMutation({
    mutationFn: async () => {
      const tokenResponse = await authFetch(`/api/v1/calls/token?session_id=${sessionId}&user_id=${sessionId}`);
      if (!tokenResponse.ok) throw new Error('Failed to get video call token');
      const tokenData = await tokenResponse.json();
      await authFetch(`/api/v1/calls/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      });
      return tokenData.token;
    },
    onSuccess: (userToken) => {
      setCallModalOpen(true);
      sendMessageMutation.mutate({
        message: t('conversations.detail.videoCallMessage'),
        message_type: 'video_call_invitation',
        sender: 'agent',
        token: userToken,
      });
    },
    onError: (e: Error) => toast({ title: t('conversations.detail.toasts.error'), description: e.message, variant: 'destructive' }),
  });

  const assigneeMutation = useMutation({
    mutationFn: (newAssigneeId: number) => authFetch(`/api/v1/conversations/${sessionId}/assignee`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json'},
      body: JSON.stringify({ user_id: newAssigneeId }),
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', agentId] });
      queryClient.invalidateQueries({ queryKey: ['sessions', companyId] });
      queryClient.invalidateQueries({ queryKey: ['sessionDetails', sessionId] });
      toast({
        title: t('conversations.detail.toasts.assignmentUpdated'),
        description: t('conversations.detail.toasts.assignmentUpdatedDesc'),
        variant: 'success'
      });
    },
    onError: (e: Error) => toast({ title: t('conversations.detail.toasts.error'), description: e.message, variant: 'destructive' }),
  });

  const handlePostNote = () => {
    if (note.trim()) sendMessageMutation.mutate({ message: note.trim(), message_type: 'note', sender: 'agent' });
  };

  const handleSendMessage = () => {
    if (message.trim()) sendMessageMutation.mutate({ message: message.trim(), message_type: 'message', sender: 'agent' });
  };

  const contact: Contact | undefined = sessionDetails?.contact;
  const conversationStatus = sessionDetails?.status || 'bot';

  return (
    <div className="flex h-full bg-white dark:bg-slate-800 card-shadow-lg rounded-lg overflow-hidden">
      <div className="flex flex-col flex-grow">
        <header className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 shadow-sm">
          {/* Top Row - Title and Quick Actions */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold dark:text-white">{t('conversations.detail.conversation')}</h2>
                <p className="text-xs text-muted-foreground">{t('conversations.detail.sessionId', { id: sessionId.slice(0, 12) + '...' })}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => startCallMutation.mutate()}
                disabled={startCallMutation.isPending}
                className="btn-hover-lift"
              >
                <Video className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('conversations.detail.videoCall')}
              </Button>
              <Button
                size="sm"
                variant={conversationStatus === 'resolved' ? 'outline' : 'default'}
                onClick={() => statusMutation.mutate('resolved')}
                disabled={statusMutation.isPending || conversationStatus === 'resolved'}
                className={conversationStatus === 'resolved' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-blue-600 hover:bg-blue-700 text-white btn-hover-lift'}
              >
                <CheckCircle className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {conversationStatus === 'resolved' ? t('conversations.detail.resolved') : t('conversations.detail.resolve')}
              </Button>
            </div>
          </div>

          {/* Bottom Row - Controls */}
          <div className="flex items-center gap-4 px-6 py-3">
            {/* AI Toggle */}
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700 card-shadow">
              <Bot className={`h-4 w-4 ${isAiEnabled ? 'text-blue-600' : 'text-gray-400'}`} />
              <Label htmlFor="ai-toggle" className="text-sm font-medium cursor-pointer">
                {t('conversations.detail.aiReplies')}
              </Label>
              <Switch
                key={`ai-toggle-${sessionId}`}
                id="ai-toggle"
                checked={isAiEnabled}
                onCheckedChange={toggleAiMutation.mutate}
                className="data-[state=checked]:bg-blue-600"
              />
            </div>

            {/* Assign To */}
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700 card-shadow">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Select
                key={`assignee-${sessionId}`}
                value={sessionDetails?.assignee_id?.toString() || undefined}
                onValueChange={(value) => assigneeMutation.mutate(parseInt(value))}
              >
                <SelectTrigger className="border-0 h-auto p-0 focus:ring-0 w-[180px]">
                  <SelectValue placeholder={t('conversations.detail.assignTo')} />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(users) && users.map(user => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-xs font-semibold text-blue-600">
                            {user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm">{user.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Badge */}
            <div className={isRTL ? 'mr-auto' : 'ml-auto'}>
              <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                conversationStatus === 'resolved' ? 'bg-green-100 text-green-800' :
                conversationStatus === 'active' ? 'bg-blue-100 text-blue-800' :
                conversationStatus === 'assigned' ? 'bg-purple-100 text-purple-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {conversationStatus.charAt(0).toUpperCase() + conversationStatus.slice(1)}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-grow overflow-y-auto p-6 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p className="text-sm text-muted-foreground">{t('conversations.detail.loadingMessages')}</p>
              </div>
            </div>
          ) : messages && messages.length > 0 ? (
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div key={`${msg.id}-${index}`}>
                  {msg.message_type === 'note' ? (
                    /* Private Note */
                    <div className="flex justify-center my-6">
                      <div className="max-w-2xl w-full bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-l-4 border-yellow-400 dark:border-yellow-600 rounded-lg p-4 card-shadow">
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-full bg-yellow-400 dark:bg-yellow-600 flex items-center justify-center flex-shrink-0">
                            <Book className="h-4 w-4 text-yellow-900 dark:text-yellow-100" />
                          </div>
                          <div className="flex-grow">
                            <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-400 mb-1">{t('conversations.detail.privateNote')}</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{msg.message}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              {new Date(msg.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Regular Message */
                    <div className={`flex items-end gap-3 ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
                      {msg.sender === 'user' && (
                        <Avatar className="h-10 w-10 flex-shrink-0 ring-2 ring-slate-200">
                          <AvatarImage src={`https://avatar.vercel.sh/${contact?.email}.png`} alt={contact?.name || 'User'} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm">
                            {contact?.name?.charAt(0)?.toUpperCase() || contact?.email?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className={`flex flex-col ${msg.sender === 'user' ? 'items-start' : 'items-end'} max-w-[75%]`}>
                        <div
                          className={`px-4 py-3 rounded-2xl card-shadow ${
                            msg.sender === 'user'
                              ? `bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 ${isRTL ? 'rounded-br-sm' : 'rounded-bl-sm'} dark:text-white`
                              : `bg-gradient-to-br from-blue-600 to-purple-600 text-white ${isRTL ? 'rounded-bl-sm' : 'rounded-br-sm'}`
                          }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {msg.message}
                          </p>
                        </div>
                        <p className={`text-xs mt-1.5 px-1 ${msg.sender === 'user' ? 'text-gray-500 dark:text-gray-400' : 'text-gray-600 dark:text-gray-400'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {msg.sender !== 'user' && (
                        <Avatar className="h-10 w-10 flex-shrink-0 ring-2 ring-purple-200">
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white font-semibold">
                            AI
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 mb-4">
                  <MessageSquare className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t('conversations.detail.noMessages')}</h3>
                <p className="text-muted-foreground text-sm">{t('conversations.detail.noMessagesDesc')}</p>
              </div>
            </div>
          )}
        </main>

        <footer className="border-t border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 p-5 flex-shrink-0">
          <Tabs defaultValue="reply" className="w-full">
            <TabsList className="bg-white dark:bg-slate-900 rounded-lg p-1 shadow-sm border dark:border-slate-700">
              <TabsTrigger value="reply" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md">
                <CornerDownRight className="h-4 w-4 mr-2"/>
                {t('conversations.detail.replyTab')}
              </TabsTrigger>
              <TabsTrigger value="note" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white rounded-md">
                <Book className="h-4 w-4 mr-2"/>
                {t('conversations.detail.privateNoteTab')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="reply" className="mt-4">
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 card-shadow p-1">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t('conversations.detail.messageInput')}
                  className="border-0 focus-visible:ring-0 resize-none min-h-[80px]"
                  rows={3}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <div className={`flex items-center justify-between px-3 pb-2 pt-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Paperclip className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button
                      variant={isRecording ? "destructive" : "ghost"}
                      size="icon"
                      onClick={handleMicClick}
                      className="h-8 w-8"
                    >
                      <Mic className={`h-4 w-4 ${isRecording ? 'text-white' : 'text-gray-500'}`} />
                    </Button>
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={sendMessageMutation.isPending || !message.trim()}
                    size="sm"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white btn-hover-lift"
                  >
                    <Send className={`h-4 w-4 ${isRTL ? 'ml-2 rotate-180' : 'mr-2'}`} />
                    {t('conversations.detail.send')}
                  </Button>
                </div>
              </div>

              {suggestedReplies.length > 0 && (
                <div className="mt-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-3 card-shadow">
                  <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-purple-600" />
                    {t('conversations.detail.aiSuggestions')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedReplies.map((reply, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => setMessage(reply)}
                        className="text-xs hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                      >
                        {reply}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="note" className="mt-4">
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border-2 border-yellow-300 card-shadow p-1">
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t('conversations.detail.noteInput')}
                  className="border-0 bg-transparent focus-visible:ring-0 resize-none min-h-[80px]"
                  rows={3}
                />
                <div className={`flex items-center justify-between px-3 pb-2 pt-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="flex items-center gap-2 text-xs text-yellow-800">
                    <Book className="h-3 w-3" />
                    <span className="font-medium">{t('conversations.detail.privateTeamOnly')}</span>
                  </div>
                  <Button
                    onClick={handlePostNote}
                    disabled={sendMessageMutation.isPending || !note.trim()}
                    size="sm"
                    className="bg-yellow-500 hover:bg-yellow-600 text-white btn-hover-lift"
                  >
                    <Book className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t('conversations.detail.saveNote')}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </footer>
      </div>

      {contact && (
        <ConversationSidebar
          contactName={contact.name || 'Unknown User'}
          contactEmail={contact.email || 'No email'}
          contactPhone={contact.phone_number || 'No phone'}
          sessionId={sessionId}
          createdAt={sessionDetails?.created_at}
        />
      )}

      {isCallModalOpen && (
        <VideoCallModal 
            sessionId={sessionId} 
            userId="agent"
            onClose={() => setCallModalOpen(false)} 
        />
      )}
    </div>
  );
};