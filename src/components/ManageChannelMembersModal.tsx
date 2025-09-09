
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, X } from 'lucide-react';
import { getChannelMembers, addChannelMember, removeChannelMember } from '@/services/chatService';
import { getUsers } from '@/services/userService';
import { User } from '@/types/user';
import { cn } from '@/lib/utils';

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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Channel Members</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Current Members</h3>
            {isLoadingMembers ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <div className="space-y-2 mt-2">
                {members?.map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={cn('h-2 w-2 rounded-full', userPresences[member.id] === 'online' ? 'bg-green-500' : 'bg-gray-400')} />
                      <span>{member.first_name} {member.last_name} ({member.email})</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMemberMutation.mutate(member.id)}
                      disabled={removeMemberMutation.isLoading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-lg font-medium">Add Members</h3>
            <Input
              placeholder="Search by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-2"
            />
            {isLoadingUsers ? (
              <Loader2 className="h-5 w-5 animate-spin mt-2" />
            ) : (
              <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
                {filteredUsers?.map((user) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <span>{user.first_name} {user.last_name} ({user.email})</span>
                    <Button
                      onClick={() => addMemberMutation.mutate(user.id)}
                      disabled={addMemberMutation.isLoading}
                    >
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageChannelMembersModal;
