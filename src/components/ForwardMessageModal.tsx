import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Forward, Search, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { forwardMessage } from '@/services/chatService';
import { useToast } from '@/components/ui/use-toast';

interface Channel {
  id: number;
  name: string | null;
  channel_type: string;
  participants?: any[];
}

interface ForwardMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: { id: number; content: string; sender?: { first_name?: string; email?: string } } | null;
  channels: Channel[];
  currentUserId?: number;
}

const ForwardMessageModal: React.FC<ForwardMessageModalProps> = ({
  isOpen,
  onClose,
  message,
  channels,
  currentUserId,
}) => {
  const [search, setSearch] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return channels.filter((c) => {
      const name = c.name || c.participants?.find((p: any) => p.user_id !== currentUserId)?.user?.first_name || '';
      return name.toLowerCase().includes(q);
    });
  }, [channels, search, currentUserId]);

  const handleForward = async () => {
    if (!message || !selectedChannelId) return;
    setIsSending(true);
    try {
      const senderName = message.sender?.first_name || message.sender?.email || 'Someone';
      await forwardMessage(selectedChannelId, message.content, senderName);
      toast({ title: 'Message forwarded' });
      onClose();
    } catch {
      toast({ title: 'Failed to forward message', variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  const getChannelName = (c: Channel) => {
    if (c.channel_type?.toUpperCase() === 'DM') {
      const other = c.participants?.find((p: any) => p.user_id !== currentUserId);
      return other?.user?.first_name || other?.user?.email || 'Direct Message';
    }
    return c.name || 'Channel';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Forward className="h-4 w-4 text-primary" />
            Forward Message
          </DialogTitle>
        </DialogHeader>

        {message && (
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground line-clamp-3 leading-relaxed">
            {message.content}
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search channels..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>

        <ScrollArea className="max-h-48">
          <div className="space-y-0.5">
            {filtered.map((channel) => {
              const name = getChannelName(channel);
              const isDM = channel.channel_type?.toUpperCase() === 'DM';
              const isSelected = selectedChannelId === channel.id;
              return (
                <button
                  key={channel.id}
                  onClick={() => setSelectedChannelId(isSelected ? null : channel.id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left text-sm transition-colors',
                    isSelected
                      ? 'bg-primary/10 text-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <div className={cn(
                    'h-6 w-6 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0',
                    isSelected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                  )}>
                    {isDM ? (name[0]?.toUpperCase() || 'D') : <Hash className="h-3 w-3" />}
                  </div>
                  <span className="truncate">{name}</span>
                  {isSelected && (
                    <span className="ml-auto text-[10px] text-primary font-medium">Selected</span>
                  )}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-4">No channels found</p>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            onClick={handleForward}
            disabled={!selectedChannelId || isSending}
            className="gap-1.5"
          >
            <Forward className="h-3.5 w-3.5" />
            {isSending ? 'Forwarding...' : 'Forward'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ForwardMessageModal;
