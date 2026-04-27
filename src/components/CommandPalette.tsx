import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Command as CommandPrimitive } from 'cmdk';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  Search, Bot, Users, Target, Send, Tag, Layers, LayoutTemplate, Sparkles,
  Zap, BookOpen, Settings, BarChart3, Inbox, Globe, MessageSquare, Phone,
  Headphones, Radio, PhoneCall, CreditCard, Building, Key, TrendingUp,
  Linkedin, Share2, PenLine, CalendarDays, Megaphone, Settings2, Wand2,
  Images, CircleUser, Plus, ArrowRight, Clock, Hash,
  WorkflowIcon as WorkflowIcon, LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePersonalization, RecentEntityType } from '@/contexts/PersonalizationContext';

/* ────────────────────────────────────────────────────────────
   PAGE INDEX — every navigable surface in the app, indexed
   for ⌘K fuzzy search. Mirrors the sidebar but flattened.
   Each entry: { keywords, title, subtitle, icon, route }
   ──────────────────────────────────────────────────────────── */
type PageItem = {
  title: string;
  subtitle?: string;
  route: string;
  icon: React.ElementType;
  keywords: string;
  group: 'inbox' | 'voice' | 'builder' | 'crm' | 'marketing' | 'ai' | 'admin' | 'home';
};

