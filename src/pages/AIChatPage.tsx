
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
import { Send, Bot, MessageCircle, Loader2, Sparkles } from 'lucide-react';
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
    <div className="h-[calc(100vh-4rem)] flex bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Sidebar - Agents & Conversations */}
      <div className="w-80 flex-shrink-0 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
          <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            AI Chat
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Chat with your AI agents</p>
        </div>

        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Select Agent</label>
          <Select onValueChange={(value) => setSelectedAgent(agents?.find(a => a.id === parseInt(value)) || null)}>
            <SelectTrigger className="dark:bg-slate-900 dark:border-slate-600 dark:text-white">
              <SelectValue placeholder="Choose an agent..." />
            </SelectTrigger>
            <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
              {isLoadingAgents ? (
                <SelectItem value="loading" disabled className="dark:text-gray-400">Loading agents...</SelectItem>
              ) : (
                agents?.map(agent => (
                  <SelectItem key={agent.id} value={String(agent.id)} className="dark:text-white dark:focus:bg-slate-700">
                    {agent.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {selectedAgent && (
            <div className="mt-3 p-3 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-cyan-900 dark:text-cyan-100">{selectedAgent.name}</p>
                  <p className="text-xs text-cyan-700 dark:text-cyan-300">Active</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Conversation History</h3>
          <div className="space-y-2">
            <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-700 cursor-pointer border-l-4 border-cyan-500">
              <p className="text-sm font-medium dark:text-white">Current Chat</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{messages.length} messages</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold dark:text-white">
                {selectedAgent ? selectedAgent.name : 'AI Assistant'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Always here to help</p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-6 bg-slate-50 dark:bg-slate-900">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/50 dark:to-blue-900/50 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="h-10 w-10 text-cyan-600 dark:text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Start a conversation</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md">
                {selectedAgent ? `Chat with ${selectedAgent.name} to get started` : 'Select an agent and send a message to begin'}
              </p>
            </div>
          ) : (
            <div className="space-y-6 max-w-4xl mx-auto">
              {messages.map(msg => (
                <div key={msg.id} className={cn('flex items-start gap-3', msg.sender === 'user' ? 'justify-end' : 'justify-start')}>
                  {msg.sender === 'agent' && (
                    <Avatar className="w-8 h-8 border-2 border-cyan-500 dark:border-cyan-400">
                      <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-xs">
                        {selectedAgent?.name.substring(0, 2).toUpperCase() || 'AI'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn(
                    'p-4 rounded-2xl max-w-lg shadow-sm',
                    msg.sender === 'user'
                      ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-br-sm'
                      : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 border border-slate-200 dark:border-slate-700 rounded-bl-sm'
                  )}>
                    <p className="text-sm leading-relaxed">{msg.message}</p>
                    <p className={cn('text-xs mt-2', msg.sender === 'user' ? 'text-cyan-100' : 'text-gray-400 dark:text-gray-500')}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {msg.sender === 'user' && (
                    <Avatar className="w-8 h-8 border-2 border-blue-500 dark:border-blue-400">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                        You
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {mutation.isPending && (
                <div className="flex items-start gap-3">
                  <Avatar className="w-8 h-8 border-2 border-cyan-500 dark:border-cyan-400">
                    <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-xs">
                      {selectedAgent?.name.substring(0, 2).toUpperCase() || 'AI'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-bl-sm">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-cyan-600 dark:text-cyan-400" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0">
          <form onSubmit={handleSendMessage} className="flex items-end gap-3 max-w-4xl mx-auto">
            <Input
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 rounded-2xl border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 py-3 px-4"
              disabled={mutation.isPending}
            />
            <Button
              type="submit"
              disabled={mutation.isPending || !inputValue.trim()}
              className="rounded-2xl h-12 px-6 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
            >
              {mutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  Send
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIChatPage;
