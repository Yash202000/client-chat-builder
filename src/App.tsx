import { lazy, Suspense } from "react";
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
import { useAuth } from "./hooks/useAuth";
import ErrorBoundary from "./components/ErrorBoundary";
import { CookieConsentBanner } from "./components/CookieConsentBanner";

// ─── Lazy: ALL pages — main.js is now just the app shell ─────────────────────
// Marketing + SEO pages (tiny chunks, near-instant load)
const Index             = lazy(() => import("./pages/Index"));
const LoginPage         = lazy(() => import("./pages/LoginPage").then(m => ({ default: m.LoginPage })));
const SignupPage        = lazy(() => import("./pages/SignupPage").then(m => ({ default: m.SignupPage })));
const PrivacyPolicy     = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService    = lazy(() => import("./pages/TermsOfService"));
const CookiePolicyPage  = lazy(() => import("./pages/CookiePolicyPage"));
const SecurityPage      = lazy(() => import("./pages/SecurityPage"));
const FeaturesPage      = lazy(() => import("./pages/FeaturesPage"));
const PricingPage       = lazy(() => import("./pages/PricingPage"));
const UseCasesPage      = lazy(() => import("./pages/UseCasesPage"));
const UseCaseDetailPage = lazy(() => import("./pages/UseCaseDetailPage"));
const BlogListPage      = lazy(() => import("./pages/BlogListPage"));
const BlogPostPage      = lazy(() => import("./pages/BlogPostPage"));
const NotFound          = lazy(() => import("./pages/NotFound"));

// Auth callbacks & misc public pages
const LicenseErrorPage      = lazy(() => import("./pages/LicenseErrorPage"));
const AcceptInvitationPage  = lazy(() => import("./pages/AcceptInvitationPage").then(m => ({ default: m.AcceptInvitationPage })));
const LinkedInCallback      = lazy(() => import("./pages/LinkedInCallback").then(m => ({ default: m.LinkedInCallback })));
const GoogleCallback        = lazy(() => import("./pages/GoogleCallback"));
const PublishedPreviewPage  = lazy(() => import("./pages/PublishedPreviewPage"));
const BookingPage           = lazy(() => import("./pages/BookingPage"));
const PublicFormPage        = lazy(() => import("./pages/PublicFormPage"));
const UserVideoCallPage     = lazy(() => import("./pages/UserVideoCallPage"));
const InternalVideoCallPage = lazy(() => import("./pages/InternalVideoCallPage"));

// ─── Lazy: Dashboard shell ────────────────────────────────────────────────────
const AppLayout             = lazy(() => import("./components/AppLayout"));
const OnboardingPage        = lazy(() => import("./pages/OnboardingPage").then(m => ({ default: m.OnboardingPage ?? m.default })));
const ClientPortalPage      = lazy(() => import("./pages/ClientPortalPage"));

// ─── Lazy: Dashboard core ─────────────────────────────────────────────────────
const DashboardPage             = lazy(() => import("./pages/DashboardPage").then(m => ({ default: m.DashboardPage ?? m.default })));
const ConversationsPage         = lazy(() => import("./pages/ConversationsPage"));
const AgentsPage                = lazy(() => import("./pages/AgentsPage"));
const BuilderPage               = lazy(() => import("./pages/BuilderPage"));
const DesignerPage              = lazy(() => import("./pages/DesignerPage"));
const TeamPage                  = lazy(() => import("./pages/TeamPage"));
const ReportsPage               = lazy(() => import("./pages/ReportsPage"));
const SettingsPage              = lazy(() => import("./pages/SettingsPage"));
const VaultPage                 = lazy(() => import("./pages/VaultPage"));
const ProfilePage               = lazy(() => import("./pages/ProfilePage").then(m => ({ default: m.ProfilePage })));
const ClientBillingPage         = lazy(() => import("./pages/ClientBillingPage"));
const CompaniesPage             = lazy(() => import("./pages/CompaniesPage").then(m => ({ default: m.CompaniesPage })));
const SubscriptionManagementPage = lazy(() => import("./pages/SubscriptionManagementPage").then(m => ({ default: m.SubscriptionManagementPage })));
const InternalChatPage          = lazy(() => import("./pages/InternalChatPage"));
const ContactHubPage            = lazy(() => import("./pages/ContactHubPage"));
const CalendarPage              = lazy(() => import("./pages/CalendarPage"));
const DrivePage                 = lazy(() => import("./pages/DrivePage"));
const AuditLogsPage             = lazy(() => import("./pages/AuditLogsPage"));
const MessageTemplatesPage      = lazy(() => import("./pages/MessageTemplatesPage"));
const EmailInboxPage            = lazy(() => import("./pages/EmailInboxPage"));
const SMSInboxPage              = lazy(() => import("./pages/SMSInboxPage"));

