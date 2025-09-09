
import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getAgents } from '@/services/agentService';
import { postChatMessage } from '@/services/aiChatService';
import { Agent } from '@/types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: number;
  message: string;
  sender: 'user' | 'agent';
  timestamp: string;
}

const AIChatPage: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: agents, isLoading: isLoadingAgents } = useQuery<Agent[]>({ queryKey: ['agents'], queryFn: getAgents });

  const mutation = useMutation({
    mutationFn: (message: string) => postChatMessage(message, conversationId, selectedAgent?.id),
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { id: Date.now(), message: data.message, sender: 'agent', timestamp: new Date().toISOString() }]);
      if (!conversationId) {
        setConversationId(data.session_id);
      }
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="p-4 h-full flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>AI Chat</CardTitle>
          <div className="w-64">
            <Select onValueChange={(value) => setSelectedAgent(agents?.find(a => a.id === parseInt(value)) || null)}>
              <SelectTrigger>
                <SelectValue placeholder="Select an agent (optional)" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingAgents ? (
                  <SelectItem value="loading" disabled>Loading agents...</SelectItem>
                ) : (
                  agents?.map(agent => (
                    <SelectItem key={agent.id} value={String(agent.id)}>{agent.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.map(msg => (
                <div key={msg.id} className={cn('flex items-start gap-3', msg.sender === 'user' ? 'justify-end' : 'justify-start')}>
                  {msg.sender === 'agent' && (
                    <Avatar>
                      <AvatarFallback>{selectedAgent?.name.substring(0, 2).toUpperCase() || 'AI'}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn('p-3 rounded-lg max-w-xs', msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800')}>
                    <p>{msg.message}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          <form onSubmit={handleSendMessage} className="mt-4 flex items-center gap-2">
            <Input
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <Button type="submit" disabled={mutation.isLoading}>
              {mutation.isLoading ? 'Sending...' : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIChatPage;
