import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Search, X, Users, MessageSquare } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';
import { cn } from '@/lib/utils';
import { useI18n } from '@/hooks/useI18n';

interface CompanyUser {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  profile_picture_url?: string;
}

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: number;
  existingChannels: Array<{
    id: number;
    channel_type: string;
    name: string | null;
    participants: { user_id: number; user?: { id: number } }[];
  }>;
  onOpenChannel: (channelId: number) => void;
  onCreate: (channelData: { name?: string | null; channel_type: string; member_ids: number[] }) => Promise<any>;
  isLoading: boolean;
}

function getUserDisplayName(user: CompanyUser): string {
  if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
  if (user.first_name) return user.first_name;
  return user.email;
}

function getUserInitial(user: CompanyUser): string {
  return (user.first_name?.[0] || user.email[0]).toUpperCase();
}

const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  onClose,
  currentUserId,
  existingChannels,
  onOpenChannel,
  onCreate,
  isLoading,
}) => {
  const { isRTL } = useI18n();
  const [search, setSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<CompanyUser[]>([]);
  const [groupName, setGroupName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: companyUsers = [], isLoading: isLoadingUsers } = useQuery<CompanyUser[]>({
    queryKey: ['companyUsers'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get(`${API_BASE_URL}/api/v1/users/?limit=200`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: isOpen,
    staleTime: 60_000,
  });

  const otherUsers = companyUsers.filter((u) => u.id !== currentUserId);

  const filteredUsers = otherUsers.filter((u) => {
    const q = search.toLowerCase();
    const name = getUserDisplayName(u).toLowerCase();
    return name.includes(q) || u.email.toLowerCase().includes(q);
  });

  const isSelected = (user: CompanyUser) => selectedUsers.some((s) => s.id === user.id);

  const toggleUser = (user: CompanyUser) => {
    if (isSelected(user)) {
      setSelectedUsers((prev) => prev.filter((s) => s.id !== user.id));
    } else {
      setSelectedUsers((prev) => [...prev, user]);
    }
    setSearch('');
    inputRef.current?.focus();
  };

  const removeUser = (userId: number) => {
    setSelectedUsers((prev) => prev.filter((s) => s.id !== userId));
  };

  const handleStart = async () => {
    if (selectedUsers.length === 0) return;

    if (selectedUsers.length === 1) {
      // DM — check if one already exists
      const targetId = selectedUsers[0].id;
      const existing = existingChannels.find(
        (ch) =>
          ch.channel_type?.toUpperCase() === 'DM' &&
          ch.participants.some((p) => p.user_id === targetId) &&
          ch.participants.some((p) => p.user_id === currentUserId)
      );
      if (existing) {
        onOpenChannel(existing.id);
        handleClose();
        return;
      }
      // Create new DM
      const result = await onCreate({
        name: null,
        channel_type: 'DM',
        member_ids: [targetId],
      });
      if (result?.id) onOpenChannel(result.id);
    } else {
      // Group chat
      const name = groupName.trim() || selectedUsers.map((u) => u.first_name || u.email.split('@')[0]).join(', ');
      const result = await onCreate({
        name,
        channel_type: 'TEAM',
        member_ids: selectedUsers.map((u) => u.id),
      });
      if (result?.id) onOpenChannel(result.id);
    }

    handleClose();
  };

  const handleClose = () => {
    setSearch('');
    setSelectedUsers([]);
    setGroupName('');
    onClose();
  };

  const isGroup = selectedUsers.length > 1;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="dark:bg-slate-800 dark:border-slate-700 rounded-2xl sm:rounded-2xl sm:max-w-md p-0 overflow-hidden"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-slate-200/80 dark:border-slate-700/60">
          <DialogTitle className="flex items-center gap-3 text-lg dark:text-white">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent font-bold">
              New Chat
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700/60">
          {/* Chips + search input */}
          <div
            className="flex flex-wrap gap-1.5 items-center cursor-text min-h-[38px]"
            onClick={() => inputRef.current?.focus()}
          >
            <span className="text-sm text-slate-400 dark:text-slate-500 font-medium shrink-0">To:</span>
            {selectedUsers.map((u) => (
              <span
                key={u.id}
                className="flex items-center gap-1 bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-200 text-xs font-semibold px-2.5 py-1 rounded-full"
              >
                {getUserDisplayName(u)}
                <button
                  onClick={(e) => { e.stopPropagation(); removeUser(u.id); }}
                  className="hover:text-violet-500 dark:hover:text-violet-300 ml-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={selectedUsers.length === 0 ? 'Search people...' : ''}
              className="flex-1 min-w-[120px] outline-none bg-transparent text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 h-8"
            />
          </div>
        </div>

        {/* Group name — only when 2+ selected */}
        {isGroup && (
          <div className="px-5 py-2 border-b border-slate-100 dark:border-slate-700/60">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder={`Group name (optional)`}
                className="flex-1 outline-none bg-transparent text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 h-8"
              />
            </div>
          </div>
        )}

        {/* User list */}
        <ScrollArea className="max-h-72">
          <div className="p-3 space-y-0.5">
            {isLoadingUsers ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-400 dark:text-slate-500">
                {search ? 'No people found' : 'No teammates to message'}
              </div>
            ) : (
              filteredUsers.map((user) => {
                const selected = isSelected(user);
                return (
                  <button
                    key={user.id}
                    onClick={() => toggleUser(user)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors',
                      selected
                        ? 'bg-violet-50 dark:bg-violet-900/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    )}
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      {user.profile_picture_url && <AvatarImage src={user.profile_picture_url} />}
                      <AvatarFallback className="text-xs font-bold bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">
                        {getUserInitial(user)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm font-semibold truncate',
                        selected ? 'text-violet-900 dark:text-violet-100' : 'text-slate-800 dark:text-white'
                      )}>
                        {getUserDisplayName(user)}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{user.email}</p>
                    </div>
                    {selected && (
                      <span className="h-5 w-5 rounded-full bg-violet-500 flex items-center justify-center shrink-0">
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>

        <div className="px-5 py-4 border-t border-slate-200/80 dark:border-slate-700/60 flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} className="rounded-xl dark:border-slate-600 dark:text-white dark:hover:bg-slate-700">
            Cancel
          </Button>
          <Button
            onClick={handleStart}
            disabled={isLoading || selectedUsers.length === 0}
            className="bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-violet-500/25"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Start'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewChatModal;
