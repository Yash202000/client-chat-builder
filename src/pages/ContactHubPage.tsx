import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
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
  LayoutList,
  LayoutGrid,
  Target,
  UserPlus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { CustomFieldInput, CustomFieldDefinition, formatCustomFieldValue } from "@/components/CustomFieldInput";

// ── Types ────────────────────────────────────────────────────────────────────

interface ContactTag {
  id: number;
  name: string;
  color?: string;
}

interface WorkflowStatus {
  id: number;
  name: string;
  color: string;
  category: string;
}

interface WorkflowTransition {
  id: number;
  name: string;
  from_status_id?: number | null;
  to_status_id: number;
  screen_fields?: { field: string; label: string; required: boolean }[];
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
  has_lead?: boolean;
  wf_status?: WorkflowStatus;
  available_transitions?: WorkflowTransition[];
  custom_fields?: Record<string, any>;
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
  subscriber:  { label: "Subscriber",  cls: "bg-muted text-foreground" },
  lead:        { label: "Lead",        cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  mql:         { label: "MQL",         cls: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300" },
  sql:         { label: "SQL",         cls: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" },
  opportunity: { label: "Opportunity", cls: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
  customer:    { label: "Customer",    cls: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
  evangelist:  { label: "Evangelist",  cls: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" },
  other:       { label: "Other",       cls: "bg-muted text-muted-foreground" },
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
        <div className="w-9 h-9 rounded-full bg-muted flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 bg-muted rounded w-3/4" />
          <div className="h-2.5 bg-muted rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}

function TimelineItemSkeleton() {
  return (
    <div className="px-3 py-2.5 animate-pulse flex items-start gap-2.5">
      <div className="w-4 h-4 rounded-full bg-muted flex-shrink-0 mt-0.5" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-muted rounded w-2/3" />
        <div className="h-2.5 bg-muted rounded w-1/2" />
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
  const { t } = useTranslation();
  const initials = getInitials(contact.name, contact.email);
  const lastActivity = contact.last_contacted_at || contact.updated_at;
  const stageCfg = contact.lifecycle_stage ? STAGE_CONFIG[contact.lifecycle_stage] : null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-3 rounded-lg transition-all border",
        selected
          ? "bg-violet-50 border-violet-200 dark:bg-violet-500/10 dark:border-violet-500/30 shadow-sm"
          : "bg-card border-transparent hover:bg-muted/60 dark:hover:bg-white/[0.06]"
      )}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold",
            selected
              ? "bg-violet-500 text-white"
              : "bg-muted text-foreground"
          )}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className="text-sm font-medium text-foreground truncate">
              {contact.name || contact.email || t('contactHub.unknown')}
            </span>
            {lastActivity && (
              <span className="text-[10px] text-muted-foreground flex-shrink-0">
                {formatRelative(lastActivity)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground truncate">
              {contact.email || contact.phone_number || t('contactHub.noContactInfo')}
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
  const { t } = useTranslation();
  if (channel === "timeline") {
    return (
      <button
        onClick={onClick}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
          active
            ? "bg-violet-500 text-white shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
        )}
      >
        <Activity className="w-3.5 h-3.5" />
        <span>{t('contactHub.timeline')}</span>
        <span className={cn(
          "ml-0.5 px-1 rounded text-[10px]",
          active ? "bg-violet-500 text-white" : "bg-muted text-muted-foreground"
        )}>
          {count}
        </span>
      </button>
    );
  }

  const cfg = CHANNEL_CONFIG[channel] ?? { label: channel, color: "text-muted-foreground", Icon: MessageSquare };
  const { Icon, color } = cfg;
  const label = channel === "calls" ? t('contactHub.calls') : cfg.label;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
        active
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
      )}
    >
      <Icon className={cn("w-3.5 h-3.5", color)} />
      <span>{label}</span>
      <span className={cn(
        "ml-0.5 px-1 rounded text-[10px]",
        active
          ? "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
          : "bg-muted text-muted-foreground"
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
  const { t } = useTranslation();
  if (item.kind === "call") {
    const call = item.data;
    const isInbound = call.direction === "inbound";
    return (
      <button
        onClick={onClick}
        className={cn(
          "w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 transition-colors group",
          selected
            ? "bg-violet-50 dark:bg-violet-500/10 ring-1 ring-violet-200 dark:ring-violet-500/30"
            : "hover:bg-muted/60"
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
              selected ? "text-violet-600 dark:text-violet-400" : "text-foreground"
            )}>
              {isInbound ? call.from_number : call.to_number}
            </span>
            <span className="text-[10px] text-muted-foreground flex-shrink-0">{formatRelative(call.started_at)}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-muted-foreground">
              📞 {formatDuration(call.duration_seconds)}
            </span>
            <span className={cn(
              "text-[9px] px-1 py-0.5 rounded font-medium",
              call.status === "completed" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : call.status === "no-answer" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
              : "bg-muted text-muted-foreground"
            )}>
              {call.status}
            </span>
          </div>
        </div>
      </button>
    );
  }

  const session = item.data;
  const cfg = CHANNEL_CONFIG[session.channel] ?? { label: session.channel, color: "text-muted-foreground", Icon: MessageSquare };
  const { Icon, color, label } = cfg;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-2.5 rounded-lg flex items-start gap-2.5 transition-colors",
        selected
          ? "bg-violet-50 dark:bg-violet-500/10 ring-1 ring-violet-200 dark:ring-violet-500/30"
          : "hover:bg-muted/60"
      )}
    >
      <Icon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", color)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className={cn(
            "text-xs font-medium",
            selected ? "text-violet-600 dark:text-violet-400" : "text-foreground"
          )}>
            {label}
          </span>
          <span className="text-[10px] text-muted-foreground flex-shrink-0">
            {formatRelative(session.last_message_timestamp)}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
          {session.first_message_content || t('contactHub.noMessagesYet')}
        </p>
        <div className="mt-1">
          <span className={cn(
            "text-[9px] px-1 py-0.5 rounded font-medium",
            session.status === "active"   ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : session.status === "resolved" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
            : session.status === "inactive" ? "bg-muted text-muted-foreground"
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
  const { t } = useTranslation();
  const cfg = CHANNEL_CONFIG[session.channel] ?? { label: session.channel, color: "text-muted-foreground", Icon: MessageSquare };
  const { Icon, color } = cfg;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-2.5 rounded-lg flex items-start gap-2.5 transition-colors",
        selected
          ? "bg-violet-50 dark:bg-violet-500/10 ring-1 ring-violet-200 dark:ring-violet-500/30"
          : "hover:bg-muted/60"
      )}
    >
      <Icon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", color)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className={cn(
            "text-xs font-medium",
            selected ? "text-violet-600 dark:text-violet-400" : "text-foreground"
          )}>
            {cfg.label}
          </span>
          <span className="text-[10px] text-muted-foreground flex-shrink-0">
            {formatRelative(session.last_message_timestamp)}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
          {session.first_message_content || t('contactHub.noMessagesYet')}
        </p>
      </div>
      <span className={cn(
        "text-[9px] px-1 py-0.5 rounded font-medium self-center flex-shrink-0",
        session.status === "active"   ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
        : session.status === "resolved" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
        : "bg-muted text-muted-foreground"
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
          ? "bg-violet-50 dark:bg-violet-500/10 ring-1 ring-violet-200 dark:ring-violet-500/30"
          : "hover:bg-muted/60"
      )}
    >
      {isInbound
        ? <ArrowDownLeft className="w-4 h-4 text-green-500 flex-shrink-0" />
        : <ArrowUpRight className="w-4 h-4 text-orange-500 flex-shrink-0" />
      }
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-medium text-foreground truncate">
            {isInbound ? call.from_number : call.to_number}
          </span>
          <span className="text-[10px] text-muted-foreground flex-shrink-0">
            {formatRelative(call.started_at)}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-muted-foreground">
            {formatDuration(call.duration_seconds)}
          </span>
          <span className={cn(
            "text-[9px] px-1 py-0.5 rounded font-medium",
            call.status === "completed" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : "bg-muted text-muted-foreground"
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
  const { t } = useTranslation();
  const { authFetch } = useAuth();
  const { makeCall, callState } = useTwilioCall();
  const queryClient = useQueryClient();

  // View mode
  const [viewMode, setViewMode] = useState<"hub" | "list">("hub");

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkConverting, setBulkConverting] = useState(false);

  // Contact workflow transition
  const [contactTransition, setContactTransition] = useState<{ contact: Contact; transition: WorkflowTransition } | null>(null);
  const [contactTransitionFields, setContactTransitionFields] = useState<Record<string, any>>({});
  const [contactTransitionSaving, setContactTransitionSaving] = useState(false);

  // Custom field definitions for contacts
  const { data: contactCustomFieldDefs = [] } = useQuery<CustomFieldDefinition[]>({
    queryKey: ["custom-field-defs", "contact"],
    queryFn: async () => {
      const res = await authFetch("/api/v1/custom-fields/?entity_type=contact");
      return res.ok ? res.json() : [];
    },
  });

  // Convert to lead state
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [convertingContact, setConvertingContact] = useState<Contact | null>(null);
  const [leadData, setLeadData] = useState({ source: "", deal_value: "", notes: "" });
  const [converting, setConverting] = useState(false);

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
      const [contactsRes, leadsRes] = await Promise.all([
        authFetch(`/api/v1/contacts/?limit=500`),
        authFetch(`/api/v1/leads/?limit=500`),
      ]);
      if (!contactsRes.ok) throw new Error("Failed to fetch contacts");
      const contactsData: Contact[] = await contactsRes.json();
      const leadsData: { contact_id: number }[] = leadsRes.ok ? await leadsRes.json() : [];
      const leadContactIds = new Set(leadsData.map((l) => l.contact_id));
      return contactsData.map((c) => ({ ...c, has_lead: leadContactIds.has(c.id) }));
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
      toast({ title: t('contactHub.toastContactUpdated') });
    },
    onError: () => {
      toast({ title: t('contactHub.toastContactUpdateFailed'), variant: "destructive" });
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

  const toggleSelect = (id: number) =>
    setSelectedIds((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const toggleSelectAll = () => {
    const eligible = filteredContacts.filter((c) => !c.has_lead).map((c) => c.id);
    const allSelected = eligible.every((id) => selectedIds.has(id));
    setSelectedIds(allSelected ? new Set() : new Set(eligible));
  };

  const bulkConvertToLead = async () => {
    const toConvert = filteredContacts.filter((c) => selectedIds.has(c.id) && !c.has_lead);
    if (!toConvert.length) return;
    setBulkConverting(true);
    let success = 0;
    await Promise.allSettled(
      toConvert.map((c) =>
        authFetch("/api/v1/leads/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contact_id: c.id }),
        }).then((r) => { if (r.ok) success++; })
      )
    );
    toast({ title: t('contactHub.toastBulkConverted', { count: success }) });
    setSelectedIds(new Set());
    setBulkConverting(false);
    queryClient.invalidateQueries({ queryKey: ["contacts"] });
  };

  const submitContactTransition = async () => {
    if (!contactTransition) return;
    setContactTransitionSaving(true);
    try {
      const { contact, transition } = contactTransition;
      const res = await authFetch(`/api/v1/contacts/${contact.id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transition_id: transition.id, field_values: contactTransitionFields }),
      });
      if (!res.ok) throw new Error();
      setContactTransition(null);
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast({ title: t('contactHub.toastStatusUpdated') });
    } catch {
      toast({ title: t('contactHub.toastStatusUpdateFailed'), variant: "destructive" });
    } finally {
      setContactTransitionSaving(false);
    }
  };

  const openConvertDialog = (contact: Contact) => {
    setConvertingContact(contact);
    setLeadData({ source: "", deal_value: "", notes: "" });
    setConvertDialogOpen(true);
  };

  const submitConversion = async () => {
    if (!convertingContact) return;
    setConverting(true);
    try {
      await authFetch("/api/v1/leads/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact_id: convertingContact.id,
          source: leadData.source || null,
          deal_value: leadData.deal_value ? parseFloat(leadData.deal_value) : null,
          notes: leadData.notes || null,
        }),
      });
      toast({ title: t('contactHub.toastConvertedToLead', { name: convertingContact.name || t('contactHub.contact') }) });
      setConvertDialogOpen(false);
      setConvertingContact(null);
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    } catch {
      toast({ title: t('contactHub.toastConvertFailed'), variant: "destructive" });
    } finally {
      setConverting(false);
    }
  };

  const selectedSessionId = rightPanel.type === "session" ? rightPanel.sessionId : null;
  const selectedCall = rightPanel.type === "call" ? rightPanel.call : null;
  const isLoadingMiddle = isLoadingSessions || isLoadingCalls;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">

      {/* ── Top toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card flex-shrink-0">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <h1 className="text-sm font-semibold">{t('contactHub.title')}</h1>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
            {contacts.length}
          </span>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
          <button
            onClick={() => setViewMode("hub")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors",
              viewMode === "hub" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> {t('contactHub.viewHub')}
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors",
              viewMode === "list" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutList className="w-3.5 h-3.5" /> {t('contactHub.viewList')}
          </button>
        </div>
      </div>

      {/* ── List View ───────────────────────────────────────────────────────── */}
      {viewMode === "list" && (
        <div className="flex-1 overflow-auto relative">
          {/* Search + filter bar */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card sticky top-0 z-10">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder={t('contactHub.searchContactsPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="appearance-none text-xs h-8 pl-2.5 pr-7 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">{t('contactHub.allStages')}</option>
              {Object.entries(STAGE_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
            <span className="text-xs text-muted-foreground ml-auto">{t('contactHub.contactsCount', { count: filteredContacts.length })}</span>
          </div>

          {/* Bulk action bar */}
          {selectedIds.size > 0 && (
            <div className="sticky top-[57px] z-20 flex items-center gap-3 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium shadow-md">
              <span>{t('contactHub.selectedCount', { count: selectedIds.size })}</span>
              <Button
                size="sm"
                variant="secondary"
                className="h-7 text-xs gap-1.5 ml-auto"
                disabled={bulkConverting}
                onClick={bulkConvertToLead}
              >
                {bulkConverting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Target className="w-3 h-3" />}
                {t('contactHub.convertToLead')}
              </Button>
              <button
                className="text-primary-foreground/70 hover:text-primary-foreground"
                onClick={() => setSelectedIds(new Set())}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 pr-0">
                  <Checkbox
                    checked={
                      filteredContacts.filter((c) => !c.has_lead).length > 0 &&
                      filteredContacts.filter((c) => !c.has_lead).every((c) => selectedIds.has(c.id))
                    }
                    onCheckedChange={toggleSelectAll}
                    aria-label={t('contactHub.selectAll')}
                  />
                </TableHead>
                <TableHead className="w-[200px]">{t('contactHub.colName')}</TableHead>
                <TableHead>{t('contactHub.colEmail')}</TableHead>
                <TableHead>{t('contactHub.colPhone')}</TableHead>
                <TableHead>{t('contactHub.colStage')}</TableHead>
                <TableHead>{t('contactHub.colLastActive')}</TableHead>
                <TableHead>{t('contactHub.colTags')}</TableHead>
                <TableHead className="text-right">{t('contactHub.colActions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingContacts ? (
                [...Array(8)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(8)].map((__, j) => (
                      <TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse w-3/4" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredContacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-12 text-sm">
                    {t('contactHub.noContactsFound')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredContacts.map((contact) => {
                  const initials = getInitials(contact.name, contact.email);
                  const stageCfg = contact.lifecycle_stage ? STAGE_CONFIG[contact.lifecycle_stage] : null;
                  const lastActivity = contact.last_contacted_at || contact.updated_at;
                  const isSelected = selectedIds.has(contact.id);
                  return (
                    <TableRow
                      key={contact.id}
                      className={cn("group", isSelected && "bg-muted/50")}
                    >
                      <TableCell className="pr-0">
                        <Checkbox
                          checked={isSelected}
                          disabled={!!contact.has_lead}
                          onCheckedChange={() => !contact.has_lead && toggleSelect(contact.id)}
                          aria-label={`Select ${contact.name || "contact"}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold flex-shrink-0">
                            {initials}
                          </div>
                          <span className="font-medium text-sm truncate max-w-[130px]">
                            {contact.name || contact.email || t('contactHub.unknown')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{contact.email || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{contact.phone_number || "—"}</TableCell>
                      <TableCell>
                        {stageCfg ? (
                          <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", stageCfg.cls)}>
                            {stageCfg.label}
                          </span>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {lastActivity ? formatRelative(lastActivity) : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(contact.tags ?? []).slice(0, 3).map((tag) => (
                            <span key={tag.id} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground"
                              style={tag.color ? { backgroundColor: tag.color + "22", color: tag.color } : undefined}>
                              {tag.name}
                            </span>
                          ))}
                          {(contact.tags?.length ?? 0) > 3 && (
                            <span className="text-[10px] text-muted-foreground">+{(contact.tags?.length ?? 0) - 3}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm" variant="ghost"
                            className="h-7 text-xs gap-1"
                            onClick={() => { setViewMode("hub"); handleSelectContact(contact.id); }}
                          >
                            <LayoutGrid className="w-3 h-3" /> {t('contactHub.viewHub')}
                          </Button>
                          {!contact.has_lead ? (
                            <Button
                              size="sm" variant="outline"
                              className="h-7 text-xs gap-1 text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/20"
                              onClick={() => openConvertDialog(contact)}
                            >
                              <Target className="w-3 h-3" /> {t('contactHub.convertToLead')}
                            </Button>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium">
                              {t('contactHub.lead')}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ── Hub View (3-panel) ───────────────────────────────────────────────── */}
      {viewMode === "hub" && (
      <div className="flex flex-1 overflow-hidden">

      {/* ── Left Panel: Contact List ───────────────────────────────────────── */}
      <div className="w-64 flex-shrink-0 flex flex-col border-r border-border bg-card">
        {/* Header */}
        <div className="px-3 py-3 border-b border-border space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">{t('contactHub.contacts')}</h2>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
              {filteredContacts.length}
            </span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder={t('contactHub.searchPlaceholder')}
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
              className="w-full appearance-none text-xs h-8 pl-2.5 pr-7 rounded-md border border-input bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">{t('contactHub.allStages')}</option>
              {Object.entries(STAGE_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Contact list */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          {isLoadingContacts ? (
            [...Array(6)].map((_, i) => <ContactCardSkeleton key={i} />)
          ) : filteredContacts.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">{t('contactHub.noContactsFound')}</p>
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
      <div className="w-80 flex-shrink-0 flex flex-col border-r border-border bg-card">
        {!selectedContact ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <User className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">{t('contactHub.selectContact')}</p>
              <p className="text-xs mt-1 text-muted-foreground">{t('contactHub.selectContactHint')}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Profile header */}
            <div className="px-4 py-4 border-b border-border">
              {/* Avatar + name row */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-lg font-semibold flex-shrink-0 shadow-sm">
                  {getInitials(selectedContact.name, selectedContact.email)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground truncate">
                      {selectedContact.name || t('contactHub.unnamedContact')}
                    </h3>
                    {!isEditing && (
                      <button
                        onClick={handleStartEdit}
                        className="flex-shrink-0 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit contact"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-wrap mt-0.5">
                    {selectedContact.wf_status && !isEditing && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-medium text-white"
                        style={{ backgroundColor: selectedContact.wf_status.color }}
                      >
                        {selectedContact.wf_status.name}
                      </span>
                    )}
                    {selectedContact.lifecycle_stage && !isEditing && (
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                        STAGE_CONFIG[selectedContact.lifecycle_stage]?.cls ?? "bg-muted text-foreground"
                      )}>
                        {STAGE_CONFIG[selectedContact.lifecycle_stage]?.label ?? selectedContact.lifecycle_stage}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Inline edit form */}
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder={t('contactHub.namePlaceholder')}
                    className="h-7 text-xs"
                  />
                  <Input
                    value={editForm.email}
                    onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder={t('contactHub.emailPlaceholder')}
                    type="email"
                    className="h-7 text-xs"
                  />
                  <Input
                    value={editForm.phone_number}
                    onChange={(e) => setEditForm((f) => ({ ...f, phone_number: e.target.value }))}
                    placeholder={t('contactHub.phonePlaceholder')}
                    className="h-7 text-xs"
                  />
                  <div className="relative">
                    <select
                      value={editForm.lifecycle_stage}
                      onChange={(e) => setEditForm((f) => ({ ...f, lifecycle_stage: e.target.value }))}
                      className="w-full appearance-none text-xs h-7 pl-2 pr-7 rounded-md border border-input bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="">{t('contactHub.stagePlaceholder')}</option>
                      {Object.entries(STAGE_CONFIG).map(([key, cfg]) => (
                        <option key={key} value={key}>{cfg.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
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
                      {t('contactHub.save')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1.5"
                      onClick={() => setIsEditing(false)}
                    >
                      <X className="w-3 h-3" />
                      {t('contactHub.cancel')}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Contact info */}
                  <div className="space-y-1 text-xs text-muted-foreground mb-3">
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
                          className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-muted text-foreground"
                          style={tag.color ? { backgroundColor: tag.color + "22", color: tag.color } : undefined}
                        >
                          <Tag className="w-2.5 h-2.5" />
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Quick actions */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {selectedContact.phone_number && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1.5"
                        onClick={handleInitiateCall}
                        disabled={callState !== "idle"}
                      >
                        <Phone className="w-3 h-3" />
                        {t('contactHub.call')}
                      </Button>
                    )}
                    {!selectedContact.has_lead ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/20"
                        onClick={() => openConvertDialog(selectedContact)}
                      >
                        <Target className="w-3 h-3" />
                        {t('contactHub.convertToLead')}
                      </Button>
                    ) : (
                      <span className="h-7 flex items-center text-[10px] px-2 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium gap-1">
                        <Target className="w-2.5 h-2.5" /> {t('contactHub.lead')}
                      </span>
                    )}
                  </div>
                  {/* Workflow transitions */}
                  {(selectedContact.available_transitions ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {selectedContact.available_transitions!.map(t => (
                        <button
                          key={t.id}
                          onClick={() => { setContactTransition({ contact: selectedContact, transition: t }); setContactTransitionFields({}); }}
                          className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-muted hover:bg-accent text-foreground font-medium transition-colors"
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Stats row */}
              {!isEditing && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                  <div className="text-center">
                    <div className="text-base font-bold text-foreground">{stats.sessions}</div>
                    <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5">
                      <MessageSquare className="w-2.5 h-2.5" /> {t('contactHub.chats')}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-base font-bold text-foreground">{stats.calls}</div>
                    <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5">
                      <Phone className="w-2.5 h-2.5" /> {t('contactHub.calls')}
                    </div>
                  </div>
                  <div className="text-center col-span-1">
                    <div className="text-xs font-semibold text-foreground">{stats.firstContact}</div>
                    <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5">
                      <Calendar className="w-2.5 h-2.5" /> {t('contactHub.firstContact')}
                    </div>
                  </div>
                  <div className="text-center col-span-1">
                    <div className="text-xs font-semibold text-foreground">{stats.lastContact}</div>
                    <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" /> {t('contactHub.lastActive')}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Custom Fields */}
            {!isEditing && contactCustomFieldDefs.length > 0 && selectedContact?.custom_fields && Object.keys(selectedContact.custom_fields).length > 0 && (
              <div className="px-3 py-2 border-t border-border space-y-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t('contactHub.customFields')}</p>
                {contactCustomFieldDefs.map(def => (
                  <div key={def.id} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{def.label}</span>
                    <span className="font-medium">{formatCustomFieldValue(selectedContact.custom_fields?.[def.name], def)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Channel tabs */}
            {channelTabs.length > 0 && (
              <div className="px-3 py-2 border-b border-border flex flex-wrap gap-1">
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
                <p className="text-xs text-muted-foreground text-center py-8">{t('contactHub.noConversationsOrCalls')}</p>
              ) : activeChannel === "timeline" ? (
                timelineByDay.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">{t('contactHub.noActivityFound')}</p>
                ) : (
                  <div className="space-y-1">
                    {timelineByDay.map((group) => (
                      <div key={group.label}>
                        {/* Day divider */}
                        <div className="flex items-center gap-2 px-2 py-1.5">
                          <div className="flex-1 h-px bg-muted" />
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex-shrink-0">
                            {group.label}
                          </span>
                          <div className="flex-1 h-px bg-muted" />
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
                  <p className="text-xs text-muted-foreground text-center py-8">{t('contactHub.noCallsFound')}</p>
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
                <h3 className="text-base font-semibold text-foreground mb-1">
                  {t('contactHub.activityHeading', { name: selectedContact.name || t('contactHub.contact') })}
                </h3>
                <p className="text-sm text-muted-foreground max-w-[220px] mx-auto leading-relaxed">
                  {t('contactHub.selectConversationHint')}
                </p>
                <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" /> {t('contactHub.chatsCount', { count: stats.sessions })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> {t('contactHub.callsCount', { count: stats.calls })}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">{t('contactHub.selectContactToGetStarted')}</p>
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
            <div className="bg-card rounded-xl border border-border p-5">
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
                  <p className="font-semibold text-foreground capitalize">
                    {t('contactHub.callDirectionLabel', { direction: rightPanel.call.direction })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {rightPanel.call.direction === "inbound"
                      ? rightPanel.call.from_number
                      : rightPanel.call.to_number}
                  </p>
                </div>
                <span className={cn(
                  "ml-auto text-xs px-2 py-1 rounded-full font-medium",
                  rightPanel.call.status === "completed"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-muted text-muted-foreground"
                )}>
                  {rightPanel.call.status}
                </span>
              </div>

              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">{t('contactHub.duration')}</dt>
                  <dd className="font-medium text-foreground">
                    {formatDuration(rightPanel.call.duration_seconds)}
                  </dd>
                </div>
                {rightPanel.call.started_at && (
                  <div>
                    <dt className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">{t('contactHub.started')}</dt>
                    <dd className="font-medium text-foreground">
                      {new Date(rightPanel.call.started_at).toLocaleString()}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">{t('contactHub.direction')}</dt>
                  <dd className="font-medium text-foreground capitalize">
                    {rightPanel.call.direction}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">{t('contactHub.sentiment')}</dt>
                  <dd className="font-medium text-muted-foreground dark:text-muted-foreground italic text-xs">
                    {t('contactHub.notAvailable')}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Transcript */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                {t('contactHub.transcript')}
              </h4>
              {rightPanel.call.full_transcript ? (
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed max-h-[60vh] overflow-y-auto">
                  {rightPanel.call.full_transcript}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground italic">{t('contactHub.noTranscriptAvailable')}</p>
              )}
            </div>
          </div>
        )}
      </div>
      </div>
      )}

      {/* ── Contact Transition Dialog ────────────────────────────────────────── */}
      <Dialog open={!!contactTransition} onOpenChange={() => setContactTransition(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{contactTransition?.transition.name ?? t('contactHub.updateStatus')}</DialogTitle>
          </DialogHeader>
          {(contactTransition?.transition.screen_fields ?? []).map(f => {
            const cfDef = contactCustomFieldDefs.find(d => d.name === f.field);
            return (
              <div key={f.field} className="space-y-1.5">
                <Label className="text-sm">{f.label}{f.required && <span className="text-red-500 ml-1">*</span>}</Label>
                {cfDef ? (
                  <CustomFieldInput
                    definition={cfDef}
                    value={contactTransitionFields[f.field] ?? null}
                    onChange={v => setContactTransitionFields(p => ({ ...p, [f.field]: v }))}
                  />
                ) : (
                  <Input
                    value={contactTransitionFields[f.field] ?? ""}
                    onChange={e => setContactTransitionFields(p => ({ ...p, [f.field]: e.target.value }))}
                  />
                )}
              </div>
            );
          })}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setContactTransition(null)}>{t('contactHub.cancel')}</Button>
            <Button size="sm" onClick={submitContactTransition} disabled={contactTransitionSaving}>
              {contactTransitionSaving && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
              {t('contactHub.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Convert to Lead Dialog ───────────────────────────────────────────── */}
      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-500" />
              {t('contactHub.convertToLead')}
            </DialogTitle>
          </DialogHeader>
          {convertingContact && (
            <div className="space-y-4 py-1">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
                  {getInitials(convertingContact.name, convertingContact.email)}
                </div>
                <div>
                  <p className="text-sm font-medium">{convertingContact.name || t('contactHub.unnamed')}</p>
                  <p className="text-xs text-muted-foreground">{convertingContact.email || convertingContact.phone_number || ""}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t('contactHub.leadSource')}</Label>
                <Select value={leadData.source} onValueChange={(v) => setLeadData((d) => ({ ...d, source: v }))}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder={t('contactHub.selectSourcePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {["website", "referral", "social_media", "email_campaign", "cold_call", "event", "partner", "other"].map((s) => (
                      <SelectItem key={s} value={s} className="text-xs capitalize">{s.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t('contactHub.dealValue')}</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={leadData.deal_value}
                  onChange={(e) => setLeadData((d) => ({ ...d, deal_value: e.target.value }))}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t('contactHub.notes')}</Label>
                <Textarea
                  placeholder={t('contactHub.notesPlaceholder')}
                  value={leadData.notes}
                  onChange={(e) => setLeadData((d) => ({ ...d, notes: e.target.value }))}
                  className="text-xs resize-none min-h-[70px]"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setConvertDialogOpen(false)}>{t('contactHub.cancel')}</Button>
            <Button size="sm" onClick={submitConversion} disabled={converting} className="gap-1.5">
              {converting ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
              {t('contactHub.convertToLead')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
