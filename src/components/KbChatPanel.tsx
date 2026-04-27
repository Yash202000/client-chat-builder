import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Database, SendHorizontal, Loader2 } from 'lucide-react';
import { KnowledgeBase } from '@/types';

interface KbChatMsg {
  id: number;
  type: 'user' | 'kb';
  text?: string;
  results?: any[];
}

interface KbChatPanelProps {
  kb: KnowledgeBase;
  authFetch: (url: string, opts?: RequestInit) => Promise<Response>;
}

export const KbChatPanel = ({ kb, authFetch }: KbChatPanelProps) => {
  const [messages, setMessages] = useState<KbChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [topK, setTopK] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    const q = input.trim();
    if (!q || isLoading) return;
    setInput('');
    setMessages(prev => [...prev, { id: Date.now(), type: 'user', text: q }]);
    setIsLoading(true);
    try {
      const res = await authFetch(`/api/v1/knowledge-bases/${kb.id}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, top_k: topK }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { id: Date.now() + 1, type: 'kb', results: data.results ?? [] }]);
    } catch {
      setMessages(prev => [...prev, { id: Date.now() + 1, type: 'kb', results: [] }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-16">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/40 dark:to-green-900/40 flex items-center justify-center">
              <Database className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Test your knowledge base</p>
              <p className="text-xs text-muted-foreground mt-1">Type a query to see what chunks get retrieved</p>
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id}>
            {msg.type === 'user' ? (
              <div className="flex justify-end">
                <div className="bg-emerald-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%] text-sm leading-relaxed shadow-sm">
                  {msg.text}
                </div>
              </div>
            ) : (
              <div className="flex gap-2.5 items-start">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex-shrink-0 flex items-center justify-center shadow-sm mt-0.5">
                  <Database className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="flex-1 space-y-2 min-w-0">
                  {!msg.results || msg.results.length === 0 ? (
                    <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-muted-foreground">
                      No matching chunks found.
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-muted-foreground px-1">
                        {msg.results.length} chunk{msg.results.length !== 1 ? 's' : ''} retrieved
                      </p>
                      {msg.results.map((r, i) => (
                        <div key={i} className="bg-muted rounded-2xl rounded-tl-sm p-3 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-muted-foreground">Chunk {i + 1}</span>
                            {r.score !== undefined && (
                              <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full flex-shrink-0">
                                {typeof r.score === 'number' ? r.score.toFixed(3) : r.score}
                              </span>
                            )}
                          </div>
                          <p className="text-xs leading-relaxed text-foreground/80 line-clamp-5 whitespace-pre-wrap">
                            {typeof r === 'string' ? r : r.text}
                          </p>
                          {r.source_type && (
                            <span className="inline-block text-xs text-muted-foreground bg-background/60 border border-border px-2 py-0.5 rounded-full">
                              {r.source_type}
                            </span>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2.5 items-start">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex-shrink-0 flex items-center justify-center shadow-sm">
              <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
            </div>
            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center">
                {[0, 150, 300].map(d => (
                  <span key={d} className="h-1.5 w-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 border-t border-border px-4 py-3 flex gap-2 items-center bg-background">
        <select
          value={topK}
          onChange={e => setTopK(Number(e.target.value))}
          className="text-xs border border-input rounded-lg px-2 py-1.5 bg-background text-foreground flex-shrink-0"
        >
          {[3, 5, 10].map(n => <option key={n} value={n}>Top {n}</option>)}
        </select>
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Ask something..."
          disabled={isLoading}
          className="flex-1 h-9 text-sm"
        />
        <Button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          size="icon"
          className="h-9 w-9 flex-shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
        >
          <SendHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
