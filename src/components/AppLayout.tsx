
import { useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Zap, 
  TrendingUp,
  Palette,
  Menu,
  X,
  Key,
  BookOpen
} from "lucide-react";
import { CreateAgentDialog } from "@/components/CreateAgentDialog";

const sidebarItems = [
  { title: "Conversations", url: "/dashboard/conversations", icon: Inbox },
  { title: "Agents", url: "/dashboard/agents", icon: Bot },
  { title: "Agent Builder", url: "/dashboard/builder", icon: Settings },
  { title: "Widget Designer", url: "/dashboard/designer", icon: Palette },
  { title: "Team Management", url: "/dashboard/team", icon: Users },
  { title: "Reports", url: "/dashboard/reports", icon: BarChart3 },
  { title: "Settings", url: "/dashboard/settings", icon: FileText },
  { title: "API Vault", url: "/dashboard/vault", icon: Key },
  { title: "Knowledge Bases", url: "/dashboard/knowledge-bases", icon: BookOpen },
];

const AppLayout = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -right-4 w-72 h-72 bg-gradient-to-br from-purple-300/20 to-pink-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-8 w-64 h-64 bg-gradient-to-br from-blue-300/20 to-cyan-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-8 right-1/3 w-48 h-48 bg-gradient-to-br from-green-300/20 to-emerald-300/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Header with Analytics */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-white/30 sticky top-0 z-50 shadow-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
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
                <div className="p-3 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl shadow-lg animate-scale-in">
                  <MessageSquare className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-900 via-purple-900 to-pink-900 bg-clip-text text-transparent">
                    AgentConnect
                  </h1>
                  <p className="text-sm text-gray-600 font-medium">Enterprise Chat Platform</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-green-600 font-medium">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Live Status
                </div>
              </div>
              <Button 
                onClick={() => setIsCreateDialogOpen(true)} 
                className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Agent
                <Sparkles className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Active Agents</p>
                    <p className="text-2xl font-bold mt-1">12</p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3 text-green-300" />
                      <p className="text-blue-200 text-xs">+2 this week</p>
                    </div>
                  </div>
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Bot className="h-6 w-6 text-blue-100" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Live Conversations</p>
                    <p className="text-2xl font-bold mt-1">247</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Zap className="h-3 w-3 text-yellow-300" />
                      <p className="text-green-200 text-xs">8 websites active</p>
                    </div>
                  </div>
                  <div className="p-2 bg-white/20 rounded-xl">
                    <MessageSquare className="h-6 w-6 text-green-100" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Response Rate</p>
                    <p className="text-2xl font-bold mt-1">98.5%</p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3 text-green-300" />
                      <p className="text-purple-200 text-xs">+5% improvement</p>
                    </div>
                  </div>
                  <div className="p-2 bg-white/20 rounded-xl">
                    <BarChart3 className="h-6 w-6 text-purple-100" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Satisfaction</p>
                    <p className="text-2xl font-bold mt-1">4.9★</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Sparkles className="h-3 w-3 text-yellow-300" />
                      <p className="text-orange-200 text-xs">Average rating</p>
                    </div>
                  </div>
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Settings className="h-6 w-6 text-orange-100" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </header>

      <div className="flex relative z-10">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 overflow-hidden bg-white/80 backdrop-blur-xl border-r border-white/30 shadow-xl`}>
          <nav className="p-4 space-y-2">
            {sidebarItems.map((item) => (
              <NavLink
                key={item.url}
                to={item.url}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-600'
                  }`
                }
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.title}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
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
