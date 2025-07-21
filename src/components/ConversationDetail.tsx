import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChatMessage, User } from '@/types';
import { Paperclip, Send, CornerDownRight, Book, UserCheck, CheckCircle, Users, Video } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { VideoCallModal } from './VideoCallModal';
import { useAuth } from "@/hooks/useAuth";

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
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
  const [widgetSettings, setWidgetSettings] = useState<any>(null); // State to store widget settings
  const [feedbackRating, setFeedbackRating] = useState<number>(0);
  const [feedbackNotes, setFeedbackNotes] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ws = useRef<WebSocket | null>(null);
  const { authFetch } = useAuth();

  const { data: messages, isLoading } = useQuery<ChatMessage[]>({
    queryKey: ['messages', agentId, sessionId, companyId],
    queryFn: async () => {
      // Limit messages to 10
      const response = await authFetch(`http://localhost:8000/api/v1/conversations/${agentId}/${sessionId}`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    },
    enabled: !!sessionId && !!agentId,
  });

  useEffect(() => {
    if (sessionId && agentId) {
      // Pass user_type as a query parameter
      ws.current = new WebSocket(`ws://localhost:8000/ws/${companyId}/${agentId}/${sessionId}?user_type=agent`);

      ws.current.onopen = () => {
        console.log('WebSocket: Connected');
      };

      ws.current.onmessage = (event) => {
        const newMessage = JSON.parse(event.data);
        console.log('WebSocket: Received message:', newMessage);
        queryClient.setQueryData<ChatMessage[]>(['messages', agentId, sessionId, companyId], (oldMessages) => {
          if (oldMessages) {
            // Avoid adding duplicates
            if (oldMessages.find(msg => msg.id === newMessage.id)) {
              return oldMessages;
            }
            return [...oldMessages, newMessage];
          }
          return [newMessage];
        });
      };

      ws.current.onclose = (event) => {
        console.log('WebSocket: Disconnected', event);
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket: Error', error);
      };

      return () => {
        ws.current?.close();
      };
    }
  }, [sessionId, agentId, companyId, queryClient]);

  const { data: users } = useQuery<User[]>({
    queryKey: ['users', companyId],
    queryFn: async () => {
      const response = await authFetch(`http://localhost:8000/api/v1/users/`);
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (!agentId) return;

    const fetchWidgetSettings = async () => {
      try {
        const response = await authFetch(`http://localhost:8000/api/v1/agents/${agentId}/widget-settings`);
        if (response.ok) {
          const data = await response.json();
          setWidgetSettings(data);
        }
      } catch (error) {
        console.error("Failed to fetch widget settings:", error);
      }
    };
    fetchWidgetSettings();
  }, [agentId]);

  useEffect(() => {
    if (messages && messages.length > 0 && widgetSettings?.suggestions_enabled) {
      const fetchSuggestions = async () => {
        try {
          const response = await authFetch(`http://localhost:8000/api/v1/suggestions/suggest-replies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversation_history: messages.map(m => m.message) })
          });
          if (response.ok) {
            const data = await response.json();
            setSuggestedReplies(data.suggested_replies);
          }
        } catch (error) {
          console.error("Failed to fetch suggestions:", error);
        }
      };
      fetchSuggestions();
    } else if (!widgetSettings?.suggestions_enabled) {
      setSuggestedReplies([]); // Clear suggestions if disabled
    }
  }, [messages, widgetSettings?.suggestions_enabled]);

  const sendMessageMutation = useMutation({
    mutationFn: (newMessage: { message: string, message_type: string, sender: string }) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(newMessage));
            return Promise.resolve();
        } else {
            return Promise.reject(new Error("WebSocket is not connected."));
        }
    },
    onSuccess: () => {
        setMessage('');
        setNote('');
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const statusMutation = useMutation({
    mutationFn: (newStatus: string) => authFetch(`http://localhost:8000/api/v1/conversations/${sessionId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    }).then(res => { if (!res.ok) throw new Error('Failed to update status'); return res.json() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', agentId] });
      toast({ title: 'Success', description: 'Conversation status updated.' });
      if (newStatus === 'resolved') {
        // Optionally show feedback form or modal here
      }
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const feedbackMutation = useMutation({
    mutationFn: ({ rating, notes }: { rating: number, notes: string }) => authFetch(`http://localhost:8000/api/v1/conversations/${sessionId}/feedback`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback_rating: rating, feedback_notes: notes }),
    }).then(res => { if (!res.ok) throw new Error('Failed to submit feedback'); return res.json() }),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Feedback submitted successfully.' });
      // Optionally hide feedback form after submission
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const startCallMutation = useMutation({
    mutationFn: () => authFetch(`http://localhost:8000/api/v1/calls/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId }),
    }).then(res => { if (!res.ok) throw new Error('Failed to start call'); return res.json() }),
    onSuccess: () => {
      setCallModalOpen(true);
      sendMessageMutation.mutate({
        message: 'I am starting a video call. Please join.',
        message_type: 'video_call_invitation',
        sender: 'agent'
      });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const assigneeMutation = useMutation({
    mutationFn: (newAssigneeId: number) => authFetch(`http://localhost:8000/api/v1/conversations/${sessionId}/assignee`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json'},
      body: JSON.stringify({ user_id: newAssigneeId }),
    }).then(res => { if (!res.ok) throw new Error('Failed to update assignee'); return res.json() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', agentId] });
      toast({ title: 'Success', description: 'Conversation assigned.' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });


  const handlePostNote = () => {
    if (note.trim()) {
        sendMessageMutation.mutate({ message: note.trim(), message_type: 'note', sender: 'agent' });
    }
  };

  const handleSendMessage = () => {
    if (message.trim()) {
        sendMessageMutation.mutate({ message: message.trim(), message_type: 'message', sender: 'agent' });
    }
  };

  const handleFeedbackSubmit = () => {
    if (feedbackRating > 0) {
      feedbackMutation.mutate({ rating: feedbackRating, notes: feedbackNotes });
    } else {
      toast({ title: 'Error', description: 'Please provide a rating.', variant: 'destructive' });
    }
  };

  const isConversationResolved = messages && messages.length > 0 && messages[messages.length - 1].status === 'resolved';

  return (
    <Card className="h-full flex flex-col max-h-screen">
      <CardHeader className="border-b flex-shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Conversation</CardTitle>
            <p className="text-sm text-gray-500">{sessionId}</p>
          </div>
          <div className="flex items-center gap-2">
            <Select onValueChange={(value) => assigneeMutation.mutate(parseInt(value))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Assign to..." />
              </SelectTrigger>
              <SelectContent>
                {users?.map(user => <SelectItem key={user.id} value={user.id.toString()}><Users className="h-4 w-4 mr-2 inline-block"/>{user.email}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={() => statusMutation.mutate('resolved')}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Resolve
            </Button>
            <Button size="sm" variant="outline" onClick={() => startCallMutation.mutate()}>
              <Video className="h-4 w-4 mr-2" />
              Start Video Call
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <p>Loading messages...</p>
        ) : (
          messages?.map((msg) => (
            <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
              {msg.message_type === 'note' ? (
                <div className="w-full my-2 flex items-center gap-2">
                  <div className="h-px flex-1 bg-yellow-300"></div>
                  <div className="bg-yellow-100 border-yellow-300 border rounded-lg p-3 w-full max-w-3xl">
                    <p className="text-sm font-semibold text-yellow-800">Private Note</p>
                    <p className="text-sm text-yellow-900">{msg.message}</p>
                    <p className="text-xs text-right text-yellow-600 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                  </div>
                  <div className="h-px flex-1 bg-yellow-300"></div>
                </div>
              ) : (
                <>
                  {msg.sender === 'user' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-md p-3 rounded-lg ${msg.sender === 'user' ? 'bg-gray-200' : 'bg-blue-500 text-white'}`}>
                    <p>{msg.message}</p>
                    <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-gray-600' : 'text-blue-200'}`}>{new Date(msg.timestamp).toLocaleTimeString()}</p>
                  </div>
                  {msg.sender !== 'user' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>A</AvatarFallback>
                    </Avatar>
                  )}
                </>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </CardContent>
      <div className="border-t p-4 flex-shrink-0">
        <Tabs defaultValue="reply" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="reply"><CornerDownRight className="h-4 w-4 mr-2"/>Reply to Customer</TabsTrigger>
            <TabsTrigger value="note"><Book className="h-4 w-4 mr-2"/>Private Note</TabsTrigger>
          </TabsList>
          <TabsContent value="reply" className="mt-2">
            <div className="relative">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="pr-20"
              />
              <div className="absolute top-2 right-2 flex items-center gap-2">
                <Button variant="ghost" size="sm"><Paperclip className="h-4 w-4" /></Button>
                <Button size="sm" onClick={handleSendMessage} disabled={sendMessageMutation.isPending}><Send className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-sm font-medium text-gray-500">Suggested Replies</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {suggestedReplies.map((reply, index) => (
                  <Button key={index} variant="outline" size="sm" onClick={() => setMessage(reply)}>{reply}</Button>
                ))}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="note" className="mt-2">
            <div className="relative">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Type an internal note..."
                className="bg-yellow-50 pr-20"
              />
              <div className="absolute top-2 right-2">
                <Button size="sm" onClick={handlePostNote} disabled={sendMessageMutation.isPending}>
                  {sendMessageMutation.isPending ? "Saving..." : "Save Note"}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        {isConversationResolved && (
          <Card className="mt-4 p-4">
            <CardTitle className="text-lg mb-2">Provide Feedback</CardTitle>
            <div className="flex items-center gap-2 mb-4">
              <Label>Rating:</Label>
              {[1, 2, 3, 4, 5].map((star) => (
                <Button
                  key={star}
                  variant={feedbackRating >= star ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFeedbackRating(star)}
                >
                  {star}
                </Button>
              ))}
            </div>
            <div className="mb-4">
              <Label htmlFor="feedback-notes">Notes (Optional):</Label>
              <Textarea
                id="feedback-notes"
                value={feedbackNotes}
                onChange={(e) => setFeedbackNotes(e.target.value)}
                placeholder="Add any additional feedback here..."
                rows={3}
              />
            </div>
            <Button onClick={handleFeedbackSubmit} disabled={feedbackMutation.isPending}>
              {feedbackMutation.isPending ? "Submitting..." : "Submit Feedback"}
            </Button>
          </Card>
        )}
      </div>
      {isCallModalOpen && (
        <VideoCallModal 
            sessionId={sessionId} 
            userId="agent" // The agent's user ID
            onClose={() => setCallModalOpen(false)} 
        />
        )
      }
    </Card>
    
  );
};