import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  UserPlus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Shield, 
  Mail,
  Plus
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
import { Team, User, Role, Permission } from "@/types";
import { toast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export const UserManagement = () => {
  const queryClient = useQueryClient();
  const companyId = 1; // Hardcoded company ID

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddUserModalOpen, setAddUserModalOpen] = useState(false);
  const [isCreateTeamModalOpen, setCreateTeamModalOpen] = useState(false);
  const [isAddMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [isRoleModalOpen, setRoleModalOpen] = useState(false);
  
  const [selectedTeamForMember, setSelectedTeamForMember] = useState<Team | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  // Form State
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newTeamName, setNewTeamName] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedMemberRole, setSelectedMemberRole] = useState("member");
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [rolePermissions, setRolePermissions] = useState<number[]>([]);

  // --- DATA FETCHING ---
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['users', companyId],
    queryFn: async () => {
      const response = await fetch(`http://localhost:8000/api/v1/users/`, {
        headers: { 'X-Company-ID': companyId.toString() },
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
  });

  const { data: teams = [], isLoading: isLoadingTeams } = useQuery<Team[]>({
    queryKey: ['teams', companyId],
    queryFn: async () => {
      const response = await fetch(`http://localhost:8000/api/v1/teams/`, {
        headers: { 'X-Company-ID': companyId.toString() },
      });
      if (!response.ok) throw new Error('Failed to fetch teams');
      return response.json();
    },
  });

  const { data: roles = [], isLoading: isLoadingRoles } = useQuery<Role[]>({
    queryKey: ['roles', companyId],
    queryFn: async () => {
      const response = await fetch(`http://localhost:8000/api/v1/roles/`, {
        headers: { 'X-Company-ID': companyId.toString() },
      });
      if (!response.ok) throw new Error('Failed to fetch roles');
      return response.json();
    },
  });

  const { data: permissions = [], isLoading: isLoadingPermissions } = useQuery<Permission[]>({
    queryKey: ['permissions'],
    queryFn: async () => {
      const response = await fetch(`http://localhost:8000/api/v1/permissions/`);
      if (!response.ok) throw new Error('Failed to fetch permissions');
      return response.json();
    },
  });

  // --- MUTATIONS ---
  const createUserMutation = useMutation({
    mutationFn: (newUser: any) => fetch(`http://localhost:8000/api/v1/users/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Company-ID': companyId.toString() },
      body: JSON.stringify(newUser),
    }).then(res => { if (!res.ok) throw new Error('Failed to create user'); return res.json() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', companyId] });
      toast({ title: 'Success', description: 'User created successfully.' });
      setAddUserModalOpen(false);
      setNewUserEmail("");
      setNewUserPassword("");
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const createTeamMutation = useMutation({
    mutationFn: (newTeam: { name: string }) => fetch(`http://localhost:8000/api/v1/teams/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Company-ID': companyId.toString() },
      body: JSON.stringify(newTeam),
    }).then(res => { if (!res.ok) throw new Error('Failed to create team'); return res.json() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', companyId] });
      toast({ title: 'Success', description: 'Team created successfully.' });
      setCreateTeamModalOpen(false);
      setNewTeamName("");
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const addMemberMutation = useMutation({
    mutationFn: ({ teamId, userId, role }: { teamId: number; userId: number; role: string }) => fetch(`http://localhost:8000/api/v1/teams/${teamId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Company-ID': companyId.toString() },
      body: JSON.stringify({ user_id: userId, role }),
    }).then(res => { if (!res.ok) throw new Error('Failed to add member'); return res.json() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', companyId] });
      toast({ title: 'Success', description: 'Member added successfully.' });
      setAddMemberModalOpen(false);
      setSelectedUserId("");
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ teamId, userId }: { teamId: number; userId: number }) => fetch(`http://localhost:8000/api/v1/teams/${teamId}/members/${userId}`, {
      method: 'DELETE',
      headers: { 'X-Company-ID': companyId.toString() },
    }).then(res => { if (!res.ok) throw new Error('Failed to remove member'); return res.json() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', companyId] });
      toast({ title: 'Success', description: 'Member removed successfully.' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const roleMutation = useMutation({
    mutationFn: (roleData: { id?: number, name: string, description?: string, permission_ids: number[] }) => {
      const url = roleData.id
        ? `http://localhost:8000/api/v1/roles/${roleData.id}`
        : `http://localhost:8000/api/v1/roles/`;
      const method = roleData.id ? 'PUT' : 'POST';
      return fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'X-Company-ID': companyId.toString() },
        body: JSON.stringify({ name: roleData.name, description: roleData.description, permission_ids: roleData.permission_ids }),
      }).then(res => { if (!res.ok) throw new Error('Failed to save role'); return res.json() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles', companyId] });
      toast({ title: 'Success', description: 'Role saved successfully.' });
      setRoleModalOpen(false);
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (roleId: number) => fetch(`http://localhost:8000/api/v1/roles/${roleId}`, {
      method: 'DELETE',
      headers: { 'X-Company-ID': companyId.toString() },
    }).then(res => { if (!res.ok) throw new Error('Failed to delete role'); return res.json() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles', companyId] });
      toast({ title: 'Success', description: 'Role deleted successfully.' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  // --- EVENT HANDLERS ---
  const handleCreateUser = () => {
    if (newUserEmail && newUserPassword) createUserMutation.mutate({ email: newUserEmail, password: newUserPassword });
  };

  const handleCreateTeam = () => {
    if (newTeamName) createTeamMutation.mutate({ name: newTeamName });
  };

  const handleAddMember = () => {
    if (selectedTeamForMember && selectedUserId) {
      addMemberMutation.mutate({
        teamId: selectedTeamForMember.id,
        userId: parseInt(selectedUserId),
        role: selectedMemberRole,
      });
    }
  };

  const openAddMemberModal = (team: Team) => {
    setSelectedTeamForMember(team);
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

  const filteredUsers = users.filter(user => user.email.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-6 w-6" />Team & User Management</CardTitle>
          <CardDescription>Manage users, teams, and their roles.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="teams">Teams</TabsTrigger>
              <TabsTrigger value="permissions">Roles & Permissions</TabsTrigger>
            </TabsList>

            {/* USERS TAB */}
            <TabsContent value="users" className="space-y-4 pt-4">
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input placeholder="Search users by email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                </div>
                <Dialog open={isAddUserModalOpen} onOpenChange={setAddUserModalOpen}>
                  <DialogTrigger asChild><Button className="flex items-center gap-2"><UserPlus className="h-4 w-4" />Add User</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add New User</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                      <Input placeholder="Email" type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} />
                      <Input placeholder="Password" type="password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAddUserModalOpen(false)}>Cancel</Button>
                      <Button onClick={handleCreateUser} disabled={createUserMutation.isPending}>{createUserMutation.isPending ? "Adding..." : "Add User"}</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="space-y-3">
                {isLoadingUsers ? <p>Loading users...</p> : filteredUsers.map((user) => (
                  <Card key={user.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12"><AvatarImage src={undefined} /><AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">{user.email.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                        <div>
                          <h3 className="font-medium">{user.email}</h3>
                          <span className="flex items-center gap-1 text-sm text-gray-600 mt-1"><Mail className="h-3 w-3" />{user.email}</span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem><Edit className="h-4 w-4 mr-2" />Edit User</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600"><Trash2 className="h-4 w-4 mr-2" />Delete User</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* TEAMS TAB */}
            <TabsContent value="teams" className="space-y-4 pt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Manage Teams</h3>
                <Dialog open={isCreateTeamModalOpen} onOpenChange={setCreateTeamModalOpen}>
                  <DialogTrigger asChild><Button className="flex items-center gap-2"><Plus className="h-4 w-4" />Create Team</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Create New Team</DialogTitle></DialogHeader>
                    <div className="py-4"><Input placeholder="Team Name" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} /></div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCreateTeamModalOpen(false)}>Cancel</Button>
                      <Button onClick={handleCreateTeam} disabled={createTeamMutation.isPending}>{createTeamMutation.isPending ? "Creating..." : "Create Team"}</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoadingTeams ? <p>Loading teams...</p> : teams.map((team) => (
                  <Card key={team.id} className="flex flex-col">
                    <CardHeader><CardTitle>{team.name}</CardTitle></CardHeader>
                    <CardContent className="flex-grow">
                      <h4 className="font-semibold mb-2 text-sm">Members ({team.members.length})</h4>
                      <div className="space-y-2">
                        {team.members.length > 0 ? team.members.map((member) => (
                          <div key={member.id} className="flex justify-between items-center text-sm">
                            <span>{member.email}</span>
                            <Button variant="ghost" size="sm" onClick={() => removeMemberMutation.mutate({ teamId: team.id, userId: member.id })}><Trash2 className="h-4 w-4 text-red-500"/></Button>
                          </div>
                        )) : <p className="text-sm text-gray-500">No members yet.</p>}
                      </div>
                    </CardContent>
                    <CardContent><Button variant="outline" className="w-full" onClick={() => openAddMemberModal(team)}><UserPlus className="h-4 w-4 mr-2" />Add Member</Button></CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* PERMISSIONS TAB */}
            <TabsContent value="permissions" className="space-y-4 pt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Manage Roles</h3>
                <Button className="flex items-center gap-2" onClick={() => openRoleModal(null)}><Plus className="h-4 w-4" />Create Role</Button>
              </div>
              <div className="space-y-4">
                {isLoadingRoles ? <p>Loading roles...</p> : roles.map((role) => (
                  <Card key={role.id}>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{role.name}</CardTitle>
                        <CardDescription>{role.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => openRoleModal(role)}><Edit className="h-4 w-4 mr-2" />Edit</Button>
                        <Button variant="destructive" size="sm" onClick={() => deleteRoleMutation.mutate(role.id)}><Trash2 className="h-4 w-4 mr-2" />Delete</Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <h4 className="font-semibold mb-2 text-sm">Permissions</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {role.permissions.map(p => <Badge key={p.id} variant="secondary">{p.name}</Badge>)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add Member Modal */}
      <Dialog open={isAddMemberModalOpen} onOpenChange={setAddMemberModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Member to {selectedTeamForMember?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="user-select">User</Label>
              <Select onValueChange={setSelectedUserId} value={selectedUserId}><SelectTrigger id="user-select"><SelectValue placeholder="Select a user" /></SelectTrigger><SelectContent>{users.map(user => (<SelectItem key={user.id} value={user.id.toString()}>{user.email}</SelectItem>))}</SelectContent></Select>
            </div>
            <div>
              <Label htmlFor="role-select">Role</Label>
              <Select onValueChange={setSelectedMemberRole} defaultValue="member"><SelectTrigger id="role-select"><SelectValue placeholder="Select a role" /></SelectTrigger><SelectContent><SelectItem value="member">Member</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent></Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddMember} disabled={addMemberMutation.isPending}>{addMemberMutation.isPending ? "Adding..." : "Add Member"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Role Modal */}
      <Dialog open={isRoleModalOpen} onOpenChange={setRoleModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{selectedRole ? 'Edit Role' : 'Create New Role'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <Input placeholder="Role Name" value={roleName} onChange={(e) => setRoleName(e.target.value)} />
            <Input placeholder="Role Description" value={roleDescription} onChange={(e) => setRoleDescription(e.target.value)} />
            <div>
              <h4 className="font-semibold mb-2">Permissions</h4>
              {isLoadingPermissions ? <p>Loading permissions...</p> : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-60 overflow-y-auto p-2 border rounded-md">
                  {permissions.map(p => (
                    <div key={p.id} className="flex items-center space-x-2">
                      <Checkbox id={`perm-${p.id}`} checked={rolePermissions.includes(p.id)} onCheckedChange={() => handlePermissionToggle(p.id)} />
                      <label htmlFor={`perm-${p.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{p.name}</label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveRole} disabled={roleMutation.isPending}>{roleMutation.isPending ? "Saving..." : "Save Role"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;