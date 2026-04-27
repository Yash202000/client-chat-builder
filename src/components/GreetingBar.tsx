import { useEffect, useMemo, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Sun, Moon, CloudMoon, Sunrise, Sunset,
  Target, Users, Bot, MessageSquare, Send, Hash,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePersonalization, RecentEntityType } from '@/contexts/PersonalizationContext';

/* ────────────────────────────────────────────────────────────
   TIME-AWARE GREETING
   - 5–8   → "Early start"     · sunrise glyph
   - 8–12  → "Good morning"    · sun glyph
   - 12–17 → "Good afternoon"  · sun glyph
   - 17–21 → "Good evening"    · sunset glyph
   - 21–24 → "Hello, night owl"· moon glyph
   - 0–5   → "Burning midnight oil" · cloud-moon glyph
   ──────────────────────────────────────────────────────────── */

type Slot = {
  greeting: string;
  weather: string;
  Icon: React.ElementType;
};

function pickSlot(hour: number): Slot {
  if (hour >= 5 && hour < 8)   return { greeting: 'Early start',          weather: 'Dawn',     Icon: Sunrise };
  if (hour >= 8 && hour < 12)  return { greeting: 'Good morning',         weather: 'Morning',  Icon: Sun };
  if (hour >= 12 && hour < 17) return { greeting: 'Good afternoon',       weather: 'Afternoon',Icon: Sun };
  if (hour >= 17 && hour < 21) return { greeting: 'Good evening',         weather: 'Dusk',     Icon: Sunset };
  if (hour >= 21)              return { greeting: 'Hello, night owl',     weather: 'Evening',  Icon: Moon };
  return                              { greeting: 'Burning midnight oil', weather: 'Late night', Icon: CloudMoon };
}

function getDisplayName(user: { first_name?: string; last_name?: string; email?: string } | null) {
  if (!user) return 'there';
  if (user.first_name) return user.first_name;
  if (user.email) {
    // Best-effort: take chars before "@" or before "."
    const local = user.email.split('@')[0];
    const first = local.split(/[._-]/)[0];
    return first.charAt(0).toUpperCase() + first.slice(1);
  }
  return 'there';
}

const TYPE_ICONS: Record<RecentEntityType, React.ElementType> = {
  lead: Target,
  contact: Users,
  agent: Bot,
  conversation: MessageSquare,
  campaign: Send,
  page: Hash,
};

const TYPE_LABELS: Record<RecentEntityType, string> = {
  lead: 'Lead',
  contact: 'Contact',
  agent: 'Agent',
  conversation: 'Chat',
  campaign: 'Campaign',
  page: 'Page',
};

interface GreetingBarProps {
  /** Optional summary stats — if not provided, generic summary is shown */
  stats?: {
    leadsToFollow?: number;
    activeConversations?: number;
    pendingTasks?: number;
  };
}

export function GreetingBar({ stats }: GreetingBarProps) {
  const location = useLocation();
  const { user } = useAuth();
  const { recents } = usePersonalization();
  const [now, setNow] = useState(() => new Date());

  // Only render on the dashboard root
  const showOnRoot = location.pathname === '/dashboard' || location.pathname === '/dashboard/';

  // Tick every minute so the clock + greeting stay current
  useEffect(() => {
    if (!showOnRoot) return;
    const tick = () => setNow(new Date());
    const interval = setInterval(tick, 60_000);
    return () => clearInterval(interval);
  }, [showOnRoot]);

  const { greeting, weather, Icon } = useMemo(() => pickSlot(now.getHours()), [now]);
  const displayName = useMemo(() => getDisplayName(user), [user]);

  const dateLabel = useMemo(() => now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).toUpperCase(), [now]);

  const timeLabel = useMemo(() => now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }), [now]);

  if (!showOnRoot) return null;

  // Build subline — show real stats if provided, else neutral default
  const sublineParts: React.ReactNode[] = [];
  if (stats?.leadsToFollow !== undefined && stats.leadsToFollow > 0) {
    sublineParts.push(
      <span key="leads">
        <span className="greeting-subline-stat">{stats.leadsToFollow}</span>
        {stats.leadsToFollow === 1 ? ' lead needs' : ' leads need'} follow-up
      </span>
    );
  }
  if (stats?.activeConversations !== undefined && stats.activeConversations > 0) {
    sublineParts.push(
      <span key="convos">
        <span className="greeting-subline-stat">{stats.activeConversations}</span>
        {stats.activeConversations === 1 ? ' conversation' : ' conversations'} waiting
      </span>
    );
  }
  if (stats?.pendingTasks !== undefined && stats.pendingTasks > 0) {
    sublineParts.push(
      <span key="tasks">
        <span className="greeting-subline-stat">{stats.pendingTasks}</span>
        {stats.pendingTasks === 1 ? ' task' : ' tasks'} pending
      </span>
    );
  }
  if (sublineParts.length === 0) {
    sublineParts.push(<span key="default">Here's what's happening across your workspace today.</span>);
  }

  return (
    <section className="greeting-bar" aria-label="Dashboard greeting">
      <div className="greeting-content">
        <div className="min-w-0">
          <h1 className="greeting-headline">
            {greeting},{' '}
            <span className="greeting-headline-accent">{displayName}</span>
          </h1>
          <p className="greeting-subline">
            {sublineParts.map((part, i) => (
              <span key={i}>
                {i > 0 && <span className="greeting-subline-divider">·</span>}
                {part}
              </span>
            ))}
          </p>
        </div>

        <div className="greeting-meta">
          <span className="greeting-meta-clock" aria-label="current date">
            {dateLabel} · <span>{timeLabel}</span>
          </span>
          <span className="greeting-meta-weather">
            <Icon />
            <span>{weather}</span>
          </span>
        </div>
      </div>

      {recents.length > 0 && (
        <div className="greeting-pills" aria-label="Recently viewed">
          <span className="greeting-pills-label">Recent</span>
          {recents.map(item => {
            const TypeIcon = TYPE_ICONS[item.type];
            return (
              <Link
                key={item.id}
                to={item.route}
                className="greeting-pill"
                title={`${TYPE_LABELS[item.type]} · ${item.title}${item.subtitle ? ' — ' + item.subtitle : ''}`}
              >
                <TypeIcon />
                <span className="truncate max-w-[160px]">{item.title}</span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
