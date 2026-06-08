import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  Code2,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  Key,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE_URL } from "@/config/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UsageStats {
  total_calls: number;
  success_calls: number;
  error_calls: number;
  avg_response_ms: number;
  by_endpoint: { endpoint: string; count: number; errors: number }[];
  daily_trend: { date: string; calls: number; errors: number }[];
  api_keys: { id: number; name: string; calls: number; last_used_at: string | null }[];
}

interface LogEntry {
  id: number;
  api_key_id: number;
  api_key_name: string;
  endpoint: string;
  method: string;
  status_code: number;
  response_ms: number | null;
  created_at: string;
}

interface LogsResponse {
  total: number;
  page: number;
  limit: number;
  pages: number;
  logs: LogEntry[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusColor(code: number): string {
  if (code < 300) return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
  if (code < 400) return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
  return "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30";
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtShortDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
              {label}
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
            {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
          </div>
          <div className={`p-2.5 rounded-lg ${accent}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Copy Button
// ---------------------------------------------------------------------------

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);
  return (
    <button
      onClick={copy}
      className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
      title="Copy"
    >
      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Code Block
// ---------------------------------------------------------------------------

function CodeBlock({ code, lang = "bash" }: { code: string; lang?: string }) {
  return (
    <div className="relative group rounded-xl bg-slate-900 dark:bg-slate-950 border border-slate-700 dark:border-slate-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 dark:bg-slate-900 border-b border-slate-700">
        <span className="text-xs text-slate-400 font-mono">{lang}</span>
        <CopyButton text={code} />
      </div>
      <pre className="text-sm text-slate-200 p-4 overflow-x-auto leading-relaxed font-mono whitespace-pre">
        {code}
      </pre>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Docs Tab
// ---------------------------------------------------------------------------

function DocsTab() {
  const base = API_BASE_URL || "https://your-backend.example.com";

  const docs = [
    {
      id: "messages-send",
      title: "Send a Message",
      method: "POST",
      path: "/api/v1/developer/messages/send",
      description:
        "Send a WhatsApp, SMS, or Email message to any recipient. The channel must be configured in your workspace integrations.",
      curl: `curl -X POST "${base}/api/v1/developer/messages/send" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "channel": "whatsapp",
    "to": "+919876543210",
    "message": "Hello from AgentConnect!"
  }'`,
      js: `const response = await fetch("${base}/api/v1/developer/messages/send", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    channel: "whatsapp",      // "whatsapp" | "sms" | "email"
    to: "+919876543210",
    message: "Hello from AgentConnect!",
    subject: "Optional — email only",
  }),
});
const data = await response.json();
console.log(data.message_id);`,
    },
    {
      id: "verify-send",
      title: "Send OTP",
      method: "POST",
      path: "/api/v1/developer/verify/send",
      description:
        "Send a one-time password (OTP) to a recipient via WhatsApp, SMS, Email, or Voice.",
      curl: `curl -X POST "${base}/api/v1/developer/verify/send" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "channel": "sms",
    "recipient": "+919876543210"
  }'`,
      js: `const response = await fetch("${base}/api/v1/developer/verify/send", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    channel: "sms",           // "whatsapp" | "sms" | "email" | "voice"
    recipient: "+919876543210",
    template: "optional_template_name",
  }),
});
const { verification_id, expires_at } = await response.json();`,
    },
    {
      id: "verify-check",
      title: "Verify OTP",
      method: "POST",
      path: "/api/v1/developer/verify/check",
      description: "Validate the OTP code entered by the user against the verification session.",
      curl: `curl -X POST "${base}/api/v1/developer/verify/check" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "verification_id": "abc123",
    "code": "482910"
  }'`,
      js: `const response = await fetch("${base}/api/v1/developer/verify/check", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    verification_id: "abc123",   // from /verify/send response
    code: "482910",              // code entered by user
  }),
});
const { valid, message } = await response.json();
if (valid) console.log("OTP verified!");`,
    },
    {
      id: "cod-verify",
      title: "COD Confirmation",
      method: "POST",
      path: "/api/v1/developer/cod/verify",
      description:
        "Send a Cash-on-Delivery confirmation request to a customer via WhatsApp or SMS.",
      curl: `curl -X POST "${base}/api/v1/developer/cod/verify" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "order_id": "ORD-12345",
    "channel": "whatsapp",
    "recipient": "+919876543210",
    "order_amount": 1499.00,
    "currency": "INR",
    "customer_name": "Priya Sharma"
  }'`,
      js: `const response = await fetch("${base}/api/v1/developer/cod/verify", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    order_id: "ORD-12345",
    channel: "whatsapp",         // "whatsapp" | "sms"
    recipient: "+919876543210",
    order_amount: 1499.00,
    currency: "INR",
    customer_name: "Priya Sharma",
    webhook_url: "https://your-app.com/webhook/cod",
  }),
});
const { verification_id, status } = await response.json();`,
    },
    {
      id: "contacts",
      title: "Upsert Contact",
      method: "POST",
      path: "/api/v1/developer/contacts",
      description:
        "Create or update a contact by phone number or email. If a contact with the same identifier exists, it will be updated.",
      curl: `curl -X POST "${base}/api/v1/developer/contacts" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone_number": "+919876543210",
    "email": "priya@example.com",
    "name": "Priya Sharma",
    "lead_source": "website",
    "tags": ["premium", "india"]
  }'`,
      js: `const response = await fetch("${base}/api/v1/developer/contacts", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    phone_number: "+919876543210",
    email: "priya@example.com",
    name: "Priya Sharma",
    lead_source: "website",
    tags: ["premium", "india"],
  }),
});
const contact = await response.json();
console.log("Contact ID:", contact.id);`,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-4">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-violet-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Authentication
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              All developer API calls require an{" "}
              <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-xs font-mono text-violet-600 dark:text-violet-400">
                Authorization: Bearer YOUR_API_KEY
              </code>{" "}
              header. Create API keys in the{" "}
              <strong>API Vault</strong> section.
            </p>
          </div>
        </div>
      </div>

      {docs.map((doc) => (
        <Card
          key={doc.id}
          className="border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge
                variant="outline"
                className="font-mono text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
              >
                {doc.method}
              </Badge>
              <code className="text-sm font-mono text-slate-700 dark:text-slate-300">
                {doc.path}
              </code>
            </div>
            <CardTitle className="text-base mt-2">{doc.title}</CardTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400">{doc.description}</p>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                cURL
              </p>
              <CodeBlock code={doc.curl} lang="bash" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                JavaScript
              </p>
              <CodeBlock code={doc.js} lang="javascript" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview Tab
// ---------------------------------------------------------------------------

function OverviewTab({ days, stats }: { days: number; stats: UsageStats }) {
  const successRate =
    stats.total_calls > 0
      ? ((stats.success_calls / stats.total_calls) * 100).toFixed(1)
      : "—";

  const activeKeys = stats.api_keys.filter((k) => k.calls > 0).length;

  const chartData = stats.daily_trend.map((d) => ({
    ...d,
    date: fmtShortDate(d.date),
  }));

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Calls"
          value={stats.total_calls.toLocaleString()}
          sub={`Last ${days} days`}
          icon={Activity}
          accent="bg-violet-500/15 text-violet-600 dark:text-violet-400"
        />
        <StatCard
          label="Success Rate"
          value={stats.total_calls > 0 ? `${successRate}%` : "—"}
          sub={`${stats.success_calls.toLocaleString()} successful`}
          icon={CheckCircle2}
          accent="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          label="Avg Latency"
          value={stats.avg_response_ms ? `${stats.avg_response_ms}ms` : "—"}
          sub="Response time"
          icon={Clock}
          accent="bg-blue-500/15 text-blue-600 dark:text-blue-400"
        />
        <StatCard
          label="Active Keys"
          value={activeKeys}
          sub={`of ${stats.api_keys.length} keys`}
          icon={Key}
          accent="bg-amber-500/15 text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* Error count alert */}
      {stats.error_calls > 0 && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-red-500/8 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            <strong>{stats.error_calls.toLocaleString()}</strong> error
            {stats.error_calls !== 1 ? "s" : ""} in the last {days} days. Check your Logs tab for details.
          </span>
        </div>
      )}

      {/* Daily Trend Chart */}
      {chartData.length > 0 && (
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Daily API Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  className="text-slate-500"
                />
                <YAxis tick={{ fontSize: 11 }} className="text-slate-500" />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-bg, #1e293b)",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="calls"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={false}
                  name="Total Calls"
                />
                <Line
                  type="monotone"
                  dataKey="errors"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                  name="Errors"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Endpoint Breakdown */}
      {stats.by_endpoint.length > 0 && (
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Calls by Endpoint</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={stats.by_endpoint.map((e) => ({
                  endpoint: e.endpoint.replace("/developer/", ""),
                  count: e.count,
                  errors: e.errors,
                }))}
                margin={{ top: 4, right: 8, bottom: 0, left: -16 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                <XAxis dataKey="endpoint" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-bg, #1e293b)",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="count" fill="#8b5cf6" name="Total" radius={[4, 4, 0, 0]} />
                <Bar dataKey="errors" fill="#ef4444" name="Errors" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* API Keys Table */}
      {stats.api_keys.length > 0 && (
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">API Key Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Key Name
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Calls
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Last Used
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.api_keys.map((k) => (
                    <tr
                      key={k.id}
                      className="border-b border-slate-100 dark:border-slate-800/50 last:border-0"
                    >
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                        {k.name}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400 tabular-nums">
                        {k.calls.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 text-xs">
                        {k.last_used_at ? fmtDate(k.last_used_at) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {stats.total_calls === 0 && (
        <div className="py-16 text-center text-slate-400">
          <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No API calls recorded in the last {days} days.</p>
          <p className="text-xs mt-1 text-slate-500">
            Make your first call using any of the endpoints in the Docs tab.
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Logs Tab
// ---------------------------------------------------------------------------

function LogsTab({ days }: { days: number }) {
  const [page, setPage] = useState(1);
  const { authFetch, user } = useAuth();

  const { data, isLoading, isError } = useQuery<LogsResponse>({
    queryKey: ["developer-logs", days, page, user?.company_id],
    queryFn: async () => {
      const res = await authFetch(
        `${API_BASE_URL}/api/v1/developer/usage/logs?days=${days}&page=${page}&limit=50`,
        { headers: { "x-company-id": String(user?.company_id ?? "") } }
      );
      if (!res.ok) throw new Error("Failed to load logs");
      return res.json();
    },
    enabled: !!user?.company_id,
    keepPreviousData: true,
  } as any);

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mr-2" />
        Loading logs…
      </div>
    );

  if (isError)
    return (
      <div className="py-12 text-center text-red-500 text-sm">
        Failed to load logs. Please try again.
      </div>
    );

  if (!data || data.logs.length === 0)
    return (
      <div className="py-16 text-center text-slate-400">
        <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No API calls in the last {days} days.</p>
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Showing {(page - 1) * data.limit + 1}–{Math.min(page * data.limit, data.total)} of{" "}
          {data.total.toLocaleString()} calls
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-slate-600 dark:text-slate-400 px-1">
            {page} / {data.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
            disabled={page >= data.pages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Endpoint
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Key
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Latency
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {data.logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-slate-100 dark:border-slate-800/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="font-mono text-xs shrink-0 bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30"
                      >
                        {log.method}
                      </Badge>
                      <span className="font-mono text-xs text-slate-600 dark:text-slate-400 truncate max-w-[200px]">
                        {log.endpoint}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">
                    {log.api_key_name}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      variant="outline"
                      className={`font-mono text-xs ${statusColor(log.status_code)}`}
                    >
                      {log.status_code}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-slate-500 tabular-nums">
                    {log.response_ms != null ? `${log.response_ms}ms` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-slate-400">
                    {fmtDate(log.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function DeveloperPortalPage() {
  const [days, setDays] = useState(30);
  const { authFetch, user } = useAuth();

  const { data: stats, isLoading, isError } = useQuery<UsageStats>({
    queryKey: ["developer-stats", days, user?.company_id],
    queryFn: async () => {
      const res = await authFetch(
        `${API_BASE_URL}/api/v1/developer/usage/stats?days=${days}`,
        { headers: { "x-company-id": String(user?.company_id ?? "") } }
      );
      if (!res.ok) throw new Error("Failed to load stats");
      return res.json();
    },
    enabled: !!user?.company_id,
  });

  return (
    <div className="min-h-screen app-surface p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-lg bg-violet-500/15">
              <Code2 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Developer Portal
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Monitor your API usage, explore logs, and access documentation for all developer
            endpoints.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Period:</span>
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-32 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="h-9">
          <TabsTrigger value="overview" className="text-sm px-4">
            Overview
          </TabsTrigger>
          <TabsTrigger value="logs" className="text-sm px-4">
            Logs
          </TabsTrigger>
          <TabsTrigger value="docs" className="text-sm px-4">
            Docs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {isLoading && (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mr-2" />
              Loading stats…
            </div>
          )}
          {isError && (
            <div className="py-12 text-center text-red-500 text-sm">
              Failed to load stats. Please try again.
            </div>
          )}
          {stats && <OverviewTab days={days} stats={stats} />}
        </TabsContent>

        <TabsContent value="logs" className="mt-6">
          <LogsTab days={days} />
        </TabsContent>

        <TabsContent value="docs" className="mt-6">
          <DocsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
