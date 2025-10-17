import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, User, Send, Mic, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ChatMessage {
  id: string | number;
  sender: 'user' | 'agent' | 'system';
  text: string;
  timestamp: string;
}

interface MessengerPreviewProps {
  messages: ChatMessage[];
  customization: any;
  handleSendMessage: (text?: string) => void;
  message: string;
  setMessage: (message: string) => void;
  isRecording: boolean;
  handleToggleRecording: () => void;
}

export const MessengerPreview: React.FC<MessengerPreviewProps> = ({
  messages,
  customization,
  handleSendMessage,
  message,
  setMessage,
  isRecording,
  handleToggleRecording,
}) => {
  return (
    <div className="bg-white h-full flex flex-col">
      <div className="p-2 border-b flex items-center">
        <Avatar className="h-8 w-8 mr-2">
          <AvatarImage src={customization.agent_avatar_url} alt="Agent" />
          <AvatarFallback>{customization.header_title.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold text-sm">{customization.header_title}</h3>
          <p className="text-xs text-gray-500">Typically replies instantly</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex w-full items-end space-x-2',
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {msg.sender === 'agent' && (
              <Avatar className="h-6 w-6">
                <AvatarImage src={customization.agent_avatar_url} alt="Agent" />
                <AvatarFallback>
                  <Bot size={14} />
                </AvatarFallback>
              </Avatar>
            )}
            <div
              className={cn(
                'max-w-[70%] p-2 rounded-2xl text-sm',
                msg.sender === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-black'
              )}
            >
              <p className="break-words">{msg.text}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="p-2 border-t flex items-center">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Aa"
          className="flex-1 text-sm rounded-full px-3 py-1 bg-gray-100 border-transparent focus:ring-blue-500"
        />
        <Button size="icon" variant="ghost" onClick={() => handleSendMessage()} className="rounded-full">
          <Send className="h-5 w-5 text-blue-500" />
        </Button>
        <Button onClick={handleToggleRecording} variant="ghost" size="icon" className="rounded-full">
          {isRecording ? <Loader2 className="animate-spin text-blue-500" /> : <Mic className="h-5 w-5 text-blue-500" />}
        </Button>
      </div>
    </div>
  );
};
