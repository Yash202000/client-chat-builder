import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ClipboardList,
  Search,
  Filter,
  ChevronDown,
  User,
  Calendar,
  Activity,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuditLogUser {
  id: number;
  full_name?: string;
  email?: string;
}

interface AuditLogEntry {
  id: number;
  company_id: number;
  user_id?: number;
  user?: AuditLogUser;
  action: string;
  entity_type?: string;
  entity_id?: number;
  entity_name?: string;
  changes?: Record<string, [unknown, unknown]>;
  ip_address?: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ACTION_COLORS: Record<string, string> = {
  created: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  updated: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  deleted: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  imported: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  exported: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
};

function actionBadgeClass(action: string): string {
  const verb = action.split(".").at(-1) ?? "";
  return (
    ACTION_COLORS[verb] ??
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
  );
}

function formatDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
    time: d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
  };
}

const ENTITY_TYPES = [
  "contact",
  "lead",
  "deal",
  "campaign",
  "sequence",
  "template",
  "agent",
  "workflow",
  "user",
  "company",
  "ticket",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AuditLogsPage() {
  const { authFetch } = useAuth();

  // Filters
  const [entityType, setEntityType] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [skip, setSkip] = useState(0);
  const LIMIT = 50;

  // Applied filters (only update on explicit search / filter change)
  const [appliedFilters, setAppliedFilters] = useState({
    entity_type: "",
    action: "",
    date_from: "",
    date_to: "",
    skip: 0,
  });

  const buildQueryPath = useCallback(() => {
    const params = new URLSearchParams();
    if (appliedFilters.entity_type) params.set("entity_type", appliedFilters.entity_type);
    if (appliedFilters.action) params.set("action", appliedFilters.action);
    if (appliedFilters.date_from) params.set("date_from", new Date(appliedFilters.date_from).toISOString());
    if (appliedFilters.date_to) params.set("date_to", new Date(appliedFilters.date_to).toISOString());
    params.set("skip", String(appliedFilters.skip));
    params.set("limit", String(LIMIT));
    return `/api/v1/audit-logs/?${params.toString()}`;
  }, [appliedFilters]);

  const { data: logs = [], isLoading, isFetching } = useQuery<AuditLogEntry[]>({
    queryKey: ["audit-logs", appliedFilters],
    queryFn: async () => {
      const res = await authFetch(buildQueryPath());
      if (!res.ok) throw new Error("Failed to fetch audit logs");
      return res.json();
    },
    staleTime: 30_000,
  });

  function applyFilters() {
    setAppliedFilters({
      entity_type: entityType === "all" ? "" : entityType,
      action: actionFilter,
      date_from: dateFrom,
      date_to: dateTo,
      skip: 0,
    });
    setSkip(0);
  }

  function loadMore() {
    const newSkip = appliedFilters.skip + LIMIT;
    setSkip(newSkip);
    setAppliedFilters((prev) => ({ ...prev, skip: newSkip }));
  }

  function resetFilters() {
    setEntityType("all");
    setActionFilter("");
    setDateFrom("");
    setDateTo("");
    setAppliedFilters({ entity_type: "", action: "", date_from: "", date_to: "", skip: 0 });
    setSkip(0);
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="flex-shrink-0 px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm shrink-0">
            <ClipboardList className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">Audit Logs</h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 hidden sm:block">
              Track every action performed across your workspace
            </p>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex-shrink-0 px-4 sm:px-6 pb-3 sm:pb-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-3 sm:p-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Entity type */}
            <div>
              <Label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Entity Type</Label>
              <Select value={entityType} onValueChange={setEntityType}>
                <SelectTrigger className="h-9 rounded-lg dark:bg-slate-800 dark:border-slate-600 dark:text-white text-sm">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {ENTITY_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action search */}
            <div>
              <Label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Action</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-4 w-4 text-slate-400" />
                <Input
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  placeholder="e.g. contact.created"
                  className="pl-8 h-9 rounded-lg dark:bg-slate-800 dark:border-slate-600 dark:text-white text-sm"
                  onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                />
              </div>
            </div>

            {/* Date from */}
            <div>
              <Label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-9 rounded-lg dark:bg-slate-800 dark:border-slate-600 dark:text-white text-sm"
              />
            </div>

            {/* Date to */}
            <div>
              <Label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-9 rounded-lg dark:bg-slate-800 dark:border-slate-600 dark:text-white text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-3">
            <button
              onClick={resetFilters}
              className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 underline-offset-2 hover:underline transition-colors"
            >
              Reset filters
            </button>
            <Button
              size="sm"
              onClick={applyFilters}
              className="h-8 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium flex items-center gap-1.5"
            >
              <Filter className="h-3.5 w-3.5" />
              Apply
            </Button>
          </div>
        </div>
      </div>

      {/* Logs */}
      <div className="flex-1 min-h-0 px-4 sm:px-6 pb-4 sm:pb-6 overflow-auto">

        {/* ── Loading / empty states ── */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400 dark:text-slate-500">
            <div className="h-6 w-6 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
            <span className="text-sm">Loading audit logs…</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400 dark:text-slate-500">
            <ClipboardList className="h-8 w-8 opacity-40" />
            <p className="text-sm font-medium">No audit log entries found</p>
            <p className="text-xs">Actions will appear here once users interact with the platform.</p>
          </div>
        ) : (
          <>
            {/* ── Mobile card list (hidden sm+) ── */}
            <div className="sm:hidden space-y-2">
              {logs.map((log) => {
                const { date, time } = formatDateTime(log.created_at);
                const displayName = log.user?.full_name ?? log.user?.email ?? `User #${log.user_id}`;
                return (
                  <div key={log.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-3 shadow-sm">
                    {/* Row 1: date + action badge */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Calendar className="h-3 w-3 shrink-0" />
                        <span className="font-medium text-slate-800 dark:text-slate-200">{date}</span>
                        <span>{time}</span>
                      </div>
                      <Badge className={`text-[10px] font-medium px-2 py-0.5 rounded-md border-0 shrink-0 ${actionBadgeClass(log.action)}`}>
                        {log.action}
                      </Badge>
                    </div>
                    {/* Row 2: user */}
                    <div className="flex items-center gap-2 mb-1.5">
                      {log.user_id ? (
                        <>
                          <div className="h-5 w-5 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                            {(displayName[0] ?? "?").toUpperCase()}
                          </div>
                          <span className="text-xs text-slate-700 dark:text-slate-300 truncate">{displayName}</span>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400 italic">System</span>
                      )}
                    </div>
                    {/* Row 3: entity + IP */}
                    <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>
                        {log.entity_type && <span className="capitalize">{log.entity_type}</span>}
                        {log.entity_type && (log.entity_name || log.entity_id) && <span className="mx-1">·</span>}
                        {log.entity_name ?? (log.entity_id ? `#${log.entity_id}` : null)}
                      </span>
                      {log.ip_address && (
                        <span className="font-mono text-[10px] shrink-0">{log.ip_address}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Desktop table (hidden below sm) ── */}
            <div className="hidden sm:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                      <th className="text-left px-4 py-3 font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Date / Time</div>
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" />User</div>
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5"><Activity className="h-3.5 w-3.5" />Action</div>
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Entity Type</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Entity</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-500 dark:text-slate-400">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {logs.map((log) => {
                      const { date, time } = formatDateTime(log.created_at);
                      const displayName = log.user?.full_name ?? log.user?.email ?? `User #${log.user_id}`;
                      return (
                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-slate-800 dark:text-slate-200 font-medium">{date}</span>
                            <span className="text-slate-400 dark:text-slate-500 ml-1.5 text-xs">{time}</span>
                          </td>
                          <td className="px-4 py-3">
                            {log.user_id ? (
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                                  {(displayName[0] ?? "?").toUpperCase()}
                                </div>
                                <span className="text-slate-700 dark:text-slate-300 text-sm truncate max-w-[140px]">{displayName}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500 text-xs italic">System</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Badge className={`text-xs font-medium px-2 py-0.5 rounded-md border-0 ${actionBadgeClass(log.action)}`}>
                              {log.action}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {log.entity_type
                              ? <span className="text-slate-600 dark:text-slate-300 capitalize text-sm">{log.entity_type}</span>
                              : <span className="text-slate-300 dark:text-slate-600">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            {log.entity_name ? (
                              <span className="text-slate-700 dark:text-slate-300 text-sm">
                                {log.entity_name}
                                {log.entity_id && <span className="text-slate-400 dark:text-slate-500 text-xs ml-1">(#{log.entity_id})</span>}
                              </span>
                            ) : log.entity_id ? (
                              <span className="text-slate-500 dark:text-slate-400 text-xs">#{log.entity_id}</span>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {log.ip_address
                              ? <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{log.ip_address}</span>
                              : <span className="text-slate-300 dark:text-slate-600">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Load more */}
            {logs.length === LIMIT && (
              <div className="mt-3 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadMore}
                  disabled={isFetching}
                  className="rounded-lg dark:border-slate-600 dark:text-slate-300 text-xs flex items-center gap-1.5"
                >
                  {isFetching
                    ? <div className="h-3 w-3 rounded-full border border-current border-t-transparent animate-spin" />
                    : <ChevronDown className="h-3.5 w-3.5" />}
                  Load more
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