// ─── Lazy: Builder sub-pages ──────────────────────────────────────────────────
const AgentPromptPage       = lazy(() => import("./pages/AgentPromptPage").then(m => ({ default: m.AgentPromptPage })));
const AgentToolsPage        = lazy(() => import("./pages/AgentToolsPage").then(m => ({ default: m.AgentToolsPage })));
const AgentKnowledgePage    = lazy(() => import("./pages/AgentKnowledgePage").then(m => ({ default: m.AgentKnowledgePage })));
const AgentWebhooksPage     = lazy(() => import("./pages/AgentWebhooksPage").then(m => ({ default: m.AgentWebhooksPage })));
const AgentCredentialsPage  = lazy(() => import("./pages/AgentCredentialsPage").then(m => ({ default: m.AgentCredentialsPage })));

// ─── Lazy: Workflow ───────────────────────────────────────────────────────────
const WorkflowManagementPage = lazy(() => import("./pages/WorkflowManagementPage"));
const WorkflowBuilderPage    = lazy(() => import("./pages/WorkflowBuilderPage"));

// ─── Lazy: Knowledge Base ─────────────────────────────────────────────────────
const KnowledgeBaseListPage       = lazy(() => import("./pages/KnowledgeBaseListPage"));
const KnowledgeBaseManagementPage = lazy(() => import("./pages/KnowledgeBaseManagementPage"));
const KnowledgeBaseProcessing     = lazy(() => import("./pages/KnowledgeBaseProcessing"));
const KnowledgeBaseDetailPage     = lazy(() => import("./pages/KnowledgeBaseDetailPage"));
const ToolManagementPage          = lazy(() => import("./pages/ToolManagementPage"));
const KBContentTypeCreatePage     = lazy(() => import("./pages/KnowledgeBaseCMS").then(m => ({ default: m.KBContentTypeCreatePage })));
const KBContentTypeEditPage       = lazy(() => import("./pages/KnowledgeBaseCMS").then(m => ({ default: m.KBContentTypeEditPage })));
const KBContentItemsListPage      = lazy(() => import("./pages/KnowledgeBaseCMS").then(m => ({ default: m.KBContentItemsListPage })));
const KBContentItemCreatePage     = lazy(() => import("./pages/KnowledgeBaseCMS").then(m => ({ default: m.KBContentItemCreatePage })));
const KBContentItemEditPage       = lazy(() => import("./pages/KnowledgeBaseCMS").then(m => ({ default: m.KBContentItemEditPage })));

// ─── Lazy: AI tools ───────────────────────────────────────────────────────────
const AIImageGeneratorPage = lazy(() => import("./pages/AIImageGeneratorPage"));
const AIImageGalleryPage   = lazy(() => import("./pages/AIImageGalleryPage"));
const AIChatPage           = lazy(() => import("./pages/AIChatPage"));
const AIToolsPage          = lazy(() => import("./pages/AIToolsPage"));
const AIToolCreatePage     = lazy(() => import("./pages/AIToolCreatePage"));
const AIToolDetailPage     = lazy(() => import("./pages/AIToolDetailPage"));
const AIToolEditPage       = lazy(() => import("./pages/AIToolEditPage"));

