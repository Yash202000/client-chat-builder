import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  ShieldAlert,
  ShieldX,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Eye,
  XCircle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SecurityLog {
  id: number;
  event_type: string;
  threat_level: string;
  blocked: boolean;
  company_id: number;
  session_id: string;
  original_message: string;
  detected_patterns: string[];
  channel: string;
  created_at: string;
}

interface SecurityStats {
  time_window_hours: number;
  total_events: number;
  blocked_count: number;
  allowed_count: number;
  block_rate: number;
  events_by_type: Record<string, number>;
  events_by_threat_level: Record<string, number>;
  top_suspicious_sessions: Array<{ session_id: string; attempt_count: number }>;
}

const getThreatBadgeColor = (level: string) => {
  switch (level) {
    case "critical":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800";
    case "high":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800";
    case "medium":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800";
    case "low":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800";
  }
};

const getThreatIcon = (level: string) => {
  switch (level) {
    case "critical":
      return <ShieldX className="h-4 w-4 text-red-500" />;
    case "high":
      return <ShieldAlert className="h-4 w-4 text-orange-500" />;
    case "medium":
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    default:
      return <Shield className="h-4 w-4 text-blue-500" />;
  }
};

export const SecurityLogs = () => {
  const { authFetch, companyId } = useAuth();
  const [timeWindow, setTimeWindow] = useState("24");
  const [threatFilter, setThreatFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<SecurityLog | null>(null);

  // Fetch security stats
  const { data: stats, isLoading: isLoadingStats, refetch: refetchStats } = useQuery<SecurityStats>({
    queryKey: ["securityStats", companyId, timeWindow],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/security-logs/stats?hours=${timeWindow}`, {
        headers: { "X-Company-ID": companyId?.toString() || "" },
      });
      if (!response.ok) throw new Error("Failed to fetch security stats");
      return response.json();
    },
    enabled: !!companyId,
  });

  // Fetch security logs
  const { data: logs, isLoading: isLoadingLogs, refetch: refetchLogs } = useQuery<SecurityLog[]>({
    queryKey: ["securityLogs", companyId, timeWindow, threatFilter],
    queryFn: async () => {
      let url = `/api/v1/security-logs/?hours=${timeWindow}&limit=50`;
      if (threatFilter !== "all") {
        url += `&threat_level=${threatFilter}`;
      }
      const response = await authFetch(url, {
        headers: { "X-Company-ID": companyId?.toString() || "" },
      });
      if (!response.ok) throw new Error("Failed to fetch security logs");
      return response.json();
    },
    enabled: !!companyId,
  });

  // Fetch critical events
  const { data: criticalEvents } = useQuery<SecurityLog[]>({
    queryKey: ["criticalSecurityEvents", companyId],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/security-logs/critical?limit=5`, {
        headers: { "X-Company-ID": companyId?.toString() || "" },
      });
      if (!response.ok) throw new Error("Failed to fetch critical events");
      return response.json();
    },
    enabled: !!companyId,
  });

  const handleRefresh = () => {
    refetchStats();
    refetchLogs();
  };

  if (isLoadingStats || isLoadingLogs) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold dark:text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-500" />
            Security Monitor
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Track prompt injection attempts and security events
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeWindow} onValueChange={setTimeWindow}>
            <SelectTrigger className="w-32 dark:bg-slate-800 dark:border-slate-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last 1 hour</SelectItem>
              <SelectItem value="6">Last 6 hours</SelectItem>
              <SelectItem value="24">Last 24 hours</SelectItem>
              <SelectItem value="168">Last 7 days</SelectItem>
              <SelectItem value="720">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={threatFilter} onValueChange={setThreatFilter}>
            <SelectTrigger className="w-32 dark:bg-slate-800 dark:border-slate-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Threats</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Total Events</span>
            </div>
            <p className="text-2xl font-bold dark:text-white">{stats?.total_events || 0}</p>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Blocked</span>
            </div>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats?.blocked_count || 0}</p>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Allowed</span>
            </div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats?.allowed_count || 0}</p>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Block Rate</span>
            </div>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats?.block_rate || 0}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Events Alert */}
      {criticalEvents && criticalEvents.length > 0 && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-800 dark:text-red-400 flex items-center gap-2 text-base">
              <ShieldX className="h-5 w-5" />
              Critical Security Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {criticalEvents.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded border border-red-200 dark:border-red-800"
                >
                  <div className="flex items-center gap-2">
                    <ShieldX className="h-4 w-4 text-red-500" />
                    <span className="text-sm dark:text-white truncate max-w-xs">
                      {event.original_message?.substring(0, 50)}...
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(event.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Threat Level Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="dark:text-white text-base">Threats by Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {["critical", "high", "medium", "low"].map((level) => {
                const count = stats?.events_by_threat_level?.[level] || 0;
                const total = stats?.total_events || 1;
                const percentage = Math.round((count / total) * 100);
                return (
                  <div key={level} className="flex items-center gap-3">
                    {getThreatIcon(level)}
                    <span className="w-16 text-sm capitalize dark:text-white">{level}</span>
                    <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          level === "critical" ? "bg-red-500" :
                          level === "high" ? "bg-orange-500" :
                          level === "medium" ? "bg-yellow-500" : "bg-blue-500"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold dark:text-white w-12 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="dark:text-white text-base">Top Suspicious Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.top_suspicious_sessions && stats.top_suspicious_sessions.length > 0 ? (
              <div className="space-y-2">
                {stats.top_suspicious_sessions.map((session, idx) => (
                  <div
                    key={session.session_id}
                    className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900/50 rounded"
                  >
                    <span className="text-sm dark:text-white font-mono truncate max-w-[200px]">
                      {session.session_id}
                    </span>
                    <Badge variant="destructive">{session.attempt_count} attempts</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-4 text-gray-500 dark:text-gray-400">
                No suspicious sessions detected
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Security Logs Table */}
      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="dark:text-white">Recent Security Events</CardTitle>
          <CardDescription className="dark:text-gray-400">
            Detailed log of blocked and flagged requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs && logs.length > 0 ? (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="flex items-center gap-3">
                    {getThreatIcon(log.threat_level)}
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className={getThreatBadgeColor(log.threat_level)}>
                          {log.threat_level}
                        </Badge>
                        <Badge variant="outline" className="dark:border-slate-600">
                          {log.event_type}
                        </Badge>
                        {log.blocked ? (
                          <Badge variant="destructive">Blocked</Badge>
                        ) : (
                          <Badge variant="secondary">Allowed</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate max-w-md">
                        {log.original_message?.substring(0, 60)}...
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No security events in this time period</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Your system is secure!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 dark:text-white">
              {selectedLog && getThreatIcon(selectedLog.threat_level)}
              Security Event Details
            </DialogTitle>
            <DialogDescription>
              Full details of the security event
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Event Type</label>
                  <p className="dark:text-white">{selectedLog.event_type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Threat Level</label>
                  <Badge className={getThreatBadgeColor(selectedLog.threat_level)}>
                    {selectedLog.threat_level}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                  <p>
                    {selectedLog.blocked ? (
                      <Badge variant="destructive">Blocked</Badge>
                    ) : (
                      <Badge variant="secondary">Allowed</Badge>
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Channel</label>
                  <p className="dark:text-white">{selectedLog.channel || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Session ID</label>
                  <p className="dark:text-white font-mono text-sm truncate">{selectedLog.session_id || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Timestamp</label>
                  <p className="dark:text-white">{new Date(selectedLog.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Original Message</label>
                <div className="mt-1 p-3 bg-slate-100 dark:bg-slate-900 rounded-lg">
                  <p className="dark:text-white text-sm whitespace-pre-wrap break-words">
                    {selectedLog.original_message}
                  </p>
                </div>
              </div>

              {selectedLog.detected_patterns && selectedLog.detected_patterns.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Detected Patterns</label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {selectedLog.detected_patterns.map((pattern, idx) => (
                      <Badge key={idx} variant="outline" className="dark:border-red-800 dark:text-red-400">
                        {pattern}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
