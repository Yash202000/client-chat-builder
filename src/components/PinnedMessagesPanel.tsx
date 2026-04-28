import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPinnedMessages, unpinMessage } from '@/services/chatService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Pin, PinOff, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';

interface PinnedMessagesPanelProps {
  channelId: number;
  currentUserId?: number;
  onClose: () => void;
}

const PinnedMessagesPanel: React.FC<PinnedMessagesPanelProps> = ({ channelId, currentUserId, onClose }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pins = [], isLoading } = useQuery({
    queryKey: ['pinnedMessages', channelId],
    queryFn: () => getPinnedMessages(channelId),
    enabled: !!channelId,
  });

  const unpinMutation = useMutation({
    mutationFn: ({ messageId }: { messageId: number }) => unpinMessage(channelId, messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pinnedMessages', channelId] });
      toast({ title: 'Message unpinned' });
    },
    onError: () => {
      toast({ title: 'Failed to unpin', variant: 'destructive' });
    },
  });

  return (
    <div className="h-full flex flex-col border-l border-border bg-card overflow-hidden w-72">
      <div className="flex items-center justify-between px-4 h-[52px] border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <Pin className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-semibold text-foreground">Pinned Messages</span>
          {pins.length > 0 && (
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{pins.length}</span>
          )}
        </div>
        <button
          onClick={onClose}
          className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            Loading...
          </div>
        ) : pins.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground px-4 text-center">
            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
              <Pin className="h-5 w-5 opacity-40" />
            </div>
            <p className="text-xs font-medium">No pinned messages</p>
            <p className="text-[11px] text-muted-foreground/60">Pin important messages to keep them accessible</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40 py-1">
            {pins.map((pin: any) => {
              const msg = pin.message;
              const sender = msg?.sender;
              const senderName = sender?.first_name || sender?.email || 'Unknown';
              const pinnedBy = pin.pinned_by?.first_name || pin.pinned_by?.email || 'Unknown';
              return (
                <div key={pin.id} className="px-3 py-2.5 hover:bg-muted/30 transition-colors group">
                  <div className="flex items-start gap-2">
                    <Avatar className="h-7 w-7 flex-shrink-0 mt-0.5">
                      <AvatarImage src={sender?.profile_picture_url} />
                      <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                        {senderName[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs font-semibold text-foreground truncate">{senderName}</span>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">
                          {new Date(msg?.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{msg?.content}</p>
                      <p className="text-[10px] text-muted-foreground/50 mt-1">Pinned by {pinnedBy}</p>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => unpinMutation.mutate({ messageId: pin.message_id })}
                          className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                        >
                          <PinOff className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent><p>Unpin</p></TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default PinnedMessagesPanel;
