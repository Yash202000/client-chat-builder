import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { searchMessages } from '@/services/chatService';
import { useQuery } from '@tanstack/react-query';
import MentionText from './MentionText';

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
  };
  reply_count?: number;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelId: number;
  onMessageClick?: (messageId: number) => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, channelId, onMessageClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Auto-focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      setSearchQuery('');
      setDebouncedQuery('');
    }
  }, [isOpen]);

  const { data: searchResults, isLoading, error } = useQuery<ChatMessage[], Error>({
    queryKey: ['searchMessages', channelId, debouncedQuery],
    queryFn: () => searchMessages(channelId, debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });

  const handleMessageClick = (messageId: number) => {
    onMessageClick?.(messageId);
    onClose();
  };

  return (
    <div className={cn(
      'h-full flex-shrink-0 flex flex-col border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden transition-all duration-300 ease-in-out',
      isOpen ? 'w-80' : 'w-0 border-l-0'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          <span className="text-sm font-semibold text-slate-800 dark:text-white">Search</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Search input */}
      <div className="px-3 py-2.5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <Input
            ref={inputRef}
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-8 h-8 text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setDebouncedQuery(''); inputRef.current?.focus(); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {!debouncedQuery || debouncedQuery.length < 2 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-slate-500">
              <Search className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-xs text-center">Type at least 2 characters<br />to search messages</p>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500 mb-2" />
              <p className="text-xs text-slate-400">Searching...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-10 text-red-500">
              <p className="text-xs">Failed to search</p>
            </div>
          ) : searchResults && searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-slate-500">
              <Search className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-xs text-center">No results for<br />"{debouncedQuery}"</p>
            </div>
          ) : (
            <div className="space-y-1">
              {searchResults?.map((message) => (
                <button
                  key={message.id}
                  onClick={() => handleMessageClick(message.id)}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors group"
                >
                  <div className="flex items-start gap-2.5">
                    <Avatar className="h-7 w-7 flex-shrink-0 mt-0.5">
                      <AvatarImage src={message.sender?.profile_picture_url} />
                      <AvatarFallback className="text-xs bg-slate-400 dark:bg-slate-600 text-white">
                        {message.sender?.first_name?.[0] || message.sender?.email[0].toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                          {message.sender?.first_name || message.sender?.email}
                        </span>
                        {message.parent_message_id && (
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded flex-shrink-0">
                            reply
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {message.content}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        {new Date(message.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default SearchModal;