const PAGES: PageItem[] = [
  { title: 'Dashboard',          subtitle: 'Home overview',           route: '/dashboard',                       icon: LayoutDashboard, group: 'home',     keywords: 'home dashboard overview' },
  { title: 'Active Conversations', subtitle: 'Web chat inbox',        route: '/dashboard/conversations',         icon: Globe,           group: 'inbox',    keywords: 'web chat conversations live customers' },
  { title: 'Email Inbox',        subtitle: 'Gmail integration',       route: '/dashboard/inbox/email',           icon: MessageSquare,   group: 'inbox',    keywords: 'email gmail mail inbox' },
  { title: 'SMS Inbox',          subtitle: 'Twilio messaging',        route: '/dashboard/inbox/sms',             icon: MessageSquare,   group: 'inbox',    keywords: 'sms text twilio messages' },
  { title: 'Team Chat',          subtitle: 'Internal channels',       route: '/dashboard/team-chat',             icon: MessageSquare,   group: 'inbox',    keywords: 'team chat internal channels slack' },
  { title: 'Contact Hub',        subtitle: 'All your contacts',       route: '/dashboard/contacts',              icon: Users,           group: 'inbox',    keywords: 'contacts directory people address book' },

  { title: 'Call Queue',         subtitle: 'Live call routing',       route: '/dashboard/call-queue',            icon: Phone,           group: 'voice',    keywords: 'call queue voice phone routing' },
  { title: 'Voice Call Log',     subtitle: 'Past phone calls',        route: '/dashboard/voice-calls',           icon: Phone,           group: 'voice',    keywords: 'voice call log history phone' },
  { title: 'Supervisor',         subtitle: 'Live call monitoring',    route: '/dashboard/supervisor',            icon: Radio,           group: 'voice',    keywords: 'supervisor monitor live calls coaching' },
  { title: 'Predictive Dialer',  subtitle: 'Outbound campaigns',      route: '/dashboard/dialer',                icon: PhoneCall,       group: 'voice',    keywords: 'dialer predictive outbound campaign' },
  { title: 'Call Analytics',     subtitle: 'Voice metrics',           route: '/dashboard/call-analytics',        icon: BarChart3,       group: 'voice',    keywords: 'call analytics voice metrics reports' },

  { title: 'Agents',             subtitle: 'AI agent builder',        route: '/dashboard/agents',                icon: Bot,             group: 'builder',  keywords: 'agents ai bots builder llm' },
  { title: 'Knowledge Base',     subtitle: 'Train your agents',       route: '/dashboard/knowledge-base/manage', icon: BookOpen,        group: 'builder',  keywords: 'knowledge base kb rag documents files train' },
  { title: 'CMS',                subtitle: 'Content management',      route: '/dashboard/cms',                   icon: LayoutTemplate,  group: 'builder',  keywords: 'cms content publish articles' },
  { title: 'Tools',              subtitle: 'Custom integrations',     route: '/dashboard/tools',                 icon: Zap,             group: 'builder',  keywords: 'tools functions actions integrations api' },
  { title: 'Workflows',          subtitle: 'Visual automation',       route: '/dashboard/workflows',             icon: WorkflowIcon,    group: 'builder',  keywords: 'workflows automation visual builder dag' },
  { title: 'Message Templates',  subtitle: 'Reusable messages',       route: '/dashboard/message-templates',     icon: Sparkles,        group: 'builder',  keywords: 'templates messages reusable snippets' },

  { title: 'CRM Dashboard',      subtitle: 'Pipeline overview',       route: '/dashboard/crm',                   icon: TrendingUp,      group: 'crm',      keywords: 'crm dashboard pipeline overview sales' },
  { title: 'Contacts',           subtitle: 'CRM contacts',            route: '/dashboard/crm/contacts',          icon: Users,           group: 'crm',      keywords: 'crm contacts people directory' },
  { title: 'Leads',              subtitle: 'Sales pipeline',          route: '/dashboard/crm/leads',             icon: Target,          group: 'crm',      keywords: 'leads pipeline sales prospects deals' },
  { title: 'Campaigns',          subtitle: 'Multi-channel outreach',  route: '/dashboard/crm/campaigns',         icon: Send,            group: 'crm',      keywords: 'campaigns email sms outreach blast' },
  { title: 'Tags',               subtitle: 'Audience labels',         route: '/dashboard/crm/tags',              icon: Tag,             group: 'crm',      keywords: 'tags labels filter' },
  { title: 'Segments',           subtitle: 'Audience groups',         route: '/dashboard/crm/segments',          icon: Layers,          group: 'crm',      keywords: 'segments audience groups filter' },
  { title: 'CRM Templates',      subtitle: 'Reusable content',        route: '/dashboard/crm/templates',         icon: LayoutTemplate,  group: 'crm',      keywords: 'crm templates email sms reusable' },

  { title: 'Social Hub',         subtitle: 'All social accounts',     route: '/dashboard/social',                icon: Share2,          group: 'marketing', keywords: 'social hub overview accounts marketing' },
  { title: 'Post Composer',      subtitle: 'Create social posts',     route: '/dashboard/social/compose',        icon: PenLine,         group: 'marketing', keywords: 'compose write post social marketing' },
  { title: 'Content Calendar',   subtitle: 'Schedule posts',          route: '/dashboard/social/calendar',       icon: CalendarDays,    group: 'marketing', keywords: 'calendar schedule social posts marketing' },
  { title: 'LinkedIn Leads',     subtitle: 'B2B prospecting',         route: '/dashboard/crm/linkedin-leads',    icon: Linkedin,        group: 'marketing', keywords: 'linkedin leads b2b prospecting outreach' },
  { title: 'Social Analytics',   subtitle: 'Marketing metrics',       route: '/dashboard/social/analytics',      icon: BarChart3,       group: 'marketing', keywords: 'social analytics marketing metrics' },
  { title: 'Social Accounts',    subtitle: 'Connect accounts',        route: '/dashboard/social/accounts',       icon: Settings2,       group: 'marketing', keywords: 'social accounts connect linkedin twitter' },

  { title: 'AI Chat',            subtitle: 'AI assistant',            route: '/dashboard/ai-chat',               icon: MessageSquare,   group: 'ai',       keywords: 'ai chat assistant gpt' },
  { title: 'AI Tools',           subtitle: 'AI-powered tools',        route: '/dashboard/ai-tools',              icon: Zap,             group: 'ai',       keywords: 'ai tools utilities' },
  { title: 'AI Image Generator', subtitle: 'Generate images',         route: '/dashboard/ai-image-generator',    icon: Wand2,           group: 'ai',       keywords: 'ai image generator dalle midjourney' },
  { title: 'AI Image Gallery',   subtitle: 'Image history',           route: '/dashboard/ai-image-gallery',      icon: Images,          group: 'ai',       keywords: 'ai images gallery history' },

  { title: 'Team Management',    subtitle: 'Users & roles',           route: '/dashboard/team',                  icon: Users,           group: 'admin',    keywords: 'team users members roles admin' },
  { title: 'Reports',            subtitle: 'All metrics',             route: '/dashboard/reports',               icon: BarChart3,       group: 'admin',    keywords: 'reports analytics metrics insights' },
  { title: 'Settings',           subtitle: 'Account settings',        route: '/dashboard/settings',              icon: Settings,        group: 'admin',    keywords: 'settings preferences config' },
  { title: 'API Vault',          subtitle: 'Stored credentials',      route: '/dashboard/vault',                 icon: Key,             group: 'admin',    keywords: 'vault api keys credentials secrets' },
  { title: 'Billing',            subtitle: 'Subscription & invoices', route: '/dashboard/billing',               icon: CreditCard,      group: 'admin',    keywords: 'billing subscription invoices payment plan' },
  { title: 'Profile',            subtitle: 'Your profile',            route: '/dashboard/profile',               icon: CircleUser,      group: 'admin',    keywords: 'profile account avatar me personal' },
];

