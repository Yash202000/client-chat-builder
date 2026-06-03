import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell, PieChart, Pie,
} from 'recharts';
import {
  ShieldCheck, Radio, MousePointerClick, Package,
  Smartphone, TrendingUp, CheckCircle2, XCircle, Clock,
  MessageSquare, BarChart3,
} from 'lucide-react';
import { API_BASE_URL } from '@/config/api';
import { format } from 'date-fns';

const COLORS = ['#25D366', '#128C7E', '#075E54', '#34D399', '#6EE7B7', '#A7F3D0'];
const CHANNEL_COLORS: Record<string, string> = {
  whatsapp: '#25D366', sms: '#3B82F6', email: '#F59E0B', voice: '#8B5CF6', flash_call: '#EF4444',
};

// ---- reusable stat card ----
const StatCard: React.FC<{
  title: string; value: string | number; sub?: string;
  icon: React.FC<any>; iconColor?: string; trend?: number;
}> = ({ title, value, sub, icon: Icon, iconColor = 'text-green-500', trend }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gray-50 dark:bg-gray-800`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          <TrendingUp className="w-3 h-3" />
          {trend >= 0 ? '+' : ''}{trend}% vs prev period
        </div>
      )}
    </CardContent>
  </Card>
);

// ---- section wrapper ----
const Section: React.FC<{ title: string; icon: React.FC<any>; color: string; children: React.ReactNode }> = ({ title, icon: Icon, color, children }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2">
      <Icon className={`w-5 h-5 ${color}`} />
      <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
    </div>
    {children}
  </div>
);

export default function CommsAnalyticsPage() {
  const { authFetch } = useAuth();
  const [days, setDays] = useState('30');

  const fetcher = (path: string) => async () => {
    const res = await authFetch(`/api/v1/comms-analytics/${path}?days=${days}`);
    if (!res.ok) throw new Error('Failed');
    return res.json();
  };

  const { data: summary, isLoading: loadingSummary } = useQuery({ queryKey: ['ca-summary', days], queryFn: fetcher('summary') });
  const { data: otp } = useQuery({ queryKey: ['ca-otp', days], queryFn: fetcher('otp') });
  const { data: broadcast } = useQuery({ queryKey: ['ca-broadcast', days], queryFn: fetcher('broadcast') });
  const { data: ctwa } = useQuery({ queryKey: ['ca-ctwa', days], queryFn: fetcher('ctwa') });
  const { data: cod } = useQuery({ queryKey: ['ca-cod', days], queryFn: fetcher('cod') });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-green-500" />
            Communications Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-1">Unified performance across OTP, Broadcast, CTWA, COD and Widgets.</p>
        </div>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary KPI strip */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard title="OTPs Sent" value={summary.otp.total_sent} sub={`${summary.otp.verification_rate}% verified`} icon={ShieldCheck} iconColor="text-purple-500" />
          <StatCard title="Messages Broadcast" value={summary.broadcast.total_messages_sent} sub={`${summary.broadcast.total_broadcasts} campaigns`} icon={Radio} iconColor="text-green-500" />
          <StatCard title="CTWA Clicks" value={summary.ctwa.total_clicks} sub={`${summary.ctwa.conversion_rate}% converted`} icon={MousePointerClick} iconColor="text-blue-500" />
          <StatCard title="COD Confirmations" value={summary.cod.confirmed} sub={`${summary.cod.confirmation_rate}% rate`} icon={Package} iconColor="text-orange-500" />
          <StatCard title="Active Widgets" value={summary.widgets.active_widgets} icon={Smartphone} iconColor="text-teal-500" />
        </div>
      )}

      {/* OTP Section */}
      {otp && (
        <Section title="OTP Verification" icon={ShieldCheck} color="text-purple-500">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Channel breakdown */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">By Channel</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(otp.by_channel as Record<string, any>).map(([ch, data]: [string, any]) => (
                    <div key={ch}>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: CHANNEL_COLORS[ch] || '#999' }} />
                          <span className="text-sm capitalize font-medium text-gray-700 dark:text-gray-200">{ch.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{data.total} sent</span>
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0 text-xs">{data.verification_rate}%</Badge>
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${data.verification_rate}%`, background: CHANNEL_COLORS[ch] || '#999' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Daily trend */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Daily Trend</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={otp.daily_trend}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="sent" stroke="#8B5CF6" strokeWidth={2} dot={false} name="Sent" />
                    <Line type="monotone" dataKey="verified" stroke="#25D366" strokeWidth={2} dot={false} name="Verified" />
                    <Legend iconSize={8} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </Section>
      )}

      {/* Broadcast Section */}
      {broadcast && (
        <Section title="Broadcast" icon={Radio} color="text-green-500">
          <div className="grid md:grid-cols-3 gap-4">
            <StatCard title="Total Sent" value={broadcast.total_messages_sent} icon={MessageSquare} iconColor="text-green-500" />
            <StatCard title="Failed" value={broadcast.total_failed} icon={XCircle} iconColor="text-red-500" />
            <StatCard title="Delivery Rate" value={`${broadcast.delivery_rate}%`} icon={CheckCircle2} iconColor="text-teal-500" />
          </div>
          {broadcast.recent?.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Recent Broadcasts</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {broadcast.recent.map((b: any) => {
                    const rate = b.total_contacts > 0 ? Math.round(b.sent_count / b.total_contacts * 100) : 0;
                    return (
                      <div key={b.id} className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{b.name}</p>
                          <p className="text-xs text-gray-400">{b.sent_count}/{b.total_contacts} sent · {b.channel}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${rate}%` }} />
                          </div>
                          <span className="text-xs text-gray-500 w-8 text-right">{rate}%</span>
                          <Badge variant={b.status === 'completed' ? 'default' : 'secondary'} className="text-xs capitalize">{b.status}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </Section>
      )}

      {/* CTWA Section */}
      {ctwa && (
        <Section title="Click to WhatsApp (CTWA)" icon={MousePointerClick} color="text-blue-500">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Clicks vs Conversions</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={ctwa.daily_trend}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="clicks" fill="#3B82F6" radius={[3, 3, 0, 0]} name="Clicks" />
                    <Bar dataKey="converted" fill="#25D366" radius={[3, 3, 0, 0]} name="Converted" />
                    <Legend iconSize={8} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Top Links</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2.5">
                  {ctwa.top_links.map((l: any, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                        <span className="text-sm text-gray-700 dark:text-gray-200 truncate">{l.name}</span>
                        {!l.is_active && <Badge variant="secondary" className="text-xs">off</Badge>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 flex-shrink-0">
                        <span>{l.clicks} clicks</span>
                        <span className="text-green-600">{l.contacts} contacts</span>
                      </div>
                    </div>
                  ))}
                  {ctwa.top_links.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No links yet</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </Section>
      )}

      {/* COD Section */}
      {cod && (
        <Section title="Cash on Delivery (COD) Verification" icon={Package} color="text-orange-500">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Sent', value: cod.total, color: 'text-gray-700 dark:text-gray-200' },
                { label: 'Confirmed', value: cod.confirmed, color: 'text-green-600' },
                { label: 'Cancelled', value: cod.cancelled, color: 'text-red-500' },
                { label: 'Expired', value: cod.expired, color: 'text-yellow-500' },
              ].map(s => (
                <Card key={s.label}>
                  <CardContent className="p-3 text-center">
                    <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Outcome Breakdown</CardTitle></CardHeader>
              <CardContent className="flex items-center justify-center">
                {cod.total > 0 ? (
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Confirmed', value: cod.confirmed },
                          { name: 'Cancelled', value: cod.cancelled },
                          { name: 'Expired', value: cod.expired },
                          { name: 'Pending', value: cod.total - cod.confirmed - cod.cancelled - cod.expired },
                        ].filter(d => d.value > 0)}
                        cx="50%" cy="50%" innerRadius={40} outerRadius={65}
                        dataKey="value" nameKey="name"
                      >
                        {['#25D366', '#EF4444', '#F59E0B', '#9CA3AF'].map((color, i) => (
                          <Cell key={i} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend iconSize={8} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-gray-400 py-8">No COD verifications yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </Section>
      )}
    </div>
  );
}
