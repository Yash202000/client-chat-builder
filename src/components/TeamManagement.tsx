import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Permission } from "@/components/Permission";
import { InviteUserModal } from "@/components/InviteUserModal";
import {
  Users,
  UserPlus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  Mail,
  Plus,
  Badge,
  Check,
  Send
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Team, User, Role, Permission as PermissionType } from "@/types";
import { toast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { TableHeader, TableRow, TableHead, TableBody, TableCell, Table } from "@/components/ui/table";
import { useI18n } from '@/hooks/useI18n';
import { useNotifications } from "@/hooks/useNotifications";

export const TeamManagement = () => {
  const { t, isRTL } = useI18n();
  const queryClient = useQueryClient();
  const companyId = 1; // Hardcoded company ID
  const { authFetch } = useAuth();
  const { playSuccessSound } = useNotifications();
  

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddUserModalOpen, setAddUserModalOpen] = useState(false);
  const [isCreateTeamModalOpen, setCreateTeamModalOpen] = useState(false);
  const [isAddMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [isRoleModalOpen, setRoleModalOpen] = useState(false);
  const [isEditTeamModalOpen, setEditTeamModalOpen] = useState(false);
  const [isEditUserModalOpen, setEditUserModalOpen] = useState(false);
  const [isInviteUserModalOpen, setInviteUserModalOpen] = useState(false);

  const [selectedTeamForMember, setSelectedTeamForMember] = useState<Team | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedTeamForEdit, setSelectedTeamForEdit] = useState<Team | null>(null);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);

  // Form State
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newTeamName, setNewTeamName] = useState("");
  const [editTeamName, setEditTeamName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editUserFirstName, setEditUserFirstName] = useState("");
  const [editUserLastName, setEditUserLastName] = useState("");
  const [editUserPassword, setEditUserPassword] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [selectedMemberRole, setSelectedMemberRole] = useState("member");
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [rolePermissions, setRolePermissions] = useState<number[]>([]);

  // --- DATA FETCHING ---
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['users', companyId],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/users/`);
      if (!response.ok) throw new Error('Failed to fetch users');
      const usersData = await response.json();
      console.log("Users data fetched:", usersData);
      return usersData;
    },
  });

  const { data: teams = [], isLoading: isLoadingTeams } = useQuery<Team[]>({
    queryKey: ['teams', companyId],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/teams/`);
      if (!response.ok) throw new Error('Failed to fetch teams');
      return response.json();
    },
  });

  const { data: roles = [], isLoading: isLoadingRoles } = useQuery<Role[]>({
    queryKey: ['roles', companyId],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/roles/`);
      if (!response.ok) throw new Error('Failed to fetch roles');
      return response.json();
    },
  });

  const { data: permissions = [], isLoading: isLoadingPermissions } = useQuery<Permission[]>({
    queryKey: ['permissions'],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/permissions/`);
      if (!response.ok) throw new Error('Failed to fetch permissions');
      return response.json();
    },
  });

  // --- MUTATIONS ---
  const createUserMutation = useMutation({
    mutationFn: (newUser: any) => authFetch(`/api/v1/users/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    }).then(res => { if (!res.ok) throw new Error('Failed to create user'); return res.json() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', companyId] });
      toast({ title: t('common.success'), variant: 'success', description: t('teamManagement.toasts.userCreated') });
      playSuccessSound();
      setAddUserModalOpen(false);
      setNewUserEmail("");
      setNewUserPassword("");
    },
    onError: (e: Error) => toast({ title: t('common.error'), description: e.message, variant: 'destructive' }),
  });

  const createTeamMutation = useMutation({
    mutationFn: (newTeam: { name: string }) => authFetch(`/api/v1/teams/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTeam),
    }).then(res => { if (!res.ok) throw new Error('Failed to create team'); return res.json() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', companyId] });
      toast({ title: t('common.success'), variant: 'success', description: t('teamManagement.toasts.teamCreated') });
      playSuccessSound();
      setCreateTeamModalOpen(false);
      setNewTeamName("");
    },
    onError: (e: Error) => toast({ title: t('common.error'), description: e.message, variant: 'destructive' }),
  });

  const addMemberMutation = useMutation({
    mutationFn: ({ teamId, userId, role }: { teamId: number; userId: number; role: string }) => authFetch(`/api/v1/teams/${teamId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, role }),
    }).then(res => { if (!res.ok) throw new Error('Failed to add member'); return res.json() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', companyId] });
    },
    onError: (e: Error) => toast({ title: t('common.error'), description: e.message, variant: 'destructive' }),
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ teamId, userId }: { teamId: number; userId: number }) => authFetch(`/api/v1/teams/${teamId}/members/${userId}`, {
      method: 'DELETE',
    }).then(res => { if (!res.ok) throw new Error('Failed to remove member'); return res.json() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', companyId] });
      toast({ title: t('common.success'), variant: 'success', description: t('teamManagement.toasts.memberRemoved') });
      playSuccessSound();
    },
    onError: (e: Error) => toast({ title: t('common.error'), description: e.message, variant: 'destructive' }),
  });

  const roleMutation = useMutation({
    mutationFn: (roleData: { id?: number, name: string, description?: string, permission_ids: number[] }) => {
      const url = roleData.id
        ? `/api/v1/roles/${roleData.id}`
        : `/api/v1/roles/`;
      const method = roleData.id ? 'PUT' : 'POST';
      return authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify({ name: roleData.name, description: roleData.description, permission_ids: roleData.permission_ids }),
      }).then(res => { if (!res.ok) throw new Error('Failed to save role'); return res.json() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles', companyId] });
      toast({ title: t('common.success'), variant: 'success', description: t('teamManagement.toasts.roleSaved') });
      playSuccessSound();
      setRoleModalOpen(false);
    },
    onError: (e: Error) => toast({ title: t('common.error'), description: e.message, variant: 'destructive' }),
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (roleId: number) => authFetch(`/api/v1/roles/${roleId}`, {
      method: 'DELETE',
    }).then(res => { if (!res.ok) throw new Error('Failed to delete role'); return res.json() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles', companyId] });
      toast({ title: t('common.success'), variant: 'success', description: t('teamManagement.toasts.roleDeleted') });
      playSuccessSound();
    },
    onError: (e: Error) => toast({ title: t('common.error'), description: e.message, variant: 'destructive' }),
  });

  const updateTeamMutation = useMutation({
    mutationFn: ({ teamId, name }: { teamId: number; name: string }) => authFetch(`/api/v1/teams/${teamId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }).then(res => { if (!res.ok) throw new Error('Failed to update team'); return res.json() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', companyId] });
      toast({ title: t('common.success'), variant: 'success', description: t('teamManagement.toasts.teamUpdated') });
      playSuccessSound();
      setEditTeamModalOpen(false);
      setEditTeamName("");
    },
    onError: (e: Error) => toast({ title: t('common.error'), description: e.message, variant: 'destructive' }),
  });

  const deleteTeamMutation = useMutation({
    mutationFn: (teamId: number) => authFetch(`/api/v1/teams/${teamId}`, {
      method: 'DELETE',
    }).then(res => { if (!res.ok) throw new Error('Failed to delete team'); return res.json() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', companyId] });
      toast({ title: t('common.success'), variant: 'success', description: t('teamManagement.toasts.teamDeleted') });
      playSuccessSound();
    },
    onError: (e: Error) => toast({ title: t('common.error'), description: e.message, variant: 'destructive' }),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => authFetch(`/api/v1/users/${userId}`, {
      method: 'DELETE',
    }).then(res => { if (!res.ok) throw new Error('Failed to delete user'); return res.json() }),
    onSuccess: (data) => {
      queryClient.refetchQueries({ queryKey: ['users', companyId] });
      const message = data.action === 'deleted'
        ? t('teamManagement.toasts.userDeleted')
        : t('teamManagement.toasts.userDeactivated') || 'User deactivated';
      toast({ title: t('common.success'), variant: 'success', description: message });
      playSuccessSound();
    },
    onError: (e: Error) => toast({ title: t('common.error'), description: e.message, variant: 'destructive' }),
  });

  const toggleUserActiveMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: number; isActive: boolean }) => authFetch(`/api/v1/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: isActive }),
    }).then(res => { if (!res.ok) throw new Error('Failed to update user status'); return res.json() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', companyId] });
      toast({ title: t('common.success'), variant: 'success', description: t('teamManagement.toasts.userStatusUpdated') });
      playSuccessSound();
    },
    onError: (e: Error) => toast({ title: t('common.error'), description: e.message, variant: 'destructive' }),
  });

  // --- EVENT HANDLERS ---
  const handleCreateUser = () => {
    if (newUserEmail && newUserPassword) createUserMutation.mutate({ email: newUserEmail, password: newUserPassword });
  };

  const handleCreateTeam = () => {
    if (newTeamName) createTeamMutation.mutate({ name: newTeamName });
  };

  const handleAddMember = async () => {
    if (selectedTeamForMember && selectedUserIds.length > 0) {
      // Add members sequentially
      for (const userId of selectedUserIds) {
        try {
          await addMemberMutation.mutateAsync({
            teamId: selectedTeamForMember.id,
            userId: userId,
            role: selectedMemberRole,
          });
        } catch (error) {
          console.error(`Failed to add user ${userId}:`, error);
          // Continue with other users even if one fails
        }
      }
      // Close modal and reset after all members are added
      setAddMemberModalOpen(false);
      setSelectedUserIds([]);
      toast({ title: t('common.success'), variant: 'success', description: t('teamManagement.toasts.membersAdded', { count: selectedUserIds.length }) });
      playSuccessSound();
    }
  };

  const handleUserSelectionToggle = (userId: number) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const openAddMemberModal = (team: Team) => {
    setSelectedTeamForMember(team);
    setSelectedUserIds([]); // Reset selection
    setSelectedMemberRole("member"); // Reset role
    setAddMemberModalOpen(true);
  };

  const openRoleModal = (role: Role | null) => {
    setSelectedRole(role);
    if (role) {
      setRoleName(role.name);
      setRoleDescription(role.description || "");
      setRolePermissions(role.permissions.map(p => p.id));
    } else {
      setRoleName("");
      setRoleDescription("");
      setRolePermissions([]);
    }
    setRoleModalOpen(true);
  };

  const handleSaveRole = () => {
    roleMutation.mutate({
      id: selectedRole?.id,
      name: roleName,
      description: roleDescription,
      permission_ids: rolePermissions,
    });
  };

  const handlePermissionToggle = (permissionId: number) => {
    setRolePermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updateData }: { userId: number; updateData: Partial<User> }) => {
      if (!companyId) throw new Error("Company ID not available");
      const response = await authFetch(`/api/v1/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update user");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: t('teamManagement.toasts.userUpdated') });
      console.log("User update successful, users query invalidated.");
    },
    onError: (error) => {
      toast({ title: t('common.error'), description: error.message, variant: "destructive" });
    },
  });

  const handleRoleChange = (userId: number, roleId: string) => {
    console.log(`Attempting to change role for user ${userId} to role ${roleId}`);
    updateUserMutation.mutate({ userId, updateData: { role_id: parseInt(roleId, 10) } });
  };

  const openEditTeamModal = (team: Team) => {
    setSelectedTeamForEdit(team);
    setEditTeamName(team.name);
    setEditTeamModalOpen(true);
  };

  const handleUpdateTeam = () => {
    if (selectedTeamForEdit && editTeamName) {
      updateTeamMutation.mutate({ teamId: selectedTeamForEdit.id, name: editTeamName });
    }
  };

  const handleDeleteTeam = (teamId: number) => {
    if (confirm(t('teamManagement.confirmDeleteTeam'))) {
      deleteTeamMutation.mutate(teamId);
    }
  };

  const openEditUserModal = (user: User) => {
    setSelectedUserForEdit(user);
    setEditUserEmail(user.email);
    setEditUserFirstName(user.first_name || "");
    setEditUserLastName(user.last_name || "");
    setEditUserPassword(""); // Reset password field
    setEditUserModalOpen(true);
  };

  const handleUpdateUser = () => {
    if (selectedUserForEdit) {
      const updateData: any = {
        email: editUserEmail,
        first_name: editUserFirstName,
        last_name: editUserLastName,
      };

      // Only include password if it's been changed
      if (editUserPassword && editUserPassword.trim() !== "") {
        updateData.password = editUserPassword;
      }

      updateUserMutation.mutate({
        userId: selectedUserForEdit.id,
        updateData,
      });
      setEditUserModalOpen(false);
    }
  };

  const handleDeleteUser = (userId: number) => {
    if (confirm(t('teamManagement.confirmDeleteUser'))) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleToggleUserActive = (userId: number, currentStatus: boolean) => {
    toggleUserActiveMutation.mutate({ userId, isActive: !currentStatus });
  };

  const filteredUsers = users.filter(user => user.email.toLowerCase().includes(searchQuery.toLowerCase()));

  // Get available users (not already in the selected team)
  const getAvailableUsers = () => {
    if (!selectedTeamForMember) return users;

    const existingMemberIds = selectedTeamForMember.members.map(member => member.user_id);
    return users.filter(user => !existingMemberIds.includes(user.id));
  };

  const availableUsers = getAvailableUsers();

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Stats Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800 card-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">{t('teamManagement.stats.totalUsers')}</p>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  {users?.length || 0}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800 card-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">{t('teamManagement.stats.teams')}</p>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {teams?.length || 0}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <span className="text-2xl">🏢</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200 dark:border-orange-800 card-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">{t('teamManagement.stats.roles')}</p>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  {roles?.length || 0}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-600 to-amber-600 flex items-center justify-center">
                <span className="text-2xl">🔒</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="card-shadow-lg bg-white dark:bg-slate-800 overflow-visible">
        <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
          <CardTitle className={`flex items-center gap-2 text-2xl dark:text-white`}>
            <Users className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            {t('teamManagement.title')}
          </CardTitle>
          <CardDescription className="dark:text-gray-400 text-base">
            {t('teamManagement.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="users" className="w-full" dir={isRTL ? 'rtl' : 'ltr'}>
            <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-900 p-1">
              <TabsTrigger value="users" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400">👥 {t('teamManagement.tabs.users')}</TabsTrigger>
              <TabsTrigger value="teams" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400">🏢 {t('teamManagement.tabs.teams')}</TabsTrigger>
              <TabsTrigger value="permissions" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400">🔒 {t('teamManagement.tabs.rolesPermissions')}</TabsTrigger>
            </TabsList>

            {/* USERS TAB */}
            <TabsContent value="users" className="space-y-5 pt-5">
              <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}>
                <div className="relative flex-1 max-w-md w-full">
                  <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4`} />
                  <Input
                    placeholder={t('teamManagement.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`${isRTL ? 'pr-10' : 'pl-10'} dark:bg-slate-900 dark:border-slate-600 dark:text-white dark:placeholder-gray-500`}
                  />
                </div>
                <Permission permission="user:create">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setInviteUserModalOpen(true)}
                      className={`flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white btn-hover-lift`}
                    >
                      <Send className="h-4 w-4" />
                      {t('teamManagement.inviteUser')}
                    </Button>
                    <Dialog open={isAddUserModalOpen} onOpenChange={setAddUserModalOpen}>
                      <DialogTrigger asChild>
                        <Button className={`flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white btn-hover-lift`}>
                          <UserPlus className="h-4 w-4" />
                          {t('teamManagement.addUser')}
                        </Button>
                      </DialogTrigger>
                  <DialogContent className="dark:bg-slate-800 dark:border-slate-700" dir={isRTL ? 'rtl' : 'ltr'}>
                    <DialogHeader>
                      <DialogTitle className="dark:text-white">{t('teamManagement.dialogs.addUser.title')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="new-user-email" className="text-sm dark:text-gray-300 mb-1.5 block">{t('teamManagement.dialogs.addUser.emailLabel')}</Label>
                        <Input
                          id="new-user-email"
                          placeholder={t('teamManagement.dialogs.addUser.emailPlaceholder')}
                          type="email"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="new-user-password" className="text-sm dark:text-gray-300 mb-1.5 block">{t('teamManagement.dialogs.addUser.passwordLabel')}</Label>
                        <Input
                          id="new-user-password"
                          placeholder="••••••••"
                          type="password"
                          value={newUserPassword}
                          onChange={(e) => setNewUserPassword(e.target.value)}
                          className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAddUserModalOpen(false)} className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700">
                        {t('common.cancel')}
                      </Button>
                      <Button
                        onClick={handleCreateUser}
                        disabled={createUserMutation.isPending}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                      >
                        {createUserMutation.isPending ? t('teamManagement.dialogs.addUser.adding') : t('teamManagement.dialogs.addUser.button')}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                  </div>
              </Permission>
              </div>
              <Card className="border border-slate-200 dark:border-slate-700 dark:bg-slate-900/50">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-900/80">
                          <TableHead className="dark:text-gray-300 font-semibold">{t('teamManagement.table.user')}</TableHead>
                          <TableHead className="dark:text-gray-300 font-semibold">{t('teamManagement.table.role')}</TableHead>
                          <TableHead className="dark:text-gray-300 font-semibold">{t('teamManagement.table.status')}</TableHead>
                          <TableHead className={`${isRTL ? 'text-left' : 'text-right'} dark:text-gray-300 font-semibold`}>{t('teamManagement.table.actions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingUsers ? (
                          <TableRow className="dark:border-slate-700">
                            <TableCell colSpan={4} className="text-center py-8 dark:text-gray-400">
                              <div className="flex items-center justify-center gap-2">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 dark:border-blue-400"></div>
                                <span>{t('teamManagement.loading.users')}</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : filteredUsers.length === 0 ? (
                          <TableRow className="dark:border-slate-700">
                            <TableCell colSpan={4} className="text-center py-8 dark:text-gray-400">
                              {t('teamManagement.noUsersFound')}
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredUsers.map((user) => (
                            <TableRow key={user.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                              <TableCell className="py-4">
                                <div className="flex items-center gap-3">
                                  <div className="relative">
                                    <Avatar className="h-10 w-10 border-2 border-slate-200 dark:border-slate-600">
                                      <AvatarImage src={user.profile_picture_url} />
                                      <AvatarFallback className="bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 text-blue-700 dark:text-blue-300 font-semibold">
                                        {user.email.charAt(0).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    {user.presence_status && (
                                      <span
                                        className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-slate-800 ${
                                          user.presence_status === 'online'
                                            ? 'bg-green-500'
                                            : user.presence_status === 'busy'
                                            ? 'bg-yellow-500'
                                            : user.presence_status === 'in_call'
                                            ? 'bg-blue-500'
                                            : 'bg-gray-400'
                                        }`}
                                        title={user.presence_status}
                                      />
                                    )}
                                  </div>
                                  <div>
                                    <div className="font-medium dark:text-white">{user.first_name} {user.last_name}</div>
                                    <div className="text-sm text-muted-foreground dark:text-gray-400">{user.email}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={user.role_id?.toString()}
                                  onValueChange={(value) => handleRoleChange(user.id, value)}
                                  disabled={updateUserMutation.isPending}
                                >
                                  <SelectTrigger className="w-[180px] dark:bg-slate-800 dark:border-slate-600 dark:text-white">
                                    <SelectValue placeholder={t('teamManagement.selectRole')} />
                                  </SelectTrigger>
                                  <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                                    {roles?.map((role) => (
                                      <SelectItem key={role.id} value={role.id.toString()} className="dark:text-white dark:focus:bg-slate-700">
                                        {role.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                  user.is_active
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                                    : 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-800'
                                }`}>
                                  {user.is_active ? t('teamManagement.status.active') : t('teamManagement.status.inactive')}
                                </span>
                              </TableCell>
                              <TableCell className={isRTL ? 'text-left' : 'text-right'}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="hover:bg-slate-100 dark:hover:bg-slate-700">
                                      <MoreHorizontal className="h-4 w-4 dark:text-gray-400" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="dark:bg-slate-800 dark:border-slate-700">
                                    <Permission permission="user:update">
                                      <DropdownMenuItem
                                        className="dark:text-white dark:focus:bg-slate-700"
                                        onClick={() => openEditUserModal(user)}
                                      >
                                        <Edit className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                        {t('common.edit')}
                                      </DropdownMenuItem>
                                    </Permission>
                                    <Permission permission="user:update">
                                      <DropdownMenuItem
                                        className="dark:text-white dark:focus:bg-slate-700"
                                        onClick={() => handleToggleUserActive(user.id, user.is_active)}
                                      >
                                        {user.is_active ? t('teamManagement.deactivate') : t('teamManagement.activate')}
                                      </DropdownMenuItem>
                                    </Permission>
                                    <Permission permission="user:delete">
                                      <DropdownMenuItem
                                        className="text-red-500 dark:text-red-400 dark:focus:bg-slate-700"
                                        onClick={() => handleDeleteUser(user.id)}
                                      >
                                        <Trash2 className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                        {t('common.delete')}
                                      </DropdownMenuItem>
                                    </Permission>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TEAMS TAB */}
            <TabsContent value="teams" className="space-y-5 pt-5">
              <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}>
                <div>
                  <h3 className="text-lg font-semibold dark:text-white">{t('teamManagement.manageTeams')}</h3>
                  <p className="text-sm text-muted-foreground dark:text-gray-400">{t('teamManagement.manageTeamsDesc')}</p>
                </div>
                <Permission permission="team:create">
                  <Dialog open={isCreateTeamModalOpen} onOpenChange={setCreateTeamModalOpen}>
                    <DialogTrigger asChild>
                      <Button className={`flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white btn-hover-lift `}>
                        <Plus className="h-4 w-4" />
                        {t('teamManagement.createTeam')}
                      </Button>
                    </DialogTrigger>
                  <DialogContent className="dark:bg-slate-800 dark:border-slate-700" dir={isRTL ? 'rtl' : 'ltr'}>
                    <DialogHeader>
                      <DialogTitle className="dark:text-white">{t('teamManagement.dialogs.createTeam.title')}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <Label htmlFor="new-team-name" className="text-sm dark:text-gray-300 mb-1.5 block">{t('teamManagement.dialogs.createTeam.label')}</Label>
                      <Input
                        id="new-team-name"
                        placeholder={t('teamManagement.dialogs.createTeam.placeholder')}
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCreateTeamModalOpen(false)} className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700">
                        {t('common.cancel')}
                      </Button>
                      <Button
                        onClick={handleCreateTeam}
                        disabled={createTeamMutation.isPending}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                      >
                        {createTeamMutation.isPending ? t('teamManagement.dialogs.createTeam.creating') : t('teamManagement.dialogs.createTeam.button')}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </Permission>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {isLoadingTeams ? (
                  <div className="col-span-full flex items-center justify-center py-12">
                    <div className="flex items-center gap-2 text-muted-foreground dark:text-gray-400">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 dark:border-blue-400"></div>
                      <span>{t('teamManagement.loading.teams')}</span>
                    </div>
                  </div>
                ) : teams.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                      <Users className="h-8 w-8 text-slate-400 dark:text-slate-600" />
                    </div>
                    <p className="text-muted-foreground dark:text-gray-400">{t('teamManagement.noTeamsYet')}</p>
                  </div>
                ) : (
                  teams.map((team) => (
                    <Card key={team.id} className="flex flex-col card-shadow-lg border-slate-200 dark:border-slate-700 dark:bg-slate-900/50 hover:shadow-xl transition-shadow">
                      <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50">
                        <div className="flex items-center justify-between">
                          <CardTitle className="dark:text-white flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 flex items-center justify-center">
                              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            {team.name}
                          </CardTitle>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="hover:bg-slate-100 dark:hover:bg-slate-700">
                                <MoreHorizontal className="h-4 w-4 dark:text-gray-400" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="dark:bg-slate-800 dark:border-slate-700">
                              <Permission permission="team:update">
                                <DropdownMenuItem
                                  className="dark:text-white dark:focus:bg-slate-700"
                                  onClick={() => openEditTeamModal(team)}
                                >
                                  <Edit className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                  {t('common.edit')}
                                </DropdownMenuItem>
                              </Permission>
                              <Permission permission="team:delete">
                                <DropdownMenuItem
                                  className="text-red-500 dark:text-red-400 dark:focus:bg-slate-700"
                                  onClick={() => handleDeleteTeam(team.id)}
                                >
                                  <Trash2 className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                  {t('common.delete')}
                                </DropdownMenuItem>
                              </Permission>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-grow pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-sm dark:text-gray-300 uppercase tracking-wider">{t('teamManagement.members')}</h4>
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
                            {team.members.length}
                          </span>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {team.members.length > 0 ? (
                            team.members.map((member) => (
                              <div
                                key={member.id}
                                className="flex justify-between items-center text-sm p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                              >
                                <div className={`flex items-center gap-2 flex-1 min-w-0 `}>
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={member.user?.profile_picture_url} />
                                    <AvatarFallback className="text-xs bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 text-blue-700 dark:text-blue-300">
                                      {member.user?.email?.charAt(0).toUpperCase() || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="dark:text-white truncate">{member.user?.email || t('teamManagement.unknown')}</span>
                                </div>
                                <Permission permission="team:update">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeMemberMutation.mutate({ teamId: team.id, userId: member.user_id })}
                                    className="hover:bg-red-50 dark:hover:bg-red-900/20"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                                  </Button>
                                </Permission>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-6">
                              <p className="text-sm text-gray-500 dark:text-gray-400">{t('teamManagement.noMembersYet')}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardContent className="pt-0 pb-4">
                        <Permission permission="team:update">
                          <Button
                            variant="outline"
                            className={`w-full dark:border-slate-600 dark:text-white dark:hover:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center gap-2 `}
                            onClick={() => openAddMemberModal(team)}
                          >
                            <UserPlus className="h-4 w-4" />
                            {t('teamManagement.addMember')}
                          </Button>
                        </Permission>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* PERMISSIONS TAB */}
            <TabsContent value="permissions" className="space-y-5 pt-5">
              <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}>
                <div>
                  <h3 className="text-lg font-semibold dark:text-white">{t('teamManagement.manageRoles')}</h3>
                  <p className="text-sm text-muted-foreground dark:text-gray-400">{t('teamManagement.manageRolesDesc')}</p>
                </div>
                <Permission permission="role:create">
                  <Button
                    className={`flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white btn-hover-lift `}
                    onClick={() => openRoleModal(null)}
                  >
                    <Plus className="h-4 w-4" />
                    {t('teamManagement.createRole')}
                  </Button>
                </Permission>
              </div>
              <div className="space-y-4 max-h-[calc(100vh-20rem)] overflow-y-auto pr-1">
                {isLoadingRoles ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex items-center gap-2 text-muted-foreground dark:text-gray-400">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 dark:border-blue-400"></div>
                      <span>{t('teamManagement.loading.roles')}</span>
                    </div>
                  </div>
                ) : roles.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                      <Shield className="h-8 w-8 text-slate-400 dark:text-slate-600" />
                    </div>
                    <p className="text-muted-foreground dark:text-gray-400">{t('teamManagement.noRolesYet')}</p>
                  </div>
                ) : (
                  roles.map((role) => (
                    <Card key={role.id} className="card-shadow-lg border-slate-200 dark:border-slate-700 dark:bg-slate-900/50">
                      <CardHeader className="flex flex-row items-start justify-between border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 flex items-center justify-center flex-shrink-0">
                            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-base dark:text-white">{role.name}</CardTitle>
                            <CardDescription className="dark:text-gray-400 mt-1">
                              {role.description || t('teamManagement.noDescription')}
                            </CardDescription>
                          </div>
                        </div>
                        <div className={`flex items-center gap-2 `}>
                          <Permission permission="role:update">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openRoleModal(role)}
                              className={`dark:border-slate-600 dark:text-white dark:hover:bg-slate-700 flex items-center gap-2 `}
                            >
                              <Edit className="h-4 w-4" />
                              {t('common.edit')}
                            </Button>
                          </Permission>
                          <Permission permission="role:delete">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteRoleMutation.mutate(role.id)}
                              className={`bg-red-600 hover:bg-red-700 flex items-center gap-2 `}
                            >
                              <Trash2 className="h-4 w-4" />
                              {t('common.delete')}
                            </Button>
                          </Permission>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-sm dark:text-gray-300 uppercase tracking-wider">{t('teamManagement.permissions')}</h4>
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
                            {role.permissions.length}
                          </span>
                        </div>
                        {role.permissions.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                            {role.permissions.map((p) => (
                              <div
                                key={p.id}
                                className={`flex items-center text-sm p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 `}
                              >
                                <Check className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'} text-green-600 dark:text-green-400 flex-shrink-0`} />
                                <span className="dark:text-white truncate">{p.name}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('teamManagement.noPermissions')}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add Member Modal */}
      <Dialog open={isAddMemberModalOpen} onOpenChange={setAddMemberModalOpen}>
        <DialogContent className="dark:bg-slate-800 dark:border-slate-700" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className={`dark:text-white flex items-center gap-2 `}>
              <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              {t('teamManagement.dialogs.addMember.title', { teamName: selectedTeamForMember?.name })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm dark:text-gray-300">
                  {t('teamManagement.dialogs.addMember.selectMembers')}
                </Label>
                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
                  {t('teamManagement.dialogs.addMember.selected', { count: selectedUserIds.length })}
                </span>
              </div>
              {availableUsers.length === 0 ? (
                <div className="text-center py-8 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('teamManagement.dialogs.addMember.allMembersAdded')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto p-3 border rounded-lg bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700">
                  {availableUsers.map((user) => (
                    <div
                      key={user.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer hover:shadow-sm ${
                        selectedUserIds.includes(user.id)
                          ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600'
                      }`}
                      onClick={() => handleUserSelectionToggle(user.id)}
                    >
                      <Checkbox
                        id={`user-${user.id}`}
                        checked={selectedUserIds.includes(user.id)}
                        onCheckedChange={() => handleUserSelectionToggle(user.id)}
                        className="dark:border-slate-500"
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <div className="relative">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.profile_picture_url} />
                            <AvatarFallback className="text-xs bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 text-blue-700 dark:text-blue-300">
                              {user.email.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {user.presence_status && (
                            <span
                              className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-800 ${
                                user.presence_status === 'online'
                                  ? 'bg-green-500'
                                  : user.presence_status === 'busy'
                                  ? 'bg-yellow-500'
                                  : user.presence_status === 'in_call'
                                  ? 'bg-blue-500'
                                  : 'bg-gray-400'
                              }`}
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium dark:text-white truncate">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="role-select" className="text-sm dark:text-gray-300 mb-1.5 block">
                {t('teamManagement.dialogs.addMember.teamRole')}
              </Label>
              <Select onValueChange={setSelectedMemberRole} defaultValue="member">
                <SelectTrigger id="role-select" className="dark:bg-slate-900 dark:border-slate-600 dark:text-white">
                  <SelectValue placeholder={t('teamManagement.dialogs.addMember.selectRole')} />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                  <SelectItem value="member" className="dark:text-white dark:focus:bg-slate-700">
                    <div className={`flex items-center gap-2 `}>
                      <Badge className="h-4 w-4" />
                      {t('teamManagement.dialogs.addMember.member')}
                    </div>
                  </SelectItem>
                  <SelectItem value="admin" className="dark:text-white dark:focus:bg-slate-700">
                    <div className={`flex items-center gap-2 `}>
                      <Shield className="h-4 w-4" />
                      {t('teamManagement.dialogs.addMember.admin')}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddMemberModalOpen(false)}
              className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700"
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={addMemberMutation.isPending || selectedUserIds.length === 0}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              {addMemberMutation.isPending ? (
                <>
                  <div className={`animate-spin rounded-full h-4 w-4 border-b-2 border-white ${isRTL ? 'ml-2' : 'mr-2'}`}></div>
                  {t('teamManagement.dialogs.addMember.adding')}
                </>
              ) : (
                <>
                  <UserPlus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('teamManagement.dialogs.addMember.button', { count: selectedUserIds.length })}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Team Modal */}
      <Dialog open={isEditTeamModalOpen} onOpenChange={setEditTeamModalOpen}>
        <DialogContent className="dark:bg-slate-800 dark:border-slate-700" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className="dark:text-white">{t('teamManagement.dialogs.editTeam.title')}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="edit-team-name" className="text-sm dark:text-gray-300 mb-1.5 block">{t('teamManagement.dialogs.editTeam.label')}</Label>
            <Input
              id="edit-team-name"
              placeholder={t('teamManagement.dialogs.editTeam.placeholder')}
              value={editTeamName}
              onChange={(e) => setEditTeamName(e.target.value)}
              className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTeamModalOpen(false)} className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700">
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleUpdateTeam}
              disabled={updateTeamMutation.isPending}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              {updateTeamMutation.isPending ? t('teamManagement.dialogs.editTeam.updating') : t('teamManagement.dialogs.editTeam.button')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditUserModalOpen} onOpenChange={setEditUserModalOpen}>
        <DialogContent className="dark:bg-slate-800 dark:border-slate-700" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className="dark:text-white">{t('teamManagement.dialogs.editUser.title')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-user-email" className="text-sm dark:text-gray-300 mb-1.5 block">{t('teamManagement.dialogs.editUser.emailLabel')}</Label>
              <Input
                id="edit-user-email"
                placeholder={t('teamManagement.dialogs.editUser.emailPlaceholder')}
                type="email"
                value={editUserEmail}
                onChange={(e) => setEditUserEmail(e.target.value)}
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div>
              <Label htmlFor="edit-user-first-name" className="text-sm dark:text-gray-300 mb-1.5 block">{t('teamManagement.dialogs.editUser.firstNameLabel')}</Label>
              <Input
                id="edit-user-first-name"
                placeholder={t('teamManagement.dialogs.editUser.firstNamePlaceholder')}
                value={editUserFirstName}
                onChange={(e) => setEditUserFirstName(e.target.value)}
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div>
              <Label htmlFor="edit-user-last-name" className="text-sm dark:text-gray-300 mb-1.5 block">{t('teamManagement.dialogs.editUser.lastNameLabel')}</Label>
              <Input
                id="edit-user-last-name"
                placeholder={t('teamManagement.dialogs.editUser.lastNamePlaceholder')}
                value={editUserLastName}
                onChange={(e) => setEditUserLastName(e.target.value)}
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div>
              <Label htmlFor="edit-user-password" className="text-sm dark:text-gray-300 mb-1.5 block">{t('teamManagement.dialogs.editUser.passwordLabel')}</Label>
              <Input
                id="edit-user-password"
                placeholder={t('teamManagement.dialogs.editUser.passwordPlaceholder')}
                type="password"
                value={editUserPassword}
                onChange={(e) => setEditUserPassword(e.target.value)}
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('teamManagement.dialogs.editUser.passwordHint')}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUserModalOpen(false)} className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700">
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleUpdateUser}
              disabled={updateUserMutation.isPending}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              {updateUserMutation.isPending ? t('teamManagement.dialogs.editUser.updating') : t('teamManagement.dialogs.editUser.button')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Role Modal */}
      <Dialog open={isRoleModalOpen} onOpenChange={setRoleModalOpen}>
        <DialogContent className="max-w-2xl dark:bg-slate-800 dark:border-slate-700" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className={`dark:text-white flex items-center gap-2 `}>
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              {selectedRole ? t('teamManagement.dialogs.role.titleEdit') : t('teamManagement.dialogs.role.titleCreate')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div>
              <Label htmlFor="role-name" className="text-sm dark:text-gray-300 mb-1.5 block">
                {t('teamManagement.dialogs.role.nameLabel')}
              </Label>
              <Input
                id="role-name"
                placeholder={t('teamManagement.dialogs.role.namePlaceholder')}
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div>
              <Label htmlFor="role-description" className="text-sm dark:text-gray-300 mb-1.5 block">
                {t('teamManagement.dialogs.role.descriptionLabel')}
              </Label>
              <Input
                id="role-description"
                placeholder={t('teamManagement.dialogs.role.descriptionPlaceholder')}
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm dark:text-gray-300 uppercase tracking-wider">
                  {t('teamManagement.permissions')}
                </h4>
                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
                  {t('teamManagement.dialogs.role.permissionsSelected', { count: rolePermissions.length })}
                </span>
              </div>
              {isLoadingPermissions ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-2 text-muted-foreground dark:text-gray-400">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 dark:border-blue-400"></div>
                    <span>{t('teamManagement.loading.permissions')}</span>
                  </div>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto p-3 border rounded-lg bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 space-y-4">
                  {/* Page Access Permissions */}
                  {permissions.filter(p => p.name.startsWith('page:')).length > 0 && (
                    <div>
                      <h5 className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Shield className="h-3.5 w-3.5" />
                        {t('teamManagement.dialogs.role.pageAccess', 'Page Access')}
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {permissions.filter(p => p.name.startsWith('page:')).map((p) => (
                          <div
                            key={p.id}
                            className={`flex items-center space-x-2 p-2.5 rounded-lg border transition-all cursor-pointer hover:shadow-sm ${
                              rolePermissions.includes(p.id)
                                ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600'
                            }`}
                            onClick={() => handlePermissionToggle(p.id)}
                          >
                            <Checkbox
                              id={`perm-${p.id}`}
                              checked={rolePermissions.includes(p.id)}
                              onCheckedChange={() => handlePermissionToggle(p.id)}
                              className="dark:border-slate-500"
                            />
                            <label
                              htmlFor={`perm-${p.id}`}
                              className="text-sm font-medium leading-none cursor-pointer dark:text-white flex-1"
                            >
                              {p.name.replace('page:', '')}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* API Permissions */}
                  <div>
                    <h5 className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5" />
                      {t('teamManagement.dialogs.role.apiPermissions', 'API Permissions')}
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {permissions.filter(p => !p.name.startsWith('page:')).map((p) => (
                        <div
                          key={p.id}
                          className={`flex items-center space-x-2 p-2.5 rounded-lg border transition-all cursor-pointer hover:shadow-sm ${
                            rolePermissions.includes(p.id)
                              ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600'
                          }`}
                          onClick={() => handlePermissionToggle(p.id)}
                        >
                          <Checkbox
                            id={`perm-${p.id}`}
                            checked={rolePermissions.includes(p.id)}
                            onCheckedChange={() => handlePermissionToggle(p.id)}
                            className="dark:border-slate-500"
                          />
                          <label
                            htmlFor={`perm-${p.id}`}
                            className="text-sm font-medium leading-none cursor-pointer dark:text-white flex-1"
                          >
                            {p.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRoleModalOpen(false)}
              className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700"
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSaveRole}
              disabled={roleMutation.isPending}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              {roleMutation.isPending ? (
                <>
                  <div className={`animate-spin rounded-full h-4 w-4 border-b-2 border-white ${isRTL ? 'ml-2' : 'mr-2'}`}></div>
                  {t('teamManagement.dialogs.role.saving')}
                </>
              ) : (
                <>
                  <Check className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('teamManagement.dialogs.role.button')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite User Modal */}
      <InviteUserModal
        isOpen={isInviteUserModalOpen}
        onClose={() => setInviteUserModalOpen(false)}
      />
    </div>
  );
};

export default TeamManagement;