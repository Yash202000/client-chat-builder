import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { ConversationDetail } from "@/components/ConversationDetail";
import { useTwilioCall } from "@/contexts/TwilioCallContext";
import {
  Globe,
  MessageSquare,
  Mail,
  Phone,
  Zap,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Building2,
  User,
  Clock,
  Activity,
  Pencil,
  Check,
  X,
  ChevronDown,
  Calendar,
  BarChart2,
  Tag,
  Loader2,
} from "lucide-react";
import {
  WhatsAppIcon,
  MessengerIcon,
  InstagramIcon,
  TelegramIcon,
  TwilioIcon,
  ApiIcon,
} from "@/components/ChannelIcons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

// ── Types ────────────────────────────────────────────────────────────────────

interface ContactTag {
  id: number;
  name: string;
  color?: string;
}

interface Contact {
  id: number;
  name?: string;
  email?: string;
  phone_number?: string;
  lifecycle_stage?: string;
  lead_source?: string;
  last_contacted_at?: string;
  created_at?: string;
  updated_at?: string;
  tags?: ContactTag[];
}

interface Session {
  conversation_id: string;
  channel: string;
  status: string;
  first_message_content: string;
  last_message_timestamp: string;
  contact_id?: number;
  assignee_id?: number;
}

interface VoiceCall {
  id: number;
  call_sid: string;
  from_number: string;
  to_number: string;
  direction: string;
  status: string;
  duration_seconds?: number;
  started_at?: string;
  full_transcript?: string;
  contact_id?: number;
}

type TimelineItem =
  | { kind: "session"; data: Session; time: Date }
  | { kind: "call"; data: VoiceCall; time: Date };

type RightPanelState =
  | { type: "empty" }
  | { type: "session"; sessionId: string }
  | { type: "call"; call: VoiceCall };

// ── Constants ─────────────────────────────────────────────────────────────────

const CHANNEL_CONFIG: Record<
  string,
  { label: string; color: string; Icon: React.ElementType }
> = {
  web_chat:     { label: "Web Chat",  color: "text-blue-500",   Icon: Globe },
  whatsapp:     { label: "WhatsApp",  color: "text-green-500",  Icon: WhatsAppIcon },
  instagram:    { label: "Instagram", color: "text-pink-500",   Icon: InstagramIcon },
  messenger:    { label: "Messenger", color: "text-blue-600",   Icon: MessengerIcon },
  telegram:     { label: "Telegram",  color: "text-sky-500",    Icon: TelegramIcon },
  twilio_voice: { label: "Voice",     color: "text-red-500",    Icon: TwilioIcon },
  sms:          { label: "SMS",       color: "text-orange-400", Icon: MessageSquare },
  gmail:        { label: "Email",     color: "text-red-500",    Icon: Mail },
  api:          { label: "API",       color: "text-cyan-500",   Icon: ApiIcon },
};

