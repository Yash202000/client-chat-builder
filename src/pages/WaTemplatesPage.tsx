import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Send, Search, CheckCircle2, Clock, XCircle, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '@/config/api';
import { useToast } from '@/hooks/use-toast';

interface WaTemplate {
  name: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | string;
  language: string;
  category: string;
  header?: string;
  body: string;
  buttons: string[];
  components: any[];
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.FC<any>; cls: string }> = {
  APPROVED: { label: 'Approved', icon: CheckCircle2, cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  PENDING:  { label: 'Pending',  icon: Clock,        cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  REJECTED: { label: 'Rejected', icon: XCircle,      cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

const CATEGORY_COLORS: Record<string, string> = {
  MARKETING: 'bg-blue-100 text-blue-700',
  UTILITY:   'bg-purple-100 text-purple-700',
  AUTHENTICATION: 'bg-orange-100 text-orange-700',
};

function extractVariableCount(body: string): number {
  const matches = body.match(/\{\{(\d+)\}\}/g);
  return matches ? new Set(matches).size : 0;
}

export default function WaTemplatesPage() {
  const { authFetch } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [sendDialog, setSendDialog] = useState<WaTemplate | null>(null);
  const [sending, setSending] = useState(false);
  const [sendForm, setSendForm] = useState({ phone: '', variables: [''], language: '' });

  const { data: templates = [], isLoading, refetch, isFetching } = useQuery<WaTemplate[]>({
    queryKey: ['wa-templates'],
    queryFn: async () => {
      const res = await authFetch(`/api/v1/wa-templates`);
      if (!res.ok) throw new Error('Failed to fetch templates');
      return res.json();
    },
  });

  const filtered = templates.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.body.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'ALL' || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  function openSendDialog(tpl: WaTemplate) {
    const varCount = extractVariableCount(tpl.body);
    setSendForm({
      phone: '',
      variables: Array(varCount).fill(''),
      language: tpl.language || 'en_US',
    });
    setSendDialog(tpl);
  }

  async function handleSend() {
    if (!sendDialog) return;
    if (!sendForm.phone.trim()) {
      toast({ title: 'Phone number required', variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      const res = await authFetch(`/api/v1/wa-templates/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_phone: sendForm.phone.trim(),
          template_name: sendDialog.name,
          language_code: sendForm.language,
          variables: sendForm.variables.filter(Boolean).length > 0
            ? sendForm.variables.filter(Boolean)
            : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Send failed');
      toast({ title: 'Template sent', description: `Message ID: ${data.message_id || '—'}` });
      setSendDialog(null);
    } catch (err: any) {
      toast({ title: 'Failed to send', description: err.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  }

  const varCount = sendDialog ? extractVariableCount(sendDialog.body) : 0;

  return (
    <div className="px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-green-500" />
            WhatsApp Templates
          </h1>
          <p className="text-sm text-gray-500 mt-1">Meta-approved message templates for business-initiated conversations.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Search templates…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats strip */}
      {templates.length > 0 && (
        <div className="flex gap-4 text-sm">
          {(['APPROVED', 'PENDING', 'REJECTED'] as const).map(s => {
            const cfg = STATUS_CONFIG[s];
            const Icon = cfg.icon;
            const count = templates.filter(t => t.status === s).length;
            return (
              <div key={s} className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                <Icon className="w-4 h-4" />
                <span className="font-medium">{count}</span>
                <span>{cfg.label}</span>
              </div>
            );
          })}
          <span className="text-gray-400 ml-1">· {templates.length} total</span>
        </div>
      )}

      {/* Template cards */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-40 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{templates.length === 0 ? 'No templates found. Make sure your WhatsApp integration has a WABA ID configured.' : 'No templates match your search.'}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map(tpl => {
            const cfg = STATUS_CONFIG[tpl.status] || STATUS_CONFIG['PENDING'];
            const Icon = cfg.icon;
            const catCls = CATEGORY_COLORS[tpl.category] || 'bg-gray-100 text-gray-600';
            return (
              <Card key={tpl.name} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-sm font-semibold truncate">{tpl.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge className={`${cfg.cls} border-0 text-xs flex items-center gap-1`}>
                          <Icon className="w-3 h-3" />{cfg.label}
                        </Badge>
                        {tpl.category && (
                          <Badge className={`${catCls} border-0 text-xs`}>{tpl.category}</Badge>
                        )}
                        <span className="text-xs text-gray-400">{tpl.language}</span>
                      </div>
                    </div>
                    {tpl.status === 'APPROVED' && (
                      <Button size="sm" variant="outline" className="shrink-0" onClick={() => openSendDialog(tpl)}>
                        <Send className="w-3.5 h-3.5 mr-1" />Send
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {tpl.header && (
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{tpl.header}</p>
                  )}
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 whitespace-pre-wrap">{tpl.body}</p>
                  {tpl.buttons.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap pt-1">
                      {tpl.buttons.map((btn, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-800">
                          {btn}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Send Dialog */}
      <Dialog open={!!sendDialog} onOpenChange={open => !open && setSendDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Template: {sendDialog?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {sendDialog && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {sendDialog.body}
              </div>
            )}
            <div className="space-y-2">
              <Label>Recipient phone (with country code)</Label>
              <Input
                placeholder="+1234567890"
                value={sendForm.phone}
                onChange={e => setSendForm(f => ({ ...f, phone: e.target.value }))}
              />
            </div>
            {varCount > 0 && (
              <div className="space-y-2">
                <Label>Template variables ({varCount})</Label>
                {Array.from({ length: varCount }).map((_, i) => (
                  <Input
                    key={i}
                    placeholder={`Variable {{${i + 1}}}`}
                    value={sendForm.variables[i] || ''}
                    onChange={e => {
                      const vars = [...sendForm.variables];
                      vars[i] = e.target.value;
                      setSendForm(f => ({ ...f, variables: vars }));
                    }}
                  />
                ))}
              </div>
            )}
            <div className="space-y-2">
              <Label>Language code</Label>
              <Input
                value={sendForm.language}
                onChange={e => setSendForm(f => ({ ...f, language: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialog(null)}>Cancel</Button>
            <Button onClick={handleSend} disabled={sending}>
              <Send className="w-4 h-4 mr-2" />
              {sending ? 'Sending…' : 'Send'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
