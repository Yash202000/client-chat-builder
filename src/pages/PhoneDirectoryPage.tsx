import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, Plus, Search, Pencil, Trash2, X, Check,
  PhoneForwarded, Voicemail, Hash, Mail, Building2,
  Users, PhoneCall, MicOff, ChevronRight, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { getUsers } from '@/services/userService';
import type { User } from '@/types/user';

// ── Types ──────────────────────────────────────────────────────────────────────

interface ExtConfig {
  ext: string;
  department: string;
  directNumber: string;
  status: 'active' | 'inactive';
  voicemailEnabled: boolean;
  forwardTo: string;
}

interface Extension extends ExtConfig {
  id: string;       // `user-${userId}`
  userId: number;
  name: string;
  email: string;
  profilePicture?: string;
}

type Department = 'All' | 'Sales' | 'Support' | 'Engineering' | 'Management' | 'Other';

const DEPARTMENTS: Department[] = ['All', 'Sales', 'Support', 'Engineering', 'Management', 'Other'];

const BLANK_CONFIG: ExtConfig = {
  ext: '',
  department: 'Sales',
  directNumber: '',
  status: 'active',
  voicemailEnabled: true,
  forwardTo: '',
};

// ── localStorage helpers ───────────────────────────────────────────────────────

const LS_KEY = 'phone_ext_configs';

function loadConfigs(): Record<number, ExtConfig> {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function saveConfigs(configs: Record<number, ExtConfig>) {
  localStorage.setItem(LS_KEY, JSON.stringify(configs));
}

function userDisplayName(u: User) {
  return [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email;
}

function userInitials(u: User) {
  if (u.first_name) return (u.first_name[0] + (u.last_name?.[0] ?? '')).toUpperCase();
  return u.email[0].toUpperCase();
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Extension['status'] }) {
  return status === 'active' ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
      <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
      Inactive
    </span>
  );
}

