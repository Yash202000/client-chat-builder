import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addDays, startOfDay, isBefore, isAfter } from "date-fns";
import {
  Plus, Copy, Trash2, Eye, Settings2, Calendar, Clock, Users, ChevronRight, Link2,
  Ban, PenLine, X, ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const API = import.meta.env.VITE_API_URL ?? "";
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("accessToken") ?? ""}`,
});

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
type Day = typeof DAYS[number];

const DEFAULT_AVAILABILITY: Record<Day, { start: string; end: string }[]> = {
  monday: [{ start: "09:00", end: "17:00" }],
  tuesday: [{ start: "09:00", end: "17:00" }],
  wednesday: [{ start: "09:00", end: "17:00" }],
  thursday: [{ start: "09:00", end: "17:00" }],
  friday: [{ start: "09:00", end: "17:00" }],
  saturday: [],
  sunday: [],
};

type DateOverrides = Record<string, { start: string; end: string }[]>;

interface BookingLink {
  id: number;
  slug: string;
  title: string;
  description?: string;
  location?: string;
  duration_minutes: number;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  availability: Record<string, { start: string; end: string }[]>;
  date_overrides?: DateOverrides;
  timezone: string;
  max_advance_days: number;
  min_notice_hours: number;
  color?: string;
  is_active: boolean;
  owner_name?: string;
  created_at: string;
}

interface BookingSlot {
  id: number;
  booker_name: string;
  booker_email: string;
  booker_phone?: string;
  booker_notes?: string;
  start_time: string;
  end_time: string;
  status: string;
  created_at: string;
}

const TIMEZONES = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Sao_Paulo", "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Moscow",
  "Asia/Dubai", "Asia/Kolkata", "Asia/Singapore", "Asia/Tokyo", "Australia/Sydney",
];

function AvailabilityEditor({
  value,
  onChange,
}: {
  value: Record<string, { start: string; end: string }[]>;
  onChange: (v: Record<string, { start: string; end: string }[]>) => void;
}) {
  const { t } = useTranslation();
  const avail = { ...DEFAULT_AVAILABILITY, ...value } as Record<Day, { start: string; end: string }[]>;

  const toggle = (day: Day) => {
    const next = { ...avail };
    if (next[day].length > 0) {
      next[day] = [];
    } else {
      next[day] = [{ start: "09:00", end: "17:00" }];
    }
    onChange(next);
  };

  const update = (day: Day, idx: number, field: "start" | "end", val: string) => {
    const next = { ...avail };
    next[day] = next[day].map((w, i) => (i === idx ? { ...w, [field]: val } : w));
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {DAYS.map((day) => {
        const active = avail[day].length > 0;
        return (
          <div key={day} className="flex items-center gap-3">
            <Switch checked={active} onCheckedChange={() => toggle(day)} />
            <span className="w-24 text-sm capitalize text-gray-700">{day}</span>
            {active ? (
              <div className="flex items-center gap-1 text-sm">
                <input
                  type="time"
                  value={avail[day][0].start}
                  onChange={(e) => update(day, 0, "start", e.target.value)}
                  className="border rounded px-2 py-1 text-xs"
                />
                <span className="text-gray-400">–</span>
                <input
                  type="time"
                  value={avail[day][0].end}
                  onChange={(e) => update(day, 0, "end", e.target.value)}
                  className="border rounded px-2 py-1 text-xs"
                />
              </div>
            ) : (
              <span className="text-xs text-gray-400">{t('bookingLinks.unavailable')}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Date Overrides Editor ─────────────────────────────────────────────────────

type OverrideMode = "blocked" | "custom";

interface OverrideEditState {
  dateKey: string;      // "YYYY-MM-DD"
  mode: OverrideMode;
  windows: { start: string; end: string }[];
}

function DateOverridesEditor({
  value,
  onChange,
  maxAdvanceDays,
}: {
  value: DateOverrides;
  onChange: (v: DateOverrides) => void;
  maxAdvanceDays: number;
}) {
  const today = startOfDay(new Date());
  const maxDate = addDays(today, maxAdvanceDays);

  // calendar month navigation
  const [calMonth, setCalMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  // editing popover state
  const [editing, setEditing] = useState<OverrideEditState | null>(null);

  const daysInMonth = () => {
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const days: Date[] = [];
    // pad from Monday
    const startDow = (first.getDay() + 6) % 7; // 0=Mon
    for (let i = 0; i < startDow; i++) days.push(new Date(0)); // placeholder
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
    return days;
  };

  const openEdit = (d: Date) => {
    const key = format(d, "yyyy-MM-dd");
    const existing = value[key];
    setEditing({
      dateKey: key,
      mode: existing && existing.length === 0 ? "blocked" : "custom",
      windows: existing && existing.length > 0 ? existing : [{ start: "09:00", end: "17:00" }],
    });
  };

  const removeOverride = (key: string) => {
    const next = { ...value };
    delete next[key];
    onChange(next);
  };

  const saveEdit = () => {
    if (!editing) return;
    const next = { ...value };
    if (editing.mode === "blocked") {
      next[editing.dateKey] = [];
    } else {
      next[editing.dateKey] = editing.windows.filter(w => w.start && w.end);
    }
    onChange(next);
    setEditing(null);
  };

  const days = daysInMonth();
  const sortedKeys = Object.keys(value).sort();

  return (
    <div className="space-y-4">
      {/* Mini calendar */}
      <div className="border rounded-lg p-3 bg-gray-50">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
            className="p-1 rounded hover:bg-gray-200 text-gray-500"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-gray-700">
            {format(calMonth, "MMMM yyyy")}
          </span>
          <button
            type="button"
            onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
            className="p-1 rounded hover:bg-gray-200 text-gray-500"
          >
            <ChevronLeft className="w-4 h-4 rotate-180" />
          </button>
        </div>
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 mb-1">
          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(d => (
            <div key={d} className="text-center text-[10px] font-medium text-gray-400 py-0.5">{d}</div>
          ))}
        </div>
        {/* Days */}
        <div className="grid grid-cols-7 gap-0.5">
          {days.map((d, idx) => {
            if (d.getTime() === 0) return <div key={`ph-${idx}`} />;
            const key = format(d, "yyyy-MM-dd");
            const isPast = isBefore(d, today);
            const isFuture = isAfter(d, maxDate);
            const override = value[key];
            const isBlocked = override !== undefined && override.length === 0;
            const isCustom = override !== undefined && override.length > 0;
            const isDisabled = isPast || isFuture;
            return (
              <button
                key={key}
                type="button"
                disabled={isDisabled}
                onClick={() => openEdit(d)}
                title={isBlocked ? "Blocked" : isCustom ? "Custom hours" : "Click to add override"}
                className={[
                  "relative h-7 w-full rounded text-xs font-medium transition-colors",
                  isDisabled ? "opacity-30 cursor-not-allowed text-gray-400" : "hover:bg-indigo-50 cursor-pointer",
                  isBlocked ? "bg-red-100 text-red-600 hover:bg-red-200" : "",
                  isCustom ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200" : "",
                  !isBlocked && !isCustom && !isDisabled ? "text-gray-700" : "",
                ].join(" ")}
              >
                {d.getDate()}
                {(isBlocked || isCustom) && (
                  <span className={[
                    "absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full",
                    isBlocked ? "bg-red-500" : "bg-indigo-500",
                  ].join(" ")} />
                )}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-100 border border-red-300 inline-block" /> Blocked</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-indigo-100 border border-indigo-300 inline-block" /> Custom hours</span>
        </div>
      </div>

      {/* Override edit panel */}
      {editing && (
        <div className="border border-indigo-200 rounded-lg p-3 bg-indigo-50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-indigo-800">
              {format(new Date(editing.dateKey + "T00:00:00"), "EEE, MMM d yyyy")}
            </span>
            <button type="button" onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(e => e ? { ...e, mode: "custom" } : e)}
              className={[
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                editing.mode === "custom"
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300",
              ].join(" ")}
            >
              <PenLine className="w-3 h-3" /> Custom hours
            </button>
            <button
              type="button"
              onClick={() => setEditing(e => e ? { ...e, mode: "blocked" } : e)}
              className={[
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                editing.mode === "blocked"
                  ? "bg-red-600 text-white border-red-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-red-300",
              ].join(" ")}
            >
              <Ban className="w-3 h-3" /> Block day
            </button>
          </div>
          {editing.mode === "custom" && (
            <div className="space-y-2">
              {editing.windows.map((w, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="time"
                    value={w.start}
                    onChange={e => setEditing(ed => ed ? {
                      ...ed,
                      windows: ed.windows.map((x, j) => j === i ? { ...x, start: e.target.value } : x),
                    } : ed)}
                    className="border rounded px-2 py-1 text-xs bg-white"
                  />
                  <span className="text-gray-400 text-xs">–</span>
                  <input
                    type="time"
                    value={w.end}
                    onChange={e => setEditing(ed => ed ? {
                      ...ed,
                      windows: ed.windows.map((x, j) => j === i ? { ...x, end: e.target.value } : x),
                    } : ed)}
                    className="border rounded px-2 py-1 text-xs bg-white"
                  />
                  {editing.windows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setEditing(ed => ed ? { ...ed, windows: ed.windows.filter((_, j) => j !== i) } : ed)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setEditing(ed => ed ? { ...ed, windows: [...ed.windows, { start: "09:00", end: "17:00" }] } : ed)}
                className="text-xs text-indigo-600 hover:underline"
              >
                + Add time window
              </button>
            </div>
          )}
          {editing.mode === "blocked" && (
            <p className="text-xs text-red-600">This date will be completely unavailable for bookings.</p>
          )}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={saveEdit}
              className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 font-medium"
            >
              Save
            </button>
            {value[editing.dateKey] !== undefined && (
              <button
                type="button"
                onClick={() => { removeOverride(editing.dateKey); setEditing(null); }}
                className="px-3 py-1.5 text-red-600 text-xs rounded-lg border border-red-200 hover:bg-red-50"
              >
                Remove override
              </button>
            )}
          </div>
        </div>
      )}

      {/* List of existing overrides */}
      {sortedKeys.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Active overrides</p>
          {sortedKeys.map(key => {
            const windows = value[key];
            const isBlocked = windows.length === 0;
            return (
              <div key={key} className="flex items-center justify-between px-3 py-2 rounded-lg border bg-white text-sm">
                <div className="flex items-center gap-2">
                  {isBlocked
                    ? <Ban className="w-3.5 h-3.5 text-red-500" />
                    : <PenLine className="w-3.5 h-3.5 text-indigo-500" />}
                  <span className="font-medium text-gray-700">
                    {format(new Date(key + "T00:00:00"), "EEE, MMM d yyyy")}
                  </span>
                  <span className={`text-xs ${isBlocked ? "text-red-500" : "text-indigo-500"}`}>
                    {isBlocked ? "Blocked" : windows.map(w => `${w.start}–${w.end}`).join(", ")}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeOverride(key)}
                  className="text-gray-300 hover:text-red-500 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface LinkFormState {
  title: string;
  description: string;
  location: string;
  duration_minutes: number;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  availability: Record<string, { start: string; end: string }[]>;
  date_overrides: DateOverrides;
  timezone: string;
  max_advance_days: number;
  min_notice_hours: number;
  color: string;
  is_active: boolean;
}

const blankForm = (): LinkFormState => ({
  title: "",
  description: "",
  location: "",
  duration_minutes: 30,
  buffer_before_minutes: 0,
  buffer_after_minutes: 0,
  availability: { ...DEFAULT_AVAILABILITY },
  date_overrides: {},
  timezone: "UTC",
  max_advance_days: 60,
  min_notice_hours: 1,
  color: "#6366f1",
  is_active: true,
});

export default function BookingLinksPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<BookingLink | null>(null);
  const [form, setForm] = useState<LinkFormState>(blankForm());
  const [bookingsSheet, setBookingsSheet] = useState<BookingLink | null>(null);

  const { data: links = [], isLoading } = useQuery<BookingLink[]>({
    queryKey: ["booking-links"],
    queryFn: async () => {
      const res = await fetch(`${API}/api/v1/booking-links/`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch booking links");
      return res.json();
    },
  });

  const { data: bookings = [] } = useQuery<BookingSlot[]>({
    queryKey: ["booking-slots", bookingsSheet?.id],
    queryFn: async () => {
      const res = await fetch(`${API}/api/v1/booking-links/${bookingsSheet!.id}/bookings`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch bookings");
      return res.json();
    },
    enabled: !!bookingsSheet,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<LinkFormState>) => {
      const res = await fetch(`${API}/api/v1/booking-links/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create booking link");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["booking-links"] });
      setDialogOpen(false);
      toast({ title: t('bookingLinks.created') });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<LinkFormState> }) => {
      const res = await fetch(`${API}/api/v1/booking-links/${id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update booking link");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["booking-links"] });
      setDialogOpen(false);
      setEditingLink(null);
      toast({ title: t('bookingLinks.updated') });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API}/api/v1/booking-links/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete booking link");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["booking-links"] });
      toast({ title: t('bookingLinks.deleted') });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openCreate = () => {
    setEditingLink(null);
    setForm(blankForm());
    setDialogOpen(true);
  };

  const openEdit = (link: BookingLink) => {
    setEditingLink(link);
    setForm({
      title: link.title,
      description: link.description ?? "",
      location: link.location ?? "",
      duration_minutes: link.duration_minutes,
      buffer_before_minutes: link.buffer_before_minutes,
      buffer_after_minutes: link.buffer_after_minutes,
      availability: link.availability,
      date_overrides: link.date_overrides ?? {},
      timezone: link.timezone,
      max_advance_days: link.max_advance_days,
      min_notice_hours: link.min_notice_hours,
      color: link.color ?? "#6366f1",
      is_active: link.is_active,
    });
    setDialogOpen(true);
  };

  const submit = () => {
    const payload = {
      ...form,
      description: form.description || undefined,
      location: form.location || undefined,
    };
    if (editingLink) {
      updateMutation.mutate({ id: editingLink.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/book/${slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: t('bookingLinks.linkCopied') });
  };

  const fmtDt = (iso: string) =>
    new Date(iso).toLocaleString([], {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });

  const isBusy = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('bookingLinks.title')}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {t('bookingLinks.subtitle')}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" /> {t('bookingLinks.newBookingLink')}
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : links.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">{t('bookingLinks.noBookingLinks')}</p>
          <p className="text-sm mt-1">{t('bookingLinks.noBookingLinksDesc')}</p>
          <Button onClick={openCreate} className="mt-4" variant="outline">
            <Plus className="w-4 h-4 mr-2" /> {t('bookingLinks.createBookingLink')}
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('bookingLinks.table.name')}</TableHead>
                <TableHead>{t('bookingLinks.table.duration')}</TableHead>
                <TableHead>{t('bookingLinks.table.status')}</TableHead>
                <TableHead>{t('bookingLinks.table.created')}</TableHead>
                <TableHead className="text-right">{t('bookingLinks.table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {links.map((link) => (
                <TableRow key={link.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: link.color ?? "#6366f1" }}
                      />
                      <div>
                        <p className="font-medium text-gray-900">{link.title}</p>
                        <p className="text-xs text-gray-400 font-mono">/book/{link.slug}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock className="w-3.5 h-3.5" />
                      {link.duration_minutes} min
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={link.is_active ? "default" : "secondary"}>
                      {link.is_active ? t('bookingLinks.status.active') : t('bookingLinks.status.inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(link.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyLink(link.slug)}
                        title={t('bookingLinks.actions.copyLink')}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(`/book/${link.slug}`, "_blank")}
                        title={t('bookingLinks.actions.preview')}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setBookingsSheet(link)}
                        title={t('bookingLinks.actions.viewBookings')}
                      >
                        <Users className="w-3.5 h-3.5" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <Settings2 className="w-3.5 h-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(link)}>
                            {t('bookingLinks.actions.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              if (confirm(t('bookingLinks.deleteConfirm'))) {
                                deleteMutation.mutate(link.id);
                              }
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> {t('bookingLinks.actions.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) { setDialogOpen(false); setEditingLink(null); } }}>
        <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLink ? t('bookingLinks.editBookingLink') : t('bookingLinks.newBookingLink')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>{t('bookingLinks.form.titleLabel')}</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder={t('bookingLinks.form.titlePlaceholder')}
                  className="mt-1"
                />
              </div>
              <div className="col-span-2">
                <Label>{t('bookingLinks.form.descriptionLabel')}</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder={t('bookingLinks.form.descriptionPlaceholder')}
                  rows={2}
                  className="mt-1"
                />
              </div>
              <div className="col-span-2">
                <Label>{t('bookingLinks.form.locationLabel')}</Label>
                <Input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder={t('bookingLinks.form.locationPlaceholder')}
                  className="mt-1"
                />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>{t('bookingLinks.form.durationLabel')}</Label>
                <Input
                  type="number"
                  min={5}
                  value={form.duration_minutes}
                  onChange={(e) => setForm({ ...form, duration_minutes: +e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>{t('bookingLinks.form.bufferBeforeLabel')}</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.buffer_before_minutes}
                  onChange={(e) => setForm({ ...form, buffer_before_minutes: +e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>{t('bookingLinks.form.bufferAfterLabel')}</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.buffer_after_minutes}
                  onChange={(e) => setForm({ ...form, buffer_after_minutes: +e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>{t('bookingLinks.form.minNoticeLabel')}</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.min_notice_hours}
                  onChange={(e) => setForm({ ...form, min_notice_hours: +e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>{t('bookingLinks.form.maxAdvanceLabel')}</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.max_advance_days}
                  onChange={(e) => setForm({ ...form, max_advance_days: +e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>{t('bookingLinks.form.colorLabel')}</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-10 h-9 rounded border cursor-pointer"
                  />
                  <Input
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label>{t('bookingLinks.form.timezoneLabel')}</Label>
              <select
                value={form.timezone}
                onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>

            <Separator />

            <div>
              <Label className="mb-3 block">{t('bookingLinks.form.availabilityLabel')}</Label>
              <AvailabilityEditor
                value={form.availability}
                onChange={(v) => setForm({ ...form, availability: v })}
              />
            </div>

            <Separator />

            <div>
              <Label className="mb-1 block">Date Overrides</Label>
              <p className="text-xs text-gray-500 mb-3">
                Block specific dates or set custom hours that override your weekly schedule.
              </p>
              <DateOverridesEditor
                value={form.date_overrides}
                onChange={(v) => setForm({ ...form, date_overrides: v })}
                maxAdvanceDays={form.max_advance_days}
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
              <Label>{t('bookingLinks.form.activeLabel')}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={submit} disabled={!form.title || isBusy}>
              {isBusy ? t('bookingLinks.saving') : editingLink ? t('bookingLinks.saveChanges') : t('bookingLinks.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bookings Sheet */}
      <Sheet open={!!bookingsSheet} onOpenChange={(o) => { if (!o) setBookingsSheet(null); }}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t('bookingLinks.bookingsTitle', { title: bookingsSheet?.title })}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            {bookingsSheet && (
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs text-gray-500">
                <Link2 className="w-3 h-3" />
                <span
                  className="font-mono truncate cursor-pointer hover:text-indigo-600"
                  onClick={() => copyLink(bookingsSheet.slug)}
                >
                  {window.location.origin}/book/{bookingsSheet.slug}
                </span>
                <Copy
                  className="w-3 h-3 flex-shrink-0 cursor-pointer hover:text-indigo-600"
                  onClick={() => copyLink(bookingsSheet!.slug)}
                />
              </div>
            )}
            <Separator />
            {bookings.length === 0 ? (
              <p className="text-center text-gray-500 py-8 text-sm">{t('bookingLinks.noBookings')}</p>
            ) : (
              bookings.map((b) => (
                <div key={b.id} className="border rounded-lg p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm text-gray-900">{b.booker_name}</p>
                    <Badge
                      variant={
                        b.status === "confirmed"
                          ? "default"
                          : b.status === "cancelled"
                          ? "destructive"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {b.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">{b.booker_email}</p>
                  <p className="text-xs text-gray-600">
                    {fmtDt(b.start_time)} – {fmtDt(b.end_time)}
                  </p>
                  {b.booker_notes && (
                    <p className="text-xs text-gray-500 italic">"{b.booker_notes}"</p>
                  )}
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