const STAGE_CONFIG: Record<string, { label: string; cls: string }> = {
  subscriber:  { label: "Subscriber",  cls: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300" },
  lead:        { label: "Lead",        cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  mql:         { label: "MQL",         cls: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300" },
  sql:         { label: "SQL",         cls: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" },
  opportunity: { label: "Opportunity", cls: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
  customer:    { label: "Customer",    cls: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
  evangelist:  { label: "Evangelist",  cls: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" },
  other:       { label: "Other",       cls: "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(seconds?: number): string {
  if (!seconds) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatRelative(timestamp?: string): string {
  if (!timestamp) return "";
  const date = new Date(timestamp.endsWith("Z") || timestamp.includes("+") ? timestamp : timestamp + "Z");
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function formatDateLabel(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (d.getTime() === today.getTime()) return "Today";
  if (d.getTime() === yesterday.getTime()) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function getInitials(name?: string, email?: string): string {
  const source = name || email || "?";
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// ── Skeleton components ───────────────────────────────────────────────────────

function ContactCardSkeleton() {
  return (
    <div className="px-3 py-3 rounded-lg animate-pulse">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
          <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}

function TimelineItemSkeleton() {
  return (
    <div className="px-3 py-2.5 animate-pulse flex items-start gap-2.5">
      <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0 mt-0.5" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
        <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
      </div>
    </div>
  );
}

// ── ContactCard ───────────────────────────────────────────────────────────────

function ContactCard({
  contact,
  selected,
  onClick,
}: {
  contact: Contact;
  selected: boolean;
  onClick: () => void;
}) {
  const initials = getInitials(contact.name, contact.email);
  const lastActivity = contact.last_contacted_at || contact.updated_at;
  const stageCfg = contact.lifecycle_stage ? STAGE_CONFIG[contact.lifecycle_stage] : null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-3 rounded-lg transition-all border",
        selected
          ? "bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-700 shadow-sm"
          : "bg-white border-transparent hover:bg-slate-50 dark:bg-slate-800/50 dark:hover:bg-slate-700/50"
      )}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold",
            selected
              ? "bg-blue-500 text-white"
              : "bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-200"
          )}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
              {contact.name || contact.email || "Unknown"}
            </span>
            {lastActivity && (
              <span className="text-[10px] text-slate-400 flex-shrink-0">
                {formatRelative(lastActivity)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {contact.email || contact.phone_number || "No contact info"}
            </span>
            {stageCfg && (
              <span className={cn("text-[9px] px-1 py-0.5 rounded font-medium flex-shrink-0", stageCfg.cls)}>
                {stageCfg.label}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// ── ChannelTab ────────────────────────────────────────────────────────────────

function ChannelTab({
  channel,
  active,
  count,
  onClick,
}: {
  channel: string;
  active: boolean;
  count: number;
  onClick: () => void;
}) {
  if (channel === "timeline") {
    return (
      <button
        onClick={onClick}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
          active
            ? "bg-blue-500 text-white shadow-sm"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
        )}
      >
        <Activity className="w-3.5 h-3.5" />
        <span>Timeline</span>
        <span className={cn(
          "ml-0.5 px-1 rounded text-[10px]",
          active ? "bg-blue-400 text-white" : "bg-slate-200 text-slate-500 dark:bg-slate-600 dark:text-slate-400"
        )}>
          {count}
        </span>
      </button>
    );
  }

  const cfg = CHANNEL_CONFIG[channel] ?? { label: channel, color: "text-slate-500", Icon: MessageSquare };
  const { Icon, label, color } = cfg;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
        active
          ? "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white"
          : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
      )}
    >
      <Icon className={cn("w-3.5 h-3.5", color)} />
      <span>{label}</span>
      <span className={cn(
        "ml-0.5 px-1 rounded text-[10px]",
        active
          ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
          : "bg-slate-200 text-slate-500 dark:bg-slate-600 dark:text-slate-400"
      )}>
        {count}
      </span>
    </button>
  );
}

// ── TimelineRow ───────────────────────────────────────────────────────────────

function TimelineRow({
  item,
  selected,
  onClick,
}: {
  item: TimelineItem;
  selected: boolean;
  onClick: () => void;
}) {
  if (item.kind === "call") {
    const call = item.data;
    const isInbound = call.direction === "inbound";
    return (
      <button
        onClick={onClick}
        className={cn(
          "w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 transition-colors group",
          selected
            ? "bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-200 dark:ring-blue-800"
            : "hover:bg-slate-50 dark:hover:bg-slate-700/40"
        )}
      >
        <div className={cn(
          "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center",
          isInbound ? "bg-green-100 dark:bg-green-900/30" : "bg-orange-100 dark:bg-orange-900/30"
        )}>
          {isInbound
            ? <ArrowDownLeft className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
            : <ArrowUpRight className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className={cn(
              "text-xs font-medium",
              selected ? "text-blue-700 dark:text-blue-300" : "text-slate-700 dark:text-slate-300"
            )}>
              {isInbound ? call.from_number : call.to_number}
            </span>
            <span className="text-[10px] text-slate-400 flex-shrink-0">{formatRelative(call.started_at)}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              📞 {formatDuration(call.duration_seconds)}
            </span>
            <span className={cn(
              "text-[9px] px-1 py-0.5 rounded font-medium",
              call.status === "completed" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : call.status === "no-answer" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
              : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
            )}>
              {call.status}
            </span>
          </div>
        </div>
      </button>
    );
  }

  const session = item.data;
  const cfg = CHANNEL_CONFIG[session.channel] ?? { label: session.channel, color: "text-slate-500", Icon: MessageSquare };
  const { Icon, color, label } = cfg;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-2.5 rounded-lg flex items-start gap-2.5 transition-colors",
        selected
          ? "bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-200 dark:ring-blue-800"
          : "hover:bg-slate-50 dark:hover:bg-slate-700/40"
      )}
    >
      <Icon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", color)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className={cn(
            "text-xs font-medium",
            selected ? "text-blue-700 dark:text-blue-300" : "text-slate-700 dark:text-slate-300"
          )}>
            {label}
          </span>
          <span className="text-[10px] text-slate-400 flex-shrink-0">
            {formatRelative(session.last_message_timestamp)}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
          {session.first_message_content || "No messages yet"}
        </p>
        <div className="mt-1">
          <span className={cn(
            "text-[9px] px-1 py-0.5 rounded font-medium",
            session.status === "active"   ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : session.status === "resolved" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
            : session.status === "inactive" ? "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
            : "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
          )}>
            {session.status}
          </span>
        </div>
      </div>
    </button>
  );
}

// ── SessionRow (used in per-channel tabs) ────────────────────────────────────

function SessionRow({
  session,
  selected,
  onClick,
}: {
  session: Session;
  selected: boolean;
  onClick: () => void;
}) {
  const cfg = CHANNEL_CONFIG[session.channel] ?? { label: session.channel, color: "text-slate-500", Icon: MessageSquare };
  const { Icon, color } = cfg;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-2.5 rounded-lg flex items-start gap-2.5 transition-colors",
        selected
          ? "bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-200 dark:ring-blue-800"
          : "hover:bg-slate-50 dark:hover:bg-slate-700/40"
      )}
    >
      <Icon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", color)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className={cn(
            "text-xs font-medium",
            selected ? "text-blue-700 dark:text-blue-300" : "text-slate-700 dark:text-slate-300"
          )}>
            {cfg.label}
          </span>
          <span className="text-[10px] text-slate-400 flex-shrink-0">
            {formatRelative(session.last_message_timestamp)}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
          {session.first_message_content || "No messages yet"}
        </p>
      </div>
      <span className={cn(
        "text-[9px] px-1 py-0.5 rounded font-medium self-center flex-shrink-0",
        session.status === "active"   ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
        : session.status === "resolved" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
        : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
      )}>
        {session.status}
      </span>
    </button>
  );
}

// ── CallRow (used in calls tab) ───────────────────────────────────────────────

function CallRow({
  call,
  selected,
  onClick,
}: {
  call: VoiceCall;
  selected: boolean;
  onClick: () => void;
}) {
  const isInbound = call.direction === "inbound";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 transition-colors",
        selected
          ? "bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-200 dark:ring-blue-800"
          : "hover:bg-slate-50 dark:hover:bg-slate-700/40"
      )}
    >
      {isInbound
        ? <ArrowDownLeft className="w-4 h-4 text-green-500 flex-shrink-0" />
        : <ArrowUpRight className="w-4 h-4 text-orange-500 flex-shrink-0" />
      }
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
            {isInbound ? call.from_number : call.to_number}
          </span>
          <span className="text-[10px] text-slate-400 flex-shrink-0">
            {formatRelative(call.started_at)}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {formatDuration(call.duration_seconds)}
          </span>
          <span className={cn(
            "text-[9px] px-1 py-0.5 rounded font-medium",
            call.status === "completed" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
          )}>
            {call.status}
          </span>
        </div>
      </div>
    </button>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ContactHubPage() {
  const { authFetch } = useAuth();
  const { makeCall, callState } = useTwilioCall();
  const queryClient = useQueryClient();

  // Left panel state
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");

  // Middle panel state
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
  const [activeChannel, setActiveChannel] = useState<string>("timeline");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<{
    name: string;
    email: string;
    phone_number: string;
    lifecycle_stage: string;
  }>({ name: "", email: "", phone_number: "", lifecycle_stage: "" });

  // Right panel state
  const [rightPanel, setRightPanel] = useState<RightPanelState>({ type: "empty" });

  // ── Data fetching ──────────────────────────────────────────────────────────

  const { data: contacts = [], isLoading: isLoadingContacts } = useQuery<Contact[]>({
    queryKey: ["contacts"],
    queryFn: async () => {
      const res = await authFetch(`/api/v1/contacts/?limit=500`);
      if (!res.ok) throw new Error("Failed to fetch contacts");
      return res.json();
    },
  });

  const { data: sessions = [], isLoading: isLoadingSessions } = useQuery<Session[]>({
    queryKey: ["contact-hub-sessions", selectedContactId],
    queryFn: async () => {
      const res = await authFetch(`/api/v1/conversations/sessions?contact_id=${selectedContactId}`);
      if (!res.ok) throw new Error("Failed to fetch sessions");
      return res.json();
    },
    enabled: selectedContactId !== null,
  });

  const { data: callsData, isLoading: isLoadingCalls } = useQuery<{ calls: VoiceCall[] }>({
    queryKey: ["contact-hub-calls", selectedContactId],
    queryFn: async () => {
      const res = await authFetch(`/api/v1/twilio/calls?contact_id=${selectedContactId}&limit=50`);
      if (!res.ok) throw new Error("Failed to fetch calls");
      return res.json();
    },
    enabled: selectedContactId !== null,
  });

  const calls = callsData?.calls ?? [];

  // ── Update contact mutation ────────────────────────────────────────────────

  const updateContactMutation = useMutation({
    mutationFn: async (data: typeof editForm) => {
      const res = await authFetch(`/api/v1/contacts/${selectedContactId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update contact");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setIsEditing(false);
      toast({ title: "Contact updated" });
    },
    onError: () => {
      toast({ title: "Failed to update contact", variant: "destructive" });
    },
  });

  // ── Derived data ───────────────────────────────────────────────────────────

  const filteredContacts = useMemo(() => {
    let result = [...contacts];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.phone_number?.includes(q)
      );
    }

    // Stage filter
    if (stageFilter) {
      result = result.filter((c) => c.lifecycle_stage === stageFilter);
    }

    // Sort by last activity desc, nulls last
    result.sort((a, b) => {
      const ta = a.last_contacted_at || a.updated_at;
      const tb = b.last_contacted_at || b.updated_at;
      if (!ta && !tb) return 0;
      if (!ta) return 1;
      if (!tb) return -1;
      return new Date(tb).getTime() - new Date(ta).getTime();
    });

    return result;
  }, [contacts, search, stageFilter]);

  const selectedContact = contacts.find((c) => c.id === selectedContactId) ?? null;

  // Build timeline: merge sessions + calls, sort desc
  const timelineItems = useMemo((): TimelineItem[] => {
    const items: TimelineItem[] = [
      ...sessions.map((s) => ({
        kind: "session" as const,
        data: s,
        time: new Date(
          s.last_message_timestamp.endsWith("Z") || s.last_message_timestamp.includes("+")
            ? s.last_message_timestamp
            : s.last_message_timestamp + "Z"
        ),
      })),
      ...calls.map((c) => ({
        kind: "call" as const,
        data: c,
        time: c.started_at
          ? new Date(c.started_at.endsWith("Z") || c.started_at.includes("+") ? c.started_at : c.started_at + "Z")
          : new Date(0),
      })),
    ];
    return items.sort((a, b) => b.time.getTime() - a.time.getTime());
  }, [sessions, calls]);

  // Group timeline by day for dividers
  const timelineByDay = useMemo(() => {
    const groups: { label: string; items: TimelineItem[] }[] = [];
    let currentLabel = "";
    for (const item of timelineItems) {
      const label = formatDateLabel(item.time);
      if (label !== currentLabel) {
        currentLabel = label;
        groups.push({ label, items: [] });
      }
      groups[groups.length - 1].items.push(item);
    }
    return groups;
  }, [timelineItems]);

  // Group sessions by channel for per-channel tabs
  const sessionsByChannel = useMemo(() => {
    const map: Record<string, Session[]> = {};
    for (const s of sessions) {
      if (!map[s.channel]) map[s.channel] = [];
      map[s.channel].push(s);
    }
    return map;
  }, [sessions]);

  const channelTabs = useMemo(() => {
    const tabs: string[] = ["timeline"];
    if (calls.length > 0) tabs.push("calls");
    Object.keys(sessionsByChannel).forEach((ch) => tabs.push(ch));
    return tabs;
  }, [calls, sessionsByChannel]);

  // Stats derived from already-fetched data
  const stats = useMemo(() => {
    const allTimes = [
      ...sessions.map((s) => new Date(
        s.last_message_timestamp.endsWith("Z") || s.last_message_timestamp.includes("+")
          ? s.last_message_timestamp
          : s.last_message_timestamp + "Z"
      ).getTime()),
      ...calls.filter((c) => c.started_at).map((c) => new Date(c.started_at!).getTime()),
    ];
    const firstContact = selectedContact?.created_at
      ? new Date(selectedContact.created_at).toLocaleDateString()
      : "—";
    const lastContact = allTimes.length
      ? formatRelative(new Date(Math.max(...allTimes)).toISOString())
      : "—";
    return {
      sessions: sessions.length,
      calls: calls.length,
      firstContact,
      lastContact,
    };
  }, [sessions, calls, selectedContact]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSelectContact = (id: number) => {
    setSelectedContactId(id);
    setActiveChannel("timeline");
    setRightPanel({ type: "empty" });
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    if (!selectedContact) return;
    setEditForm({
      name: selectedContact.name ?? "",
      email: selectedContact.email ?? "",
      phone_number: selectedContact.phone_number ?? "",
      lifecycle_stage: selectedContact.lifecycle_stage ?? "",
    });
    setIsEditing(true);
  };

  const handleInitiateCall = () => {
    if (!selectedContact?.phone_number) return;
    makeCall(selectedContact.phone_number);
  };

  const getTabCount = (tab: string) => {
    if (tab === "timeline") return timelineItems.length;
    if (tab === "calls") return calls.length;
    return sessionsByChannel[tab]?.length ?? 0;
  };

  const selectedSessionId = rightPanel.type === "session" ? rightPanel.sessionId : null;
  const selectedCall = rightPanel.type === "call" ? rightPanel.call : null;
  const isLoadingMiddle = isLoadingSessions || isLoadingCalls;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full overflow-hidden bg-slate-50 dark:bg-slate-900">

      {/* ── Left Panel: Contact List ───────────────────────────────────────── */}
      <div className="w-64 flex-shrink-0 flex flex-col border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        {/* Header */}
        <div className="px-3 py-3 border-b border-slate-100 dark:border-slate-700 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Contacts</h2>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
              {filteredContacts.length}
            </span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-7 h-8 text-xs"
            />
          </div>

          {/* Stage filter */}
          <div className="relative">
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="w-full appearance-none text-xs h-8 pl-2.5 pr-7 rounded-md border border-input bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">All stages</option>
              {Object.entries(STAGE_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Contact list */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          {isLoadingContacts ? (
            [...Array(6)].map((_, i) => <ContactCardSkeleton key={i} />)
          ) : filteredContacts.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">No contacts found</p>
          ) : (
            filteredContacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                selected={contact.id === selectedContactId}
                onClick={() => handleSelectContact(contact.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Middle Panel: Contact Profile + Channel Tabs ───────────────────── */}
      <div className="w-80 flex-shrink-0 flex flex-col border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        {!selectedContact ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-slate-400">
              <User className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Select a contact</p>
              <p className="text-xs mt-1 text-slate-400">to view their activity</p>
            </div>
          </div>
        ) : (
          <>
            {/* Profile header */}
            <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-700">
              {/* Avatar + name row */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-lg font-semibold flex-shrink-0 shadow-sm">
                  {getInitials(selectedContact.name, selectedContact.email)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                      {selectedContact.name || "Unnamed Contact"}
                    </h3>
                    {!isEditing && (
                      <button
                        onClick={handleStartEdit}
                        className="flex-shrink-0 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        title="Edit contact"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  {selectedContact.lifecycle_stage && !isEditing && (
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                      STAGE_CONFIG[selectedContact.lifecycle_stage]?.cls ??
                        "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                    )}>
                      {STAGE_CONFIG[selectedContact.lifecycle_stage]?.label ?? selectedContact.lifecycle_stage}
                    </span>
                  )}
                </div>
              </div>

              {/* Inline edit form */}
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Name"
                    className="h-7 text-xs"
                  />
                  <Input
                    value={editForm.email}
                    onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="Email"
                    type="email"
                    className="h-7 text-xs"
                  />
                  <Input
                    value={editForm.phone_number}
                    onChange={(e) => setEditForm((f) => ({ ...f, phone_number: e.target.value }))}
                    placeholder="Phone"
                    className="h-7 text-xs"
                  />
                  <div className="relative">
                    <select
                      value={editForm.lifecycle_stage}
                      onChange={(e) => setEditForm((f) => ({ ...f, lifecycle_stage: e.target.value }))}
                      className="w-full appearance-none text-xs h-7 pl-2 pr-7 rounded-md border border-input bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="">Stage…</option>
                      {Object.entries(STAGE_CONFIG).map(([key, cfg]) => (
                        <option key={key} value={key}>{cfg.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      className="h-7 text-xs flex-1 gap-1.5"
                      onClick={() => updateContactMutation.mutate(editForm)}
                      disabled={updateContactMutation.isPending}
                    >
                      {updateContactMutation.isPending
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <Check className="w-3 h-3" />
                      }
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1.5"
                      onClick={() => setIsEditing(false)}
                    >
                      <X className="w-3 h-3" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Contact info */}
                  <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 mb-3">
                    {selectedContact.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{selectedContact.email}</span>
                      </div>
                    )}
                    {selectedContact.phone_number && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 flex-shrink-0" />
                        <span>{selectedContact.phone_number}</span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {selectedContact.tags && selectedContact.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {selectedContact.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                          style={tag.color ? { backgroundColor: tag.color + "22", color: tag.color } : undefined}
                        >
                          <Tag className="w-2.5 h-2.5" />
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Quick actions */}
                  {selectedContact.phone_number && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1.5 mb-3"
                      onClick={handleInitiateCall}
                      disabled={callState !== "idle"}
                    >
                      <Phone className="w-3 h-3" />
                      Call
                    </Button>
                  )}
                </>
              )}

              {/* Stats row */}
              {!isEditing && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <div className="text-center">
                    <div className="text-base font-bold text-slate-800 dark:text-slate-100">{stats.sessions}</div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-center gap-0.5">
                      <MessageSquare className="w-2.5 h-2.5" /> Chats
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-base font-bold text-slate-800 dark:text-slate-100">{stats.calls}</div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-center gap-0.5">
                      <Phone className="w-2.5 h-2.5" /> Calls
                    </div>
                  </div>
                  <div className="text-center col-span-1">
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">{stats.firstContact}</div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-center gap-0.5">
                      <Calendar className="w-2.5 h-2.5" /> First contact
                    </div>
                  </div>
                  <div className="text-center col-span-1">
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">{stats.lastContact}</div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" /> Last active
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Channel tabs */}
            {channelTabs.length > 0 && (
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 flex flex-wrap gap-1">
                {channelTabs.map((tab) => (
                  <ChannelTab
                    key={tab}
                    channel={tab}
                    active={activeChannel === tab}
                    count={getTabCount(tab)}
                    onClick={() => {
                      setActiveChannel(tab);
                      setRightPanel({ type: "empty" });
                    }}
                  />
                ))}
              </div>
            )}

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto px-2 py-2">
              {isLoadingMiddle ? (
                <div className="space-y-0.5">
                  {[...Array(5)].map((_, i) => <TimelineItemSkeleton key={i} />)}
                </div>
              ) : channelTabs.length <= 1 && timelineItems.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No conversations or calls yet</p>
              ) : activeChannel === "timeline" ? (
                timelineByDay.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">No activity found</p>
                ) : (
                  <div className="space-y-1">
                    {timelineByDay.map((group) => (
                      <div key={group.label}>
                        {/* Day divider */}
                        <div className="flex items-center gap-2 px-2 py-1.5">
                          <div className="flex-1 h-px bg-slate-100 dark:bg-slate-700" />
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide flex-shrink-0">
                            {group.label}
                          </span>
                          <div className="flex-1 h-px bg-slate-100 dark:bg-slate-700" />
                        </div>
                        {group.items.map((item, idx) => (
                          <TimelineRow
                            key={item.kind === "session" ? item.data.conversation_id : `call-${item.data.id}-${idx}`}
                            item={item}
                            selected={
                              item.kind === "session"
                                ? selectedSessionId === item.data.conversation_id
                                : selectedCall?.id === item.data.id
                            }
                            onClick={() => {
                              if (item.kind === "session") {
                                setRightPanel({ type: "session", sessionId: item.data.conversation_id });
                              } else {
                                setRightPanel({ type: "call", call: item.data });
                              }
                            }}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                )
              ) : activeChannel === "calls" ? (
                calls.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">No calls found</p>
                ) : (
                  <div className="space-y-0.5">
                    {calls.map((call) => (
                      <CallRow
                        key={call.id}
                        call={call}
                        selected={selectedCall?.id === call.id}
                        onClick={() => setRightPanel({ type: "call", call })}
                      />
                    ))}
                  </div>
                )
              ) : (
                <div className="space-y-0.5">
                  {(sessionsByChannel[activeChannel] ?? []).map((session) => (
                    <SessionRow
                      key={session.conversation_id}
                      session={session}
                      selected={selectedSessionId === session.conversation_id}
                      onClick={() => setRightPanel({ type: "session", sessionId: session.conversation_id })}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Right Panel: Detail View ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {rightPanel.type === "empty" && (
          <div className="flex-1 flex items-center justify-center">
            {selectedContact ? (
              <div className="text-center px-8">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-4">
                  <BarChart2 className="w-8 h-8 text-blue-400 dark:text-blue-500" />
                </div>
                <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  {selectedContact.name || "Contact"}'s Activity
                </h3>
                <p className="text-sm text-slate-400 max-w-[220px] mx-auto leading-relaxed">
                  Select a conversation or call from the timeline to view details
                </p>
                <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" /> {stats.sessions} chats
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> {stats.calls} calls
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400">
                <Activity className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Select a contact to get started</p>
              </div>
            )}
          </div>
        )}

        {rightPanel.type === "session" && (
          <ConversationDetail sessionId={rightPanel.sessionId} agentId={1} />
        )}

        {rightPanel.type === "call" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Call summary */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  rightPanel.call.direction === "inbound"
                    ? "bg-green-100 dark:bg-green-900/40"
                    : "bg-orange-100 dark:bg-orange-900/40"
                )}>
                  {rightPanel.call.direction === "inbound"
                    ? <ArrowDownLeft className="w-5 h-5 text-green-600 dark:text-green-400" />
                    : <ArrowUpRight className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  }
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white capitalize">
                    {rightPanel.call.direction} Call
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {rightPanel.call.direction === "inbound"
                      ? rightPanel.call.from_number
                      : rightPanel.call.to_number}
                  </p>
                </div>
                <span className={cn(
                  "ml-auto text-xs px-2 py-1 rounded-full font-medium",
                  rightPanel.call.status === "completed"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                )}>
                  {rightPanel.call.status}
                </span>
              </div>

              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Duration</dt>
                  <dd className="font-medium text-slate-700 dark:text-slate-300">
                    {formatDuration(rightPanel.call.duration_seconds)}
                  </dd>
                </div>
                {rightPanel.call.started_at && (
                  <div>
                    <dt className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Started</dt>
                    <dd className="font-medium text-slate-700 dark:text-slate-300">
                      {new Date(rightPanel.call.started_at).toLocaleString()}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Direction</dt>
                  <dd className="font-medium text-slate-700 dark:text-slate-300 capitalize">
                    {rightPanel.call.direction}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Sentiment</dt>
                  <dd className="font-medium text-slate-400 dark:text-slate-500 italic text-xs">
                    Not available
                  </dd>
                </div>
              </dl>
            </div>

            {/* Transcript */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-400" />
                Transcript
              </h4>
              {rightPanel.call.full_transcript ? (
                <pre className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap font-mono leading-relaxed max-h-[60vh] overflow-y-auto">
                  {rightPanel.call.full_transcript}
                </pre>
              ) : (
                <p className="text-sm text-slate-400 italic">No transcript available</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
