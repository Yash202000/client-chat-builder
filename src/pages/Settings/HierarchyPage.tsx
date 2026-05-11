import { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ChevronRight, ChevronDown, Plus, Pencil, Trash2, Network, FolderTree,
  Loader2, ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HierarchyType {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  position: number;
}

interface HierarchyNode {
  id: number;
  type_id: number;
  parent_id: number | null;
  name: string;
  code: string;
  path: string;
  position: number;
  is_active: boolean;
  metadata?: Record<string, any>;
  children: HierarchyNode[];
}

const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken')}` });

// ── Tree Node Component ───────────────────────────────────────────────────────

function TreeNode({
  node, depth, onEdit, onDelete, onAddChild,
}: {
  node: HierarchyNode;
  depth: number;
  onEdit: (n: HierarchyNode) => void;
  onDelete: (n: HierarchyNode) => void;
  onAddChild: (parent: HierarchyNode) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-muted/60 group text-sm',
        )}
        style={{ paddingLeft: `${8 + depth * 20}px` }}
      >
        {/* expand/collapse */}
        <button
          className="w-4 h-4 flex items-center justify-center flex-shrink-0 text-muted-foreground"
          onClick={() => setExpanded(e => !e)}
          disabled={!hasChildren}
        >
          {hasChildren ? (
            expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />
          ) : (
            <span className="w-3" />
          )}
        </button>

        <span className={cn('flex-1 font-medium truncate', !node.is_active && 'text-muted-foreground line-through')}>
          {node.name}
        </span>

        <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono flex-shrink-0">
          {node.code}
        </code>

        {!node.is_active && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 flex-shrink-0">inactive</Badge>
        )}

        {/* actions — shown on hover */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            title="Add child node"
            onClick={() => onAddChild(node)}
          >
            <Plus className="w-3 h-3" />
          </button>
          <button
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            onClick={() => onEdit(node)}
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(node)}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {hasChildren && expanded && (
        <div>
          {node.children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function HierarchyPage() {
  const { toast } = useToast();
  const [types, setTypes] = useState<HierarchyType[]>([]);
  const [selectedType, setSelectedType] = useState<HierarchyType | null>(null);
  const [tree, setTree] = useState<HierarchyNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [treeLoading, setTreeLoading] = useState(false);

  // Type dialog
  const [typeDialog, setTypeDialog] = useState<{ open: boolean; edit?: HierarchyType }>({ open: false });
  const [typeForm, setTypeForm] = useState({ name: '', description: '', is_active: true });
  const [typeSaving, setTypeSaving] = useState(false);

  // Node dialog
  const [nodeDialog, setNodeDialog] = useState<{
    open: boolean;
    edit?: HierarchyNode;
    parentNode?: HierarchyNode;
  }>({ open: false });
  const [nodeForm, setNodeForm] = useState({
    name: '', code: '', parent_id: '' as string | number, is_active: true,
  });
  const [nodeSaving, setNodeSaving] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<
    { kind: 'type'; item: HierarchyType } | { kind: 'node'; item: HierarchyNode } | null
  >(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchTypes(); }, []);
  useEffect(() => {
    if (selectedType) fetchTree(selectedType.id);
  }, [selectedType]);

  const fetchTypes = async () => {
    try {
      const res = await axios.get('/api/v1/hierarchy/types', { headers: headers(), params: { include_inactive: true } });
      setTypes(res.data);
      if (res.data.length > 0 && !selectedType) setSelectedType(res.data[0]);
    } catch {
      toast({ title: 'Error', description: 'Failed to load hierarchy types', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchTree = async (typeId: number) => {
    setTreeLoading(true);
    try {
      const res = await axios.get(`/api/v1/hierarchy/types/${typeId}/tree`, { headers: headers() });
      setTree(res.data);
    } catch {
      toast({ title: 'Error', description: 'Failed to load nodes', variant: 'destructive' });
    } finally {
      setTreeLoading(false);
    }
  };

  // ── Type CRUD ────────────────────────────────────────────────────────────────

  const openCreateType = () => {
    setTypeForm({ name: '', description: '', is_active: true });
    setTypeDialog({ open: true });
  };

  const openEditType = (t: HierarchyType) => {
    setTypeForm({ name: t.name, description: t.description || '', is_active: t.is_active });
    setTypeDialog({ open: true, edit: t });
  };

  const saveType = async () => {
    if (!typeForm.name.trim()) return;
    setTypeSaving(true);
    try {
      if (typeDialog.edit) {
        await axios.put(`/api/v1/hierarchy/types/${typeDialog.edit.id}`, typeForm, { headers: headers() });
        toast({ title: 'Type updated' });
      } else {
        await axios.post('/api/v1/hierarchy/types', typeForm, { headers: headers() });
        toast({ title: 'Type created' });
      }
      setTypeDialog({ open: false });
      fetchTypes();
    } catch {
      toast({ title: 'Error', description: 'Failed to save type', variant: 'destructive' });
    } finally {
      setTypeSaving(false);
    }
  };

  // ── Node CRUD ────────────────────────────────────────────────────────────────

  const openCreateNode = (parent?: HierarchyNode) => {
    setNodeForm({ name: '', code: '', parent_id: parent?.id ?? '', is_active: true });
    setNodeDialog({ open: true, parentNode: parent });
  };

  const openEditNode = (node: HierarchyNode) => {
    setNodeForm({
      name: node.name,
      code: node.code,
      parent_id: node.parent_id ?? '',
      is_active: node.is_active,
    });
    setNodeDialog({ open: true, edit: node });
  };

  const saveNode = async () => {
    if (!nodeForm.name.trim() || !nodeForm.code.trim() || !selectedType) return;
    if (!/^[a-z][a-z0-9_]*$/.test(nodeForm.code)) {
      toast({ title: 'Invalid code', description: 'Code must be lowercase letters, numbers, underscores; start with a letter.', variant: 'destructive' });
      return;
    }
    setNodeSaving(true);
    try {
      const payload = {
        name: nodeForm.name,
        code: nodeForm.code,
        parent_id: nodeForm.parent_id !== '' ? Number(nodeForm.parent_id) : null,
        is_active: nodeForm.is_active,
      };
      if (nodeDialog.edit) {
        await axios.put(`/api/v1/hierarchy/nodes/${nodeDialog.edit.id}`, payload, { headers: headers() });
        toast({ title: 'Node updated' });
      } else {
        await axios.post(`/api/v1/hierarchy/types/${selectedType.id}/nodes`, payload, { headers: headers() });
        toast({ title: 'Node created' });
      }
      setNodeDialog({ open: false });
      fetchTree(selectedType.id);
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.detail || 'Failed to save node', variant: 'destructive' });
    } finally {
      setNodeSaving(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.kind === 'type') {
        await axios.delete(`/api/v1/hierarchy/types/${deleteTarget.item.id}`, { headers: headers() });
        toast({ title: 'Type deleted' });
        setSelectedType(null);
        fetchTypes();
      } else {
        await axios.delete(`/api/v1/hierarchy/nodes/${deleteTarget.item.id}`, { headers: headers() });
        toast({ title: 'Node deleted' });
        if (selectedType) fetchTree(selectedType.id);
      }
      setDeleteTarget(null);
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.detail || 'Delete failed', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  // ── Flatten tree for parent selector ─────────────────────────────────────────

  const flattenTree = (nodes: HierarchyNode[], depth = 0): { id: number; label: string }[] => {
    const result: { id: number; label: string }[] = [];
    for (const n of nodes) {
      result.push({ id: n.id, label: `${'—'.repeat(depth)} ${n.name} (${n.code})` });
      if (n.children?.length) result.push(...flattenTree(n.children, depth + 1));
    }
    return result;
  };

  const flatNodes = flattenTree(tree);

  // ── Render ────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0">
      {/* Left panel — type list */}
      <div className="w-64 flex-shrink-0 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Hierarchy Types</h2>
            </div>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={openCreateType}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Define dimensions like Location, Classification
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {types.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8 px-4">
              No types yet. Create one to start building your hierarchy.
            </p>
          )}
          {types.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedType(t)}
              className={cn(
                'w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                selectedType?.id === t.id
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'hover:bg-muted/60 text-foreground',
              )}
            >
              <FolderTree className="w-4 h-4 flex-shrink-0" />
              <span className={cn('flex-1 truncate', !t.is_active && 'text-muted-foreground line-through')}>
                {t.name}
              </span>
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100">
                <button
                  className="p-0.5 hover:text-muted-foreground"
                  onClick={e => { e.stopPropagation(); openEditType(t); }}
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  className="p-0.5 hover:text-destructive"
                  onClick={e => { e.stopPropagation(); setDeleteTarget({ kind: 'type', item: t }); }}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right panel — node tree */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selectedType ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Select a hierarchy type to manage its nodes
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-border flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-sm font-semibold">{selectedType.name}</h2>
                {selectedType.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{selectedType.description}</p>
                )}
              </div>
              <Button size="sm" onClick={() => openCreateNode()} className="h-8 gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                Add root node
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {treeLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : tree.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <FolderTree className="w-10 h-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No nodes yet</p>
                  <Button size="sm" variant="outline" onClick={() => openCreateNode()}>
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add first node
                  </Button>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {tree.map(n => (
                    <TreeNode
                      key={n.id}
                      node={n}
                      depth={0}
                      onEdit={openEditNode}
                      onDelete={node => setDeleteTarget({ kind: 'node', item: node })}
                      onAddChild={openCreateNode}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Type dialog ────────────────────────────────────────────────────────── */}
      <Dialog open={typeDialog.open} onOpenChange={open => setTypeDialog({ open })}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>{typeDialog.edit ? 'Edit Hierarchy Type' : 'New Hierarchy Type'}</DialogTitle>
            <DialogDescription>
              A hierarchy type defines a dimension (e.g. Location, Classification).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Name <span className="text-destructive">*</span></Label>
              <Input
                value={typeForm.name}
                onChange={e => setTypeForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Location"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={typeForm.description}
                onChange={e => setTypeForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Optional description"
                rows={2}
                className="resize-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={typeForm.is_active}
                onCheckedChange={v => setTypeForm(f => ({ ...f, is_active: v }))}
              />
              <Label className="font-normal">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTypeDialog({ open: false })}>Cancel</Button>
            <Button onClick={saveType} disabled={typeSaving || !typeForm.name.trim()}>
              {typeSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {typeDialog.edit ? 'Save Changes' : 'Create Type'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Node dialog ────────────────────────────────────────────────────────── */}
      <Dialog open={nodeDialog.open} onOpenChange={open => setNodeDialog({ open })}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>
              {nodeDialog.edit ? 'Edit Node' : nodeDialog.parentNode ? `Add child of "${nodeDialog.parentNode.name}"` : 'Add Root Node'}
            </DialogTitle>
            <DialogDescription>
              The code is used in custom field values and routing rules.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Name <span className="text-destructive">*</span></Label>
              <Input
                value={nodeForm.name}
                onChange={e => setNodeForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Ward 12"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Code <span className="text-destructive">*</span></Label>
              <Input
                value={nodeForm.code}
                onChange={e => setNodeForm(f => ({
                  ...f,
                  code: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                }))}
                placeholder="e.g. ward_12"
                disabled={!!nodeDialog.edit}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Lowercase letters, numbers, underscores. Cannot be changed after creation.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Parent node</Label>
              <Select
                value={nodeForm.parent_id !== '' ? String(nodeForm.parent_id) : '__none__'}
                onValueChange={v => setNodeForm(f => ({ ...f, parent_id: v === '__none__' ? '' : Number(v) }))}
                disabled={!!nodeDialog.edit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Root (no parent)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Root (no parent) —</SelectItem>
                  {flatNodes
                    .filter(fn => !nodeDialog.edit || fn.id !== nodeDialog.edit.id)
                    .map(fn => (
                      <SelectItem key={fn.id} value={String(fn.id)}>{fn.label}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={nodeForm.is_active}
                onCheckedChange={v => setNodeForm(f => ({ ...f, is_active: v }))}
              />
              <Label className="font-normal">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNodeDialog({ open: false })}>Cancel</Button>
            <Button
              onClick={saveNode}
              disabled={nodeSaving || !nodeForm.name.trim() || !nodeForm.code.trim()}
            >
              {nodeSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {nodeDialog.edit ? 'Save Changes' : 'Create Node'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation ─────────────────────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-destructive" />
              Delete {deleteTarget?.kind === 'type' ? 'Hierarchy Type' : 'Node'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.kind === 'type'
                ? `Deleting "${deleteTarget.item.name}" will also delete all its nodes and node assignments. This cannot be undone.`
                : `Deleting "${deleteTarget?.item.name}" will also delete all child nodes and any assignments to this node.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
