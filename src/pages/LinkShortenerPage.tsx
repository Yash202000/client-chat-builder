import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Plus,
  Copy,
  CheckCircle2,
  Trash2,
  Link2,
  MousePointerClick,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { API_BASE_URL } from '@/config/api';
import { formatDistanceToNow } from 'date-fns';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ShortLink {
  id: number;
  company_id: number;
  code: string;
  title: string | null;
  original_url: string;
  click_count: number;
  is_active: boolean;
  created_at: string;
  last_clicked_at: string | null;
}

// ---------------------------------------------------------------------------
// CopyButton
// ---------------------------------------------------------------------------

const CopyButton: React.FC<{ text: string; label?: string }> = ({ text, label }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      title="Copy to clipboard"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
    >
      {copied ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
      {label && <span>{copied ? 'Copied!' : label}</span>}
    </button>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const DEFAULT_FORM = { original_url: '', title: '' };

export default function LinkShortenerPage() {
  const { authFetch } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const [deleteTarget, setDeleteTarget] = useState<ShortLink | null>(null);

  // ── Fetch links ────────────────────────────────────────────────────────────
  const { data: links = [], isLoading } = useQuery<ShortLink[]>({
    queryKey: ['short-links'],
    queryFn: async () => {
      const res = await authFetch(`/api/v1/short-links`);
      if (!res.ok) throw new Error('Failed to fetch links');
      return res.json();
    },
  });

  // ── Create ─────────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async (payload: { original_url: string; title?: string }) => {
      const res = await authFetch(`/api/v1/short-links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to create link');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['short-links'] });
      setDialogOpen(false);
      setForm({ ...DEFAULT_FORM });
      toast({ title: 'Link created', description: 'Your short link is ready to share.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Could not create link.', variant: 'destructive' });
    },
  });

  // ── Delete ─────────────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await authFetch(`/api/v1/short-links/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok && res.status !== 204) throw new Error('Failed to delete link');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['short-links'] });
      setDeleteTarget(null);
      toast({ title: 'Link deleted' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Could not delete link.', variant: 'destructive' });
    },
  });

  // ── Toggle active ──────────────────────────────────────────────────────────
  const toggleMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await authFetch(`/api/v1/short-links/${id}/toggle`, {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error('Failed to toggle link');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['short-links'] });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Could not toggle link.', variant: 'destructive' });
    },
  });

  // ── Helpers ────────────────────────────────────────────────────────────────
  const shortUrl = (code: string) => `${API_BASE_URL}/api/v1/s/${code}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.original_url.trim()) return;
    createMutation.mutate({
      original_url: form.original_url.trim(),
      title: form.title.trim() || undefined,
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Link2 className="w-6 h-6 text-violet-500" />
            Link Shortener
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create branded short links and track clicks in real time.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Link
        </Button>
      </div>

      {/* Stats bar */}
      {links.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Total Links</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{links.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Total Clicks</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {links.reduce((s, l) => s + (l.click_count || 0), 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Active Links</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {links.filter(l => l.is_active).length}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Link list */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-7 h-7 animate-spin text-violet-500" />
        </div>
      ) : links.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
          <Link2 className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">No short links yet</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 mb-4">
            Create your first link and start tracking clicks.
          </p>
          <Button onClick={() => setDialogOpen(true)} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            Create Link
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map(link => {
            const url = shortUrl(link.code);
            const maxClicks = Math.max(...links.map(l => l.click_count || 0), 1);
            const pct = Math.round(((link.click_count || 0) / maxClicks) * 100);

            return (
              <Card
                key={link.id}
                className={`transition-opacity ${link.is_active ? '' : 'opacity-60'}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Left: info */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      {/* Title */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {link.title ? (
                          <span className="font-semibold text-slate-800 dark:text-slate-100 truncate max-w-xs">
                            {link.title}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 italic text-sm">Untitled</span>
                        )}
                        {!link.is_active && (
                          <Badge variant="outline" className="text-xs text-slate-400">Inactive</Badge>
                        )}
                      </div>

                      {/* Short URL */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="text-xs bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded border border-violet-100 dark:border-violet-800 font-mono select-all">
                          {url}
                        </code>
                        <CopyButton text={url} label="Copy" />
                        <a
                          href={link.original_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span className="truncate max-w-[300px]">{link.original_url}</span>
                        </a>
                      </div>

                      {/* Click bar */}
                      <div className="flex items-center gap-2 mt-1">
                        <MousePointerClick className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden max-w-[160px]">
                          <div
                            className="h-full bg-violet-500 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {link.click_count || 0} click{link.click_count !== 1 ? 's' : ''}
                        </span>
                        {link.last_clicked_at && (
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            · last {formatDistanceToNow(new Date(link.last_clicked_at), { addSuffix: true })}
                          </span>
                        )}
                      </div>

                      {/* Created date */}
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        Created {formatDistanceToNow(new Date(link.created_at), { addSuffix: true })}
                      </p>
                    </div>

                    {/* Right: controls */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {link.is_active ? 'Active' : 'Off'}
                        </span>
                        <Switch
                          checked={link.is_active}
                          onCheckedChange={() => toggleMutation.mutate(link.id)}
                          disabled={toggleMutation.isPending}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => setDeleteTarget(link)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-violet-500" />
              Create Short Link
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="original_url">
                Destination URL <span className="text-red-500">*</span>
              </Label>
              <Input
                id="original_url"
                type="url"
                placeholder="https://example.com/your-long-link"
                value={form.original_url}
                onChange={e => setForm(f => ({ ...f, original_url: e.target.value }))}
                required
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="title">Title (optional)</Label>
              <Input
                id="title"
                placeholder="e.g. Summer Campaign"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setDialogOpen(false); setForm({ ...DEFAULT_FORM }); }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || !form.original_url.trim()}>
                {createMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating…</>
                ) : (
                  'Create Link'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Link?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            This will permanently delete{' '}
            <strong>{deleteTarget?.title || deleteTarget?.code}</strong> and all its click data.
            This cannot be undone.
          </p>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deleting…</>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
