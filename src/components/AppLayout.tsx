
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CircleUser, Moon, Sun } from "lucide-react";
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
import { PresenceSelector } from "@/components/PresenceSelector";

const AppLayout = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  console.log("Logged in user:", user);

  const sidebarItems = [
    { title: "Active Clients", url: "/dashboard/conversations", icon: Inbox, permission: "conversation:read" },
    { title: "Agents", url: "/dashboard/agents", icon: Bot, permission: "agent:read" },
    { title: "Agent Builder", url: "/dashboard/builder", icon: Settings, permission: "agent:update" },
    { title: "Widget Designer", url: "/dashboard/designer", icon: Palette, permission: "company_settings:update" },
    { title: "Team Management", url: "/dashboard/team", icon: Users, permission: "user:read" },
    { title: "Team Chat", url: "/dashboard/team-chat", icon: MessageSquare, permission: "user:read" },
    { title: "Reports", url: "/dashboard/reports", icon: BarChart3, permission: "analytics:read" },
    { title: "Settings", url: "/dashboard/settings", icon: FileText, permission: "company_settings:update" },
    { title: "API Vault", url: "/dashboard/vault", icon: Key, permission: "company_settings:update" },
    { title: "Knowledge Bases", url: "/dashboard/knowledge-base/manage", icon: BookOpen, permission: "knowledgebase:read" },
    { title: "Custom Tools", url: "/dashboard/tools", icon: Zap, permission: "tool:read" },
    { title: "Custom Workflows", url: "/dashboard/workflows", icon: WorkflowIcon, permission: "workflow:read" },
    { title: "Voice Lab", url: "/dashboard/voice-lab", icon: Mic, permission: "voice:create" }, 
    { title: "Billing", url: "/dashboard/billing", icon: CreditCard, permission: "billing:manage" },
    { title: "Manage Plans", url: "/dashboard/admin/subscriptions", icon: Sparkles, admin: true },
    { title: "Companies", url: "/dashboard/companies", icon: Building, admin: true },
    { title: "AI Image Generator", url: "/dashboard/ai-image-generator", icon: Sparkles, permission: "image:create" },
    { title: "AI Image Gallery", url: "/dashboard/ai-image-gallery", icon: FileText, permission: "image:read" },
    { title: "AI Chat", url: "/dashboard/ai-chat", icon: MessageSquare, permission: "chat:read" },
    { title: "AI Tools", url: "/dashboard/ai-tools", icon: Sparkles, permission: "ai-tool:read" },
    { title: "Vision AI", url: "/dashboard/object-detection", icon: Sparkles, permission: "image:create" },
  ];

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50 dark:bg-slate-900 overflow-hidden transition-colors">
      {/* Header */}
      <header className="flex-shrink-0 bg-white dark:bg-slate-800 border-b dark:border-slate-700 z-20">
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
                <h1 className="text-xl font-bold text-gray-800 dark:text-white">AgentConnect</h1>
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

              {/* Theme Toggle */}
              <Button
                variant="outline"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Moon className="h-5 w-5 text-slate-700" />
                )}
              </Button>

              {/* Presence Selector */}
              <PresenceSelector currentStatus={user?.presence_status} showLabel={false} />

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
        {/* Enhanced Sidebar with Dark Mode */}
        <aside
          className={`w-64 flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 ${
            sidebarOpen ? '' : '-ml-64 lg:ml-0'
          }`}
        >
          <nav className="p-3 space-y-1 h-full flex flex-col overflow-y-auto">
            <div className="flex-1 space-y-1">
              {sidebarItems.map((item) => {
                // Only show admin items if user is super admin
                if (item.admin && !user?.is_super_admin) return null;

                return (
                  <Permission key={item.url} permission={item.permission}>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon
                            className={`h-5 w-5 transition-transform duration-200 ${
                              isActive ? '' : 'group-hover:scale-110'
                            }`}
                          />
                          <span className="truncate">{item.title}</span>
                        </>
                      )}
                    </NavLink>
                  </Permission>
                );
              })}
            </div>

            {/* Sidebar Footer */}
            <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                <p className="font-semibold mb-1 text-gray-900 dark:text-gray-100">{user?.email}</p>
                <p className="truncate text-gray-500 dark:text-gray-400">{user?.company_name || 'AgentConnect'}</p>
              </div>
            </div>
          </nav>
        </aside>

        {/* Main Content with Background */}
        <main className="flex-1 overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors">
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