// ─── Lazy: Tickets ───────────────────────────────────────────────────────────
const TicketProjectsPage    = lazy(() => import("./pages/Tickets/ProjectsPage"));
const TicketBoardPage       = lazy(() => import("./pages/Tickets/TicketBoardPage"));
const TicketListPage        = lazy(() => import("./pages/Tickets/TicketListPage"));
const TicketDetailPage      = lazy(() => import("./pages/Tickets/TicketDetailPage"));
const WorkflowEditorPage    = lazy(() => import("./pages/Tickets/WorkflowEditorPage"));
const TicketAnalyticsPage   = lazy(() => import("./pages/Tickets/TicketAnalyticsPage"));
const TicketBacklogPage     = lazy(() => import("./pages/Tickets/TicketBacklogPage"));

// ─── Lazy: CRM ───────────────────────────────────────────────────────────────
const CRMDashboard       = lazy(() => import("./pages/CRM/CRMDashboard"));
const LeadsPage          = lazy(() => import("./pages/CRM/LeadsPage"));
const LeadDetailPage     = lazy(() => import("./pages/CRM/LeadDetailPage"));
const ContactsPage       = lazy(() => import("./pages/CRM/ContactsPage"));
const DealsPage          = lazy(() => import("./pages/CRM/DealsPage"));
const DealDetailPage     = lazy(() => import("./pages/CRM/DealDetailPage"));
const AccountsPage       = lazy(() => import("./pages/CRM/AccountsPage"));
const AccountDetailPage  = lazy(() => import("./pages/CRM/AccountDetailPage"));
const CampaignsPage      = lazy(() => import("./pages/CRM/CampaignsPage"));
const CampaignCreatePage = lazy(() => import("./pages/CRM/CampaignCreatePage"));
const CampaignDetailPage = lazy(() => import("./pages/CRM/CampaignDetailPage"));
const CampaignEditPage   = lazy(() => import("./pages/CRM/CampaignEditPage"));
const AnalyticsPage      = lazy(() => import("./pages/CRM/AnalyticsPage"));
const TagsPage           = lazy(() => import("./pages/CRM/TagsPage"));
const SegmentsPage       = lazy(() => import("./pages/CRM/SegmentsPage"));
const TemplatesPage      = lazy(() => import("./pages/CRM/TemplatesPage"));
const TemplateEditorPage = lazy(() => import("./pages/CRM/TemplateEditorPage"));
const LinkedInLeadsPage  = lazy(() => import("./pages/CRM/LinkedInLeadsPage"));
const BookingLinksPage   = lazy(() => import("./pages/CRM/BookingLinksPage"));
const SequencesPage      = lazy(() => import("./pages/CRM/SequencesPage"));
const SequenceEditorPage = lazy(() => import("./pages/CRM/SequenceEditorPage"));
const FormsPage          = lazy(() => import("./pages/CRM/FormsPage"));
const FormEditorPage     = lazy(() => import("./pages/CRM/FormEditorPage"));

// ─── Lazy: Call centre ────────────────────────────────────────────────────────
const CallQueuePage          = lazy(() => import("./pages/CallQueuePage"));
const VoiceCallLogPage       = lazy(() => import("./pages/VoiceCallLogPage"));
const SupervisorDashboardPage = lazy(() => import("./pages/SupervisorDashboardPage"));
const CallAnalyticsPage      = lazy(() => import("./pages/CallAnalyticsPage"));
const DialerPage             = lazy(() => import("./pages/DialerPage"));

// ─── Lazy: CMS ───────────────────────────────────────────────────────────────
const CMSDashboardPage    = lazy(() => import("./pages/CMS").then(m => ({ default: m.CMSDashboardPage })));
const ContentTypesPage    = lazy(() => import("./pages/CMS").then(m => ({ default: m.ContentTypesPage })));
const ContentTypeCreatePage = lazy(() => import("./pages/CMS").then(m => ({ default: m.ContentTypeCreatePage })));
const ContentTypeEditPage = lazy(() => import("./pages/CMS").then(m => ({ default: m.ContentTypeEditPage })));
const ContentItemsPage    = lazy(() => import("./pages/CMS").then(m => ({ default: m.ContentItemsPage })));
const ContentItemCreatePage = lazy(() => import("./pages/CMS").then(m => ({ default: m.ContentItemCreatePage })));
const ContentItemEditPage = lazy(() => import("./pages/CMS").then(m => ({ default: m.ContentItemEditPage })));
const MediaLibraryPage    = lazy(() => import("./pages/CMS").then(m => ({ default: m.MediaLibraryPage })));
const CategoriesPage      = lazy(() => import("./pages/CMS").then(m => ({ default: m.CategoriesPage })));
const MarketplacePage     = lazy(() => import("./pages/CMS").then(m => ({ default: m.MarketplacePage })));
const CMSSettingsPage     = lazy(() => import("./pages/CMS").then(m => ({ default: m.CMSSettingsPage })));

