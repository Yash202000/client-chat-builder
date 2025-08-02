
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { DashboardPage } from "./pages/DashboardPage";
import Index from "./pages/Index";
import AppLayout from "./components/AppLayout";
import ConversationsPage from "./pages/ConversationsPage";
import AgentsPage from "./pages/AgentsPage";
import BuilderPage from "./pages/BuilderPage";
import DesignerPage from "./pages/DesignerPage";
import TeamPage from "./pages/TeamPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import VaultPage from "./pages/VaultPage";
import KnowledgeBaseListPage from "./pages/KnowledgeBaseListPage";
import ToolManagementPage from "./pages/ToolManagementPage";
import KnowledgeBaseManagementPage from "./pages/KnowledgeBaseManagementPage";
import WorkflowManagementPage from "./pages/WorkflowManagementPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SubscriptionManagementPage } from "./pages/SubscriptionManagementPage";
import ClientBillingPage from "./pages/ClientBillingPage";
import { UserManagementPage } from "./pages/UserManagementPage";
import ClientPortalPage from "./pages/ClientPortalPage";
import NotFound from "./pages/NotFound";
import UserVideoCallPage from "./pages/UserVideoCallPage";
import VoicesPage from "./pages/VoicesPage";
import VoiceLabPage from "./pages/VoiceLabPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/dashboard" element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route index element={<Navigate to="/dashboard/conversations" replace />} />
                <Route path="conversations" element={<ConversationsPage />} />
                <Route path="agents" element={<AgentsPage />} />
                <Route path="builder" element={<BuilderPage />} />
                <Route path="builder/:agentId" element={<BuilderPage />} />
                <Route path="designer" element={<DesignerPage />} />
                <Route path="team" element={<TeamPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="vault" element={<VaultPage />} />
                <Route path="knowledge-base" element={<KnowledgeBaseListPage />} />
                <Route path="tools" element={<ToolManagementPage />} />
                <Route path="knowledge-base/manage" element={<KnowledgeBaseManagementPage />} />
                <Route path="workflows" element={<WorkflowManagementPage />} />
                <Route path="voices" element={<VoicesPage />} />
                <Route path="voice-lab" element={<VoiceLabPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="billing" element={<ClientBillingPage />} />
                <Route path="users" element={<UserManagementPage />} />
                <Route path="admin/subscriptions" element={<SubscriptionManagementPage />} />
              </Route>
            </Route>
            <Route path="/client-portal" element={<ProtectedRoute />}>
              <Route index element={<ClientPortalPage />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="/video-call" element={<UserVideoCallPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
