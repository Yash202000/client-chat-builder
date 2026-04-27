import React, { useEffect, useRef, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Loader2, X, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';
import FileAttachment from './FileAttachment';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatAttachment {
  id: number;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
}

interface ChatMessage {
  id: number;
  sender_id: number;
  content: string;
  created_at: string;
  parent_message_id?: number | null;
  sender: {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
    profile_picture_url?: string;
    presence_status: string;
  };
  attachments?: ChatAttachment[];
  reply_count?: number;
}

interface ThreadPanelProps {
  parentMessage: ChatMessage | null;
  currentUserId?: number;
  onClose: () => void;
  onSendReply: (content: string, parentMessageId: number) => Promise<void>;
  onDownloadFile?: (attachment: ChatAttachment) => void;
}

const ThreadPanel: React.FC<ThreadPanelProps> = ({
  parentMessage,
  currentUserId,
  onClose,
  onSendReply,
  onDownloadFile,
}) => {
  const [replyContent, setReplyContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const queryClient = useQueryClient();
  const repliesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isOpen = parentMessage !== null;

  const { data: replies, isLoading } = useQuery({
    queryKey: ['messageReplies', parentMessage?.id],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/chat/messages/${parentMessage!.id}/replies`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data as ChatMessage[];
    },
    enabled: !!parentMessage?.id,
  });

  // Scroll to bottom when replies load or new reply arrives
  useEffect(() => {
    if (replies?.length) {
      setTimeout(() => repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    }
  }, [replies?.length]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, parentMessage?.id]);

  const handleSendReply = async () => {
    if (!replyContent.trim() || isSending || !parentMessage) return;
    setIsSending(true);
    try {
      await onSendReply(replyContent.trim(), parentMessage.id);
      setReplyContent('');
      queryClient.invalidateQueries({ queryKey: ['messageReplies', parentMessage.id] });
    } catch {
      // error handled upstream
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div
      className={cn(
        'h-full flex-shrink-0 flex flex-col border-l border-border bg-card overflow-hidden transition-all duration-300 ease-in-out',
        isOpen ? 'w-80' : 'w-0 border-l-0'
      )}
    >
      {isOpen && parentMessage && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between px-4 h-[52px] border-b border-border flex-shrink-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground font-display">Thread</span>
              {replies && replies.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Parent message */}
          <div className="flex-shrink-0 px-4 py-3 border-b border-border/60 bg-muted/20">
            <div className="flex gap-2.5">
              <Avatar className="h-7 w-7 flex-shrink-0 mt-0.5">
                <AvatarImage src={parentMessage.sender?.profile_picture_url} />
                <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                  {parentMessage.sender?.first_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5 mb-0.5">
                  <span className="text-xs font-semibold text-foreground truncate">
                    {parentMessage.sender?.first_name || parentMessage.sender?.email}
                  </span>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">
                    {formatDate(parentMessage.created_at)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {parentMessage.content}
                </p>
                {parentMessage.attachments && parentMessage.attachments.length > 0 && (
                  <div className="mt-1.5 space-y-1">
                    {parentMessage.attachments.map((a) => (
                      <FileAttachment key={a.id} attachment={a} onDownload={onDownloadFile} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Replies list */}
          <div className="flex-1 overflow-hidden min-h-0">
            <ScrollArea className="h-full">
              <div className="px-4 py-3 space-y-3">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : !replies || replies.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center mb-3">
                      <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">No replies yet</p>
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5">Be the first to reply</p>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {replies.map((reply) => {
                      const isOwn = reply.sender_id === currentUserId;
                      return (
                        <motion.div
                          key={reply.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.15 }}
                          className="flex gap-2.5 group"
                        >
                          <Avatar className="h-6 w-6 flex-shrink-0 mt-0.5">
                            <AvatarImage src={reply.sender?.profile_picture_url} />
                            <AvatarFallback className={cn(
                              'text-[10px] font-semibold',
                              isOwn ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                            )}>
                              {reply.sender?.first_name?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-1.5 mb-0.5">
                              <span className="text-[11px] font-semibold text-foreground">
                                {isOwn ? 'You' : (reply.sender?.first_name || reply.sender?.email)}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {formatTime(reply.created_at)}
                              </span>
                            </div>
                            <div className={cn(
                              'px-3 py-2 rounded-xl text-xs leading-relaxed',
                              isOwn
                                ? 'bg-primary text-primary-foreground rounded-tl-sm'
                                : 'bg-muted text-foreground rounded-tl-sm'
                            )}>
                              {reply.content}
                              {reply.attachments && reply.attachments.length > 0 && (
                                <div className="mt-1.5 space-y-1">
                                  {reply.attachments.map((a) => (
                                    <FileAttachment key={a.id} attachment={a} onDownload={onDownloadFile} />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
                <div ref={repliesEndRef} />
              </div>
            </ScrollArea>
          </div>

          {/* Composer */}
          <div className="flex-shrink-0 px-3 pb-3 pt-2 border-t border-border/60">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 focus-within:border-primary/40 transition-colors">
              <input
                ref={inputRef}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendReply()}
                placeholder="Reply to thread…"
                disabled={isSending}
                className="flex-1 bg-transparent border-0 outline-none text-xs text-foreground placeholder:text-muted-foreground/50 disabled:opacity-50"
              />
              <button
                onClick={handleSendReply}
                disabled={!replyContent.trim() || isSending}
                className={cn(
                  'h-6 w-6 rounded-md flex items-center justify-center flex-shrink-0 transition-all',
                  replyContent.trim()
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-muted text-muted-foreground/40 cursor-not-allowed'
                )}
              >
                {isSending
                  ? <Loader2 className="h-3 w-3 animate-spin" />
                  : <Send className="h-3 w-3" />
                }
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ThreadPanel;
