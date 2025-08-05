import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChatMessage, User, Contact } from '@/types';
import { Paperclip, Send, CornerDownRight, Book, CheckCircle, Users, Video, Bot, Mic } from 'lucide-react';
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

interface ConversationDetailProps {
  sessionId: string;
  agentId: number;
}

export const ConversationDetail: React.FC<ConversationDetailProps> = ({ sessionId, agentId }) => {
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
      const res = await authFetch(`/api/v1/sessions/${sessionId}`);
      if (!res.ok) throw new Error('Failed to fetch session details');
      return res.json();
    },
    onSuccess: (data) => {
      setIsAiEnabled(data.is_ai_enabled);
    },
    enabled: !!sessionId,
  });

  const toggleAiMutation = useMutation({
    mutationFn: (enabled: boolean) => authFetch(`/api/v1/conversations/${sessionId}/toggle-ai`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_ai_enabled: enabled }),
    }).then(res => { if (!res.ok) throw new Error('Failed to update AI status'); return res.json() }),
    onSuccess: (data) => {
      setIsAiEnabled(data.is_ai_enabled);
      queryClient.invalidateQueries({ queryKey: ['sessionDetails', sessionId] });
      toast({ title: 'Success', description: `AI has been ${data.is_ai_enabled ? 'enabled' : 'disabled'}.` });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
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
      ws.current = new WebSocket(`ws://${window.location.host}/api/v1/ws/${agentId}/${sessionId}?user_type=agent&token=${token}`);
      ws.current.onmessage = (event) => {
        const newMessage = JSON.parse(event.data);
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
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const statusMutation = useMutation({
    mutationFn: (newStatus: string) => authFetch(`/api/v1/conversations/${sessionId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', agentId] });
      toast({ title: 'Success', description: 'Conversation status updated.' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
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
        message: 'I am starting a video call. Please join.',
        message_type: 'video_call_invitation',
        sender: 'agent',
        token: userToken,
      });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const assigneeMutation = useMutation({
    mutationFn: (newAssigneeId: number) => authFetch(`/api/v1/conversations/${sessionId}/assignee`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json'},
      body: JSON.stringify({ user_id: newAssigneeId }),
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', agentId] });
      toast({ title: 'Success', description: 'Conversation assigned.' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
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
    <div className="flex h-screen bg-white">
      <div className="flex flex-col flex-grow">
        <header className="flex items-center justify-between p-4 border-b flex-wrap">
          <div>
            <h2 className="text-xl font-bold">Conversation</h2>
            <p className="text-sm text-gray-500">Session ID: {sessionId}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <div className="flex items-center space-x-2">
              <Bot className={`h-5 w-5 ${isAiEnabled ? 'text-blue-500' : 'text-gray-400'}`} />
              <Label htmlFor="ai-toggle" className="text-sm font-medium">AI Replies</Label>
              <Switch id="ai-toggle" checked={isAiEnabled} onCheckedChange={toggleAiMutation.mutate} />
            </div>
            <Separator orientation="vertical" className="h-8" />
            <Select onValueChange={(value) => assigneeMutation.mutate(parseInt(value))}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Assign to..." />
              </SelectTrigger>
              <SelectContent>
                {users?.map(user => <SelectItem key={user.id} value={user.id.toString()}><Users className="h-4 w-4 mr-2 inline-block"/>{user.email}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={() => startCallMutation.mutate()} disabled={startCallMutation.isPending}>
              <Video className="h-4 w-4 mr-2" />
              Start Video Call
            </Button>
            <Button size="sm" onClick={() => statusMutation.mutate('resolved')} disabled={statusMutation.isPending || conversationStatus === 'resolved'}>
              <CheckCircle className="h-4 w-4 mr-2" />
              {conversationStatus === 'resolved' ? 'Resolved' : 'Resolve'}
            </Button>
          </div>
        </header>

        <main className="flex-grow overflow-y-auto p-6 space-y-6">
          {isLoading ? <p>Loading messages...</p> : messages?.map((msg, index) => (
            <div key={`${msg.id}-${index}`} className={`flex items-end gap-3 ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
              {msg.message_type === 'note' ? (
                <div className="w-full my-4">
                  <div className="bg-yellow-100/60 border-l-4 border-yellow-400 rounded-r-lg p-4 w-full">
                    <p className="text-sm font-semibold text-yellow-800">Private Note</p>
                    <p className="text-sm text-gray-700 mt-1">{msg.message}</p>
                    <p className="text-xs text-right text-gray-500 mt-2">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              ) : (
                <>
                  {msg.sender === 'user' && (
                    <Avatar className="h-9 w-9 flex-shrink-0">
                      <AvatarImage src={`https://avatar.vercel.sh/${contact?.email}.png`} alt={contact?.name} />
                      <AvatarFallback>{contact?.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-[70%] p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-gray-100 rounded-bl-none' : 'bg-blue-500 text-white rounded-br-none'}`}>
                    <p className="text-sm">{msg.message}</p>
                    <p className={`text-xs mt-1.5 text-right ${msg.sender === 'user' ? 'text-gray-500' : 'text-blue-200'}`}>{new Date(msg.timestamp).toLocaleTimeString()}</p>
                  </div>
                  {msg.sender !== 'user' && (
                    <Avatar className="h-9 w-9 flex-shrink-0">
                      <AvatarFallback>A</AvatarFallback>
                    </Avatar>
                  )}
                </>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </main>

        <footer className="border-t bg-white p-4">
          <Tabs defaultValue="reply" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-sm">
              <TabsTrigger value="reply"><CornerDownRight className="h-4 w-4 mr-2"/>Reply</TabsTrigger>
              <TabsTrigger value="note"><Book className="h-4 w-4 mr-2"/>Private Note</TabsTrigger>
            </TabsList>
            <TabsContent value="reply" className="mt-4">
              <div className="relative">
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type your message..." className="pr-32" rows={3} />
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <Button variant="ghost" size="icon"><Paperclip className="h-5 w-5" /></Button>
                  <Button size="icon" onClick={handleSendMessage} disabled={sendMessageMutation.isPending || !message.trim()}><Send className="h-5 w-5" /></Button>
                  <Button variant={isRecording ? "destructive" : "outline"} size="icon" onClick={handleMicClick}>
                    <Mic className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              {suggestedReplies.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-500 mb-2">Suggested Replies</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedReplies.map((reply, index) => (
                      <Button key={index} variant="outline" size="sm" onClick={() => setMessage(reply)}>{reply}</Button>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
            <TabsContent value="note" className="mt-4">
              <div className="relative">
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Type an internal note..." className="bg-yellow-50" rows={3} />
                <div className="absolute bottom-3 right-3">
                  <Button onClick={handlePostNote} disabled={sendMessageMutation.isPending || !note.trim()}>
                    Save Note
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