import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Loader2, X, Hash, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { searchMessages, searchAllChannels } from '@/services/chatService';
import { useQuery } from '@tanstack/react-query';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelId?: number;
  onMessageClick?: (messageId: number, channelId?: number) => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, channelId, onMessageClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [globalMode, setGlobalMode] = useState(!channelId);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (isOpen) {
      setGlobalMode(!channelId);
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      setSearchQuery('');
      setDebouncedQuery('');
    }
  }, [isOpen, channelId]);

  const ready = debouncedQuery.length >= 2;

  const { data: channelResults, isLoading: loadingChannel } = useQuery({
    queryKey: ['searchMessages', channelId, debouncedQuery],
    queryFn: () => searchMessages(channelId!, debouncedQuery),
    enabled: ready && !globalMode && !!channelId,
  });

  const { data: globalResults, isLoading: loadingGlobal } = useQuery({
    queryKey: ['searchAllChannels', debouncedQuery],
    queryFn: () => searchAllChannels(debouncedQuery),
    enabled: ready && globalMode,
  });

  const results: any[] = globalMode ? (globalResults ?? []) : (channelResults ?? []);
  const isLoading = globalMode ? loadingGlobal : loadingChannel;

  const handleClick = (msg: any) => {
    onMessageClick?.(msg.id, msg.channel_id ?? channelId);
    onClose();
  };

  return (
    <div className={cn(
      'h-full flex-shrink-0 flex flex-col border-l border-border bg-background overflow-hidden transition-all duration-300 ease-in-out',
      isOpen ? 'w-80' : 'w-0 border-l-0'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Search</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scope toggle — only show when a specific channel is provided */}
      {channelId && (
        <div className="flex px-3 pt-2.5 gap-1.5 flex-shrink-0">
          <button
            onClick={() => setGlobalMode(false)}
            className={cn(
              'flex-1 text-xs py-1 rounded-md font-medium transition-colors',
              !globalMode ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            This channel
          </button>
          <button
            onClick={() => setGlobalMode(true)}
            className={cn(
              'flex-1 text-xs py-1 rounded-md font-medium transition-colors',
              globalMode ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            All channels
          </button>
        </div>
      )}

      {/* Search input */}
      <div className="px-3 py-2.5 border-b border-border flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            placeholder={globalMode ? 'Search all channels…' : 'Search this channel…'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-8 h-8 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setDebouncedQuery(''); inputRef.current?.focus(); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {!ready ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Search className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-xs text-center">Type at least 2 characters<br />to search messages</p>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
              <p className="text-xs text-muted-foreground">Searching…</p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-xs text-center">No results for<br />"{debouncedQuery}"</p>
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((msg) => {
                const senderName = msg.sender?.first_name || msg.sender?.email || '?';
                const channelLabel = globalMode && msg.channel_name;
                const isDM = msg.channel_type?.toUpperCase() === 'DM';
                return (
                  <button
                    key={`${msg.id}-${msg.channel_id}`}
                    onClick={() => handleClick(msg)}
                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    {channelLabel && (
                      <div className="flex items-center gap-1 mb-1">
                        {isDM
                          ? <MessageSquare className="h-3 w-3 text-muted-foreground" />
                          : <Hash className="h-3 w-3 text-muted-foreground" />}
                        <span className="text-[10px] text-muted-foreground font-medium truncate">{channelLabel}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-2.5">
                      <Avatar className="h-7 w-7 flex-shrink-0 mt-0.5">
                        <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                          {senderName[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-xs font-semibold text-foreground truncate">{senderName}</span>
                          {msg.parent_message_id && (
                            <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded flex-shrink-0">reply</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{msg.content}</p>
                        <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                          {new Date(msg.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default SearchModal;
