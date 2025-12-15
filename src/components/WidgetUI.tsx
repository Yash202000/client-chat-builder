import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, X, Mic, Send, Loader2, Bot, User, ImagePlus, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WidgetForm } from '@/components/WidgetForm';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { VoiceAgentPreview } from './previews/VoiceAgentPreview';

// Type definitions
export interface WidgetSettings {
  primary_color: string;
  header_title: string;
  welcome_message: string;
  proactive_message: string;
  position: string;
  border_radius: number;
  font_family: string;
  agent_avatar_url: string;
  input_placeholder: string;
  user_message_color: string;
  user_message_text_color: string;
  bot_message_color: string;
  bot_message_text_color: string;
  time_color?: string;
  widget_size: 'small' | 'medium' | 'large';
  show_header: boolean;
  dark_mode: boolean;
  typing_indicator_enabled: boolean;
  proactive_message_enabled: boolean;
  proactive_message_delay: number;
  livekit_url: string;
  frontend_url: string;
  voice_id?: string;
  stt_provider?: string;
  communication_mode: 'chat' | 'voice' | 'chat_and_voice';
  meta?: {
    z_index?: number;
    [key: string]: any; // Allow any additional customizations
  };
}

export interface Message {
  id: string | number;
  sender: 'user' | 'agent' | 'system';
  text: string;
  type: 'message' | 'prompt' | 'form' | 'video_call_invitation';
  timestamp: string;
  options?: string[];
  fields?: any[];
  videoCallUrl?: string;
}

const widgetSizes = {
  small: { width: 320, height: 450 },
  medium: { width: 360, height: 550 },
  large: { width: 400, height: 650 },
};

interface WidgetUIProps {
  settings: WidgetSettings;
  isOpen: boolean;
  messages: Message[];
  inputValue: string;
  isTyping: boolean;
  isUsingTool: boolean;
  isRecording: boolean;
  activeForm: any[] | null;
  liveKitToken: string | null;
  backendUrl: string;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onToggleOpen: (isOpen: boolean) => void;
  onInputChange: (value: string) => void;
  onSendMessage: (text: string, payload?: any) => void;
  onFormSubmit: (data: Record<string, any>) => void;
  onToggleRecording: () => void;
}

