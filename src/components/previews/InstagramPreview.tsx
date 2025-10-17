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

interface InstagramPreviewProps {
  messages: ChatMessage[];
  customization: any;
  handleSendMessage: (text?: string) => void;
  message: string;
  setMessage: (message: string) => void;
  isRecording: boolean;
  handleToggleRecording: () => void;
}

export const InstagramPreview: React.FC<InstagramPreviewProps> = ({
  messages,
  customization,
  handleSendMessage,
  message,
  setMessage,
  isRecording,
  handleToggleRecording,
}) => {
  return (
    <div className="bg-black h-full flex flex-col text-white">
      <div className="p-2 border-b border-gray-800 flex items-center">
        <Avatar className="h-8 w-8 mr-2">
          <AvatarImage src={customization.agent_avatar_url} alt="Agent" />
          <AvatarFallback>{customization.header_title.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold text-sm">{customization.header_title}</h3>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
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
                'max-w-[70%] p-3 rounded-2xl text-sm',
                msg.sender === 'user'
                  ? 'bg-blue-500'
                  : 'bg-gray-800'
              )}
            >
              <p className="break-words">{msg.text}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="p-2 m-2 border border-gray-700 rounded-full flex items-center">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Message..."
          className="flex-1 text-sm bg-transparent border-none text-white placeholder-gray-400 focus:ring-0"
        />
        <Button size="icon" variant="ghost" onClick={() => handleSendMessage()} className="rounded-full">
          <Send className="h-5 w-5 text-white" />
        </Button>
        <Button onClick={handleToggleRecording} variant="ghost" size="icon" className="rounded-full">
          {isRecording ? <Loader2 className="animate-spin text-white" /> : <Mic className="h-5 w-5 text-white" />}
        </Button>
      </div>
    </div>
  );
};
