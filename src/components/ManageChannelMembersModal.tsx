
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channelMembers', channelId] });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: number) => removeChannelMember(channelId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channelMembers', channelId] });
    },
  });

  const filteredUsers = users?.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !members?.some((member) => member.id === user.id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="dark:bg-slate-800 dark:border-slate-700 rounded-2xl sm:rounded-2xl sm:max-w-lg" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader className="pb-4 border-b border-slate-200/80 dark:border-slate-700/60">
          <DialogTitle className={`dark:text-white flex items-center gap-3 text-xl ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/25">
              <Users className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              {t('teamChat.dialogs.manageMembers.title')}
            </span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-4">
          {/* Current Members */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-purple-500" />
              {t('teamChat.dialogs.manageMembers.currentMembers')}
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-medium">
                {members?.length || 0}
              </span>
            </h3>
            {isLoadingMembers ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
              </div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {members?.map((member) => (
                  <div key={member.id} className={`flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="relative">
                        <Avatar className="h-9 w-9 ring-2 ring-white dark:ring-slate-700">
                          <AvatarImage src={(member as any).profile_picture_url} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-sm font-medium">
                            {member.first_name?.[0] || member.email?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn(
                          'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white dark:ring-slate-700',
                          userPresences[member.id] === 'online' ? 'bg-green-500' : 'bg-slate-400'
                        )} />
                      </div>
                      <div>
                        <p className="font-medium text-sm dark:text-white">{member.first_name} {member.last_name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{member.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMemberMutation.mutate(member.id)}
                      disabled={removeMemberMutation.isPending}
                      className="h-8 w-8 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Members */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2 mb-3">
              <UserPlus className="h-4 w-4 text-green-500" />
              {t('teamChat.dialogs.manageMembers.addMembers')}
            </h3>
            <div className="relative mb-3">
              <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400`} />
              <Input
                placeholder={t('teamChat.dialogs.manageMembers.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${isRTL ? 'pr-10' : 'pl-10'} rounded-xl h-11 dark:bg-slate-900 dark:border-slate-600 dark:text-white`}
              />
            </div>
            {isLoadingUsers ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
              </div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {filteredUsers?.length === 0 ? (
                  <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-4">No users found</p>
                ) : (
                  filteredUsers?.map((user) => (
                    <div key={user.id} className={`flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Avatar className="h-9 w-9 ring-2 ring-white dark:ring-slate-700">
                          <AvatarImage src={(user as any).profile_picture_url} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white text-sm font-medium">
                            {user.first_name?.[0] || user.email?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm dark:text-white">{user.first_name} {user.last_name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addMemberMutation.mutate(user.id)}
                        disabled={addMemberMutation.isPending}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg h-8 px-3 shadow-sm"
                      >
                        <UserPlus className={`h-3.5 w-3.5 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                        {t('teamChat.dialogs.manageMembers.addButton')}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="pt-4 border-t border-slate-200/80 dark:border-slate-700/60">
          <Button onClick={onClose} className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-purple-500/25">
            {t('common.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageChannelMembersModal;
