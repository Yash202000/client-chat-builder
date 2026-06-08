import { useState, useEffect } from "react";
import { motion, AnimatePresence } from 'framer-motion';
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
  Check,
  Send,
  Tag,
  X,
  Phone,
  Hash,
  PhoneForwarded,
  Voicemail,
  Building2,
  AlertCircle,
  Crown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
  const [editUserSkills, setEditUserSkills] = useState<string[]>([]);
  const [editUserSkillInput, setEditUserSkillInput] = useState("");

  // Node assignments for the user being edited
  const [userNodeAssignments, setUserNodeAssignments] = useState<any[]>([]);
  const [hierarchyTypes, setHierarchyTypes] = useState<{ id: number; name: string }[]>([]);
  const [hierarchyNodes, setHierarchyNodes] = useState<{ id: number; name: string; code: string; type_id: number; path: string }[]>([]);
  const [nodeAssignForm, setNodeAssignForm] = useState({ type_id: '', node_ids: [] as string[] });
  const [nodeSearch, setNodeSearch] = useState('');
  const [addingNodeAssign, setAddingNodeAssign] = useState(false);

  // ── Extension config (localStorage, keyed by userId) ──────────────────────
  const EXT_LS_KEY = 'phone_ext_configs';
  const loadExtConfigs = (): Record<number, ExtConfig> => {
    try { return JSON.parse(localStorage.getItem(EXT_LS_KEY) ?? '{}'); } catch { return {}; }
  };
  interface ExtConfig {
    ext: string; department: string; directNumber: string;
    status: 'active' | 'inactive'; voicemailEnabled: boolean; forwardTo: string;
  }
  const BLANK_EXT: ExtConfig = { ext: '', department: 'Support', directNumber: '', status: 'active', voicemailEnabled: true, forwardTo: '' };
  const EXT_DEPTS = ['Sales', 'Support', 'Engineering', 'Management', 'Other'];
  const [extConfigs, setExtConfigs] = useState<Record<number, ExtConfig>>(loadExtConfigs);
  const [extDialogUser, setExtDialogUser] = useState<User | null>(null);
  const [extForm, setExtForm] = useState<ExtConfig>(BLANK_EXT);
  const saveExtConfig = (userId: number, cfg: ExtConfig) => {
    const next = { ...extConfigs, [userId]: cfg };
    setExtConfigs(next);
    localStorage.setItem(EXT_LS_KEY, JSON.stringify(next));
  };
  const removeExtConfig = (userId: number) => {
    const next = { ...extConfigs };
    delete next[userId];
    setExtConfigs(next);
    localStorage.setItem(EXT_LS_KEY, JSON.stringify(next));
  };
  const openExtDialog = (user: User) => {
    setExtDialogUser(user);
    setExtForm(extConfigs[user.id] ?? BLANK_EXT);
  };
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [selectedMemberRole, setSelectedMemberRole] = useState("member");
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [rolePermissions, setRolePermissions] = useState<number[]>([]);

  // --- DATA FETCHING ---

  const { data: billingStatus } = useQuery({
    queryKey: ['billingStatus'],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/billing/status`);
      if (!response.ok) return null;
      return response.json();
    },
  });

  const isAtUserLimit = billingStatus
    ? billingStatus.current_user_count >= billingStatus.user_limit
    : false;
  const usersOverLimit = billingStatus && billingStatus.current_user_count > billingStatus.user_limit
    ? billingStatus.current_user_count - billingStatus.user_limit
    : 0;

  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['users', companyId],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/users/`);
      if (!response.ok) throw new Error('Failed to fetch users');
      const usersData = await response.json();
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
    },
    onError: (error) => {
      toast({ title: t('common.error'), description: error.message, variant: "destructive" });
    },
  });

  const handleRoleChange = (userId: number, roleId: string) => {
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

  const openEditUserModal = async (user: User) => {
    setSelectedUserForEdit(user);
    setEditUserEmail(user.email);
    setEditUserFirstName(user.first_name || "");
    setEditUserLastName(user.last_name || "");
    setEditUserPassword("");
    setEditUserSkills(Array.isArray((user as any).skills) ? (user as any).skills : []);
    setEditUserSkillInput("");
    setNodeAssignForm({ type_id: '', node_ids: [] });
    setNodeSearch('');
    setEditUserModalOpen(true);
    // Fetch hierarchy types, all nodes, and user's assignments
    try {
      const [typesRes, assignRes] = await Promise.all([
        authFetch('/api/v1/hierarchy/types'),
        authFetch(`/api/v1/hierarchy/user-assignments?user_id=${user.id}`),
      ]);
      const types = typesRes.ok ? await typesRes.json() : [];
      if (typesRes.ok) setHierarchyTypes(types);
      if (assignRes.ok) setUserNodeAssignments(await assignRes.json());
      // Load all nodes for all types so we can show names in chips + depth in dropdown
      if (types.length > 0) {
        const nodeResults = await Promise.all(
          types.map((t: { id: number }) => authFetch(`/api/v1/hierarchy/types/${t.id}/nodes`))
        );
        const allNodes = (await Promise.all(nodeResults.map(r => r.ok ? r.json() : []))).flat();
        setHierarchyNodes(allNodes);
      }
    } catch { /* non-fatal */ }
  };

  const handleUpdateUser = async () => {
    if (!selectedUserForEdit) return;
    const updateData: any = {
      email: editUserEmail,
      first_name: editUserFirstName,
      last_name: editUserLastName,
    };
    if (editUserPassword && editUserPassword.trim() !== "") {
      updateData.password = editUserPassword;
    }
    updateUserMutation.mutate({ userId: selectedUserForEdit.id, updateData });
    // Save skills separately
    try {
      await authFetch(`/api/v1/agent-skills/${selectedUserForEdit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills: editUserSkills }),
      });
    } catch (_) { /* non-critical */ }
    setEditUserModalOpen(false);
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
    <div className="space-y-5" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Compact stats row */}
      <div className="flex items-center gap-2 flex-wrap mb-5">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted border border-border text-xs font-semibold text-foreground">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          {users?.length || 0} {t('teamManagement.stats.totalUsers')}
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-semibold text-violet-600 dark:text-violet-400">
          <Users className="h-3.5 w-3.5" />
          {teams?.length || 0} {t('teamManagement.stats.teams')}
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-semibold text-violet-600 dark:text-violet-400">
          <Shield className="h-3.5 w-3.5" />
          {roles?.length || 0} {t('teamManagement.stats.roles')}
        </span>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Tabs defaultValue="users" className="w-full" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="border-b border-border bg-muted/30 px-4 pt-4">
            <TabsList className="grid w-full max-w-xs grid-cols-3 bg-muted p-0.5 rounded-lg h-8 gap-0.5">
              <TabsTrigger value="users" className="rounded-md text-xs py-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                <Users className="h-3.5 w-3.5 mr-1.5" />{t('teamManagement.tabs.users')}
              </TabsTrigger>
              <TabsTrigger value="teams" className="rounded-md text-xs py-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                <Users className="h-3.5 w-3.5 mr-1.5" />{t('teamManagement.tabs.teams')}
              </TabsTrigger>
              <TabsTrigger value="permissions" className="rounded-md text-xs py-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                <Shield className="h-3.5 w-3.5 mr-1.5" />{t('teamManagement.tabs.rolesPermissions')}
              </TabsTrigger>
            </TabsList>
          </div>
          <div className="p-4">

            {/* USERS TAB */}
            <TabsContent value="users" className="space-y-4 mt-0">
              {isAtUserLimit && (
                <Alert className="border-orange-300 bg-orange-50 dark:bg-orange-950/40 dark:border-orange-700 mb-3">
                  <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <AlertTitle className="text-orange-800 dark:text-orange-300 font-semibold">
                    {usersOverLimit > 0
                      ? `User limit exceeded by ${usersOverLimit} ${usersOverLimit === 1 ? 'user' : 'users'}`
                      : 'User limit reached'}
                  </AlertTitle>
                  <AlertDescription className="text-orange-700 dark:text-orange-400 flex items-center justify-between gap-4">
                    <span>
                      {billingStatus?.current_user_count} / {billingStatus?.user_limit} seats used.
                      Upgrade your plan to add more team members.
                    </span>
                    <a href="/dashboard/billing" className="flex items-center gap-1 text-xs font-semibold text-orange-800 dark:text-orange-300 underline underline-offset-2 shrink-0">
                      <Crown className="h-3.5 w-3.5" />
                      Upgrade
                    </a>
                  </AlertDescription>
                </Alert>
              )}

              <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="relative flex-1 max-w-md w-full">
                  <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-muted-foreground h-3.5 w-3.5`} />
                  <Input
                    placeholder={t('teamManagement.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`${isRTL ? 'pr-9' : 'pl-9'} h-9 text-sm border-border bg-background text-foreground placeholder:text-muted-foreground`}
                  />
                </div>
                <Permission permission="user:create">
                  <div className={`flex items-center gap-2 shrink-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            onClick={() => !isAtUserLimit && setInviteUserModalOpen(true)}
                            size="sm"
                            disabled={isAtUserLimit}
                            className={`flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                          >
                            <Send className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">{t('teamManagement.inviteUser')}</span>
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {isAtUserLimit && (
                        <TooltipContent>
                          <p>User limit reached. Upgrade your plan to invite more members.</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                    <Dialog open={isAtUserLimit ? false : isAddUserModalOpen} onOpenChange={(open) => !isAtUserLimit && setAddUserModalOpen(open)}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <DialogTrigger asChild>
                              <Button size="sm" disabled={isAtUserLimit} className={`flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}>
                                <UserPlus className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">{t('teamManagement.addUser')}</span>
                              </Button>
                            </DialogTrigger>
                          </span>
                        </TooltipTrigger>
                        {isAtUserLimit && (
                          <TooltipContent>
                            <p>User limit reached. Upgrade your plan to add more members.</p>
                          </TooltipContent>
                        )}
                      </Tooltip>

                  <DialogContent className="dark:bg-slate-800 dark:border-slate-700 rounded-2xl sm:rounded-2xl" dir={isRTL ? 'rtl' : 'ltr'}>
                    <DialogHeader className="pb-4 border-b border-slate-200/80 dark:border-slate-700/60">
                      <DialogTitle className={`dark:text-white flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
                          <UserPlus className="h-5 w-5 text-white" />
                        </div>
                        {t('teamManagement.dialogs.addUser.title')}
                      </DialogTitle>
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
                          className="dark:bg-slate-900 dark:border-slate-600 dark:text-white rounded-xl h-11"
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
                          className="dark:bg-slate-900 dark:border-slate-600 dark:text-white rounded-xl h-11"
                        />
                      </div>
                    </div>
                    <DialogFooter className="pt-4 border-t border-slate-200/80 dark:border-slate-700/60">
                      <Button variant="outline" onClick={() => setAddUserModalOpen(false)} className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700 rounded-xl">
                        {t('common.cancel')}
                      </Button>
                      <Button
                        onClick={handleCreateUser}
                        disabled={createUserMutation.isPending}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-500/25"
                      >
                        {createUserMutation.isPending ? t('teamManagement.dialogs.addUser.adding') : t('teamManagement.dialogs.addUser.button')}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                  </div>
              </Permission>
              </div>
              {isLoadingUsers ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mr-2"></div>
                  <span className="text-sm">{t('teamManagement.loading.users')}</span>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">{t('teamManagement.noUsersFound')}</div>
              ) : (
                <>
                  {/* Mobile cards (hidden sm+) */}
                  <div className="sm:hidden space-y-2">
                    {filteredUsers.map((user, index) => (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18, delay: index * 0.03 }}
                        className="rounded-lg border border-border bg-card p-3"
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative shrink-0">
                              <Avatar className="h-8 w-8 border border-border">
                                <AvatarImage src={user.profile_picture_url} />
                                <AvatarFallback className="bg-muted text-foreground font-semibold text-xs">
                                  {user.email.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              {user.presence_status && (
                                <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card ${
                                  user.presence_status === 'online' ? 'bg-green-500' : user.presence_status === 'busy' ? 'bg-yellow-500' : user.presence_status === 'in_call' ? 'bg-blue-500' : 'bg-gray-400'
                                }`} />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-medium text-foreground text-sm truncate">{user.first_name} {user.last_name}</span>
                                {extConfigs[user.id] && (
                                  <span className="font-mono text-[10px] font-bold text-violet-400 bg-violet-500/10 px-1 py-0.5 rounded border border-violet-500/20">#{extConfigs[user.id].ext}</span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              user.is_active ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' : 'bg-muted text-muted-foreground border border-border'
                            }`}>
                              {user.is_active ? t('teamManagement.status.active') : t('teamManagement.status.inactive')}
                            </span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-muted">
                                  <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-card border-border">
                                <Permission permission="user:update"><DropdownMenuItem className="text-foreground text-xs" onClick={() => openEditUserModal(user)}><Edit className="h-3.5 w-3.5 mr-2" />{t('common.edit')}</DropdownMenuItem></Permission>
                                <Permission permission="user:update"><DropdownMenuItem className="text-foreground text-xs" onClick={() => openExtDialog(user)}><Phone className="h-3.5 w-3.5 mr-2" />{extConfigs[user.id] ? 'Edit Extension' : 'Assign Extension'}</DropdownMenuItem></Permission>
                                <Permission permission="user:update"><DropdownMenuItem className="text-foreground text-xs" onClick={() => handleToggleUserActive(user.id, user.is_active)}>{user.is_active ? t('teamManagement.deactivate') : t('teamManagement.activate')}</DropdownMenuItem></Permission>
                                <Permission permission="user:delete"><DropdownMenuItem className="text-red-500 dark:text-red-400 text-xs" onClick={() => handleDeleteUser(user.id)}><Trash2 className="h-3.5 w-3.5 mr-2" />{t('common.delete')}</DropdownMenuItem></Permission>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <Select value={user.role_id?.toString()} onValueChange={(value) => handleRoleChange(user.id, value)} disabled={updateUserMutation.isPending}>
                          <SelectTrigger className="w-full h-8 text-xs bg-background border-border text-foreground">
                            <SelectValue placeholder={t('teamManagement.selectRole')} />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            {roles?.map((role) => (
                              <SelectItem key={role.id} value={role.id.toString()} className="text-foreground text-xs">{role.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </motion.div>
                    ))}
                  </div>

                  {/* Desktop table (hidden below sm) */}
                  <div className="hidden sm:block rounded-lg border border-border bg-card overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b border-border bg-muted/50 hover:bg-muted/50">
                            <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wide">{t('teamManagement.table.user')}</TableHead>
                            <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wide">{t('teamManagement.table.role')}</TableHead>
                            <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wide">{t('teamManagement.table.status')}</TableHead>
                            <TableHead className={`${isRTL ? 'text-left' : 'text-right'} text-muted-foreground font-semibold text-xs uppercase tracking-wide`}>{t('teamManagement.table.actions')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUsers.map((user, index) => (
                            <motion.tr
                              key={user.id}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.18, delay: index * 0.03 }}
                              className="border-b border-border hover:bg-muted/40 transition-colors"
                            >
                              <TableCell className="py-3">
                                <div className="flex items-center gap-3">
                                  <div className="relative">
                                    <Avatar className="h-8 w-8 border border-border">
                                      <AvatarImage src={user.profile_picture_url} />
                                      <AvatarFallback className="bg-muted text-foreground font-semibold text-xs">{user.email.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    {user.presence_status && (
                                      <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card ${
                                        user.presence_status === 'online' ? 'bg-green-500' : user.presence_status === 'busy' ? 'bg-yellow-500' : user.presence_status === 'in_call' ? 'bg-blue-500' : 'bg-gray-400'
                                      }`} title={user.presence_status} />
                                    )}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-medium text-foreground text-sm">{user.first_name} {user.last_name}</span>
                                      {extConfigs[user.id] && (
                                        <span className="font-mono text-[10px] font-bold text-violet-400 bg-violet-500/10 px-1 py-0.5 rounded border border-violet-500/20">#{extConfigs[user.id].ext}</span>
                                      )}
                                    </div>
                                    <div className="text-xs text-muted-foreground">{user.email}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Select value={user.role_id?.toString()} onValueChange={(value) => handleRoleChange(user.id, value)} disabled={updateUserMutation.isPending}>
                                  <SelectTrigger className="w-[160px] h-8 text-xs bg-background border-border text-foreground">
                                    <SelectValue placeholder={t('teamManagement.selectRole')} />
                                  </SelectTrigger>
                                  <SelectContent className="bg-card border-border">
                                    {roles?.map((role) => (
                                      <SelectItem key={role.id} value={role.id.toString()} className="text-foreground text-xs">{role.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  user.is_active ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' : 'bg-muted text-muted-foreground border border-border'
                                }`}>
                                  {user.is_active ? t('teamManagement.status.active') : t('teamManagement.status.inactive')}
                                </span>
                              </TableCell>
                              <TableCell className={isRTL ? 'text-left' : 'text-right'}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-muted">
                                      <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-card border-border">
                                    <Permission permission="user:update"><DropdownMenuItem className="text-foreground text-xs" onClick={() => openEditUserModal(user)}><Edit className={`h-3.5 w-3.5 ${isRTL ? 'ml-2' : 'mr-2'}`} />{t('common.edit')}</DropdownMenuItem></Permission>
                                    <Permission permission="user:update"><DropdownMenuItem className="text-foreground text-xs" onClick={() => openExtDialog(user)}><Phone className={`h-3.5 w-3.5 ${isRTL ? 'ml-2' : 'mr-2'}`} />{extConfigs[user.id] ? 'Edit Extension' : 'Assign Extension'}</DropdownMenuItem></Permission>
                                    <Permission permission="user:update"><DropdownMenuItem className="text-foreground text-xs" onClick={() => handleToggleUserActive(user.id, user.is_active)}>{user.is_active ? t('teamManagement.deactivate') : t('teamManagement.activate')}</DropdownMenuItem></Permission>
                                    <Permission permission="user:delete"><DropdownMenuItem className="text-red-500 dark:text-red-400 text-xs" onClick={() => handleDeleteUser(user.id)}><Trash2 className={`h-3.5 w-3.5 ${isRTL ? 'ml-2' : 'mr-2'}`} />{t('common.delete')}</DropdownMenuItem></Permission>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </motion.tr>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            {/* TEAMS TAB */}
            <TabsContent value="teams" className="space-y-4 mt-0">
              <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{t('teamManagement.manageTeams')}</h3>
                  <p className="text-xs text-muted-foreground">{t('teamManagement.manageTeamsDesc')}</p>
                </div>
                <Permission permission="team:create">
                  <Dialog open={isCreateTeamModalOpen} onOpenChange={setCreateTeamModalOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className={`flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-200 hover:scale-[1.02]`}>
                        <Plus className="h-3.5 w-3.5" />
                        {t('teamManagement.createTeam')}
                      </Button>
                    </DialogTrigger>
                  <DialogContent className="dark:bg-slate-800 dark:border-slate-700 rounded-2xl sm:rounded-2xl" dir={isRTL ? 'rtl' : 'ltr'}>
                    <DialogHeader className="pb-4 border-b border-slate-200/80 dark:border-slate-700/60">
                      <DialogTitle className={`dark:text-white flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/25">
                          <Plus className="h-5 w-5 text-white" />
                        </div>
                        {t('teamManagement.dialogs.createTeam.title')}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <Label htmlFor="new-team-name" className="text-sm dark:text-gray-300 mb-1.5 block">{t('teamManagement.dialogs.createTeam.label')}</Label>
                      <Input
                        id="new-team-name"
                        placeholder={t('teamManagement.dialogs.createTeam.placeholder')}
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        className="dark:bg-slate-900 dark:border-slate-600 dark:text-white rounded-xl h-11"
                      />
                    </div>
                    <DialogFooter className="pt-4 border-t border-slate-200/80 dark:border-slate-700/60">
                      <Button variant="outline" onClick={() => setCreateTeamModalOpen(false)} className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700 rounded-xl">
                        {t('common.cancel')}
                      </Button>
                      <Button
                        onClick={handleCreateTeam}
                        disabled={createTeamMutation.isPending}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl shadow-lg shadow-purple-500/25"
                      >
                        {createTeamMutation.isPending ? t('teamManagement.dialogs.createTeam.creating') : t('teamManagement.dialogs.createTeam.button')}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </Permission>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoadingTeams ? (
                  <div className="col-span-full flex items-center justify-center py-12">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                      <span className="text-sm">{t('teamManagement.loading.teams')}</span>
                    </div>
                  </div>
                ) : teams.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-muted border border-border mb-3">
                      <Users className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">{t('teamManagement.noTeamsYet')}</p>
                  </div>
                ) : (
                  teams.map((team, index) => (
                    <motion.div
                      key={team.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.04 }}
                      className="flex flex-col rounded-xl border border-border bg-card p-4 hover:border-border/80 transition-colors"
                    >
                      <div className={`flex items-center justify-between mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex items-center gap-2.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <div className="h-8 w-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                            <Users className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                          </div>
                          <span className="font-semibold text-sm text-foreground">{team.name}</span>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-muted">
                              <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card border-border">
                            <Permission permission="team:update">
                              <DropdownMenuItem
                                className="text-foreground text-xs"
                                onClick={() => openEditTeamModal(team)}
                              >
                                <Edit className={`h-3.5 w-3.5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                {t('common.edit')}
                              </DropdownMenuItem>
                            </Permission>
                            <Permission permission="team:delete">
                              <DropdownMenuItem
                                className="text-red-500 dark:text-red-400 text-xs"
                                onClick={() => handleDeleteTeam(team.id)}
                              >
                                <Trash2 className={`h-3.5 w-3.5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                {t('common.delete')}
                              </DropdownMenuItem>
                            </Permission>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-xs text-muted-foreground uppercase tracking-wider">{t('teamManagement.members')}</h4>
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted border border-border text-muted-foreground font-medium">
                          {team.members.length}
                        </span>
                      </div>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto flex-1">
                        {team.members.length > 0 ? (
                          team.members.map((member) => (
                            <div
                              key={member.id}
                              className="flex justify-between items-center text-xs p-2 rounded-lg bg-muted/50 border border-border"
                            >
                              <div className={`flex items-center gap-2 flex-1 min-w-0`}>
                                <Avatar className="h-5 w-5">
                                  <AvatarImage src={member.user?.profile_picture_url} />
                                  <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                                    {member.user?.email?.charAt(0).toUpperCase() || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-foreground truncate">{member.user?.email || t('teamManagement.unknown')}</span>
                              </div>
                              <Permission permission="team:update">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeMemberMutation.mutate({ teamId: team.id, userId: member.user_id })}
                                  className="h-6 w-6 p-0 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                  <Trash2 className="h-3 w-3 text-red-500 dark:text-red-400" />
                                </Button>
                              </Permission>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-xs text-muted-foreground">{t('teamManagement.noMembersYet')}</p>
                          </div>
                        )}
                      </div>
                      <div className="mt-3">
                        <Permission permission="team:update">
                          <Button
                            variant="outline"
                            size="sm"
                            className={`w-full border-border text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors flex items-center gap-1.5 justify-center text-xs`}
                            onClick={() => openAddMemberModal(team)}
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                            {t('teamManagement.addMember')}
                          </Button>
                        </Permission>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </TabsContent>

            {/* PERMISSIONS TAB */}
            <TabsContent value="permissions" className="space-y-4 mt-0">
              <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{t('teamManagement.manageRoles')}</h3>
                  <p className="text-xs text-muted-foreground">{t('teamManagement.manageRolesDesc')}</p>
                </div>
                <Permission permission="role:create">
                  <Button
                    size="sm"
                    className={`flex items-center gap-2 bg-gradient-to-r from-violet-500 to-orange-600 hover:from-violet-600 hover:to-orange-700 text-white rounded-lg shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 transition-all duration-200 hover:scale-[1.02]`}
                    onClick={() => openRoleModal(null)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {t('teamManagement.createRole')}
                  </Button>
                </Permission>
              </div>
              <div className="space-y-3 max-h-[calc(100vh-20rem)] overflow-y-auto pr-1">
                {isLoadingRoles ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                      <span className="text-sm">{t('teamManagement.loading.roles')}</span>
                    </div>
                  </div>
                ) : roles.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-muted border border-border mb-3">
                      <Shield className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">{t('teamManagement.noRolesYet')}</p>
                  </div>
                ) : (
                  roles.map((role, index) => (
                    <motion.div
                      key={role.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.04 }}
                      className="rounded-xl border border-border bg-card overflow-hidden"
                    >
                      <div className={`flex flex-row items-start justify-between p-4 border-b border-border bg-muted/30 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex items-start gap-3 flex-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <div className="h-9 w-9 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                            <Shield className="h-4.5 w-4.5 text-violet-600 dark:text-violet-400" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-foreground">{role.name}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {role.description || t('teamManagement.noDescription')}
                            </div>
                          </div>
                        </div>
                        <div className={`flex items-center gap-2 shrink-0`}>
                          <Permission permission="role:update">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openRoleModal(role)}
                              className={`border-border text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-1.5 h-7 text-xs`}
                            >
                              <Edit className="h-3 w-3" />
                              <span className="hidden sm:inline">{t('common.edit')}</span>
                            </Button>
                          </Permission>
                          <Permission permission="role:delete">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteRoleMutation.mutate(role.id)}
                              className={`bg-red-600 hover:bg-red-700 flex items-center gap-1.5 h-7 text-xs`}
                            >
                              <Trash2 className="h-3 w-3" />
                              <span className="hidden sm:inline">{t('common.delete')}</span>
                            </Button>
                          </Permission>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-xs text-muted-foreground uppercase tracking-wider">{t('teamManagement.permissions')}</h4>
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted border border-border text-muted-foreground font-medium">
                            {role.permissions.length}
                          </span>
                        </div>
                        {role.permissions.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5">
                            {role.permissions.map((p) => (
                              <div
                                key={p.id}
                                className={`flex items-center text-xs p-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800`}
                              >
                                <Check className={`h-3 w-3 ${isRTL ? 'ml-1.5' : 'mr-1.5'} text-green-600 dark:text-green-400 flex-shrink-0`} />
                                <span className="text-foreground truncate">{p.name}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 bg-muted/50 rounded-lg border border-border">
                            <p className="text-xs text-muted-foreground">{t('teamManagement.noPermissions')}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Add Member Modal */}
      <Dialog open={isAddMemberModalOpen} onOpenChange={setAddMemberModalOpen}>
        <DialogContent className="dark:bg-slate-800 dark:border-slate-700 rounded-2xl sm:rounded-2xl" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader className="pb-4 border-b border-slate-200/80 dark:border-slate-700/60">
            <DialogTitle className={`dark:text-white flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
                <UserPlus className="h-5 w-5 text-white" />
              </div>
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
          <DialogFooter className="pt-4 border-t border-slate-200/80 dark:border-slate-700/60">
            <Button
              variant="outline"
              onClick={() => setAddMemberModalOpen(false)}
              className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700 rounded-xl"
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={addMemberMutation.isPending || selectedUserIds.length === 0}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-500/25"
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
        <DialogContent className="dark:bg-slate-800 dark:border-slate-700 rounded-2xl sm:rounded-2xl" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader className="pb-4 border-b border-slate-200/80 dark:border-slate-700/60">
            <DialogTitle className={`dark:text-white flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/25">
                <Edit className="h-5 w-5 text-white" />
              </div>
              {t('teamManagement.dialogs.editTeam.title')}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="edit-team-name" className="text-sm dark:text-gray-300 mb-1.5 block">{t('teamManagement.dialogs.editTeam.label')}</Label>
            <Input
              id="edit-team-name"
              placeholder={t('teamManagement.dialogs.editTeam.placeholder')}
              value={editTeamName}
              onChange={(e) => setEditTeamName(e.target.value)}
              className="dark:bg-slate-900 dark:border-slate-600 dark:text-white rounded-xl h-11"
            />
          </div>
          <DialogFooter className="pt-4 border-t border-slate-200/80 dark:border-slate-700/60">
            <Button variant="outline" onClick={() => setEditTeamModalOpen(false)} className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700 rounded-xl">
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleUpdateTeam}
              disabled={updateTeamMutation.isPending}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl shadow-lg shadow-purple-500/25"
            >
              {updateTeamMutation.isPending ? t('teamManagement.dialogs.editTeam.updating') : t('teamManagement.dialogs.editTeam.button')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditUserModalOpen} onOpenChange={setEditUserModalOpen}>
        <DialogContent className="dark:bg-slate-800 dark:border-slate-700 rounded-2xl sm:rounded-2xl flex flex-col max-h-[90vh]" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader className="pb-4 border-b border-slate-200/80 dark:border-slate-700/60 shrink-0">
            <DialogTitle className={`dark:text-white flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
                <Edit className="h-5 w-5 text-white" />
              </div>
              {t('teamManagement.dialogs.editUser.title')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto flex-1 pr-1">
            <div>
              <Label htmlFor="edit-user-email" className="text-sm dark:text-gray-300 mb-1.5 block">{t('teamManagement.dialogs.editUser.emailLabel')}</Label>
              <Input
                id="edit-user-email"
                placeholder={t('teamManagement.dialogs.editUser.emailPlaceholder')}
                type="email"
                value={editUserEmail}
                onChange={(e) => setEditUserEmail(e.target.value)}
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-white rounded-xl h-11"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-user-first-name" className="text-sm dark:text-gray-300 mb-1.5 block">{t('teamManagement.dialogs.editUser.firstNameLabel')}</Label>
                <Input
                  id="edit-user-first-name"
                  placeholder={t('teamManagement.dialogs.editUser.firstNamePlaceholder')}
                  value={editUserFirstName}
                  onChange={(e) => setEditUserFirstName(e.target.value)}
                  className="dark:bg-slate-900 dark:border-slate-600 dark:text-white rounded-xl h-11"
                />
              </div>
              <div>
                <Label htmlFor="edit-user-last-name" className="text-sm dark:text-gray-300 mb-1.5 block">{t('teamManagement.dialogs.editUser.lastNameLabel')}</Label>
                <Input
                  id="edit-user-last-name"
                  placeholder={t('teamManagement.dialogs.editUser.lastNamePlaceholder')}
                  value={editUserLastName}
                  onChange={(e) => setEditUserLastName(e.target.value)}
                  className="dark:bg-slate-900 dark:border-slate-600 dark:text-white rounded-xl h-11"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-user-password" className="text-sm dark:text-gray-300 mb-1.5 block">{t('teamManagement.dialogs.editUser.passwordLabel')}</Label>
              <Input
                id="edit-user-password"
                placeholder={t('teamManagement.dialogs.editUser.passwordPlaceholder')}
                type="password"
                value={editUserPassword}
                onChange={(e) => setEditUserPassword(e.target.value)}
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-white rounded-xl h-11"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('teamManagement.dialogs.editUser.passwordHint')}</p>
            </div>

            {/* Skills section */}
            <div>
              <Label className="text-sm dark:text-gray-300 mb-1.5 flex items-center gap-1.5 block">
                <Tag className="h-3.5 w-3.5 text-emerald-500" />
                Skills (for call routing)
              </Label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="e.g. billing, spanish, technical"
                  value={editUserSkillInput}
                  onChange={e => setEditUserSkillInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const s = editUserSkillInput.trim().toLowerCase();
                      if (s && !editUserSkills.includes(s)) setEditUserSkills(prev => [...prev, s]);
                      setEditUserSkillInput('');
                    }
                  }}
                  className="dark:bg-slate-900 dark:border-slate-600 dark:text-white rounded-xl h-9 text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const s = editUserSkillInput.trim().toLowerCase();
                    if (s && !editUserSkills.includes(s)) setEditUserSkills(prev => [...prev, s]);
                    setEditUserSkillInput('');
                  }}
                  className="h-9 px-3 rounded-xl dark:border-slate-600"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              {editUserSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {editUserSkills.map(skill => (
                    <span key={skill} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      {skill}
                      <button type="button" onClick={() => setEditUserSkills(prev => prev.filter(s => s !== skill))}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Jurisdiction / Node Assignments */}
            {hierarchyTypes.length > 0 && (
              <div>
                <Label className="text-sm dark:text-gray-300 mb-2 flex items-center gap-1.5 block">
                  <Building2 className="h-3.5 w-3.5 text-blue-500" />
                  Jurisdiction Assignments
                </Label>
                <div className="space-y-2">
                  {hierarchyTypes.map(ht => {
                    const typeAssignments = userNodeAssignments.filter(
                      a => hierarchyNodes.find(n => n.id === a.node_id)?.type_id === ht.id
                    );
                    const isExpanded = nodeAssignForm.type_id === String(ht.id);
                    const alreadyAssignedIds = new Set(typeAssignments.map(a => String(a.node_id)));

                    return (
                      <div key={ht.id} className="rounded-lg border border-input dark:border-slate-700 overflow-hidden">
                        {/* Type header row */}
                        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-muted/40 dark:bg-slate-800/60">
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex-1">{ht.name}</span>
                          <button
                            type="button"
                            className={`h-5 w-5 flex items-center justify-center rounded transition-colors text-muted-foreground ${isExpanded ? 'bg-primary/10 text-primary' : 'hover:bg-accent'}`}
                            onClick={() => {
                              setNodeSearch('');
                              setNodeAssignForm(f => ({
                                ...f,
                                type_id: isExpanded ? '' : String(ht.id),
                                node_ids: [],
                              }));
                            }}
                          >
                            {isExpanded ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                          </button>
                        </div>

                        {/* Chips */}
                        {typeAssignments.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 px-2.5 py-2">
                            {typeAssignments.map(a => {
                              const node = hierarchyNodes.find(n => n.id === a.node_id);
                              return (
                                <span key={a.id} className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-[11px] bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                  {node?.name ?? `#${a.node_id}`}
                                  <button
                                    type="button"
                                    className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
                                    onClick={async () => {
                                      await authFetch(`/api/v1/hierarchy/user-assignments/${a.id}`, { method: 'DELETE' });
                                      setUserNodeAssignments(prev => prev.filter(x => x.id !== a.id));
                                    }}
                                  >
                                    <X className="h-2.5 w-2.5" />
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        )}

                        {/* Inline node picker — expands when + is clicked */}
                        {isExpanded && (
                          <div className="border-t border-input dark:border-slate-700">
                            <div className="flex items-center gap-2 px-2 py-1.5 border-b border-input dark:border-slate-700">
                              <Input
                                placeholder="Search nodes…"
                                className="h-6 text-xs border-0 shadow-none focus-visible:ring-0 px-0 bg-transparent flex-1"
                                value={nodeSearch}
                                onChange={e => setNodeSearch(e.target.value)}
                                autoFocus
                              />
                              {nodeAssignForm.node_ids.length > 0 && (
                                <button
                                  type="button"
                                  className="text-[10px] text-muted-foreground hover:text-destructive shrink-0 whitespace-nowrap"
                                  onClick={() => setNodeAssignForm(f => ({ ...f, node_ids: [] }))}
                                >
                                  Clear ({nodeAssignForm.node_ids.length})
                                </button>
                              )}
                            </div>
                            <div className="max-h-40 overflow-y-auto">
                              {(() => {
                                const filtered = hierarchyNodes.filter(n =>
                                  n.type_id === ht.id &&
                                  !alreadyAssignedIds.has(String(n.id)) &&
                                  (nodeSearch === '' || n.name.toLowerCase().includes(nodeSearch.toLowerCase()) || n.code.toLowerCase().includes(nodeSearch.toLowerCase()))
                                );
                                if (filtered.length === 0) return (
                                  <p className="text-xs text-muted-foreground text-center py-3">
                                    {alreadyAssignedIds.size > 0 && nodeSearch === '' ? 'All nodes assigned' : 'No nodes found'}
                                  </p>
                                );
                                return filtered.map(n => {
                                  const depth = n.path ? n.path.split('.').length - 1 : 0;
                                  const isSelected = nodeAssignForm.node_ids.includes(String(n.id));
                                  return (
                                    <label
                                      key={n.id}
                                      className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer text-xs hover:bg-accent transition-colors ${isSelected ? 'bg-accent/50' : ''}`}
                                    >
                                      <input
                                        type="checkbox"
                                        className="h-3.5 w-3.5 shrink-0 accent-primary"
                                        checked={isSelected}
                                        onChange={() => setNodeAssignForm(f => ({
                                          ...f,
                                          node_ids: isSelected
                                            ? f.node_ids.filter(x => x !== String(n.id))
                                            : [...f.node_ids, String(n.id)],
                                        }))}
                                      />
                                      <span className="flex items-center gap-1 flex-1 min-w-0" style={{ paddingLeft: `${depth * 10}px` }}>
                                        {depth > 0 && <span className="text-muted-foreground text-[10px] shrink-0">└</span>}
                                        <span className="truncate">{n.name}</span>
                                        <span className="text-muted-foreground shrink-0">({n.code})</span>
                                      </span>
                                    </label>
                                  );
                                });
                              })()}
                            </div>
                            {nodeAssignForm.node_ids.length > 0 && (
                              <div className="px-2 py-1.5 border-t border-input dark:border-slate-700">
                                <Button
                                  type="button"
                                  size="sm"
                                  className="h-7 w-full text-xs"
                                  disabled={addingNodeAssign}
                                  onClick={async () => {
                                    if (!selectedUserForEdit) return;
                                    setAddingNodeAssign(true);
                                    try {
                                      const results = await Promise.all(
                                        nodeAssignForm.node_ids.map(nid =>
                                          authFetch('/api/v1/hierarchy/user-assignments', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ user_id: selectedUserForEdit.id, node_id: Number(nid) }),
                                          }).then(r => r.ok ? r.json() : null)
                                        )
                                      );
                                      const added = results.filter(Boolean);
                                      if (added.length > 0) {
                                        setUserNodeAssignments(prev => [...prev, ...added]);
                                        setNodeAssignForm(f => ({ ...f, node_ids: [], type_id: '' }));
                                        setNodeSearch('');
                                      }
                                    } finally {
                                      setAddingNodeAssign(false);
                                    }
                                  }}
                                >
                                  {addingNodeAssign
                                    ? <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />Adding…</span>
                                    : `Add ${nodeAssignForm.node_ids.length} node${nodeAssignForm.node_ids.length > 1 ? 's' : ''}`
                                  }
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="pt-4 border-t border-slate-200/80 dark:border-slate-700/60 shrink-0">
            <Button variant="outline" onClick={() => setEditUserModalOpen(false)} className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700 rounded-xl">
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleUpdateUser}
              disabled={updateUserMutation.isPending}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-500/25"
            >
              {updateUserMutation.isPending ? t('teamManagement.dialogs.editUser.updating') : t('teamManagement.dialogs.editUser.button')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Role Modal */}
      <Dialog open={isRoleModalOpen} onOpenChange={setRoleModalOpen}>
        <DialogContent className="max-w-2xl dark:bg-slate-800 dark:border-slate-700 rounded-2xl sm:rounded-2xl" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader className="pb-4 border-b border-slate-200/80 dark:border-slate-700/60">
            <DialogTitle className={`dark:text-white flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-orange-600 shadow-lg shadow-violet-500/25">
                <Shield className="h-5 w-5 text-white" />
              </div>
              {selectedRole ? t('teamManagement.dialogs.role.titleEdit') : t('teamManagement.dialogs.role.titleCreate')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role-name" className="text-sm dark:text-gray-300 mb-1.5 block">
                  {t('teamManagement.dialogs.role.nameLabel')}
                </Label>
                <Input
                  id="role-name"
                  placeholder={t('teamManagement.dialogs.role.namePlaceholder')}
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="dark:bg-slate-900 dark:border-slate-600 dark:text-white rounded-xl h-11"
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
                  className="dark:bg-slate-900 dark:border-slate-600 dark:text-white rounded-xl h-11"
                />
              </div>
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
          <DialogFooter className="pt-4 border-t border-slate-200/80 dark:border-slate-700/60">
            <Button
              variant="outline"
              onClick={() => setRoleModalOpen(false)}
              className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700 rounded-xl"
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSaveRole}
              disabled={roleMutation.isPending}
              className="bg-gradient-to-r from-violet-500 to-orange-600 hover:from-violet-600 hover:to-orange-700 text-white rounded-xl shadow-lg shadow-violet-500/25"
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

      {/* ── Extension Config Dialog ──────────────────────────────────────── */}
      <Dialog open={!!extDialogUser} onOpenChange={open => { if (!open) setExtDialogUser(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <Phone className="h-4 w-4 text-violet-400" />
              {extDialogUser && extConfigs[extDialogUser.id] ? 'Edit Extension' : 'Assign Extension'}
              {extDialogUser && (
                <span className="font-normal text-muted-foreground">
                  — {extDialogUser.first_name || extDialogUser.email}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Extension #</label>
                <div className="relative">
                  <Hash className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input value={extForm.ext} onChange={e => setExtForm(f => ({ ...f, ext: e.target.value }))}
                    placeholder="101" className="pl-8 h-8 text-sm font-mono" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Department</label>
                <select
                  value={extForm.department}
                  onChange={e => setExtForm(f => ({ ...f, department: e.target.value }))}
                  className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground"
                >
                  {EXT_DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Direct DID (optional)</label>
              <div className="relative">
                <Phone className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input value={extForm.directNumber} onChange={e => setExtForm(f => ({ ...f, directNumber: e.target.value }))}
                  placeholder="+1 (415) 555-0100" className="pl-8 h-8 text-sm font-mono" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Forward To (ext, optional)</label>
              <div className="relative">
                <PhoneForwarded className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input value={extForm.forwardTo} onChange={e => setExtForm(f => ({ ...f, forwardTo: e.target.value }))}
                  placeholder="201" className="pl-8 h-8 text-sm font-mono" />
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <button type="button"
                  onClick={() => setExtForm(f => ({ ...f, status: f.status === 'active' ? 'inactive' : 'active' }))}
                  className={`relative h-5 w-9 rounded-full transition-colors ${extForm.status === 'active' ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`}
                >
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${extForm.status === 'active' ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
                <span className="text-xs text-muted-foreground">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <button type="button"
                  onClick={() => setExtForm(f => ({ ...f, voicemailEnabled: !f.voicemailEnabled }))}
                  className={`relative h-5 w-9 rounded-full transition-colors ${extForm.voicemailEnabled ? 'bg-violet-500' : 'bg-muted-foreground/30'}`}
                >
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${extForm.voicemailEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
                <span className="text-xs text-muted-foreground">Voicemail</span>
              </label>
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            {extDialogUser && extConfigs[extDialogUser.id] && (
              <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-500 hover:bg-red-500/5 text-xs h-8 mr-auto"
                onClick={() => { removeExtConfig(extDialogUser!.id); setExtDialogUser(null); }}>
                Remove
              </Button>
            )}
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setExtDialogUser(null)}>Cancel</Button>
            <Button size="sm" disabled={!extForm.ext}
              className="h-8 text-xs gap-1.5 bg-violet-600 hover:bg-violet-700 text-white"
              onClick={() => { saveExtConfig(extDialogUser!.id, extForm); setExtDialogUser(null); }}>
              <Check className="h-3.5 w-3.5" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamManagement;