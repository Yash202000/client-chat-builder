import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
  ArrowLeft,
  Plus,
  FolderTree,
  ChevronRight,
  ChevronDown,
  Pencil,
  Trash,
  Loader2,
} from 'lucide-react';
import * as cmsService from '@/services/cmsService';
import { ContentCategory, CategoryCreate } from '@/types/cms';
import { useToast } from '@/hooks/use-toast';

interface CategoryItemProps {
  category: ContentCategory;
  level: number;
  onEdit: (category: ContentCategory) => void;
  onDelete: (category: ContentCategory) => void;
  onAddChild: (parentId: number) => void;
}

const CategoryItem = ({ category, level, onEdit, onDelete, onAddChild }: CategoryItemProps) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 py-2 px-3 rounded hover:bg-muted group"
        style={{ paddingLeft: `${level * 24 + 12}px` }}
      >
        <button
          type="button"
          className="w-5 h-5 flex items-center justify-center"
          onClick={() => hasChildren && setExpanded(!expanded)}
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )
          ) : (
            <span className="w-4" />
          )}
        </button>

        <FolderTree className="w-4 h-4 text-muted-foreground" />
        <span className="flex-1 font-medium">{category.name}</span>
        <span className="text-xs text-muted-foreground font-mono">/{category.slug}</span>

        <div className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAddChild(category.id)}>
            <Plus className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(category)}>
            <Pencil className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive"
            onClick={() => onDelete(category)}
          >
            <Trash className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {hasChildren && expanded && (
        <div>
          {category.children!.map((child) => (
            <CategoryItem
              key={child.id}
              category={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CategoriesPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [formDialog, setFormDialog] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    parentId?: number;
    category?: ContentCategory;
  }>({ open: false, mode: 'create' });

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    category: ContentCategory | null;
  }>({ open: false, category: null });

  const [formData, setFormData] = useState<CategoryCreate>({
    name: '',
    description: '',
    slug: '',
  });

  const { data: categories, isLoading } = useQuery<ContentCategory[]>({
    queryKey: ['cms-categories-tree'],
    queryFn: () => cmsService.getCategoryTree(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CategoryCreate) => cmsService.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-categories-tree'] });
      toast({ title: t('cms.categories.created') });
      setFormDialog({ open: false, mode: 'create' });
    },
    onError: (error: any) => {
      toast({
        title: t('cms.categories.createFailed'),
        description: error.response?.data?.detail || t('cms.form.errorOccurred'),
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => cmsService.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-categories-tree'] });
      toast({ title: t('cms.categories.updated') });
      setFormDialog({ open: false, mode: 'create' });
    },
    onError: (error: any) => {
      toast({
        title: t('cms.categories.updateFailed'),
        description: error.response?.data?.detail || t('cms.form.errorOccurred'),
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (categoryId: number) => cmsService.deleteCategory(categoryId, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-categories-tree'] });
      toast({ title: t('cms.categories.deleted') });
      setDeleteDialog({ open: false, category: null });
    },
    onError: (error: any) => {
      toast({
        title: t('cms.categories.deleteFailed'),
        description: error.response?.data?.detail || t('cms.form.errorOccurred'),
        variant: 'destructive',
      });
    },
  });

  const openCreateDialog = (parentId?: number) => {
    setFormData({ name: '', description: '', slug: '', parent_id: parentId });
    setFormDialog({ open: true, mode: 'create', parentId });
  };

  const openEditDialog = (category: ContentCategory) => {
    setFormData({
      name: category.name,
      description: category.description || '',
      slug: category.slug,
    });
    setFormDialog({ open: true, mode: 'edit', category });
  };

  const handleSubmit = () => {
    if (formDialog.mode === 'create') {
      createMutation.mutate({
        ...formData,
        parent_id: formDialog.parentId,
      });
    } else if (formDialog.category) {
      updateMutation.mutate({
        id: formDialog.category.id,
        data: {
          name: formData.name,
          description: formData.description,
        },
      });
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link to="/dashboard/cms">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">{t('cms.quickLinks.categories')}</h1>
            <p className="text-muted-foreground hidden sm:block">{t('cms.quickLinks.categoriesDesc')}</p>
          </div>
        </div>
        <Button onClick={() => openCreateDialog()}>
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">{t('cms.categories.create')}</span>
        </Button>
      </div>

      {/* Categories Tree */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : categories && categories.length > 0 ? (
        <Card>
          <CardContent className="pt-4">
            {categories.map((category) => (
              <CategoryItem
                key={category.id}
                category={category}
                level={0}
                onEdit={openEditDialog}
                onDelete={(cat) => setDeleteDialog({ open: true, category: cat })}
                onAddChild={(parentId) => openCreateDialog(parentId)}
              />
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderTree className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">{t('cms.categories.create')}</h3>
            <p className="text-muted-foreground text-center mb-4">
              {t('cms.quickLinks.categoriesDesc')}
            </p>
            <Button onClick={() => openCreateDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              {t('cms.categories.create')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={formDialog.open} onOpenChange={(open) => setFormDialog({ ...formDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {formDialog.mode === 'create' ? t('cms.categories.create') : t('cms.categories.edit')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setFormData({
                    ...formData,
                    name,
                    slug: formDialog.mode === 'create' ? generateSlug(name) : formData.slug,
                  });
                }}
                placeholder="e.g., Programming"
              />
            </div>

            {formDialog.mode === 'create' && (
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={formData.slug || ''}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g., programming"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('cms.categories.descriptionPlaceholder')}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFormDialog({ open: false, mode: 'create' })}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : formDialog.mode === 'create' ? (
                t('cms.categories.createBtn')
              ) : (
                t('cms.categories.saveBtn')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDialog.category?.name}"? Child categories
              will be moved to the parent level.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteDialog.category && deleteMutation.mutate(deleteDialog.category.id)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('cms.categories.deleteBtn')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CategoriesPage;
