
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { BrandingProvider } from "./hooks/BrandingProvider";
import { ThemeProvider } from "./hooks/useTheme";
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
import ClientPortalPage from "./pages/ClientPortalPage";
import NotFound from "./pages/NotFound";
import UserVideoCallPage from "./pages/UserVideoCallPage";
import InternalVideoCallPage from "./pages/InternalVideoCallPage";
import InternalChatPage from "./pages/InternalChatPage";
import VoicesPage from "./pages/VoicesPage";
import VoiceLabPage from "./pages/VoiceLabPage";
import { CompaniesPage } from "./pages/CompaniesPage";
import { useAuth } from "./hooks/useAuth";
import WorkflowBuilderPage from "./pages/WorkflowBuilderPage";
import { LinkedInCallback } from "./pages/LinkedInCallback";
import { AgentKnowledgePage } from "./pages/AgentKnowledgePage";
import { AgentPromptPage } from "./pages/AgentPromptPage";
import { AgentToolsPage } from "./pages/AgentToolsPage";
import { AgentWebhooksPage } from "./pages/AgentWebhooksPage";
import { AgentCredentialsPage } from "./pages/AgentCredentialsPage";
import GoogleCallback from "./pages/GoogleCallback";
import PublishedPreviewPage from "./pages/PublishedPreviewPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import AIImageGeneratorPage from "./pages/AIImageGeneratorPage";
import AIImageGalleryPage from "./pages/AIImageGalleryPage";
import AIChatPage from "./pages/AIChatPage";
import AIToolsPage from "./pages/AIToolsPage";
import AIToolCreatePage from "./pages/AIToolCreatePage";
import AIToolDetailPage from "./pages/AIToolDetailPage";
import AIToolEditPage from "./pages/AIToolEditPage";
import KnowledgeBaseProcessing from "./pages/KnowledgeBaseProcessing";
import KnowledgeBaseDetailPage from "./pages/KnowledgeBaseDetailPage";
import {
  KBContentTypeCreatePage,
  KBContentTypeEditPage,
  KBContentItemsListPage,
  KBContentItemCreatePage,
  KBContentItemEditPage,
} from "./pages/KnowledgeBaseCMS";
import { ObjectDetectionPage } from "./pages/ObjectDetectionPage";
import ErrorBoundary from "./components/ErrorBoundary";
// CRM Pages
import CRMDashboard from "./pages/CRM/CRMDashboard";
import LeadsPage from "./pages/CRM/LeadsPage";
import LeadDetailPage from "./pages/CRM/LeadDetailPage";
import ContactsPage from "./pages/CRM/ContactsPage";
import CampaignsPage from "./pages/CRM/CampaignsPage";
import CampaignCreatePage from "./pages/CRM/CampaignCreatePage";
import CampaignDetailPage from "./pages/CRM/CampaignDetailPage";
import CampaignEditPage from "./pages/CRM/CampaignEditPage";
import AnalyticsPage from "./pages/CRM/AnalyticsPage";
import TagsPage from "./pages/CRM/TagsPage";
import SegmentsPage from "./pages/CRM/SegmentsPage";
import TemplatesPage from "./pages/CRM/TemplatesPage";
import TemplateEditorPage from "./pages/CRM/TemplateEditorPage";
import MessageTemplatesPage from "./pages/MessageTemplatesPage";
import { AcceptInvitationPage } from "./pages/AcceptInvitationPage";
// CMS Pages
import {
  CMSDashboardPage,
  ContentTypesPage,
  ContentTypeCreatePage,
  ContentTypeEditPage,
  ContentItemsPage,
  ContentItemCreatePage,
  ContentItemEditPage,
  MediaLibraryPage,
  CategoriesPage,
  MarketplacePage,
  CMSSettingsPage,
} from "./pages/CMS";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 401 (unauthorized) errors
        if (error?.message === 'Unauthorized' || error?.status === 401) {
          return false;
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/accept-invite" element={<AcceptInvitationPage />} />
      <Route path="/preview/:publishId" element={<PublishedPreviewPage mode="widget" />} />
      <Route path="/chat/:publishId" element={<PublishedPreviewPage mode="fullpage" />} />
      <Route path="/embed/:publishId" element={<PublishedPreviewPage mode="iframe" />} />
      <Route path="/dashboard" element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard/conversations" replace />} />
          <Route path="conversations" element={<ConversationsPage />} />
          <Route path="internal-chat" element={<InternalChatPage />} />
          <Route path="agents" element={<AgentsPage />} />
          <Route path="builder" element={<BuilderPage />} />
          <Route path="builder/:agentId" element={<BuilderPage />} />
          <Route path="builder/:agentId/prompt" element={<AgentPromptPage />} />
          <Route path="builder/:agentId/tools" element={<AgentToolsPage />} />
          <Route path="builder/:agentId/knowledge" element={<AgentKnowledgePage />} />
          <Route path="builder/:agentId/webhooks" element={<AgentWebhooksPage />} />
          <Route path="builder/:agentId/credentials" element={<AgentCredentialsPage />} />
          <Route path="designer" element={<DesignerPage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="team-chat" element={<InternalChatPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="vault" element={<VaultPage />} />
          <Route path="knowledge-base" element={<KnowledgeBaseListPage />} />
          <Route path="tools" element={<ToolManagementPage />} />
          <Route path="knowledge-base/manage" element={<KnowledgeBaseManagementPage />} />
          <Route path="knowledge-base/processing" element={<KnowledgeBaseProcessing />} />
          {/* Knowledge Base Detail with CMS Integration */}
          <Route path="knowledge-base/:id" element={<KnowledgeBaseDetailPage />} />
          <Route path="knowledge-base/:id/content/types/new" element={<KBContentTypeCreatePage />} />
          <Route path="knowledge-base/:id/content/types/:slug" element={<KBContentTypeEditPage />} />
          <Route path="knowledge-base/:id/content/:typeSlug" element={<KBContentItemsListPage />} />
          <Route path="knowledge-base/:id/content/:typeSlug/new" element={<KBContentItemCreatePage />} />
          <Route path="knowledge-base/:id/content/:typeSlug/:itemId" element={<KBContentItemEditPage />} />
          <Route path="workflows" element={<WorkflowManagementPage />} />
          <Route path="workflows/:workflowId" element={<WorkflowBuilderPage />} />
          <Route path="voices" element={<VoicesPage />} />
          <Route path="voice-lab" element={<VoiceLabPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="billing" element={<ClientBillingPage />} />
          <Route path="users" element={<TeamPage />} />
          {user?.is_super_admin && <Route path="companies" element={<CompaniesPage />} />}
          <Route path="admin/subscriptions" element={<SubscriptionManagementPage />} />
          <Route path="ai-image-generator" element={<AIImageGeneratorPage />} />
          <Route path="ai-image-gallery" element={<AIImageGalleryPage />} />
          <Route path="ai-chat" element={<AIChatPage />} />
          <Route path="ai-tools" element={<AIToolsPage />} />
          <Route path="ai-tools/new" element={<AIToolCreatePage />} />
          <Route path="ai-tools/:id" element={<AIToolDetailPage />} />
          <Route path="ai-tools/:id/edit" element={<AIToolEditPage />} />
          <Route path="object-detection" element={<ObjectDetectionPage />} />
          {/* CRM Routes */}
          <Route path="crm" element={<CRMDashboard />} />
          <Route path="crm/leads" element={<LeadsPage />} />
          <Route path="crm/leads/:id" element={<LeadDetailPage />} />
          <Route path="crm/contacts" element={<ContactsPage />} />
          <Route path="crm/campaigns" element={<CampaignsPage />} />
          <Route path="crm/campaigns/new" element={<CampaignCreatePage />} />
          <Route path="crm/campaigns/:id" element={<CampaignDetailPage />} />
          <Route path="crm/campaigns/:id/edit" element={<CampaignEditPage />} />
          <Route path="crm/tags" element={<TagsPage />} />
          <Route path="crm/segments" element={<SegmentsPage />} />
          <Route path="crm/templates" element={<TemplatesPage />} />
          <Route path="crm/templates/:id" element={<TemplateEditorPage />} />
          <Route path="message-templates" element={<MessageTemplatesPage />} />
          <Route path="crm/analytics" element={<AnalyticsPage />} />
          {/* CMS Routes */}
          <Route path="cms" element={<CMSDashboardPage />} />
          <Route path="cms/types" element={<ContentTypesPage />} />
          <Route path="cms/types/new" element={<ContentTypeCreatePage />} />
          <Route path="cms/types/:slug" element={<ContentTypeEditPage />} />
          <Route path="cms/content/:typeSlug" element={<ContentItemsPage />} />
          <Route path="cms/content/:typeSlug/new" element={<ContentItemCreatePage />} />
          <Route path="cms/content/:typeSlug/:id" element={<ContentItemEditPage />} />
          <Route path="cms/media" element={<MediaLibraryPage />} />
          <Route path="cms/categories" element={<CategoriesPage />} />
          <Route path="cms/marketplace" element={<MarketplacePage />} />
          <Route path="cms/settings" element={<CMSSettingsPage />} />
        </Route>
      </Route>
      <Route path="/client-portal" element={<ProtectedRoute />}>
        <Route index element={<ClientPortalPage />} />
      </Route>
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="/video-call" element={<UserVideoCallPage />} />
      <Route path="/internal-video-call" element={<InternalVideoCallPage />} />
      <Route path="/linkedin-callback" element={<LinkedInCallback />} />
      <Route path="/google/callback" element={<GoogleCallback />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <BrandingProvider>
                <AppRoutes />
              </BrandingProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