export const WidgetUI = ({
  settings,
  isOpen,
  messages,
  inputValue,
  isTyping,
  isUsingTool,
  isRecording,
  activeForm,
  liveKitToken,
  backendUrl,
  messagesEndRef,
  onToggleOpen,
  onInputChange,
  onSendMessage,
  onFormSubmit,
  onToggleRecording,
}: WidgetUIProps) => {
  if (!settings) return null;

  const { position, primary_color, agent_avatar_url, widget_size, border_radius, dark_mode, header_title, show_header, input_placeholder, user_message_color, user_message_text_color, bot_message_color, bot_message_text_color, time_color } = settings;
  // Read position from meta field, fallback to direct position for backward compatibility
  const widgetPosition = settings.meta?.position || position || 'bottom-right';
  const [vertical, horizontal] = widgetPosition.split('-');
  const size = widgetSizes[widget_size] || widgetSizes.medium;
  const isRTL = settings.meta?.rtl_enabled || false;

  return (
    <div style={{ position: 'fixed', zIndex: settings.meta?.z_index || 9999, [vertical]: '20px', [horizontal]: '20px' }}>
      {!isOpen && (
        <Button
          onClick={() => onToggleOpen(true)}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: primary_color,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
          className="flex items-center justify-center"
        >
          {agent_avatar_url ? (
            <img
              src={`${backendUrl}/api/v1/proxy/image-proxy?url=${encodeURIComponent(agent_avatar_url)}`}
              alt="Avatar"
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <MessageSquare size={32} color="white" />
          )}
        </Button>
      )}

      {isOpen && settings?.communication_mode === 'voice' && liveKitToken && (
        <VoiceAgentPreview
          liveKitToken={liveKitToken}
          shouldConnect={isOpen}
          setShouldConnect={onToggleOpen}
          livekitUrl={settings.livekit_url}
          customization={settings}
          backendUrl={backendUrl}
        />
      )}

      {isOpen && settings?.communication_mode !== 'voice' && (
        <div
          dir={isRTL ? 'rtl' : 'ltr'}
          style={{
            width: `${size.width}px`,
            height: `${size.height}px`,
            borderRadius: `${border_radius}px`,
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            position: 'absolute',
            [vertical === 'bottom' ? 'bottom' : 'top']: '80px',
            [horizontal === 'right' ? 'right' : 'left']: '0',
          }}
          className={cn(
            'flex flex-col overflow-hidden',
            dark_mode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'
          )}
        >
          {show_header && (
            <div
              style={{
                background: primary_color,
                borderTopLeftRadius: `${border_radius}px`,
                borderTopRightRadius: `${border_radius}px`,
              }}
              className="p-4 text-white flex justify-between items-center flex-shrink-0"
            >
              <div className="flex items-center gap-3">
                {agent_avatar_url && (
                  <img
                    src={`${backendUrl}/api/v1/proxy/image-proxy?url=${encodeURIComponent(agent_avatar_url)}`}
                    alt="Header Avatar"
                    className="w-10 h-10 rounded-full object-cover border-2 border-white/50"
                  />
                )}
                <span className="font-bold text-lg">{header_title}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggleOpen(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
          )}
          <div className="flex-grow p-4 overflow-y-auto space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={cn('flex w-full', msg.sender === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[85%] p-3 flex flex-col')} style={{ background: msg.sender === 'user' ? user_message_color : bot_message_color, color: msg.sender === 'user' ? user_message_text_color : bot_message_text_color, borderRadius: `${border_radius}px` }}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="bg-transparent text-xs">
                          {msg.sender === 'agent' ? <Bot size={14} /> : <User size={14} />}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-semibold">{msg.sender === 'agent' ? 'Agent' : 'You'}</span>
                    </div>
                    <span className="text-xs" style={{ color: time_color || (dark_mode ? '#9CA3AF' : '#6B7280') }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-full">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline" />
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                  {msg.options && msg.options.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {msg.options.map((option, index) => (
                        <Button
                          key={index}
                          onClick={() => onSendMessage(option)}
                          variant="outline"
                          size="sm"
                          className={cn('rounded-full', dark_mode ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' : 'bg-gray-100 hover:bg-gray-200 border-gray-300')}
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                  )}
                  {msg.type === 'video_call_invitation' && (<Button onClick={() => window.open(msg.videoCallUrl, '_blank', 'width=800,height=600')} className="mt-2 w-full" style={{background: primary_color, color: 'white'}}>Join Video Call</Button>)}
                </div>
              </div>
            ))}
            {isTyping && <div className="text-sm text-gray-500 italic px-2">Agent is typing...</div>}
            {isUsingTool && <div className="text-sm text-gray-500 italic px-2">Using a tool...</div>}
            <div ref={messagesEndRef} />
          </div>
          {activeForm ? (<WidgetForm fields={activeForm} onSubmit={onFormSubmit} primaryColor={primary_color} darkMode={dark_mode} />) : (
            <div className={cn('p-2 border-t', dark_mode ? 'border-gray-800' : 'border-gray-200')}>
              <div className="flex items-center gap-2">
                {/* Input container with icons inside - Instagram style */}
                <div className={cn(
                  'flex-grow flex items-center gap-1 px-3 py-2 border rounded-full transition-all',
                  dark_mode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'
                )}>
                  {/* Text input */}
                  <input
                    type="text"
                    value={inputValue}
                    onChange={e => onInputChange(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && onSendMessage(inputValue)}
                    placeholder={input_placeholder}
                    className={cn(
                      'flex-grow bg-transparent outline-none text-sm min-w-0',
                      dark_mode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
                    )}
                  />
                  {/* Right icons - hide when typing, show send when has content */}
                  {inputValue ? (
                    <button
                      onClick={() => onSendMessage(inputValue)}
                      className="p-1.5 rounded-full transition-colors"
                      style={{ color: primary_color }}
                    >
                      <Send size={20} />
                    </button>
                  ) : (
                    <>
                      <button
                        className={cn(
                          'p-1.5 rounded-full transition-colors',
                          dark_mode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
                        )}
                        title="Attach image"
                      >
                        <ImagePlus size={20} />
                      </button>
                      <button
                        className={cn(
                          'p-1.5 rounded-full transition-colors',
                          dark_mode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
                        )}
                        title="Share location"
                      >
                        <MapPin size={20} />
                      </button>
                    </>
                  )}
                </div>
                {/* Mic button - always outside */}
                <button
                  onClick={onToggleRecording}
                  className={cn(
                    'p-2 rounded-full transition-colors flex-shrink-0',
                    isRecording ? 'bg-red-500 text-white' : (dark_mode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')
                  )}
                >
                  {isRecording ? <Loader2 className="animate-spin" size={20} /> : <Mic size={20} />}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
