import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';
import FileAttachment from './FileAttachment';

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

interface MessageThreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentMessage: ChatMessage;
  currentUserId?: number;
  onSendReply: (content: string, parentMessageId: number) => Promise<void>;
  onDownloadFile?: (attachment: ChatAttachment) => void;
}

const MessageThreadModal: React.FC<MessageThreadModalProps> = ({
  isOpen,
  onClose,
  parentMessage,
  currentUserId,
  onSendReply,
  onDownloadFile,
}) => {
  const [replyContent, setReplyContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const queryClient = useQueryClient();

  const { data: replies, isLoading } = useQuery({
    queryKey: ['messageReplies', parentMessage.id],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/chat/messages/${parentMessage.id}/replies`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data as ChatMessage[];
    },
    enabled: isOpen,
  });

  const handleSendReply = async () => {
    if (!replyContent.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendReply(replyContent.trim(), parentMessage.id);
      setReplyContent('');
      // Refresh replies
      queryClient.invalidateQueries({ queryKey: ['messageReplies', parentMessage.id] });
    } catch (error) {
      console.error('Failed to send reply:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0 gap-0">
        <DialogHeader className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">Thread</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex flex-col h-[calc(80vh-140px)]">
          {/* Parent Message */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
            <div className="flex gap-3">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src={parentMessage.sender?.profile_picture_url} />
                <AvatarFallback className="bg-gradient-to-br from-purple-400 to-indigo-500 text-white text-sm">
                  {parentMessage.sender?.first_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                    {parentMessage.sender?.first_name || parentMessage.sender?.email}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(parentMessage.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-full">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {parentMessage.content}
                  </ReactMarkdown>
                </div>
                {parentMessage.attachments && parentMessage.attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {parentMessage.attachments.map((attachment) => (
                      <FileAttachment
                        key={attachment.id}
                        attachment={attachment}
                        onDownload={onDownloadFile}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Replies */}
          <ScrollArea className="flex-1 p-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600 dark:text-purple-400" />
              </div>
            ) : replies && replies.length > 0 ? (
              <div className="space-y-4">
                {replies.map((reply) => (
                  <div key={reply.id} className="flex gap-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={reply.sender?.profile_picture_url} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-500 text-white text-xs">
                        {reply.sender?.first_name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-slate-800 dark:text-slate-200">
                          {reply.sender_id === currentUserId
                            ? 'You'
                            : reply.sender?.first_name || reply.sender?.email}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(reply.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div
                        className={cn(
                          'p-3 rounded-lg',
                          reply.sender_id === currentUserId
                            ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white'
                            : 'bg-card border border-border'
                        )}
                      >
                        <div
                          className={cn(
                            'prose prose-sm max-w-full',
                            reply.sender_id === currentUserId
                              ? 'prose-invert'
                              : 'dark:prose-invert'
                          )}
                        >
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {reply.content}
                          </ReactMarkdown>
                        </div>
                        {reply.attachments && reply.attachments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {reply.attachments.map((attachment) => (
                              <FileAttachment
                                key={attachment.id}
                                attachment={attachment}
                                onDownload={onDownloadFile}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  No replies yet. Be the first to reply!
                </p>
              </div>
            )}
          </ScrollArea>

          {/* Reply Input */}
          <div className="p-4 border-t border-border bg-card">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Reply to thread..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                onKeyPress={(e) =>
                  e.key === 'Enter' && !e.shiftKey && handleSendReply()
                }
                className="flex-1"
                disabled={isSending}
              />
              <Button
                onClick={handleSendReply}
                disabled={!replyContent.trim() || isSending}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessageThreadModal;
