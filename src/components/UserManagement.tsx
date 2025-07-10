import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Shield, 
  Mail,
  Phone,
  Calendar,
  Activity,
  Plus
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const mockUsers = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah@example.com",
    role: "Admin",
    status: "online",
    avatar: null,
    lastActive: "2 minutes ago",
    conversationsHandled: 127,
    responseTime: "1.2 min",
    satisfaction: 4.8
  },
  {
    id: "2",
    name: "Mike Chen",
    email: "mike@example.com",
    role: "Agent",
    status: "busy",
    avatar: null,
    lastActive: "5 minutes ago",
    conversationsHandled: 89,
    responseTime: "2.1 min",
    satisfaction: 4.6
  },
  {
    id: "3",
    name: "Emily Davis",
    email: "emily@example.com",
    role: "Agent",
    status: "offline",
    avatar: null,
    lastActive: "2 hours ago",
    conversationsHandled: 156,
    responseTime: "1.8 min",
    satisfaction: 4.9
  }
];

const mockTeams = [
  {
    id: "1",
    name: "Customer Support",
    description: "Primary customer support team",
    members: 8,
    activeConversations: 24
  },
  {
    id: "2",
    name: "Sales",
    description: "Sales and pre-sales support",
    members: 5,
    activeConversations: 12
  },
  {
    id: "3",
    name: "Technical Support",
    description: "Technical issues and product support",
    members: 6,
    activeConversations: 18
  }
];

export const UserManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-green-500";
      case "busy": return "bg-yellow-500";
      case "offline": return "bg-gray-400";
      default: return "bg-gray-400";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Admin": return "bg-purple-100 text-purple-800";
      case "Agent": return "bg-blue-100 text-blue-800";
      case "Manager": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === "all" || user.role.toLowerCase() === selectedRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-blue-600">24</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Online Now</p>
                <p className="text-2xl font-bold text-green-600">18</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Chats</p>
                <p className="text-2xl font-bold text-orange-600">54</p>
              </div>
              <Activity className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Response</p>
                <p className="text-2xl font-bold text-purple-600">1.7m</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            User Management
          </CardTitle>
          <CardDescription>
            Manage team members, roles, and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="teams">Teams</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              {/* Search and Filter Bar */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="p-2 border rounded-md"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="agent">Agent</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
                
                <Button className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Add User
                </Button>
              </div>

              {/* Users List */}
              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <Card key={user.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={user.avatar || undefined} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                {user.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(user.status)}`}></div>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{user.name}</h3>
                              <Badge className={getRoleColor(user.role)}>
                                {user.role}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {user.email}
                              </span>
                              <span>Last active: {user.lastActive}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-right text-sm">
                            <div className="font-medium">{user.conversationsHandled}</div>
                            <div className="text-gray-600">Conversations</div>
                          </div>
                          
                          <div className="text-right text-sm">
                            <div className="font-medium">{user.responseTime}</div>
                            <div className="text-gray-600">Avg Response</div>
                          </div>
                          
                          <div className="text-right text-sm">
                            <div className="font-medium flex items-center gap-1">
                              <span className="text-yellow-500">★</span>
                              {user.satisfaction}
                            </div>
                            <div className="text-gray-600">Satisfaction</div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Shield className="h-4 w-4 mr-2" />
                                Manage Permissions
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="teams" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Teams</h3>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Team
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockTeams.map((team) => (
                  <Card key={team.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold text-lg">{team.name}</h3>
                          <p className="text-sm text-gray-600">{team.description}</p>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <div>
                            <span className="font-medium">{team.members}</span>
                            <span className="text-gray-600"> members</span>
                          </div>
                          <div>
                            <span className="font-medium text-green-600">{team.activeConversations}</span>
                            <span className="text-gray-600"> active chats</span>
                          </div>
                        </div>
                        
                        <Button variant="outline" className="w-full">
                          Manage Team
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="permissions" className="space-y-4">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Role Permissions</h3>
                
                {["Admin", "Manager", "Agent"].map((role) => (
                  <Card key={role}>
                    <CardHeader>
                      <CardTitle className="text-base">{role} Permissions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                          "Manage Users",
                          "View Analytics",
                          "Handle Conversations",
                          "Manage Agents",
                          "Access Reports",
                          "Configure Webhooks",
                          "Manage Teams",
                          "System Settings"
                        ].map((permission) => (
                          <div key={permission} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`${role}-${permission}`}
                              defaultChecked={role === "Admin" || (role === "Manager" && !permission.includes("System")) || (role === "Agent" && permission.includes("Conversations"))}
                              className="rounded"
                            />
                            <label htmlFor={`${role}-${permission}`} className="text-sm">
                              {permission}
                            </label>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