// ─── Lazy: Social / Marketing Hub ────────────────────────────────────────────
const SocialHubPage      = lazy(() => import("./pages/Social/SocialHubPage"));
const PostComposerPage   = lazy(() => import("./pages/Social/PostComposerPage"));
const TrendingPostsPage  = lazy(() => import("./pages/Social/TrendingPostsPage"));
const SocialAccountsPage = lazy(() => import("./pages/Social/SocialAccountsPage"));
const SocialAnalyticsPage = lazy(() => import("./pages/Social/SocialAnalyticsPage"));

// ─── Suspense fallback ────────────────────────────────────────────────────────
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-slate-400">Loading…</p>
    </div>
  </div>
);

// ─── Query client ─────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: (failureCount, error: any) => {
        if (error?.message === "Unauthorized" || error?.status === 401) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});

// ─── Routes ───────────────────────────────────────────────────────────────────
const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ── Public / marketing (eager — load instantly, SEO critical) ── */}
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/use-cases" element={<UseCasesPage />} />
        <Route path="/use-cases/:slug" element={<UseCaseDetailPage />} />
        <Route path="/blog" element={<BlogListPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/cookie-policy" element={<CookiePolicyPage />} />
        <Route path="/security" element={<SecurityPage />} />

        {/* ── Public / misc (lazy) ── */}
        <Route path="/license-error" element={<LicenseErrorPage />} />
        <Route path="/accept-invite" element={<AcceptInvitationPage />} />
        <Route path="/preview/:publishId" element={<PublishedPreviewPage mode="widget" />} />
        <Route path="/chat/:publishId" element={<PublishedPreviewPage mode="fullpage" />} />
        <Route path="/embed/:publishId" element={<PublishedPreviewPage mode="iframe" />} />
        <Route path="/book/:slug" element={<BookingPage />} />
        <Route path="/f/:slug" element={<PublicFormPage />} />
        <Route path="/video-call" element={<UserVideoCallPage />} />
        <Route path="/internal-video-call" element={<InternalVideoCallPage />} />
        <Route path="/linkedin-callback" element={<LinkedInCallback />} />
        <Route path="/google/callback" element={<GoogleCallback />} />

        {/* ── Dashboard (all lazy) ── */}
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
            {/* Tickets */}
            <Route path="tickets" element={<TicketProjectsPage />} />
            <Route path="tickets/:projectKey/board" element={<TicketBoardPage />} />
            <Route path="tickets/:projectKey/list" element={<TicketListPage />} />
            <Route path="tickets/:projectKey/backlog" element={<TicketBacklogPage />} />
            <Route path="tickets/:projectKey/analytics" element={<TicketAnalyticsPage />} />
            <Route path="tickets/:projectKey/:ticketNumber" element={<TicketDetailPage />} />
            <Route path="tickets/settings/workflows" element={<WorkflowEditorPage />} />
            {/* CRM */}
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
            {/* Social */}
            <Route path="social" element={<SocialHubPage />} />
            <Route path="social/compose" element={<PostComposerPage />} />
            <Route path="social/calendar" element={<Navigate to="/dashboard/calendar" replace />} />
            <Route path="social/trending" element={<TrendingPostsPage />} />
            <Route path="social/accounts" element={<SocialAccountsPage />} />
            <Route path="social/analytics" element={<SocialAnalyticsPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="drive" element={<DrivePage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
            {/* CMS */}
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

        {/* ── Client portal (lazy) ── */}
        <Route path="/client-portal" element={<ProtectedRoute />}>
          <Route index element={<ClientPortalPage />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

// ─── App ──────────────────────────────────────────────────────────────────────
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
                    <CookieConsentBanner />
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
