import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChatMessage, User } from '@/types';
import { Paperclip, Send, CornerDownRight, Book, UserCheck, CheckCircle, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ConversationDetailProps {
  sessionId: string;
  agentId: number;
}

export const ConversationDetail: React.FC<ConversationDetailProps> = ({ sessionId, agentId }) => {
  const queryClient = useQueryClient();
  const companyId = 1; // Hardcoded company ID
  const [message, setMessage] = useState('');
  const [note, setNote] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useQuery<ChatMessage[]>({
    queryKey: ['messages', agentId, sessionId, companyId],
    queryFn: async () => {
      const response = await fetch(`http://localhost:8000/api/v1/conversations/${agentId}/${sessionId}`, {
        headers: { 'X-Company-ID': companyId.toString() },
      });
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    },
    enabled: !!sessionId && !!agentId,
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ['users', companyId],
    queryFn: async () => {
      const response = await fetch(`http://localhost:8000/api/v1/users/`, {
        headers: { 'X-Company-ID': companyId.toString() },
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const postNoteMutation = useMutation({
    mutationFn: (newNote: string) => fetch(`http://localhost:8000/api/v1/conversations/${agentId}/${sessionId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Company-ID': companyId.toString() },
      body: JSON.stringify({ message: newNote }),
    }).then(res => { if (!res.ok) throw new Error('Failed to post note'); return res.json() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', agentId, sessionId, companyId] });
      setNote('');
      toast({ title: 'Success', description: 'Private note added.' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const statusMutation = useMutation({
    mutationFn: (newStatus: string) => fetch(`http://localhost:8000/api/v1/conversations/${sessionId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Company-ID': companyId.toString() },
      body: JSON.stringify({ status: newStatus }),
    }).then(res => { if (!res.ok) throw new Error('Failed to update status'); return res.json() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', agentId] });
      toast({ title: 'Success', description: 'Conversation status updated.' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const assigneeMutation = useMutation({
    mutationFn: (newAssigneeId: number) => fetch(`http://localhost:8000/api/v1/conversations/${sessionId}/assignee`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Company-ID': companyId.toString() },
      body: JSON.stringify({ user_id: newAssigneeId }),
    }).then(res => { if (!res.ok) throw new Error('Failed to update assignee'); return res.json() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions', agentId] });
      toast({ title: 'Success', description: 'Conversation assigned.' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });


  const handlePostNote = () => {
    if (note.trim()) postNoteMutation.mutate(note.trim());
  };

  const handleSendMessage = () => {
    // This functionality is not fully implemented yet, as it requires a websocket connection
    // to the agent execution service. For now, we'll just show a toast.
    toast({ title: 'Not Implemented', description: 'Sending messages to the user is not yet connected.' });
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b">
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
      <div className="border-t p-4">
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
                <Button size="sm" onClick={handleSendMessage}><Send className="h-4 w-4" /></Button>
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
                <Button size="sm" onClick={handlePostNote} disabled={postNoteMutation.isPending}>
                  {postNoteMutation.isPending ? "Saving..." : "Save Note"}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
};