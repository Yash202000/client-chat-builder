import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Loader2, GitBranch,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Tree Node with connecting lines ───────────────────────────────────────────

function TreeNode({
  node, depth, isLast, onEdit, onDelete, onAddChild,
}: {
  node: HierarchyNode;
  depth: number;
  isLast: boolean;
  onEdit: (n: HierarchyNode) => void;
  onDelete: (n: HierarchyNode) => void;
  onAddChild: (parent: HierarchyNode) => void;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="relative">
      {/* Vertical connecting line from parent */}
      {depth > 0 && (
        <div
          className="absolute left-0 top-0 bottom-0 border-l-2 border-slate-200 dark:border-slate-700"
          style={{ left: `${(depth - 1) * 24 + 12}px` }}
        />
      )}

      <div
        className="group relative flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors duration-150 cursor-default"
        style={{ paddingLeft: `${12 + depth * 24}px` }}
      >
        {/* Horizontal connector */}
        {depth > 0 && (
          <div
            className="absolute border-t-2 border-slate-200 dark:border-slate-700"
            style={{
              left: `${(depth - 1) * 24 + 12}px`,
              width: '16px',
              top: '50%',
            }}
          />
        )}

        {/* Expand / collapse */}
        <button
          className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
          onClick={() => setExpanded(e => !e)}
          disabled={!hasChildren}
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {hasChildren ? (
            expanded
              ? <ChevronDown className="w-3.5 h-3.5" />
              : <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 block" />
          )}
        </button>

        {/* Node name */}
        <span className={cn(
          'flex-1 text-sm font-medium truncate text-slate-800 dark:text-slate-200',
          !node.is_active && 'line-through text-slate-400 dark:text-slate-500',
        )}>
          {node.name}
        </span>

        {/* Code badge */}
        <code className="text-[11px] text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/50 border border-violet-200 dark:border-violet-800/50 px-1.5 py-0.5 rounded font-mono flex-shrink-0 hidden sm:block">
          {node.code}
        </code>

        {!node.is_active && (
          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 flex-shrink-0">
            inactive
          </span>
        )}

        {/* Hover actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0">
          <button
            className="p-1.5 rounded-md hover:bg-violet-100 dark:hover:bg-violet-900/40 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors cursor-pointer"
            title={t('hierarchy.addChild')}
            onClick={() => onAddChild(node)}
            aria-label="Add child node"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
            onClick={() => onEdit(node)}
            aria-label="Edit node"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
            onClick={() => onDelete(node)}
            aria-label="Delete node"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div className="relative">
          {node.children.map((child, i) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              isLast={i === node.children.length - 1}
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
  const { t } = useTranslation();
  const { toast } = useToast();

  const [types, setTypes] = useState<HierarchyType[]>([]);
  const [selectedType, setSelectedType] = useState<HierarchyType | null>(null);
  const [tree, setTree] = useState<HierarchyNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [treeLoading, setTreeLoading] = useState(false);

  const [typeDialog, setTypeDialog] = useState<{ open: boolean; edit?: HierarchyType }>({ open: false });
  const [typeForm, setTypeForm] = useState({ name: '', description: '', is_active: true });
  const [typeSaving, setTypeSaving] = useState(false);

  const [nodeDialog, setNodeDialog] = useState<{
    open: boolean;
    edit?: HierarchyNode;
    parentNode?: HierarchyNode;
  }>({ open: false });
  const [nodeForm, setNodeForm] = useState({
    name: '', code: '', parent_id: '' as string | number, is_active: true,
  });
  const [nodeSaving, setNodeSaving] = useState(false);

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
      toast({ title: 'Error', description: t('hierarchy.loadTypesFailed'), variant: 'destructive' });
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
      toast({ title: 'Error', description: t('hierarchy.loadNodesFailed'), variant: 'destructive' });
    } finally {
      setTreeLoading(false);
    }
  };

  const openCreateType = () => {
    setTypeForm({ name: '', description: '', is_active: true });
    setTypeDialog({ open: true });
  };

  const openEditType = (type: HierarchyType) => {
    setTypeForm({ name: type.name, description: type.description || '', is_active: type.is_active });
    setTypeDialog({ open: true, edit: type });
  };

  const saveType = async () => {
    if (!typeForm.name.trim()) return;
    setTypeSaving(true);
    try {
      if (typeDialog.edit) {
        await axios.put(`/api/v1/hierarchy/types/${typeDialog.edit.id}`, typeForm, { headers: headers() });
        toast({ title: t('hierarchy.typeUpdated') });
      } else {
        await axios.post('/api/v1/hierarchy/types', typeForm, { headers: headers() });
        toast({ title: t('hierarchy.typeCreated') });
      }
      setTypeDialog({ open: false });
      fetchTypes();
    } catch {
      toast({ title: 'Error', description: t('hierarchy.typeSaveFailed'), variant: 'destructive' });
    } finally {
      setTypeSaving(false);
    }
  };

  const openCreateNode = (parent?: HierarchyNode) => {
    setNodeForm({ name: '', code: '', parent_id: parent?.id ?? '', is_active: true });
    setNodeDialog({ open: true, parentNode: parent });
  };

  const openEditNode = (node: HierarchyNode) => {
    setNodeForm({ name: node.name, code: node.code, parent_id: node.parent_id ?? '', is_active: node.is_active });
    setNodeDialog({ open: true, edit: node });
  };

  const saveNode = async () => {
    if (!nodeForm.name.trim() || !nodeForm.code.trim() || !selectedType) return;
    if (!/^[a-z][a-z0-9_]*$/.test(nodeForm.code)) {
      toast({ title: t('hierarchy.invalidCode'), description: t('hierarchy.invalidCodeDesc'), variant: 'destructive' });
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
        toast({ title: t('hierarchy.nodeUpdated') });
      } else {
        await axios.post(`/api/v1/hierarchy/types/${selectedType.id}/nodes`, payload, { headers: headers() });
        toast({ title: t('hierarchy.nodeCreated') });
      }
      setNodeDialog({ open: false });
      fetchTree(selectedType.id);
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.detail || t('hierarchy.nodeSaveFailed'), variant: 'destructive' });
    } finally {
      setNodeSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.kind === 'type') {
        await axios.delete(`/api/v1/hierarchy/types/${deleteTarget.item.id}`, { headers: headers() });
        toast({ title: t('hierarchy.typeDeleted') });
        setSelectedType(null);
        fetchTypes();
      } else {
        await axios.delete(`/api/v1/hierarchy/nodes/${deleteTarget.item.id}`, { headers: headers() });
        toast({ title: t('hierarchy.nodeDeleted') });
        if (selectedType) fetchTree(selectedType.id);
      }
      setDeleteTarget(null);
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.detail || t('hierarchy.deleteFailed'), variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const flattenTree = (nodes: HierarchyNode[], depth = 0): { id: number; label: string }[] => {
    const result: { id: number; label: string }[] = [];
    for (const n of nodes) {
      result.push({ id: n.id, label: `${'—'.repeat(depth)} ${n.name} (${n.code})` });
      if (n.children?.length) result.push(...flattenTree(n.children, depth + 1));
    }
    return result;
  };

  const flatNodes = flattenTree(tree);

  const countNodes = (nodes: HierarchyNode[]): number =>
    nodes.reduce((acc, n) => acc + 1 + countNodes(n.children ?? []), 0);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
    </div>
  );

  return (
    <div className="flex h-full min-h-0 bg-slate-50 dark:bg-slate-950">

      {/* ── Left panel: type list ─────────────────────────────────────────── */}
      <div className="w-64 flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">

        {/* Panel header */}
        <div className="px-4 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                <Network className="w-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Hierarchy Types</h2>
            </div>
            <button
              onClick={openCreateType}
              className="h-7 w-7 rounded-lg flex items-center justify-center bg-violet-50 dark:bg-violet-900/30 hover:bg-violet-100 dark:hover:bg-violet-900/60 text-violet-600 dark:text-violet-400 transition-colors cursor-pointer"
              aria-label="Create new hierarchy type"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
            Dimensions like Location or Classification
          </p>
        </div>

        {/* Type list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {types.length === 0 ? (
            <div className="text-center py-10 px-4">
              <Network className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                No types yet. Create one to start building your hierarchy.
              </p>
              <button
                onClick={openCreateType}
                className="mt-3 text-xs text-violet-600 dark:text-violet-400 font-medium hover:underline cursor-pointer"
              >
                + Create first type
              </button>
            </div>
          ) : (
            types.map(type => (
              <div
                key={type.id}
                className={cn(
                  'group w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors duration-150 cursor-pointer',
                  selectedType?.id === type.id
                    ? 'bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300',
                )}
                onClick={() => setSelectedType(type)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedType(type)}
              >
                <FolderTree className={cn(
                  'w-4 h-4 flex-shrink-0',
                  selectedType?.id === type.id ? 'text-violet-500' : 'text-slate-400 dark:text-slate-500',
                )} />
                <span className={cn(
                  'flex-1 font-medium truncate',
                  !type.is_active && 'line-through text-slate-400 dark:text-slate-500',
                )}>
                  {type.name}
                </span>

                {/* Edit / Delete — now on the group div so group-hover works */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <button
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    onClick={e => { e.stopPropagation(); openEditType(type); }}
                    aria-label={`Edit ${type.name}`}
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                    onClick={e => { e.stopPropagation(); setDeleteTarget({ kind: 'type', item: type }); }}
                    aria-label={`Delete ${type.name}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Right panel: node tree ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selectedType ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
            <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <GitBranch className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Select a hierarchy type</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Choose a type from the left panel to manage its nodes</p>
            </div>
          </div>
        ) : (
          <>
            {/* Tree panel header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-4 flex-shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">{selectedType.name}</h2>
                  {!selectedType.is_active && (
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                      inactive
                    </span>
                  )}
                  {!treeLoading && (
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                      {countNodes(tree)} node{countNodes(tree) !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                {selectedType.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{selectedType.description}</p>
                )}
              </div>
              <Button
                size="sm"
                onClick={() => openCreateNode()}
                className="h-8 px-3 text-xs bg-violet-600 hover:bg-violet-700 text-white rounded-lg gap-1.5 flex-shrink-0 cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Add root node
              </Button>
            </div>

            {/* Tree content */}
            <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-slate-900">
              {treeLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
                </div>
              ) : tree.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                  <div className="h-14 w-14 rounded-2xl bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center">
                    <FolderTree className="w-7 h-7 text-violet-300 dark:text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No nodes in {selectedType.name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Add a root node to start building this hierarchy</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openCreateNode()}
                    className="mt-1 h-8 px-3 text-xs rounded-lg border-violet-200 text-violet-600 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-400 dark:hover:bg-violet-950/30 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add first node
                  </Button>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {tree.map((n, i) => (
                    <TreeNode
                      key={n.id}
                      node={n}
                      depth={0}
                      isLast={i === tree.length - 1}
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

      {/* ── Type dialog ────────────────────────────────────────────────────── */}
      <Dialog open={typeDialog.open} onOpenChange={open => setTypeDialog({ open })}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl dark:bg-slate-900 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white flex items-center gap-2">
              <Network className="w-4 h-4 text-violet-500" />
              {typeDialog.edit ? t('hierarchy.editType') : t('hierarchy.newType')}
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              A hierarchy type defines a dimension — e.g. Location, Classification, Department.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={typeForm.name}
                onChange={e => setTypeForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Location"
                className="h-9 text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Description</Label>
              <Textarea
                value={typeForm.description}
                onChange={e => setTypeForm(f => ({ ...f, description: e.target.value }))}
                placeholder={t('hierarchy.descriptionPlaceholder')}
                rows={2}
                className="text-sm resize-none dark:bg-slate-800 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 bg-slate-50 dark:bg-slate-800/50">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-white">Active</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">Inactive types are hidden from pickers</p>
              </div>
              <Switch
                checked={typeForm.is_active}
                onCheckedChange={v => setTypeForm(f => ({ ...f, is_active: v }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTypeDialog({ open: false })} className="rounded-xl dark:border-slate-600 dark:text-slate-300">
              Cancel
            </Button>
            <Button
              onClick={saveType}
              disabled={typeSaving || !typeForm.name.trim()}
              className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white cursor-pointer"
            >
              {typeSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {typeDialog.edit ? 'Save Changes' : 'Create Type'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Node dialog ────────────────────────────────────────────────────── */}
      <Dialog open={nodeDialog.open} onOpenChange={open => setNodeDialog({ open })}>
        <DialogContent className="sm:max-w-[460px] rounded-2xl dark:bg-slate-900 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-violet-500" />
              {nodeDialog.edit
                ? 'Edit Node'
                : nodeDialog.parentNode
                  ? `Add child under "${nodeDialog.parentNode.name}"`
                  : 'Add Root Node'}
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              The code is used in custom field values and routing rules. It cannot be changed after creation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={nodeForm.name}
                onChange={e => setNodeForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Ward 12"
                className="h-9 text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Code <span className="text-red-500">*</span>
              </Label>
              <Input
                value={nodeForm.code}
                onChange={e => setNodeForm(f => ({
                  ...f,
                  code: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                }))}
                placeholder="e.g. ward_12"
                disabled={!!nodeDialog.edit}
                className="h-9 text-sm font-mono dark:bg-slate-800 dark:border-slate-600 dark:text-white disabled:opacity-60"
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Lowercase letters, numbers, underscores only.
                {nodeDialog.edit && ' Code cannot be changed after creation.'}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Parent node</Label>
              <Select
                value={nodeForm.parent_id !== '' ? String(nodeForm.parent_id) : '__none__'}
                onValueChange={v => setNodeForm(f => ({ ...f, parent_id: v === '__none__' ? '' : Number(v) }))}
                disabled={!!nodeDialog.edit}
              >
                <SelectTrigger className="h-9 text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white">
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
            <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 bg-slate-50 dark:bg-slate-800/50">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-white">Active</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">Inactive nodes are hidden from pickers</p>
              </div>
              <Switch
                checked={nodeForm.is_active}
                onCheckedChange={v => setNodeForm(f => ({ ...f, is_active: v }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNodeDialog({ open: false })} className="rounded-xl dark:border-slate-600 dark:text-slate-300">
              Cancel
            </Button>
            <Button
              onClick={saveNode}
              disabled={nodeSaving || !nodeForm.name.trim() || !nodeForm.code.trim()}
              className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white cursor-pointer"
            >
              {nodeSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {nodeDialog.edit ? 'Save Changes' : 'Create Node'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation ─────────────────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent className="rounded-2xl dark:bg-slate-900 dark:border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Trash2 className="w-4 h-4 text-red-500" />
              Delete {deleteTarget?.kind === 'type' ? 'Hierarchy Type' : 'Node'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 dark:text-slate-400">
              {deleteTarget?.kind === 'type'
                ? `Deleting "${deleteTarget.item.name}" will also delete all its nodes and node assignments. This cannot be undone.`
                : `Deleting "${deleteTarget?.item.name}" will also delete all child nodes and any assignments to this node.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl dark:border-slate-600 dark:text-slate-300">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white cursor-pointer"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Yes, delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
