import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, X, Users, UserPlus, Search } from 'lucide-react';
import { getChannelMembers, addChannelMember, removeChannelMember } from '@/services/chatService';
import { getUsers } from '@/services/userService';
import { User } from '@/types/user';
import { cn } from '@/lib/utils';
import { useI18n } from '@/hooks/useI18n';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ManageChannelMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelId: number;
  userPresences: { [key: number]: 'online' | 'offline' };
}

const ManageChannelMembersModal: React.FC<ManageChannelMembersModalProps> = ({
  isOpen,
  onClose,
  channelId,
  userPresences,
}) => {
  const { t, isRTL } = useI18n();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: members, isLoading: isLoadingMembers } = useQuery<User[], Error>({
    queryKey: ['channelMembers', channelId],
    queryFn: () => getChannelMembers(channelId),
    enabled: isOpen,
  });

  const { data: users, isLoading: isLoadingUsers } = useQuery<User[], Error>({
    queryKey: ['companyUsers'],
    queryFn: getUsers,
    enabled: isOpen,
  });

  const addMemberMutation = useMutation({
    mutationFn: (userId: number) => addChannelMember(channelId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['channelMembers', channelId] }),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: number) => removeChannelMember(channelId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['channelMembers', channelId] }),
  });

  const filteredUsers = users?.filter(
    (user) =>
      (user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())) &&
      !members?.some((member) => member.id === user.id)
  );

  return (
    <div className={cn(
      'h-full flex-shrink-0 flex flex-col border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden transition-all duration-300 ease-in-out',
      isOpen ? 'w-80' : 'w-0 border-l-0'
    )} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          <span className="text-sm font-semibold text-slate-800 dark:text-white">
            {t('teamChat.dialogs.manageMembers.title')}
          </span>
          {members && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
              {members.length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Current Members */}
          <div>
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-1">
              {t('teamChat.dialogs.manageMembers.currentMembers')}
            </p>
            {isLoadingMembers ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              </div>
            ) : (
              <div className="space-y-1">
                {members?.map((member) => (
                  <div key={member.id} className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/60 group">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative flex-shrink-0">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={(member as any).profile_picture_url} />
                          <AvatarFallback className="text-xs bg-slate-400 dark:bg-slate-600 text-white">
                            {member.first_name?.[0] || member.email?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn(
                          'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-1 ring-white dark:ring-slate-800',
                          userPresences[member.id] === 'online' ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
                        )} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                          {member.first_name} {member.last_name}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{member.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeMemberMutation.mutate(member.id)}
                      disabled={removeMemberMutation.isPending}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 text-slate-400 transition-all"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-slate-200 dark:border-slate-700" />

          {/* Add Members */}
          <div>
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-1">
              {t('teamChat.dialogs.manageMembers.addMembers')}
            </p>
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <Input
                placeholder={t('teamChat.dialogs.manageMembers.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              />
            </div>
            {isLoadingUsers ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              </div>
            ) : filteredUsers?.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-3">No users to add</p>
            ) : (
              <div className="space-y-1">
                {filteredUsers?.map((user) => (
                  <div key={user.id} className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/60">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="h-7 w-7 flex-shrink-0">
                        <AvatarImage src={(user as any).profile_picture_url} />
                        <AvatarFallback className="text-xs bg-slate-400 dark:bg-slate-600 text-white">
                          {user.first_name?.[0] || user.email?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => addMemberMutation.mutate(user.id)}
                      disabled={addMemberMutation.isPending}
                      className="p-1 rounded hover:bg-green-100 dark:hover:bg-green-900/30 text-slate-400 hover:text-green-600 dark:hover:text-green-400 transition-colors flex-shrink-0"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default ManageChannelMembersModal;
