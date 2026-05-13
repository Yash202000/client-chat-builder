import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Building2, Plus, X, Trash2, Search, ChevronRight, Users, MapPin,
  Tag, Shield, Check, Edit2, Save, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Department {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
}

interface HierarchyType {
  id: number;
  name: string;
}

interface HierarchyNode {
  id: number;
  name: string;
  code: string;
  type_id: number;
  path: string;
}

interface NodeAssignment {
  id: number;
  department_id: number;
  node_id: number;
}

interface DeptMember {
  id: number;
  department_id: number;
  user_id: number;
  role: string;
}

interface UserRecord {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

// ── Role config ───────────────────────────────────────────────────────────────

const ROLES = ['agent', 'supervisor', 'approver', 'manager'] as const;
type Role = typeof ROLES[number];

const ROLE_COLORS: Record<Role, string> = {
  agent:      'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30',
  supervisor: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30',
  approver:   'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-500/20 dark:text-violet-300 dark:border-violet-500/30',
  manager:    'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30',
};

// ── Skeleton helpers ──────────────────────────────────────────────────────────

function SidebarSkeleton() {
  return (
    <div className="space-y-1.5 p-3">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-11 w-full rounded-lg" />
      ))}
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-40" />
      <div className="mt-6 space-y-3">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function DepartmentPage() {
  const { authFetch } = useAuth();
  const { t: tI18n, isRTL } = useI18n();
  const { t } = useTranslation();
  const { toast } = useToast();

  // ── Global data ──────────────────────────────────────────────────────────────
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptLoading, setDeptLoading] = useState(true);

  const [hierarchyTypes, setHierarchyTypes] = useState<HierarchyType[]>([]);
  const [allUsers, setAllUsers] = useState<UserRecord[]>([]);

  // ── Selection + per-dept data ────────────────────────────────────────────────
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [nodeAssignments, setNodeAssignments] = useState<NodeAssignment[]>([]);
  const [members, setMembers] = useState<DeptMember[]>([]);
  const [panelLoading, setPanelLoading] = useState(false);

  // ── Sidebar create/edit form ─────────────────────────────────────────────────
  const [creatingDept, setCreatingDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');
  const [savingNew, setSavingNew] = useState(false);

  // ── Right panel – inline dept edit ──────────────────────────────────────────
  const [editingHeader, setEditingHeader] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [savingHeader, setSavingHeader] = useState(false);

  // ── Delete dept ──────────────────────────────────────────────────────────────
  const [deletingDeptId, setDeletingDeptId] = useState<number | null>(null);

  // ── Jurisdiction – per type node picker state ────────────────────────────────
  const [typeNodes, setTypeNodes] = useState<Record<number, HierarchyNode[]>>({});
  const [pickerOpen, setPickerOpen] = useState<Record<number, boolean>>({});
  const [nodeSearch, setNodeSearch] = useState<Record<number, string>>({});
  const [pendingNodes, setPendingNodes] = useState<Record<number, Set<number>>>({});
  const [addingNodes, setAddingNodes] = useState<Record<number, boolean>>({});
  const [removingNode, setRemovingNode] = useState<number | null>(null);

  // ── Members – add form ────────────────────────────────────────────────────────
  const [addMemberUserId, setAddMemberUserId] = useState('');
  const [addMemberRole, setAddMemberRole] = useState<Role>('agent');
  const [addingMember, setAddingMember] = useState(false);
  const [removingMember, setRemovingMember] = useState<number | null>(null);

  // ── Toggle status saving ─────────────────────────────────────────────────────
  const [togglingStatus, setTogglingStatus] = useState(false);

  // ── Fetch helpers ────────────────────────────────────────────────────────────

  const fetchDepartments = useCallback(async () => {
    setDeptLoading(true);
    try {
      const res = await authFetch('/api/v1/departments');
      if (res.ok) {
        const data: Department[] = await res.json();
        setDepartments(data);
      }
    } catch {
      toast({ title: t('departments.error'), description: t('departments.loadFailed'), variant: 'destructive' });
    } finally {
      setDeptLoading(false);
    }
  }, [authFetch, toast]);

  const fetchHierarchyTypes = useCallback(async () => {
    try {
      const res = await authFetch('/api/v1/hierarchy/types');
      if (res.ok) {
        const data: HierarchyType[] = await res.json();
        setHierarchyTypes(data);
      }
    } catch { /* ignore */ }
  }, [authFetch]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await authFetch('/api/v1/users');
      if (res.ok) {
        const data: UserRecord[] = await res.json();
        setAllUsers(data);
      }
    } catch { /* ignore */ }
  }, [authFetch]);

  const fetchTypeNodes = useCallback(async (typeId: number) => {
    if (typeNodes[typeId]) return;
    try {
      const res = await authFetch(`/api/v1/hierarchy/types/${typeId}/nodes`);
      if (res.ok) {
        const data: HierarchyNode[] = await res.json();
        setTypeNodes(prev => ({ ...prev, [typeId]: data }));
      }
    } catch { /* ignore */ }
  }, [authFetch, typeNodes]);

  const fetchDeptPanel = useCallback(async (dept: Department) => {
    setPanelLoading(true);
    setNodeAssignments([]);
    setMembers([]);
    try {
      const [nodesRes, membersRes] = await Promise.all([
        authFetch(`/api/v1/departments/${dept.id}/nodes`),
        authFetch(`/api/v1/departments/${dept.id}/members`),
      ]);
      if (nodesRes.ok) setNodeAssignments(await nodesRes.json());
      if (membersRes.ok) setMembers(await membersRes.json());
    } catch {
      toast({ title: t('departments.error'), description: t('departments.loadDetailFailed'), variant: 'destructive' });
    } finally {
      setPanelLoading(false);
    }
  }, [authFetch, toast]);

  // ── Mount effects ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchDepartments();
    fetchHierarchyTypes();
    fetchUsers();
  }, [fetchDepartments, fetchHierarchyTypes, fetchUsers]);

  // ── Select dept ───────────────────────────────────────────────────────────────
  const selectDept = (dept: Department) => {
    setSelectedDept(dept);
    setEditingHeader(false);
    setPickerOpen({});
    setNodeSearch({});
    setPendingNodes({});
    setAddMemberUserId('');
    setAddMemberRole('agent');
    fetchDeptPanel(dept);
    // Pre-fetch nodes for all hierarchy types
    hierarchyTypes.forEach(ht => fetchTypeNodes(ht.id));
  };

  // ── Create department ─────────────────────────────────────────────────────────
  const handleCreateDept = async () => {
    if (!newDeptName.trim()) return;
    setSavingNew(true);
    try {
      const res = await authFetch('/api/v1/departments', {
        method: 'POST',
        body: JSON.stringify({ name: newDeptName.trim(), description: newDeptDesc.trim() }),
      });
      if (res.ok) {
        const created: Department = await res.json();
        setDepartments(prev => [...prev, created]);
        setCreatingDept(false);
        setNewDeptName('');
        setNewDeptDesc('');
        toast({ title: t('departments.created'), description: created.name });
        selectDept(created);
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: t('departments.error'), description: err.detail || t('departments.createFailed'), variant: 'destructive' });
      }
    } catch {
      toast({ title: t('departments.error'), description: t('departments.networkError'), variant: 'destructive' });
    } finally {
      setSavingNew(false);
    }
  };

  // ── Save dept header edits ────────────────────────────────────────────────────
  const handleSaveHeader = async () => {
    if (!selectedDept) return;
    setSavingHeader(true);
    try {
      const res = await authFetch(`/api/v1/departments/${selectedDept.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editName.trim(), description: editDesc.trim() }),
      });
      if (res.ok) {
        const updated: Department = await res.json();
        setDepartments(prev => prev.map(d => d.id === updated.id ? updated : d));
        setSelectedDept(updated);
        setEditingHeader(false);
        toast({ title: t('departments.saved'), description: t('departments.updated') });
      } else {
        toast({ title: t('departments.error'), description: t('departments.saveFailed'), variant: 'destructive' });
      }
    } catch {
      toast({ title: t('departments.error'), description: t('departments.networkError'), variant: 'destructive' });
    } finally {
      setSavingHeader(false);
    }
  };

  // ── Toggle active status ──────────────────────────────────────────────────────
  const handleToggleStatus = async (checked: boolean) => {
    if (!selectedDept) return;
    setTogglingStatus(true);
    try {
      const res = await authFetch(`/api/v1/departments/${selectedDept.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: checked }),
      });
      if (res.ok) {
        const updated: Department = await res.json();
        setDepartments(prev => prev.map(d => d.id === updated.id ? updated : d));
        setSelectedDept(updated);
      } else {
        toast({ title: t('departments.error'), description: t('departments.statusUpdateFailed'), variant: 'destructive' });
      }
    } catch {
      toast({ title: t('departments.error'), description: t('departments.networkError'), variant: 'destructive' });
    } finally {
      setTogglingStatus(false);
    }
  };

  // ── Delete department ─────────────────────────────────────────────────────────
  const handleDeleteDept = async () => {
    if (!deletingDeptId) return;
    try {
      const res = await authFetch(`/api/v1/departments/${deletingDeptId}`, { method: 'DELETE' });
      if (res.ok || res.status === 204) {
        setDepartments(prev => prev.filter(d => d.id !== deletingDeptId));
        if (selectedDept?.id === deletingDeptId) {
          setSelectedDept(null);
          setNodeAssignments([]);
          setMembers([]);
        }
        toast({ title: t('departments.deleted'), description: t('departments.removed') });
      } else {
        toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
      }
    } catch {
      toast({ title: t('departments.error'), description: t('departments.networkError'), variant: 'destructive' });
    } finally {
      setDeletingDeptId(null);
    }
  };

  // ── Jurisdiction: toggle picker ───────────────────────────────────────────────
  const togglePicker = async (typeId: number) => {
    await fetchTypeNodes(typeId);
    setPickerOpen(prev => ({ ...prev, [typeId]: !prev[typeId] }));
    if (!pendingNodes[typeId]) {
      setPendingNodes(prev => ({ ...prev, [typeId]: new Set() }));
    }
    if (!nodeSearch[typeId]) {
      setNodeSearch(prev => ({ ...prev, [typeId]: '' }));
    }
  };

  // ── Jurisdiction: add selected nodes ─────────────────────────────────────────
  const handleAddNodes = async (typeId: number) => {
    if (!selectedDept) return;
    const pending = pendingNodes[typeId];
    if (!pending || pending.size === 0) return;
    setAddingNodes(prev => ({ ...prev, [typeId]: true }));
    try {
      await Promise.all(
        [...pending].map(nodeId =>
          authFetch(`/api/v1/departments/${selectedDept.id}/nodes`, {
            method: 'POST',
            body: JSON.stringify({ node_id: nodeId }),
          })
        )
      );
      // Refresh assignments
      const res = await authFetch(`/api/v1/departments/${selectedDept.id}/nodes`);
      if (res.ok) setNodeAssignments(await res.json());
      setPendingNodes(prev => ({ ...prev, [typeId]: new Set() }));
      setPickerOpen(prev => ({ ...prev, [typeId]: false }));
      toast({ title: 'Nodes assigned', description: `${pending.size} node(s) added` });
    } catch {
      toast({ title: 'Error', description: 'Failed to assign nodes', variant: 'destructive' });
    } finally {
      setAddingNodes(prev => ({ ...prev, [typeId]: false }));
    }
  };

  // ── Jurisdiction: remove node assignment ──────────────────────────────────────
  const handleRemoveNode = async (assignmentId: number) => {
    if (!selectedDept) return;
    setRemovingNode(assignmentId);
    try {
      const res = await authFetch(`/api/v1/departments/${selectedDept.id}/nodes/${assignmentId}`, {
        method: 'DELETE',
      });
      if (res.ok || res.status === 204) {
        setNodeAssignments(prev => prev.filter(a => a.id !== assignmentId));
      } else {
        toast({ title: 'Error', description: 'Failed to remove node', variant: 'destructive' });
      }
    } catch {
      toast({ title: t('departments.error'), description: t('departments.networkError'), variant: 'destructive' });
    } finally {
      setRemovingNode(null);
    }
  };

  // ── Members: add ──────────────────────────────────────────────────────────────
  const handleAddMember = async () => {
    if (!selectedDept || !addMemberUserId) return;
    setAddingMember(true);
    try {
      const res = await authFetch(`/api/v1/departments/${selectedDept.id}/members`, {
        method: 'POST',
        body: JSON.stringify({ user_id: parseInt(addMemberUserId, 10), role: addMemberRole }),
      });
      if (res.ok) {
        const refreshed = await authFetch(`/api/v1/departments/${selectedDept.id}/members`);
        if (refreshed.ok) setMembers(await refreshed.json());
        setAddMemberUserId('');
        setAddMemberRole('agent');
        toast({ title: 'Member added' });
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: 'Error', description: err.detail || 'Failed to add member', variant: 'destructive' });
      }
    } catch {
      toast({ title: t('departments.error'), description: t('departments.networkError'), variant: 'destructive' });
    } finally {
      setAddingMember(false);
    }
  };

  // ── Members: remove ───────────────────────────────────────────────────────────
  const handleRemoveMember = async (membershipId: number) => {
    if (!selectedDept) return;
    setRemovingMember(membershipId);
    try {
      const res = await authFetch(`/api/v1/departments/${selectedDept.id}/members/${membershipId}`, {
        method: 'DELETE',
      });
      if (res.ok || res.status === 204) {
        setMembers(prev => prev.filter(m => m.id !== membershipId));
        toast({ title: 'Member removed' });
      } else {
        toast({ title: 'Error', description: 'Failed to remove member', variant: 'destructive' });
      }
    } catch {
      toast({ title: t('departments.error'), description: t('departments.networkError'), variant: 'destructive' });
    } finally {
      setRemovingMember(null);
    }
  };

  // ── Derived helpers ───────────────────────────────────────────────────────────

  const getUserById = (userId: number) => allUsers.find(u => u.id === userId);

  const assignedNodeIds = new Set(nodeAssignments.map(a => a.node_id));
  const memberUserIds = new Set(members.map(m => m.user_id));
  const availableUsers = allUsers.filter(u => !memberUserIds.has(u.id));

  // Nodes for a given hierarchy type that are already assigned
  const assignedNodesForType = (typeId: number): Array<{ assignment: NodeAssignment; node: HierarchyNode | undefined }> => {
    const nodes = typeNodes[typeId] || [];
    return nodeAssignments
      .filter(a => {
        const n = nodes.find(nd => nd.id === a.node_id);
        return n !== undefined;
      })
      .map(a => ({ assignment: a, node: nodes.find(nd => nd.id === a.node_id) }));
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className={cn('flex h-full overflow-hidden', isRTL && 'flex-row-reverse')}>
      {/* ── LEFT SIDEBAR ─────────────────────────────────────────────────────── */}
      <div className="w-72 flex-shrink-0 border-r border-border flex flex-col bg-muted/30">
        {/* Sidebar header */}
        <div className="px-4 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-600/20">
              <Building2 className="w-4 h-4 text-blue-400" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">Departments</h2>
          </div>
        </div>

        {/* Department list */}
        <div className="flex-1 overflow-y-auto">
          {deptLoading ? (
            <SidebarSkeleton />
          ) : (
            <div className="p-2 space-y-0.5">
              {departments.map(dept => (
                <button
                  key={dept.id}
                  onClick={() => selectDept(dept)}
                  className={cn(
                    'w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2 group transition-colors',
                    selectedDept?.id === dept.id
                      ? 'bg-blue-600/20 border border-blue-500/30'
                      : 'hover:bg-muted/60 border border-transparent'
                  )}
                >
                  <Building2
                    className={cn(
                      'w-4 h-4 flex-shrink-0',
                      selectedDept?.id === dept.id ? 'text-blue-400' : 'text-muted-foreground'
                    )}
                  />
                  <span
                    className={cn(
                      'flex-1 text-sm font-medium truncate',
                      selectedDept?.id === dept.id ? 'text-blue-700 dark:text-blue-100' : 'text-foreground'
                    )}
                  >
                    {dept.name}
                  </span>
                  {dept.is_active ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium border border-emerald-500/30 flex-shrink-0">
                      Active
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium border border-border flex-shrink-0">
                      Inactive
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Create form or footer button */}
        <div className="border-t border-border p-3">
          {creatingDept ? (
            <div className="space-y-2">
              <Input
                value={newDeptName}
                onChange={e => setNewDeptName(e.target.value)}
                placeholder="Department name"
                className="h-8 text-sm dark:bg-slate-900 dark:border-border"
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCreateDept();
                  if (e.key === 'Escape') { setCreatingDept(false); setNewDeptName(''); setNewDeptDesc(''); }
                }}
              />
              <Input
                value={newDeptDesc}
                onChange={e => setNewDeptDesc(e.target.value)}
                placeholder="Description (optional)"
                className="h-8 text-sm dark:bg-slate-900 dark:border-border"
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCreateDept();
                  if (e.key === 'Escape') { setCreatingDept(false); setNewDeptName(''); setNewDeptDesc(''); }
                }}
              />
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  onClick={handleCreateDept}
                  disabled={savingNew || !newDeptName.trim()}
                  className="flex-1 h-7 text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-foreground border-0"
                >
                  {savingNew ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Check className="w-3 h-3 mr-1" />Save</>}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setCreatingDept(false); setNewDeptName(''); setNewDeptDesc(''); }}
                  className="h-7 px-2 text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCreatingDept(true)}
              className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/80 text-xs h-8"
            >
              <Plus className="w-3.5 h-3.5" />
              New Department
            </Button>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL ──────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-background">
        {!selectedDept ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="p-4 rounded-2xl bg-muted/60 border border-border/50">
              <Building2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Select a department to manage it</p>
          </div>
        ) : panelLoading ? (
          <PanelSkeleton />
        ) : (
          <div className="p-6 space-y-5 max-w-4xl">

            {/* ── A) HEADER CARD ─────────────────────────────────────────────── */}
            <div className="rounded-xl border border-border bg-card p-6">
              {editingHeader ? (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Name</Label>
                    <Input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="dark:bg-slate-900 dark:border-border"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Description</Label>
                    <Input
                      value={editDesc}
                      onChange={e => setEditDesc(e.target.value)}
                      placeholder="Optional description"
                      className="dark:bg-slate-900 dark:border-border"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveHeader}
                      disabled={savingHeader || !editName.trim()}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-foreground border-0"
                    >
                      {savingHeader
                        ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                        : <Save className="w-4 h-4 mr-1.5" />}
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingHeader(false)}
                      className="text-muted-foreground hover:text-foreground hover:bg-muted"
                    >
                      <X className="w-4 h-4 mr-1.5" />Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-xl font-semibold text-foreground truncate">{selectedDept.name}</h1>
                      {selectedDept.is_active ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium border border-emerald-500/30">
                          Active
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium border border-border">
                          Inactive
                        </span>
                      )}
                    </div>
                    {selectedDept.description && (
                      <p className="text-sm text-muted-foreground mt-1">{selectedDept.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Active toggle */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Active</span>
                      <Switch
                        checked={selectedDept.is_active}
                        onCheckedChange={handleToggleStatus}
                        disabled={togglingStatus}
                        className="data-[state=checked]:bg-emerald-500"
                      />
                    </div>

                    <Separator orientation="vertical" className="h-6 bg-border" />

                    {/* Edit button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditName(selectedDept.name);
                        setEditDesc(selectedDept.description || '');
                        setEditingHeader(true);
                      }}
                      className="text-muted-foreground hover:text-foreground hover:bg-muted h-8 px-2"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>

                    {/* Delete button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeletingDeptId(selectedDept.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 px-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* ── B) JURISDICTION CARD ───────────────────────────────────────── */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-5">
              <div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  <h2 className="text-base font-semibold text-foreground">Jurisdiction</h2>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">Locations &amp; classifications this department covers</p>
              </div>

              <Separator className="bg-border/60" />

              {hierarchyTypes.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No hierarchy types configured</p>
              ) : (
                <div className="space-y-6">
                  {hierarchyTypes.map(ht => {
                    const assigned = assignedNodesForType(ht.id);
                    const nodes = typeNodes[ht.id] || [];
                    const isOpen = !!pickerOpen[ht.id];
                    const search = nodeSearch[ht.id] || '';
                    const pending = pendingNodes[ht.id] || new Set<number>();
                    const isAdding = !!addingNodes[ht.id];

                    const filteredNodes = nodes.filter(n =>
                      !assignedNodeIds.has(n.id) &&
                      (search === '' || n.name.toLowerCase().includes(search.toLowerCase()) || n.code.toLowerCase().includes(search.toLowerCase()))
                    );

                    return (
                      <div key={ht.id} className="space-y-2">
                        {/* Type header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">{ht.name}</span>
                          </div>
                          <button
                            onClick={() => togglePicker(ht.id)}
                            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                          >
                            {isOpen ? (
                              <><X className="w-3 h-3" />Close</>
                            ) : (
                              <><Plus className="w-3 h-3" />Add</>
                            )}
                          </button>
                        </div>

                        {/* Assigned chips */}
                        {assigned.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic pl-1">No nodes assigned</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {assigned.map(({ assignment, node }) => (
                              <div
                                key={assignment.id}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600/20 border border-blue-500/30 text-xs text-blue-300"
                              >
                                <span>{node?.name ?? `Node #${assignment.node_id}`}</span>
                                {node?.code && (
                                  <span className="text-blue-500/60 font-mono">({node.code})</span>
                                )}
                                <button
                                  onClick={() => handleRemoveNode(assignment.id)}
                                  disabled={removingNode === assignment.id}
                                  className="ml-0.5 text-blue-400 hover:text-foreground transition-colors disabled:opacity-50"
                                >
                                  {removingNode === assignment.id
                                    ? <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                    : <X className="w-2.5 h-2.5" />}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Inline picker */}
                        {isOpen && (
                          <div className="mt-2 rounded-lg border border-border bg-muted/80 overflow-hidden">
                            {/* Search */}
                            <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
                              <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                              <input
                                type="text"
                                value={search}
                                onChange={e => setNodeSearch(prev => ({ ...prev, [ht.id]: e.target.value }))}
                                placeholder={`Search ${ht.name} nodes...`}
                                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                              />
                            </div>

                            {/* Node list */}
                            <div className="max-h-48 overflow-y-auto">
                              {filteredNodes.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic text-center py-4">
                                  {nodes.length === 0 ? 'Loading nodes...' : 'No nodes available'}
                                </p>
                              ) : (
                                filteredNodes.map(node => {
                                  const depth = node.path ? node.path.split('.').length - 1 : 0;
                                  const isChecked = pending.has(node.id);
                                  return (
                                    <label
                                      key={node.id}
                                      className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted/60 cursor-pointer group"
                                      style={{ paddingLeft: `${12 + depth * 10}px` }}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={e => {
                                          setPendingNodes(prev => {
                                            const s = new Set(prev[ht.id] || []);
                                            if (e.target.checked) s.add(node.id);
                                            else s.delete(node.id);
                                            return { ...prev, [ht.id]: s };
                                          });
                                        }}
                                        className="accent-blue-500 w-3.5 h-3.5 flex-shrink-0"
                                      />
                                      {depth > 0 && (
                                        <span className="text-muted-foreground text-xs flex-shrink-0 select-none">└</span>
                                      )}
                                      <span className="text-sm text-foreground group-hover:text-foreground truncate">{node.name}</span>
                                      <span className="text-xs text-muted-foreground font-mono flex-shrink-0">{node.code}</span>
                                    </label>
                                  );
                                })
                              )}
                            </div>

                            {/* Add button */}
                            {pending.size > 0 && (
                              <div className="border-t border-border px-3 py-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleAddNodes(ht.id)}
                                  disabled={isAdding}
                                  className="h-7 text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-foreground border-0"
                                >
                                  {isAdding
                                    ? <><Loader2 className="w-3 h-3 animate-spin mr-1.5" />Adding...</>
                                    : <><Check className="w-3 h-3 mr-1.5" />Add {pending.size} node{pending.size !== 1 ? 's' : ''}</>}
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── C) MEMBERS CARD ───────────────────────────────────────────── */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-5">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <h2 className="text-base font-semibold text-foreground">Members</h2>
                <span className="ml-auto text-xs text-muted-foreground">{members.length} member{members.length !== 1 ? 's' : ''}</span>
              </div>

              <Separator className="bg-border/60" />

              {/* Members table */}
              {members.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No members yet. Add one below.</p>
              ) : (
                <div className="rounded-lg border border-border/60 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/60">
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">User</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Role</th>
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {members.map(member => {
                        const user = getUserById(member.user_id);
                        const initials = user
                          ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase()
                          : '?';
                        const fullName = user ? `${user.first_name} ${user.last_name}` : `User #${member.user_id}`;
                        const roleColor = ROLE_COLORS[member.role as Role] ?? 'bg-muted text-muted-foreground border-border';
                        const isRemoving = removingMember === member.id;

                        return (
                          <tr key={member.id} className="hover:bg-muted/40 transition-colors group">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-7 h-7 flex-shrink-0">
                                  <AvatarFallback className="text-[10px] font-medium bg-muted text-muted-foreground">
                                    {initials}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="font-medium text-foreground truncate leading-tight">{fullName}</p>
                                  {user && (
                                    <p className="text-xs text-muted-foreground truncate leading-tight">{user.email}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={cn(
                                'text-xs px-2 py-0.5 rounded-full font-medium border capitalize',
                                roleColor
                              )}>
                                {member.role}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => handleRemoveMember(member.id)}
                                disabled={isRemoving}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 disabled:opacity-40 p-1 rounded"
                              >
                                {isRemoving
                                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  : <X className="w-3.5 h-3.5" />}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Add member form */}
              <div className="flex gap-2 pt-1">
                <div className="flex-1 min-w-0">
                  <Select value={addMemberUserId} onValueChange={setAddMemberUserId}>
                    <SelectTrigger className="h-9 text-sm dark:bg-slate-900 dark:border-border">
                      <SelectValue placeholder="Select user..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">No users available</div>
                      ) : (
                        availableUsers.map(u => (
                          <SelectItem
                            key={u.id}
                            value={String(u.id)}
                            className="text-foreground"
                          >
                            {u.first_name} {u.last_name} ({u.email})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <Select value={addMemberRole} onValueChange={v => setAddMemberRole(v as Role)}>
                  <SelectTrigger className="h-9 text-sm w-36 dark:bg-slate-900 dark:border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map(role => (
                      <SelectItem
                        key={role}
                        value={role}
                        className="text-foreground capitalize"
                      >
                        <div className="flex items-center gap-2">
                          <Shield className="w-3 h-3 text-muted-foreground" />
                          <span className="capitalize">{role}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  size="sm"
                  onClick={handleAddMember}
                  disabled={addingMember || !addMemberUserId}
                  className="h-9 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-foreground border-0 flex-shrink-0"
                >
                  {addingMember
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <><Plus className="w-4 h-4 mr-1.5" />Add</>}
                </Button>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ── DELETE DEPARTMENT CONFIRM ─────────────────────────────────────────── */}
      <AlertDialog open={!!deletingDeptId} onOpenChange={open => { if (!open) setDeletingDeptId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Department?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently remove the department and all its node assignments and memberships. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDept}
              className="bg-red-600 hover:bg-red-500 text-foreground border-0"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
