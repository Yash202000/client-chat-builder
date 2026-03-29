import { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Loader2, Check, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('accessToken');
  const res = await fetch(url, {
    ...options,
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...options.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
};

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  updatedContent?: string | null;
  updatedHashtags?: string[] | null;
  isLoading?: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  platform: string;
  currentContent: string;
  onApply: (content: string, hashtags?: string[]) => void;
}

const STARTER_PROMPTS = [
  'Make this more engaging and punchy',
  'Shorten it to under 150 words',
  'Add a strong call-to-action at the end',
  'Rewrite in a more conversational tone',
  'Make the opening hook stronger',
];

export default function PostAIAssistant({ open, onClose, platform, currentContent, onApply }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setMessages([]);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const historyForAPI = messages
    .filter(m => !m.isLoading)
    .map(m => ({ role: m.role, content: m.content }));

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;
    setInput('');

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    const loadingMsg: Message = { id: `loading-${Date.now()}`, role: 'assistant', content: '', isLoading: true };
    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setIsLoading(true);

    try {
      const data = await authFetch('/api/v1/social/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: text,
          history: historyForAPI,
          current_content: currentContent,
          platform,
        }),
      });

      setMessages(prev => [
        ...prev.filter(m => !m.isLoading),
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.reply,
          updatedContent: data.updated_content,
          updatedHashtags: data.updated_hashtags,
        },
      ]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev.filter(m => !m.isLoading),
        { id: Date.now().toString(), role: 'assistant', content: `Error: ${err.message}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">AI Assistant</span>
          <span className="text-xs text-zinc-400 capitalize">· {platform}</span>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => setMessages([])}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="space-y-3">
            <p className="text-xs text-zinc-400 text-center pt-2">Refine your {platform} post through conversation</p>
            <div className="space-y-1.5">
              {STARTER_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="w-full text-left text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className={`px-3 py-2 rounded-xl text-sm ${
                  msg.role === 'user'
                    ? 'text-white rounded-br-sm'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-bl-sm'
                }`} style={msg.role === 'user' ? { background: 'linear-gradient(135deg,#7c3aed,#a855f7)' } : {}}>
                  {msg.isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                  ) : (
                    msg.content
                  )}
                </div>

                {/* Updated content preview + Apply button */}
                {msg.updatedContent && (
                  <div className="w-full border border-violet-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                    <div className="px-3 py-2 text-xs font-semibold text-violet-600 dark:text-violet-400 flex items-center gap-1 bg-violet-50 dark:bg-zinc-800/60 border-b border-violet-100 dark:border-zinc-700">
                      <Sparkles className="h-3 w-3" /> Updated post
                    </div>
                    <div className="px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap line-clamp-4 bg-white dark:bg-zinc-900">
                      {msg.updatedContent}
                    </div>
                    {msg.updatedHashtags && msg.updatedHashtags.length > 0 && (
                      <div className="px-3 pb-2 flex flex-wrap gap-1 bg-white dark:bg-zinc-900">
                        {msg.updatedHashtags.map(t => (
                          <span key={t} className="text-xs text-violet-600 dark:text-violet-400">#{t.replace('#', '')}</span>
                        ))}
                      </div>
                    )}
                    <div className="px-3 pb-2 bg-white dark:bg-zinc-900">
                      <Button
                        size="sm"
                        className="w-full gap-1.5 h-7 text-xs bg-violet-600 hover:bg-violet-700 text-white"
                        onClick={() => onApply(msg.updatedContent!, msg.updatedHashtags ?? undefined)}
                      >
                        <Check className="h-3 w-3" /> Apply to post
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            className="flex-1 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-zinc-50 dark:bg-zinc-900 resize-none focus:outline-none focus:ring-1 focus:ring-violet-400 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 min-h-[40px] max-h-[120px]"
            placeholder="Ask AI to edit your post..."
            value={input}
            rows={1}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
          />
          <button
            className="h-9 w-9 shrink-0 rounded-lg flex items-center justify-center text-white disabled:opacity-40 transition-all"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}
            disabled={!input.trim() || isLoading}
            onClick={() => send(input)}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          </button>
        </div>
        <p className="text-xs text-zinc-400 mt-1.5">Enter to send · Shift+Enter for newline</p>
      </div>
    </div>
  );
}
