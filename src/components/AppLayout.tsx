
import { useAuth } from "@/hooks/useAuth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CircleUser } from "lucide-react";
import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  MessageSquare, 
  Settings, 
  BarChart3, 
  Bot, 
  Users, 
  Inbox, 
  FileText, 
  Sparkles, 
  WorkflowIcon as WorkflowIcon,
  Zap, 
  Palette,
  Menu,
  X,
  Key,
  BookOpen,
  CreditCard,
  Mic,
  Building
} from "lucide-react";
import { CreateAgentDialog } from "@/components/CreateAgentDialog";
import { Permission } from "./Permission";

const AppLayout = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  console.log("Logged in user:", user);

  const sidebarItems = [
    { title: "Conversations", url: "/dashboard/conversations", icon: Inbox, permission: "conversation:read" },
    { title: "Agents", url: "/dashboard/agents", icon: Bot, permission: "agent:read" },
    { title: "Agent Builder", url: "/dashboard/builder", icon: Settings, permission: "agent:update" },
    { title: "Widget Designer", url: "/dashboard/designer", icon: Palette, permission: "company_settings:update" },
    { title: "Team Management", url: "/dashboard/team", icon: Users, permission: "user:read" },
    { title: "Reports", url: "/dashboard/reports", icon: BarChart3, permission: "analytics:read" },
    { title: "Settings", url: "/dashboard/settings", icon: FileText, permission: "company_settings:update" },
    { title: "API Vault", url: "/dashboard/vault", icon: Key, permission: "company_settings:update" },
    { title: "Knowledge Bases", url: "/dashboard/knowledge-base/manage", icon: BookOpen, permission: "knowledgebase:read" },
    { title: "Tools", url: "/dashboard/tools", icon: Zap, permission: "tool:read" },
    { title: "Workflows", url: "/dashboard/workflows", icon: WorkflowIcon, permission: "workflow:read" },
    { title: "Voice Lab", url: "/dashboard/voice-lab", icon: Mic, permission: "voice:create" }, 
    { title: "Billing", url: "/dashboard/billing", icon: CreditCard, permission: "billing:manage" },
    { title: "Manage Plans", url: "/dashboard/admin/subscriptions", icon: Sparkles, admin: true },
    { title: "Companies", url: "/dashboard/companies", icon: Building, admin: true },
  ];

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b z-20">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              <div className="flex items-center space-x-3">
                 <div className="p-2 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-lg shadow-md">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-800">AgentConnect</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Permission permission="agent:create">
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)} 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Agent
                </Button>
              </Permission>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon" className="rounded-full">
                    <CircleUser className="h-5 w-5" />
                    <span className="sr-only">Toggle user menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <NavLink to="/dashboard/profile">Profile</NavLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`w-64 flex-shrink-0 bg-white border-r transition-all duration-300 ${sidebarOpen ? '' : '-ml-64'}`}>
          <nav className="p-4 space-y-1 h-full flex flex-col">
            <div className="flex-1">
              {sidebarItems.map((item) => (
                <Permission key={item.url} permission={item.permission}>
                  <NavLink
                    to={item.url}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`
                    }
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </NavLink>
                </Permission>
              ))}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <CreateAgentDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen} 
      />
    </div>
  );
};

export default AppLayout;
