
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CircleUser, Moon, Sun, ChevronsLeft, ChevronsRight, PanelLeftClose, PanelLeftOpen } from "lucide-react";
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  console.log("Logged in user:", user);

  const sidebarItems = [
    // Core Operations
    { title: "Active Clients", url: "/dashboard/conversations", icon: Inbox, permission: "conversation:read" },
    { title: "Agents", url: "/dashboard/agents", icon: Bot, permission: "agent:read" },
    { title: "Agent Builder", url: "/dashboard/builder", icon: Settings, permission: "agent:update" },
    { title: "Widget Designer", url: "/dashboard/designer", icon: Palette, permission: "company_settings:update" },

    // Analytics & Monitoring
    { title: "Reports", url: "/dashboard/reports", icon: BarChart3, permission: "analytics:read" },

    // Configuration & Resources
    { title: "Knowledge Bases", url: "/dashboard/knowledge-base/manage", icon: BookOpen, permission: "knowledgebase:read" },
    { title: "Custom Tools", url: "/dashboard/tools", icon: Zap, permission: "tool:read" },
    { title: "Custom Workflows", url: "/dashboard/workflows", icon: WorkflowIcon, permission: "workflow:read" },
    { title: "Voice Lab", url: "/dashboard/voice-lab", icon: Mic, permission: "voice:create" },

    // Team & Communication
    { title: "Team Management", url: "/dashboard/team", icon: Users, permission: "user:read" },
    { title: "Team Chat", url: "/dashboard/team-chat", icon: MessageSquare, permission: "user:read" },

    // AI Features
    { title: "AI Chat", url: "/dashboard/ai-chat", icon: MessageSquare, permission: "chat:read" },
    { title: "AI Tools", url: "/dashboard/ai-tools", icon: Sparkles, permission: "ai-tool:read" },
    { title: "AI Image Generator", url: "/dashboard/ai-image-generator", icon: Sparkles, permission: "image:create" },
    { title: "AI Image Gallery", url: "/dashboard/ai-image-gallery", icon: FileText, permission: "image:read" },
    { title: "Vision AI", url: "/dashboard/object-detection", icon: Sparkles, permission: "image:create" },

    // System & Administration
    { title: "Settings", url: "/dashboard/settings", icon: FileText, permission: "company_settings:update" },
    { title: "API Vault", url: "/dashboard/vault", icon: Key, permission: "company_settings:update" },
    { title: "Billing", url: "/dashboard/billing", icon: CreditCard, permission: "billing:manage" },
    { title: "Manage Plans", url: "/dashboard/admin/subscriptions", icon: Sparkles, admin: true },
    { title: "Companies", url: "/dashboard/companies", icon: Building, admin: true },
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

              {/* User Info Card with Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hidden lg:flex items-center gap-3 px-4 py-2 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:from-slate-100 hover:to-slate-200 dark:hover:from-slate-700 dark:hover:to-slate-800 transition-all duration-200 cursor-pointer">
                    <div className="flex flex-col items-end">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                        {user?.email}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-tight">
                        {user?.company_name || 'AgentConnect'}
                      </p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-md ring-2 ring-white dark:ring-slate-700">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.email}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.company_name || 'AgentConnect'}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-2">
                    <p className="text-xs font-medium text-muted-foreground mb-2 px-2">Status</p>
                    <PresenceSelector currentStatus={user?.presence_status} showLabel={true} />
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <NavLink to="/dashboard/profile">Profile</NavLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile User Menu - Show icon on mobile only */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon" className="rounded-full lg:hidden">
                    <CircleUser className="h-5 w-5" />
                    <span className="sr-only">Toggle user menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.email}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.company_name || 'AgentConnect'}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-2">
                    <p className="text-xs font-medium text-muted-foreground mb-2 px-2">Status</p>
                    <PresenceSelector currentStatus={user?.presence_status} showLabel={true} />
                  </div>
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
          className={`flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 relative ${
            sidebarOpen ? '' : '-ml-64 lg:ml-0'
          } ${sidebarCollapsed ? 'w-16' : 'w-64'}`}
        >
          {/* Collapse/Expand Button for Desktop */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex absolute -right-3 top-8 z-20 bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110 group"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            ) : (
              <PanelLeftClose className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
            )}
          </button>

          <nav className={`p-3 space-y-1 h-full flex flex-col overflow-y-auto ${sidebarCollapsed ? 'items-center' : ''}`}>
            <div className="flex-1 space-y-1">
              {sidebarItems.map((item) => {
                // Only show admin items if user is super admin
                if (item.admin && !user?.is_super_admin) return null;

                return (
                  <Permission key={item.url} permission={item.permission}>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center rounded-lg text-sm font-medium transition-all duration-200 group ${
                          sidebarCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
                        } ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                        }`
                      }
                      title={sidebarCollapsed ? item.title : undefined}
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon
                            className={`h-5 w-5 transition-transform duration-200 ${
                              isActive ? '' : 'group-hover:scale-110'
                            } ${sidebarCollapsed ? 'flex-shrink-0' : ''}`}
                          />
                          {!sidebarCollapsed && <span className="truncate">{item.title}</span>}
                        </>
                      )}
                    </NavLink>
                  </Permission>
                );
              })}
            </div>
          </nav>
        </aside>

        {/* Main Content with Background */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 transition-colors">
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
