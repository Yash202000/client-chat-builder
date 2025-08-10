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

interface GmailPreviewProps {
  messages: ChatMessage[];
  customization: any;
  handleSendMessage: (text?: string) => void;
  message: string;
  setMessage: (message: string) => void;
  isRecording: boolean;
  handleToggleRecording: () => void;
}

export const GmailPreview: React.FC<GmailPreviewProps> = ({
  messages,
  customization,
  handleSendMessage,
  message,
  setMessage,
  isRecording,
  handleToggleRecording,
}) => {
  return (
    <div className="bg-white h-full flex flex-col border">
      <div className="p-2 border-b flex items-center justify-between">
        <div className="flex items-center">
          <Avatar className="h-8 w-8 mr-2">
            <AvatarImage src={customization.agent_avatar_url} alt="Agent" />
            <AvatarFallback>{customization.header_title.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-sm">{customization.header_title}</h3>
            <p className="text-xs text-gray-500">support@example.com</p>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          {new Date().toLocaleDateString()}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.map((msg) => (
          <div key={msg.id} className="border-b pb-4">
            <div className="flex items-center mb-2">
              <Avatar className="h-6 w-6 mr-2">
                <AvatarFallback>
                  {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
                </AvatarFallback>
              </Avatar>
              <div className="flex justify-between w-full">
                <span className="font-semibold text-sm">{msg.sender === 'user' ? 'You' : customization.header_title}</span>
                <span className="text-xs text-gray-500">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
            <p className="text-sm ml-8">{msg.text}</p>
          </div>
        ))}
      </div>
      <div className="p-2 border-t flex items-center">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Reply..."
          className="flex-1 text-sm"
        />
        <Button size="icon" variant="ghost" onClick={() => handleSendMessage()}>
          <Send className="h-5 w-5" />
        </Button>
        <Button onClick={handleToggleRecording} variant="ghost" size="icon">
          {isRecording ? <Loader2 className="animate-spin" /> : <Mic className="h-5 w-5" />}
        </Button>
      </div>
    </div>
  );
};
