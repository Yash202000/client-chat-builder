
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { BrandingProvider } from "./hooks/BrandingProvider";
import { ThemeProvider } from "./hooks/useTheme";
import { VideoCallProvider } from "./contexts/VideoCallContext";
import { PersonalizationProvider } from "./contexts/PersonalizationContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { OnboardingPage } from "./pages/OnboardingPage";
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
import LicenseErrorPage from "./pages/LicenseErrorPage";
import UserVideoCallPage from "./pages/UserVideoCallPage";
import InternalVideoCallPage from "./pages/InternalVideoCallPage";
import InternalChatPage from "./pages/InternalChatPage";
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
import ErrorBoundary from "./components/ErrorBoundary";
import ContactHubPage from "./pages/ContactHubPage";
// CRM Pages
import CRMDashboard from "./pages/CRM/CRMDashboard";
import LeadsPage from "./pages/CRM/LeadsPage";
import LeadDetailPage from "./pages/CRM/LeadDetailPage";
import ContactsPage from "./pages/CRM/ContactsPage";
import DealsPage from "./pages/CRM/DealsPage";
import DealDetailPage from "./pages/CRM/DealDetailPage";
import AccountsPage from "./pages/CRM/AccountsPage";
import AccountDetailPage from "./pages/CRM/AccountDetailPage";
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
import EmailInboxPage from "./pages/EmailInboxPage";
import SMSInboxPage from "./pages/SMSInboxPage";
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
// Social / Marketing Hub Pages
import SocialHubPage from "./pages/Social/SocialHubPage";
import PostComposerPage from "./pages/Social/PostComposerPage";
import TrendingPostsPage from "./pages/Social/TrendingPostsPage";
import SocialAccountsPage from "./pages/Social/SocialAccountsPage";
import SocialAnalyticsPage from "./pages/Social/SocialAnalyticsPage";
import LinkedInLeadsPage from "./pages/CRM/LinkedInLeadsPage";
import BookingLinksPage from "./pages/CRM/BookingLinksPage";
import BookingPage from "./pages/BookingPage";
import SequencesPage from "./pages/CRM/SequencesPage";
import SequenceEditorPage from "./pages/CRM/SequenceEditorPage";
import FormsPage from "./pages/CRM/FormsPage";
import FormEditorPage from "./pages/CRM/FormEditorPage";
import PublicFormPage from "./pages/PublicFormPage";
import CallQueuePage from "./pages/CallQueuePage";
import VoiceCallLogPage from "./pages/VoiceCallLogPage";
import SupervisorDashboardPage from "./pages/SupervisorDashboardPage";
import CallAnalyticsPage from "./pages/CallAnalyticsPage";
import DialerPage from "./pages/DialerPage";
import CalendarPage from "./pages/CalendarPage";
import DrivePage from "./pages/DrivePage";
import AuditLogsPage from "./pages/AuditLogsPage";

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
      <Route path="/license-error" element={<LicenseErrorPage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/accept-invite" element={<AcceptInvitationPage />} />
      <Route path="/preview/:publishId" element={<PublishedPreviewPage mode="widget" />} />
      <Route path="/chat/:publishId" element={<PublishedPreviewPage mode="fullpage" />} />
      <Route path="/embed/:publishId" element={<PublishedPreviewPage mode="iframe" />} />
      <Route path="/book/:slug" element={<BookingPage />} />
      <Route path="/f/:slug" element={<PublicFormPage />} />
      <Route path="/dashboard" element={<ProtectedRoute />}>
        <Route path="onboarding" element={<OnboardingPage />} />
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="conversations" element={<ConversationsPage channel="web_chat" />} />
          <Route path="inbox/whatsapp" element={<ConversationsPage channel="whatsapp" />} />
          <Route path="inbox/instagram" element={<ConversationsPage channel="instagram" />} />
          <Route path="inbox/messenger" element={<ConversationsPage channel="messenger" />} />
          <Route path="inbox/telegram" element={<ConversationsPage channel="telegram" />} />
          <Route path="inbox/twilio" element={<ConversationsPage channel="twilio_voice" />} />
          <Route path="inbox/api" element={<ConversationsPage channel="api" />} />
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
          <Route path="knowledge-base" element={<Navigate to="/dashboard/knowledge-base/manage" replace />} />
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
          <Route path="profile" element={<ProfilePage />} />
          <Route path="billing" element={<ClientBillingPage />} />
          {user?.is_super_admin && <Route path="companies" element={<CompaniesPage />} />}
          <Route path="admin/subscriptions" element={<SubscriptionManagementPage />} />
          <Route path="ai-image-generator" element={<AIImageGeneratorPage />} />
          <Route path="ai-image-gallery" element={<AIImageGalleryPage />} />
          <Route path="ai-chat" element={<AIChatPage />} />
          <Route path="ai-tools" element={<AIToolsPage />} />
          <Route path="ai-tools/new" element={<AIToolCreatePage />} />
          <Route path="ai-tools/:id" element={<AIToolDetailPage />} />
          <Route path="ai-tools/:id/edit" element={<AIToolEditPage />} />
          <Route path="contacts" element={<ContactHubPage />} />
          {/* CRM Routes */}
          <Route path="crm" element={<CRMDashboard />} />
          <Route path="crm/leads" element={<LeadsPage />} />
          <Route path="crm/leads/:id" element={<LeadDetailPage />} />
          <Route path="crm/contacts" element={<ContactsPage />} />
          <Route path="crm/deals" element={<DealsPage />} />
          <Route path="crm/deals/:id" element={<DealDetailPage />} />
          <Route path="crm/accounts" element={<AccountsPage />} />
          <Route path="crm/accounts/:id" element={<AccountDetailPage />} />
          <Route path="crm/campaigns" element={<CampaignsPage />} />
          <Route path="crm/campaigns/new" element={<CampaignCreatePage />} />
          <Route path="crm/campaigns/:id" element={<CampaignDetailPage />} />
          <Route path="crm/campaigns/:id/edit" element={<CampaignEditPage />} />
          <Route path="crm/tags" element={<TagsPage />} />
          <Route path="crm/segments" element={<SegmentsPage />} />
          <Route path="crm/templates" element={<TemplatesPage />} />
          <Route path="crm/templates/:id" element={<TemplateEditorPage />} />
          <Route path="message-templates" element={<MessageTemplatesPage />} />
          <Route path="inbox/email" element={<EmailInboxPage />} />
          <Route path="inbox/sms" element={<SMSInboxPage />} />
          <Route path="call-queue" element={<CallQueuePage />} />
          <Route path="voice-calls" element={<VoiceCallLogPage />} />
          <Route path="supervisor" element={<SupervisorDashboardPage />} />
          <Route path="call-analytics" element={<CallAnalyticsPage />} />
          <Route path="dialer" element={<DialerPage />} />
          <Route path="crm/analytics" element={<AnalyticsPage />} />
          <Route path="crm/linkedin-leads" element={<LinkedInLeadsPage />} />
          <Route path="crm/booking-links" element={<BookingLinksPage />} />
          <Route path="crm/sequences" element={<SequencesPage />} />
          <Route path="crm/sequences/:id" element={<SequenceEditorPage />} />
          <Route path="crm/forms" element={<FormsPage />} />
          <Route path="crm/forms/:id" element={<FormEditorPage />} />
          {/* Marketing Hub / Social Routes */}
          <Route path="social" element={<SocialHubPage />} />
          <Route path="social/compose" element={<PostComposerPage />} />
          <Route path="social/calendar" element={<Navigate to="/dashboard/calendar" replace />} />
          <Route path="social/trending" element={<TrendingPostsPage />} />
          <Route path="social/accounts" element={<SocialAccountsPage />} />
          <Route path="social/analytics" element={<SocialAnalyticsPage />} />
          {/* Work Calendar */}
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="drive" element={<DrivePage />} />
          {/* Audit Logs */}
          <Route path="audit-logs" element={<AuditLogsPage />} />
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
                <PersonalizationProvider>
                  <VideoCallProvider>
                    <AppRoutes />
                  </VideoCallProvider>
                </PersonalizationProvider>
              </BrandingProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