function DeptChip({ dept, active, onClick }: { dept: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
        active
          ? 'bg-violet-500/15 text-violet-400 border-violet-500/30'
          : 'bg-transparent text-muted-foreground border-border/50 hover:border-border hover:text-foreground'
      }`}
    >
      {dept}
    </button>
  );
}

// ── Extension config form (no name/email — those come from the user) ───────────

function ExtConfigForm({
  value,
  onChange,
}: {
  value: ExtConfig;
  onChange: (v: ExtConfig) => void;
}) {
  const set = (field: keyof ExtConfig, val: string | boolean) =>
    onChange({ ...value, [field]: val });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Extension #</label>
          <div className="relative">
            <Hash className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={value.ext}
              onChange={e => set('ext', e.target.value)}
              placeholder="101"
              className="pl-8 h-9 text-sm font-mono"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Department</label>
          <Select value={value.department} onValueChange={v => set('department', v)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENTS.filter(d => d !== 'All').map(d => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1.5">Direct DID (optional)</label>
        <div className="relative">
          <Phone className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={value.directNumber}
            onChange={e => set('directNumber', e.target.value)}
            placeholder="+1 (415) 555-0100"
            className="pl-8 h-9 text-sm font-mono"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1.5">Forward To (extension, optional)</label>
        <div className="relative">
          <PhoneForwarded className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={value.forwardTo}
            onChange={e => set('forwardTo', e.target.value)}
            placeholder="201"
            className="pl-8 h-9 text-sm font-mono"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => set('status', value.status === 'active' ? 'inactive' : 'active')}
            className={`relative h-5 w-9 rounded-full transition-colors ${
              value.status === 'active' ? 'bg-emerald-500' : 'bg-muted-foreground/30'
            }`}
          >
            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
              value.status === 'active' ? 'translate-x-4' : 'translate-x-0.5'
            }`} />
          </button>
          <span className="text-xs text-muted-foreground">Active status</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => set('voicemailEnabled', !value.voicemailEnabled)}
            className={`relative h-5 w-9 rounded-full transition-colors ${
              value.voicemailEnabled ? 'bg-violet-500' : 'bg-muted-foreground/30'
            }`}
          >
            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
              value.voicemailEnabled ? 'translate-x-4' : 'translate-x-0.5'
            }`} />
          </button>
          <span className="text-xs text-muted-foreground">Voicemail</span>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function PhoneDirectoryPage() {
  // Fetch real team users
  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  });

  // Extension configs stored in localStorage, keyed by userId
  const [configs, setConfigs] = useState<Record<number, ExtConfig>>(loadConfigs);

  const persistConfigs = useCallback((next: Record<number, ExtConfig>) => {
    setConfigs(next);
    saveConfigs(next);
  }, []);

  // Merge users + configs → Extension list (only users with assigned extensions)
  const extensions = useMemo<Extension[]>(() => {
    return users
      .filter(u => configs[u.id])
      .map(u => ({
        ...configs[u.id],
        id: `user-${u.id}`,
        userId: u.id,
        name: userDisplayName(u),
        email: u.email,
        profilePicture: u.profile_picture_url,
      }));
  }, [users, configs]);

  // Users without an extension (available to assign)
  const unassignedUsers = useMemo(
    () => users.filter(u => !configs[u.id]),
    [users, configs]
  );

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<Department>('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Add dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [addUserId, setAddUserId] = useState<number | null>(null);
  const [addForm, setAddForm] = useState<ExtConfig>(BLANK_CONFIG);

  // Inline edit state
  const [editForm, setEditForm] = useState<{ id: string; config: ExtConfig } | null>(null);

  // Stats
  const totalActive = useMemo(() => extensions.filter(e => e.status === 'active').length, [extensions]);
  const voicemailCount = useMemo(() => extensions.filter(e => e.voicemailEnabled).length, [extensions]);
  const deptCount = useMemo(() => new Set(extensions.map(e => e.department)).size, [extensions]);

  // Filtered list
  const filtered = useMemo(() => {
    return extensions.filter(e => {
      const matchDept = deptFilter === 'All' || e.department === deptFilter;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.ext.includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q) ||
        e.directNumber.includes(q);
      return matchDept && matchSearch;
    });
  }, [extensions, deptFilter, search]);

  const selectedExt = useMemo(
    () => extensions.find(e => e.id === selectedId) ?? null,
    [extensions, selectedId]
  );

  // Handlers
  const handleAdd = useCallback(() => {
    if (!addUserId || !addForm.ext) return;
    persistConfigs({ ...configs, [addUserId]: addForm });
    setAddOpen(false);
    setAddUserId(null);
    setAddForm(BLANK_CONFIG);
  }, [addUserId, addForm, configs, persistConfigs]);

  const handleSaveEdit = useCallback(() => {
    if (!editForm) return;
    const ext = extensions.find(e => e.id === editForm.id);
    if (!ext) return;
    persistConfigs({ ...configs, [ext.userId]: editForm.config });
    setEditForm(null);
  }, [editForm, extensions, configs, persistConfigs]);

  const handleDelete = useCallback((id: string) => {
    const ext = extensions.find(e => e.id === id);
    if (!ext) return;
    const next = { ...configs };
    delete next[ext.userId];
    persistConfigs(next);
    if (selectedId === id) setSelectedId(null);
  }, [extensions, configs, persistConfigs, selectedId]);

  const startEdit = useCallback((ext: Extension) => {
    setSelectedId(ext.id);
    setEditForm({
      id: ext.id,
      config: {
        ext: ext.ext,
        department: ext.department,
        directNumber: ext.directNumber,
        status: ext.status,
        voicemailEnabled: ext.voicemailEnabled,
        forwardTo: ext.forwardTo,
      },
    });
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-6 py-4 border-b border-border/60 flex-shrink-0"
      >
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-aurora-sm">
            <PhoneCall className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="font-display text-base font-semibold text-foreground leading-tight">
              Phone Directory
            </h1>
            <p className="text-[11px] text-muted-foreground">
              {loadingUsers ? 'Loading team…' : `${users.length} team members · ${extensions.length} extensions configured`}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          className="gap-1.5 h-8 text-xs bg-violet-600 hover:bg-violet-700 text-white"
          onClick={() => { setAddForm(BLANK_CONFIG); setAddUserId(null); setAddOpen(true); }}
          disabled={loadingUsers || unassignedUsers.length === 0}
        >
          <Plus className="h-3.5 w-3.5" />
          Assign Extension
        </Button>
      </motion.div>

      {/* ── Stats row ───────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-4 gap-px border-b border-border/60 bg-border/30 flex-shrink-0"
      >
        {[
          { label: 'Total Extensions', value: extensions.length, icon: Hash, color: 'text-violet-400' },
          { label: 'Active', value: totalActive, icon: PhoneCall, color: 'text-emerald-400' },
          { label: 'Voicemail Enabled', value: voicemailCount, icon: Voicemail, color: 'text-cyan-400' },
          { label: 'Departments', value: deptCount, icon: Building2, color: 'text-orange-400' },
        ].map(stat => (
          <div key={stat.label} className="flex items-center gap-3 px-5 py-3 bg-card">
            <stat.icon className={`h-4 w-4 ${stat.color} flex-shrink-0`} />
            <div>
              <p className={`font-mono text-xl font-bold leading-none ${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* ── Body: two-column ────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: list ────────────────────────────────────────────────────── */}
        <div className="flex flex-col w-full lg:w-[54%] border-r border-border/60 overflow-hidden">
          {/* Search + filters */}
          <div className="px-4 py-3 space-y-2.5 border-b border-border/40 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, ext, email…"
                className="pl-8 h-8 text-xs"
              />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {DEPARTMENTS.map(d => (
                <DeptChip key={d} dept={d} active={deptFilter === d} onClick={() => setDeptFilter(d)} />
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-y-auto">
            {loadingUsers ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p className="text-sm">Loading team members…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
                <MicOff className="h-7 w-7 opacity-30" />
                <p className="text-sm">
                  {extensions.length === 0 ? 'No extensions assigned yet' : 'No extensions found'}
                </p>
                {extensions.length === 0 && unassignedUsers.length > 0 && (
                  <button
                    onClick={() => setAddOpen(true)}
                    className="text-xs text-violet-400 hover:underline"
                  >
                    Assign the first extension →
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                <AnimatePresence initial={false}>
                  {filtered.map((ext, i) => (
                    <motion.div
                      key={ext.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => { setSelectedId(ext.id); setEditForm(null); }}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors group ${
                        selectedId === ext.id
                          ? 'bg-violet-500/8 border-r-2 border-r-violet-500'
                          : 'hover:bg-muted/30'
                      }`}
                    >
                      {/* Avatar + ext badge */}
                      <div className="relative flex-shrink-0">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={ext.profilePicture} />
                          <AvatarFallback className="text-xs font-semibold bg-violet-500/10 text-violet-400">
                            {ext.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="absolute -bottom-1 -right-1 h-4 min-w-4 px-0.5 rounded-md bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-[9px] font-bold text-white font-mono leading-none">
                          {ext.ext}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground truncate">{ext.name}</span>
                          <StatusBadge status={ext.status} />
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-muted-foreground truncate">{ext.department}</span>
                          {ext.voicemailEnabled && <Voicemail className="h-3 w-3 text-muted-foreground/60 flex-shrink-0" />}
                          {ext.forwardTo && (
                            <span className="flex items-center gap-0.5 text-[10px] text-cyan-400">
                              <PhoneForwarded className="h-2.5 w-2.5" />→ {ext.forwardTo}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Hover actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={e => { e.stopPropagation(); startEdit(ext); }}
                          className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); handleDelete(ext.id); }}
                          className="h-7 w-7 rounded-md hover:bg-red-500/10 flex items-center justify-center text-muted-foreground hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <ChevronRight className={`h-3.5 w-3.5 flex-shrink-0 transition-opacity ${selectedId === ext.id ? 'opacity-100 text-violet-400' : 'opacity-0 group-hover:opacity-60 text-muted-foreground/40'}`} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Footer count */}
          <div className="px-4 py-2 border-t border-border/40 flex-shrink-0">
            <p className="text-[11px] text-muted-foreground">
              {filtered.length} of {extensions.length} extension{extensions.length !== 1 ? 's' : ''}
              {unassignedUsers.length > 0 && (
                <span className="ml-2 text-muted-foreground/50">· {unassignedUsers.length} unassigned</span>
              )}
            </p>
          </div>
        </div>

        {/* ── Right: detail / edit panel ──────────────────────────────────── */}
        <div className="hidden lg:flex flex-col flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {!selectedExt ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground"
              >
                <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center">
                  <Users className="h-6 w-6 opacity-40" />
                </div>
                <p className="text-sm font-medium">Select an extension</p>
                <p className="text-xs text-muted-foreground/60">Click a row to view details</p>
              </motion.div>
            ) : editForm && editForm.id === selectedExt.id ? (
              /* Edit mode */
              <motion.div
                key={`edit-${selectedExt.id}`}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                className="flex flex-col h-full"
              >
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60 flex-shrink-0">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={selectedExt.profilePicture} />
                      <AvatarFallback className="text-xs font-semibold bg-violet-500/10 text-violet-400">
                        {selectedExt.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{selectedExt.name}</p>
                      <p className="text-[11px] text-muted-foreground">{selectedExt.email}</p>
                    </div>
                  </div>
                  <button onClick={() => setEditForm(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-5">
                  <ExtConfigForm
                    value={editForm.config}
                    onChange={config => setEditForm({ ...editForm, config })}
                  />
                </div>
                <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-border/60 flex-shrink-0">
                  <Button variant="outline" size="sm" onClick={() => setEditForm(null)} className="h-8 text-xs">Cancel</Button>
                  <Button
                    size="sm"
                    className="h-8 text-xs gap-1.5 bg-violet-600 hover:bg-violet-700 text-white"
                    onClick={handleSaveEdit}
                  >
                    <Check className="h-3.5 w-3.5" />
                    Save Changes
                  </Button>
                </div>
              </motion.div>
            ) : (
              /* View mode */
              <motion.div
                key={`view-${selectedExt.id}`}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                className="flex flex-col h-full"
              >
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60 flex-shrink-0">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={selectedExt.profilePicture} />
                      <AvatarFallback className="text-xs font-semibold bg-violet-500/10 text-violet-400">
                        {selectedExt.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{selectedExt.name}</p>
                        <span className="font-mono text-xs font-bold text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded">
                          #{selectedExt.ext}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{selectedExt.department}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEdit(selectedExt)}
                    className="gap-1.5 h-8 text-xs border-border/60"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                  {/* Badges */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <StatusBadge status={selectedExt.status} />
                    {selectedExt.voicemailEnabled && (
                      <Badge variant="secondary" className="gap-1 text-[11px] px-2 py-0.5 bg-violet-500/10 text-violet-400 border border-violet-500/20">
                        <Voicemail className="h-3 w-3" />
                        Voicemail on
                      </Badge>
                    )}
                  </div>

                  {/* Info grid */}
                  <div className="space-y-3">
                    {[
                      { icon: Mail, label: 'Email', value: selectedExt.email },
                      { icon: Phone, label: 'Direct DID', value: selectedExt.directNumber || '—' },
                      { icon: PhoneForwarded, label: 'Forward To', value: selectedExt.forwardTo ? `Ext. ${selectedExt.forwardTo}` : '—' },
                      { icon: Building2, label: 'Department', value: selectedExt.department },
                    ].map(row => (
                      <div key={row.label} className="flex items-start gap-3 py-2.5 border-b border-border/30 last:border-b-0">
                        <row.icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[11px] text-muted-foreground font-medium">{row.label}</p>
                          <p className="text-sm text-foreground font-mono mt-0.5">{row.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Danger zone */}
                  <div className="pt-2">
                    <p className="text-[11px] font-medium text-muted-foreground mb-2 uppercase tracking-wide">Danger zone</p>
                    <button
                      onClick={() => handleDelete(selectedExt.id)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/5 transition-colors text-xs font-medium"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove extension
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Assign Extension Dialog ──────────────────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-base flex items-center gap-2">
              <Plus className="h-4 w-4 text-violet-400" />
              Assign Extension
            </DialogTitle>
          </DialogHeader>

          <div className="py-2 space-y-4">
            {/* User picker */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Team Member
              </label>
              <Select
                value={addUserId?.toString() ?? ''}
                onValueChange={v => setAddUserId(Number(v))}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select a team member…" />
                </SelectTrigger>
                <SelectContent>
                  {unassignedUsers.map(u => (
                    <SelectItem key={u.id} value={u.id.toString()}>
                      <div className="flex items-center gap-2">
                        <span>{userDisplayName(u)}</span>
                        <span className="text-muted-foreground text-xs">{u.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                  {unassignedUsers.length === 0 && (
                    <SelectItem value="none" disabled>All team members have extensions</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <ExtConfigForm value={addForm} onChange={setAddForm} />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setAddOpen(false)} className="h-8 text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={!addUserId || !addForm.ext}
              className="h-8 text-xs gap-1.5 bg-violet-600 hover:bg-violet-700 text-white"
            >
              <Check className="h-3.5 w-3.5" />
              Assign Extension
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