const QUICK_ACTIONS = [
  { title: 'Create new agent',    icon: Bot,    keywords: 'new create agent bot ai',    route: '/dashboard/agents?action=create' },
  { title: 'New campaign',        icon: Send,   keywords: 'new create campaign email',  route: '/dashboard/crm/campaigns?action=create' },
  { title: 'New lead',            icon: Target, keywords: 'new create lead prospect',   route: '/dashboard/crm/leads?action=create' },
  { title: 'New social post',     icon: PenLine, keywords: 'new create social post',     route: '/dashboard/social/compose' },
];

/* ────────────────────────────────────────────────────────────
   ENTITY ICON — map RecentEntityType → lucide icon
   ──────────────────────────────────────────────────────────── */
const TYPE_ICONS: Record<RecentEntityType, React.ElementType> = {
  lead: Target,
  contact: Users,
  agent: Bot,
  conversation: MessageSquare,
  campaign: Send,
  page: Hash,
};

/* ────────────────────────────────────────────────────────────
   COMPONENT
   ──────────────────────────────────────────────────────────── */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { recents } = usePersonalization();

  // Global ⌘K / Ctrl+K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Close + reset query on route change
  useEffect(() => {
    setOpen(false);
    setQuery('');
  }, [location.pathname]);

  // Permission-aware page filtering — admins/super_admins see everything,
  // regular users only see what their role permits.
  const visiblePages = useMemo(() => {
    if (!user) return PAGES;
    if (user.is_super_admin) return PAGES;
    // For non-admin users, show non-restricted pages (a permissive default;
    // server-side gate is the source of truth — this just hides obviously
    // admin-only items from the palette)
    const adminOnly = ['/dashboard/companies', '/dashboard/admin/subscriptions'];
    return PAGES.filter(p => !adminOnly.includes(p.route));
  }, [user]);

  const handleSelect = useCallback((route: string) => {
    setOpen(false);
    setQuery('');
    navigate(route);
  }, [navigate]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="cmd-palette-overlay" />
        <DialogPrimitive.Content className="cmd-palette-content">
          <DialogPrimitive.Title className="sr-only">Command Palette</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Search across pages, recent items, and quick actions
          </DialogPrimitive.Description>

          <CommandPrimitive
            className="flex h-full flex-col"
            shouldFilter={true}
            loop
          >
            {/* ── Header: input + ⌘K hint ── */}
            <div className="cmd-palette-header">
              <Search className="h-4 w-4 text-muted-foreground/70 flex-shrink-0" />
              <CommandPrimitive.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Type a page, person, or action…"
                className="cmd-palette-input"
                autoFocus
              />
              <kbd className="cmd-palette-kbd-header">esc</kbd>
            </div>

            <CommandPrimitive.List className="cmd-palette-list">
              <CommandPrimitive.Empty>
                <div className="cmd-palette-empty">
                  <div className="cmd-palette-empty-orb" />
                  <p className="cmd-palette-empty-text">Nothing found for "{query}"</p>
                  <p className="cmd-palette-empty-hint">Try fewer keywords or a different phrase.</p>
                </div>
              </CommandPrimitive.Empty>

              {/* ── RECENT ── */}
              {recents.length > 0 && !query && (
                <CommandPrimitive.Group heading="Recent" className="cmd-palette-group">
                  {recents.map(item => {
                    const Icon = TYPE_ICONS[item.type];
                    return (
                      <CommandPrimitive.Item
                        key={item.id}
                        value={`recent-${item.id}-${item.title} ${item.subtitle ?? ''}`}
                        onSelect={() => handleSelect(item.route)}
                        className="cmd-palette-item"
                      >
                        <span className="cmd-palette-item-bar" />
                        <Icon className="cmd-palette-item-icon h-4 w-4" />
                        <span className="cmd-palette-item-title">{item.title}</span>
                        {item.subtitle && (
                          <span className="cmd-palette-item-subtitle">{item.subtitle}</span>
                        )}
                        <span className="cmd-palette-item-meta">
                          <Clock className="h-3 w-3" />
                          <span className="capitalize text-[10px]">{item.type}</span>
                        </span>
                        <ArrowRight className="cmd-palette-item-arrow h-3.5 w-3.5" />
                      </CommandPrimitive.Item>
                    );
                  })}
                </CommandPrimitive.Group>
              )}

              {/* ── QUICK ACTIONS ── */}
              <CommandPrimitive.Group heading="Quick actions" className="cmd-palette-group">
                {QUICK_ACTIONS.map(action => {
                  const Icon = action.icon;
                  return (
                    <CommandPrimitive.Item
                      key={action.route}
                      value={`action-${action.title} ${action.keywords}`}
                      onSelect={() => handleSelect(action.route)}
                      className="cmd-palette-item"
                    >
                      <span className="cmd-palette-item-bar" />
                      <span className="cmd-palette-item-icon-wrap cmd-palette-item-icon-aurora">
                        <Plus className="h-3 w-3" />
                      </span>
                      <span className="cmd-palette-item-title">{action.title}</span>
                      <Icon className="cmd-palette-item-arrow h-3.5 w-3.5 text-muted-foreground/50" />
                    </CommandPrimitive.Item>
                  );
                })}
              </CommandPrimitive.Group>

              {/* ── PAGES ── */}
              <CommandPrimitive.Group heading="Jump to" className="cmd-palette-group">
                {visiblePages.map(page => {
                  const Icon = page.icon;
                  return (
                    <CommandPrimitive.Item
                      key={page.route}
                      value={`page-${page.title} ${page.keywords} ${page.subtitle ?? ''}`}
                      onSelect={() => handleSelect(page.route)}
                      className="cmd-palette-item"
                    >
                      <span className="cmd-palette-item-bar" />
                      <Icon className="cmd-palette-item-icon h-4 w-4" />
                      <span className="cmd-palette-item-title">{page.title}</span>
                      {page.subtitle && (
                        <span className="cmd-palette-item-subtitle">{page.subtitle}</span>
                      )}
                      <span className="cmd-palette-item-meta cmd-palette-item-group-tag">
                        {page.group}
                      </span>
                      <ArrowRight className="cmd-palette-item-arrow h-3.5 w-3.5" />
                    </CommandPrimitive.Item>
                  );
                })}
              </CommandPrimitive.Group>
            </CommandPrimitive.List>

            {/* ── Footer: keyboard hints ── */}
            <div className="cmd-palette-footer">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <kbd className="cmd-palette-kbd">↑</kbd>
                  <kbd className="cmd-palette-kbd">↓</kbd>
                  <span className="cmd-palette-hint">navigate</span>
                </span>
                <span className="cmd-palette-hint-divider" />
                <span className="flex items-center gap-1.5">
                  <kbd className="cmd-palette-kbd">↵</kbd>
                  <span className="cmd-palette-hint">open</span>
                </span>
                <span className="cmd-palette-hint-divider" />
                <span className="flex items-center gap-1.5">
                  <kbd className="cmd-palette-kbd">esc</kbd>
                  <span className="cmd-palette-hint">close</span>
                </span>
              </div>
              <span className="cmd-palette-brand">
                <Sparkles className="h-3 w-3" />
                <span>AgentConnect</span>
              </span>
            </div>
          </CommandPrimitive>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** Trigger pill — small ⌘K button for the topbar that opens the palette. */
export function CommandPaletteTrigger() {
  const onClick = useCallback(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
  }, []);

  // Detect platform for accurate kbd display
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <button
      onClick={onClick}
      className="cmd-palette-trigger group"
      aria-label="Open command palette"
    >
      <Search className="h-3.5 w-3.5 text-muted-foreground/70 group-hover:text-foreground transition-colors" />
      <span className="cmd-palette-trigger-label">Search</span>
      <kbd className="cmd-palette-trigger-kbd">{isMac ? '⌘' : 'Ctrl'}K</kbd>
    </button>
  );
}
