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

interface TelegramPreviewProps {
  messages: ChatMessage[];
  customization: any;
  handleSendMessage: (text?: string) => void;
  message: string;
  setMessage: (message: string) => void;
  isRecording: boolean;
  handleToggleRecording: () => void;
}

export const TelegramPreview: React.FC<TelegramPreviewProps> = ({
  messages,
  customization,
  handleSendMessage,
  message,
  setMessage,
  isRecording,
  handleToggleRecording,
}) => {
  return (
    <div className="bg-[#EBF4FB] h-full flex flex-col">
      <div className="bg-[#50A7EA] p-2 text-white flex items-center">
        <Avatar className="h-8 w-8 mr-2">
          <AvatarImage src={customization.agent_avatar_url} alt="Agent" />
          <AvatarFallback>{customization.header_title.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold text-sm">{customization.header_title}</h3>
          <p className="text-xs">online</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex w-full',
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'max-w-[85%] p-2 rounded-lg text-sm shadow',
                msg.sender === 'user'
                  ? 'bg-[#C7E7FF]' // Lighter blue for user messages
                  : 'bg-white'
              )}
            >
              <p className="break-words">{msg.text}</p>
              <span className="text-xs text-gray-500 float-right ml-2 mt-1">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="p-2 bg-transparent flex items-center">
        <div className="flex-1 flex items-center bg-white rounded-full px-3 py-1">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Message"
            className="flex-1 text-sm bg-transparent border-none focus:ring-0"
          />
          <Button size="icon" variant="ghost" onClick={() => handleSendMessage()} className="rounded-full">
            <Send className="h-5 w-5 text-gray-500" />
          </Button>
        </div>
        <Button onClick={handleToggleRecording} variant="ghost" size="icon" className="rounded-full ml-2 bg-[#50A7EA] hover:bg-[#4096D9] text-white">
          {isRecording ? <Loader2 className="animate-spin" /> : <Mic className="h-5 w-5" />}
        </Button>
      </div>
    </div>
  );
};
