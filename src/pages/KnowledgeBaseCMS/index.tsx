/**
 * Knowledge Base CMS Pages
 *
 * These are wrapper components that render CMS functionality scoped to a specific Knowledge Base.
 * Content types and items created here are automatically linked to the KB and indexed for RAG.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ArrowLeft,
  Plus,
  Trash,
  GripVertical,
  Loader2,
  Save,
  MoreVertical,
  Pencil,
  Eye,
  Archive,
  Globe,
  Lock,
  CheckCircle,
  FileText,
  FolderTree,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  List,
  X,
} from 'lucide-react';
import * as cmsService from '@/services/cmsService';
import { FieldType, FIELD_TYPE_INFO, ContentType, ContentItem, ContentCategory } from '@/types/cms';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';

const fieldTypes = Object.keys(FIELD_TYPE_INFO) as FieldType[];

// ==================== Content Type Form (Create/Edit) ====================

const fieldSchema = z.object({
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z][a-z0-9_]*$/, 'Slug must be lowercase with underscores'),
  name: z.string().min(1, 'Name is required'),
  type: z.enum(fieldTypes as [FieldType, ...FieldType[]]),
  required: z.boolean().optional(),
  searchable: z.boolean().optional(),
  settings: z.record(z.any()).optional(),
});

const contentTypeFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z][a-z0-9-]*$/, 'Slug must be lowercase with hyphens'),
  description: z.string().optional(),
  icon: z.string().optional(),
  allow_public_publish: z.boolean().optional(),
  field_schema: z.array(fieldSchema).min(1, 'At least one field is required'),
});

type ContentTypeFormValues = z.infer<typeof contentTypeFormSchema>;

interface KBContentTypeFormProps {
  mode: 'create' | 'edit';
}

const KBContentTypeFormPage = ({ mode }: KBContentTypeFormProps) => {
  const { id: kbId, slug } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const isEdit = mode === 'edit';
  const knowledgeBaseId = kbId ? parseInt(kbId) : undefined;

  const { data: contentType, isLoading: isLoadingType } = useQuery({
    queryKey: ['cms-content-type', slug],
    queryFn: () => cmsService.getContentType(slug!),
    enabled: isEdit && !!slug,
  });

  const form = useForm<ContentTypeFormValues>({
    resolver: zodResolver(contentTypeFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      icon: '',
      allow_public_publish: true,
      field_schema: [
        { slug: 'title', name: 'Title', type: 'text', required: true, searchable: true },
      ],
    },
    values: isEdit && contentType ? {
      name: contentType.name,
      slug: contentType.slug,
      description: contentType.description || '',
      icon: contentType.icon || '',
      allow_public_publish: contentType.allow_public_publish,
      field_schema: contentType.field_schema || [],
    } : undefined,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'field_schema',
  });

  const createMutation = useMutation({
    mutationFn: (data: ContentTypeFormValues) =>
      cmsService.createContentType({ ...data, knowledge_base_id: knowledgeBaseId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-content-types', knowledgeBaseId] });
      toast({ title: 'Content type created' });
      navigate(`/dashboard/knowledge-base/${kbId}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create content type',
        description: error.response?.data?.detail || 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ContentTypeFormValues) => cmsService.updateContentType(slug!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-content-types', knowledgeBaseId] });
      queryClient.invalidateQueries({ queryKey: ['cms-content-type', slug] });
      toast({ title: 'Content type updated' });
      navigate(`/dashboard/knowledge-base/${kbId}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update content type',
        description: error.response?.data?.detail || 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ContentTypeFormValues) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
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

  const generateFieldSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s_]/g, '')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .trim();
  };

  if (isEdit && isLoadingType) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to={`/dashboard/knowledge-base/${kbId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">
            {isEdit ? 'Edit Content Type' : 'Create Content Type'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Modify the schema for this content type' : 'Define a new content schema for this knowledge base'}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>General settings for this content type</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Shloka, Recipe, Article"
                          onChange={(e) => {
                            field.onChange(e);
                            if (!isEdit && !form.getValues('slug')) {
                              form.setValue('slug', generateSlug(e.target.value));
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., shloka" disabled={isEdit} />
                      </FormControl>
                      <FormDescription>URL-friendly identifier</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Describe this content type..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="allow_public_publish"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Allow Public Publishing</FormLabel>
                      <FormDescription>
                        Content can be published with "public" visibility
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Field Schema */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Fields</CardTitle>
                  <CardDescription>Define the fields for this content type. Mark fields as "Searchable" to include them in RAG retrieval.</CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      slug: '',
                      name: '',
                      type: 'text',
                      required: false,
                      searchable: false,
                    })
                  }
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Field
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-start gap-3 p-4 border rounded-lg bg-muted/30"
                >
                  <div className="pt-2 cursor-move text-muted-foreground">
                    <GripVertical className="w-4 h-4" />
                  </div>

                  <div className="flex-1 grid grid-cols-12 gap-3">
                    <div className="col-span-3">
                      <FormField
                        control={form.control}
                        name={`field_schema.${index}.name`}
                        render={({ field: formField }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Field Name</FormLabel>
                            <FormControl>
                              <Input
                                {...formField}
                                placeholder="Title"
                                onChange={(e) => {
                                  formField.onChange(e);
                                  const currentSlug = form.getValues(`field_schema.${index}.slug`);
                                  if (!currentSlug) {
                                    form.setValue(
                                      `field_schema.${index}.slug`,
                                      generateFieldSlug(e.target.value)
                                    );
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`field_schema.${index}.slug`}
                        render={({ field: formField }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Slug</FormLabel>
                            <FormControl>
                              <Input {...formField} placeholder="title" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-3">
                      <FormField
                        control={form.control}
                        name={`field_schema.${index}.type`}
                        render={({ field: formField }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Type</FormLabel>
                            <Select value={formField.value} onValueChange={formField.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {fieldTypes.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    <div className="flex items-center gap-2">
                                      <span>{FIELD_TYPE_INFO[type].label}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-2 flex items-end gap-4 pb-2">
                      <FormField
                        control={form.control}
                        name={`field_schema.${index}.required`}
                        render={({ field: formField }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <Switch
                                checked={formField.value}
                                onCheckedChange={formField.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-xs !mt-0">Required</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-2 flex items-end gap-4 pb-2">
                      <FormField
                        control={form.control}
                        name={`field_schema.${index}.searchable`}
                        render={({ field: formField }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <Switch
                                checked={formField.value}
                                onCheckedChange={formField.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-xs !mt-0">Searchable</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              {form.formState.errors.field_schema?.message && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.field_schema.message}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Link to={`/dashboard/knowledge-base/${kbId}`}>
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isEdit ? 'Save Changes' : 'Create Content Type'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

// ==================== Content Items List ====================

const KBContentItemsPage = () => {
  const { id: kbId, typeSlug } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useI18n();
  const knowledgeBaseId = kbId ? parseInt(kbId) : undefined;

  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: ContentItem | null }>({
    open: false,
    item: null,
  });
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'categories' | 'items'>('categories');
  const [categoryDisplayType, setCategoryDisplayType] = useState<'cards' | 'tree'>('tree');
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  const { data: contentType, isLoading: isLoadingType } = useQuery({
    queryKey: ['cms-content-type', typeSlug],
    queryFn: () => cmsService.getContentType(typeSlug!),
    enabled: !!typeSlug,
  });

  const { data: itemsData, isLoading: isLoadingItems } = useQuery({
    queryKey: ['cms-content-items', typeSlug, knowledgeBaseId],
    queryFn: () => cmsService.getContentItems(typeSlug!),
    enabled: !!typeSlug,
  });

  // Fetch categories for filtering
  const { data: categories = [] } = useQuery<ContentCategory[]>({
    queryKey: ['cms-categories', knowledgeBaseId],
    queryFn: () => cmsService.getCategories(knowledgeBaseId),
    enabled: !!knowledgeBaseId,
  });

  // Calculate item counts per category
  const allItems = itemsData?.items || [];
  const getCategoryItemCount = (categoryId: number) => {
    return allItems.filter((item: ContentItem) =>
      item.categories?.some((cat: ContentCategory) => cat.id === categoryId)
    ).length;
  };

  // Items without any category
  const uncategorizedItems = allItems.filter((item: ContentItem) =>
    !item.categories || item.categories.length === 0
  );

  const deleteMutation = useMutation({
    mutationFn: (itemId: number) => cmsService.deleteContentItem(typeSlug!, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-content-items', typeSlug] });
      toast({ title: 'Content item deleted' });
      setDeleteDialog({ open: false, item: null });
    },
    onError: () => {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    },
  });

  const publishMutation = useMutation({
    mutationFn: (itemId: number) => cmsService.publishContentItem(typeSlug!, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-content-items', typeSlug] });
      toast({ title: 'Content published and indexed for RAG' });
    },
    onError: () => {
      toast({ title: 'Failed to publish', variant: 'destructive' });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (itemId: number) => cmsService.archiveContentItem(typeSlug!, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-content-items', typeSlug] });
      toast({ title: 'Content archived and removed from index' });
    },
    onError: () => {
      toast({ title: 'Failed to archive', variant: 'destructive' });
    },
  });

  // Filter items by selected category
  const items = selectedCategoryFilter === 0
    ? uncategorizedItems  // Show uncategorized items
    : selectedCategoryFilter
      ? allItems.filter((item: ContentItem) =>
          item.categories?.some((cat: ContentCategory) => cat.id === selectedCategoryFilter)
        )
      : allItems;

  // Get selected category name
  const selectedCategory = categories.find(c => c.id === selectedCategoryFilter);

  // Handle category click
  const handleCategoryClick = (categoryId: number | null) => {
    setSelectedCategoryFilter(categoryId);
    setViewMode('items');
  };

  // Handle back to categories
  const handleBackToCategories = () => {
    setSelectedCategoryFilter(null);
    setViewMode('categories');
  };

  // Build hierarchical tree from flat categories list
  const buildCategoryTree = (cats: ContentCategory[], parentId: number | null = null): ContentCategory[] => {
    return cats
      .filter(cat => cat.parent_id === parentId)
      .map(cat => ({
        ...cat,
        children: buildCategoryTree(cats, cat.id)
      }));
  };

  const categoryTree = buildCategoryTree(categories);

  // Toggle category expansion in tree view
  const toggleCategoryExpand = (categoryId: number) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Get all descendant category IDs for a category
  const getDescendantIds = (category: ContentCategory): number[] => {
    const ids: number[] = [category.id];
    if (category.children) {
      category.children.forEach((child: ContentCategory) => {
        ids.push(...getDescendantIds(child));
      });
    }
    return ids;
  };

  // Get total items count including children categories
  const getTotalCategoryItemCount = (category: ContentCategory): number => {
    const descendantIds = getDescendantIds(category);
    return allItems.filter((item: ContentItem) =>
      item.categories?.some((cat: ContentCategory) => descendantIds.includes(cat.id))
    ).length;
  };

  // Render tree node recursively
  const renderTreeNode = (category: ContentCategory, depth: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const directCount = getCategoryItemCount(category.id);
    const totalCount = getTotalCategoryItemCount(category);

    return (
      <div key={category.id}>
        <div
          className={`flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-muted/50 cursor-pointer group transition-colors ${
            depth > 0 ? 'ml-6' : ''
          }`}
          style={{ paddingLeft: `${depth * 24 + 12}px` }}
        >
          {/* Expand/collapse button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren) toggleCategoryExpand(category.id);
            }}
            className={`p-1 rounded hover:bg-muted ${!hasChildren ? 'invisible' : ''}`}
          >
            {hasChildren && (
              isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {/* Category info */}
          <div
            className="flex-1 flex items-center gap-3"
            onClick={() => handleCategoryClick(category.id)}
          >
            <div className="p-1.5 bg-primary/10 rounded">
              <FolderTree className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{category.name}</p>
              {category.description && (
                <p className="text-xs text-muted-foreground truncate">{category.description}</p>
              )}
            </div>
          </div>

          {/* Item counts */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {directCount} direct
            </Badge>
            {hasChildren && totalCount !== directCount && (
              <Badge variant="outline" className="text-xs">
                {totalCount} total
              </Badge>
            )}
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="border-l-2 border-muted ml-6">
            {category.children!.map((child: ContentCategory) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"><CheckCircle className="w-3 h-3 mr-1" />Published</Badge>;
      case 'draft':
        return <Badge variant="secondary"><FileText className="w-3 h-3 mr-1" />Draft</Badge>;
      case 'archived':
        return <Badge variant="outline"><Archive className="w-3 h-3 mr-1" />Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public':
      case 'marketplace':
        return <Globe className="w-4 h-4 text-green-500" />;
      default:
        return <Lock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  // Get first text/rich_text field for preview
  const getPreviewText = (item: ContentItem) => {
    if (!contentType?.field_schema) return '';
    const textField = contentType.field_schema.find(f => f.type === 'text' || f.type === 'rich_text');
    if (textField && item.data[textField.slug]) {
      const text = item.data[textField.slug];
      return typeof text === 'string' ? text.slice(0, 100) + (text.length > 100 ? '...' : '') : '';
    }
    return '';
  };

  if (isLoadingType || isLoadingItems) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show categories view if we have categories and no filter selected
  const showCategoriesView = categories.length > 0 && viewMode === 'categories';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {viewMode === 'items' && selectedCategoryFilter !== null ? (
            <Button variant="ghost" size="icon" onClick={handleBackToCategories}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          ) : (
            <Link to={`/dashboard/knowledge-base/${kbId}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
          )}
          <div>
            <h1 className="text-2xl font-bold">
              {viewMode === 'items' && selectedCategory
                ? `${selectedCategory.name}`
                : contentType?.name || 'Content Items'}
            </h1>
            <p className="text-muted-foreground">
              {viewMode === 'items'
                ? `${items.length} item${items.length !== 1 ? 's' : ''} in this category`
                : `${allItems.length} total item${allItems.length !== 1 ? 's' : ''} - Browse by category`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {viewMode === 'items' && (
            <Button variant="outline" onClick={handleBackToCategories}>
              <FolderTree className="w-4 h-4 mr-2" />
              All Categories
            </Button>
          )}
          <Link to={`/dashboard/knowledge-base/${kbId}/content/${typeSlug}/new`}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New {contentType?.name}
            </Button>
          </Link>
        </div>
      </div>

      {/* Categories View */}
      {showCategoriesView && (
        <div className="space-y-4">
          {/* View Toggle */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Categories</h2>
            <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
              <Button
                variant={categoryDisplayType === 'cards' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setCategoryDisplayType('cards')}
                className="gap-2"
              >
                <LayoutGrid className="w-4 h-4" />
                Cards
              </Button>
              <Button
                variant={categoryDisplayType === 'tree' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setCategoryDisplayType('tree')}
                className="gap-2"
              >
                <List className="w-4 h-4" />
                Tree
              </Button>
            </div>
          </div>

          {/* Card View */}
          {categoryDisplayType === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.filter(c => !c.parent_id).map((category) => {
                const itemCount = getCategoryItemCount(category.id);
                const totalCount = getTotalCategoryItemCount(category);
                const hasChildren = categories.some(c => c.parent_id === category.id);
                return (
                  <Card
                    key={category.id}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleCategoryClick(category.id)}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <FolderTree className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{category.name}</p>
                            {category.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {category.description}
                              </p>
                            )}
                            {hasChildren && (
                              <p className="text-xs text-primary mt-1">
                                Has subcategories
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="secondary" className="text-sm">
                            {itemCount} {itemCount === 1 ? 'item' : 'items'}
                          </Badge>
                          {hasChildren && totalCount !== itemCount && (
                            <span className="text-xs text-muted-foreground">
                              {totalCount} total
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Uncategorized items card */}
              {uncategorizedItems.length > 0 && (
                <Card
                  className="cursor-pointer hover:border-primary transition-colors border-dashed"
                  onClick={() => {
                    setSelectedCategoryFilter(0);  // Use 0 to indicate uncategorized
                    setViewMode('items');
                  }}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-lg">
                          <FileText className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">Uncategorized</p>
                          <p className="text-xs text-muted-foreground">Items without a category</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-sm">
                        {uncategorizedItems.length} {uncategorizedItems.length === 1 ? 'item' : 'items'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* View all items card */}
              <Card
                className="cursor-pointer hover:border-primary transition-colors bg-muted/30"
                onClick={() => {
                  setSelectedCategoryFilter(null);
                  setViewMode('items');
                }}
              >
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Eye className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">View All Items</p>
                        <p className="text-xs text-muted-foreground">Browse all content items</p>
                      </div>
                    </div>
                    <Badge className="text-sm">
                      {allItems.length} total
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tree View */}
          {categoryDisplayType === 'tree' && (
            <Card>
              <CardContent className="py-4">
                <div className="space-y-1">
                  {categoryTree.map((category: ContentCategory) => renderTreeNode(category))}

                  {/* Uncategorized items in tree */}
                  {uncategorizedItems.length > 0 && (
                    <div
                      className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => {
                        setSelectedCategoryFilter(0);
                        setViewMode('items');
                      }}
                    >
                      <button className="p-1 invisible">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <div className="flex-1 flex items-center gap-3">
                        <div className="p-1.5 bg-muted rounded">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-muted-foreground">Uncategorized</p>
                          <p className="text-xs text-muted-foreground">Items without a category</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {uncategorizedItems.length} items
                      </Badge>
                    </div>
                  )}

                  {/* View all items in tree */}
                  <div
                    className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-muted/50 cursor-pointer bg-muted/30"
                    onClick={() => {
                      setSelectedCategoryFilter(null);
                      setViewMode('items');
                    }}
                  >
                    <button className="p-1 invisible">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <div className="flex-1 flex items-center gap-3">
                      <div className="p-1.5 bg-primary/10 rounded">
                        <Eye className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">View All Items</p>
                        <p className="text-xs text-muted-foreground">Browse all content items</p>
                      </div>
                    </div>
                    <Badge className="text-xs">
                      {allItems.length} total
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Items list - only show when not in categories view */}
      {viewMode === 'items' && (
        <>
          {/* Back to categories button when filtered */}
          {categories.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setViewMode('categories');
                  setSelectedCategoryFilter(null);
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Categories
              </Button>
              {selectedCategoryFilter !== null && (
                <Badge variant="secondary">
                  {selectedCategoryFilter === 0
                    ? 'Uncategorized'
                    : categories.find((c: ContentCategory) => c.id === selectedCategoryFilter)?.name || 'All Items'}
                </Badge>
              )}
            </div>
          )}

          {items.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {items.map((item: ContentItem) => (
                <Card key={item.id} className="group">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {getVisibilityIcon(item.visibility)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{getPreviewText(item) || `Item #${item.id}`}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {getStatusBadge(item.status)}
                            {item.categories?.map((cat: ContentCategory) => (
                              <Badge key={cat.id} variant="outline" className="text-xs">
                                <FolderTree className="w-3 h-3 mr-1" />
                                {cat.name}
                              </Badge>
                            ))}
                            <span className="text-xs text-muted-foreground">
                              Updated {new Date(item.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => navigate(`/dashboard/knowledge-base/${kbId}/content/${typeSlug}/${item.id}`)}
                            >
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {item.status === 'draft' && (
                              <DropdownMenuItem onClick={() => publishMutation.mutate(item.id)}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Publish
                              </DropdownMenuItem>
                            )}
                            {item.status === 'published' && (
                              <DropdownMenuItem onClick={() => archiveMutation.mutate(item.id)}>
                                <Archive className="w-4 h-4 mr-2" />
                                Archive
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteDialog({ open: true, item })}
                            >
                              <Trash className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {selectedCategoryFilter === 0
                    ? 'No uncategorized items'
                    : selectedCategoryFilter
                      ? 'No items in this category'
                      : 'No content items yet'}
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  {selectedCategoryFilter
                    ? 'Create content items and assign them to this category.'
                    : `Create your first ${contentType?.name?.toLowerCase()} to add structured content to this knowledge base.`}
                </p>
                <Link to={`/dashboard/knowledge-base/${kbId}/content/${typeSlug}/new`}>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create {contentType?.name}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Show items directly if no categories exist */}
      {viewMode === 'categories' && categories.length === 0 && (
        <>
          {items.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {items.map((item: ContentItem) => (
                <Card key={item.id} className="group">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {getVisibilityIcon(item.visibility)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{getPreviewText(item) || `Item #${item.id}`}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {getStatusBadge(item.status)}
                            <span className="text-xs text-muted-foreground">
                              Updated {new Date(item.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => navigate(`/dashboard/knowledge-base/${kbId}/content/${typeSlug}/${item.id}`)}
                            >
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {item.status === 'draft' && (
                              <DropdownMenuItem onClick={() => publishMutation.mutate(item.id)}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Publish
                              </DropdownMenuItem>
                            )}
                            {item.status === 'published' && (
                              <DropdownMenuItem onClick={() => archiveMutation.mutate(item.id)}>
                                <Archive className="w-4 h-4 mr-2" />
                                Archive
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteDialog({ open: true, item })}
                            >
                              <Trash className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No content items yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first {contentType?.name?.toLowerCase()} to add structured content to this knowledge base.
                </p>
                <Link to={`/dashboard/knowledge-base/${kbId}/content/${typeSlug}/new`}>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create {contentType?.name}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Content Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this item? This will also remove it from the search index.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialog.item && deleteMutation.mutate(deleteDialog.item.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// ==================== Content Item Form (Create/Edit) ====================

interface KBContentItemFormProps {
  mode: 'create' | 'edit';
}

const KBContentItemFormPage = ({ mode }: KBContentItemFormProps) => {
  const { id: kbId, typeSlug, itemId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useI18n();

  const isEdit = mode === 'edit';
  const knowledgeBaseId = kbId ? parseInt(kbId) : undefined;

  const { data: contentType, isLoading: isLoadingType } = useQuery({
    queryKey: ['cms-content-type', typeSlug],
    queryFn: () => cmsService.getContentType(typeSlug!),
    enabled: !!typeSlug,
  });

  const { data: contentItem, isLoading: isLoadingItem } = useQuery({
    queryKey: ['cms-content-item', typeSlug, itemId],
    queryFn: () => cmsService.getContentItem(typeSlug!, parseInt(itemId!)),
    enabled: isEdit && !!typeSlug && !!itemId,
  });

  // Fetch categories for this knowledge base
  const { data: categories = [] } = useQuery<ContentCategory[]>({
    queryKey: ['cms-categories', knowledgeBaseId],
    queryFn: () => cmsService.getCategories(knowledgeBaseId),
    enabled: !!knowledgeBaseId,
  });

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [status, setStatus] = useState<string>('draft');
  const [visibility, setVisibility] = useState<string>('private');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);

  // Initialize form data when content item loads
  useState(() => {
    if (isEdit && contentItem) {
      setFormData(contentItem.data || {});
      setStatus(contentItem.status);
      setVisibility(contentItem.visibility);
      if (contentItem.categories) {
        setSelectedCategories(contentItem.categories.map((c: ContentCategory) => c.id));
      }
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: { data: Record<string, any>; status: string; visibility: string; category_ids?: number[] }) =>
      cmsService.createContentItem(typeSlug!, {
        ...data,
        knowledge_base_id: knowledgeBaseId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-content-items', typeSlug] });
      toast({ title: t('knowledgeBase.detailPage.contentItems.itemCreated') });
      navigate(`/dashboard/knowledge-base/${kbId}/content/${typeSlug}`);
    },
    onError: (error: any) => {
      toast({
        title: t('knowledgeBase.detailPage.contentItems.createFailed'),
        description: error.response?.data?.detail || t('common.errorOccurred'),
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { data: Record<string, any>; status: string; visibility: string; category_ids?: number[] }) =>
      cmsService.updateContentItem(typeSlug!, parseInt(itemId!), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-content-items', typeSlug] });
      queryClient.invalidateQueries({ queryKey: ['cms-content-item', typeSlug, itemId] });
      toast({ title: t('knowledgeBase.detailPage.contentItems.itemUpdated') });
      navigate(`/dashboard/knowledge-base/${kbId}/content/${typeSlug}`);
    },
    onError: (error: any) => {
      toast({
        title: t('knowledgeBase.detailPage.contentItems.updateFailed'),
        description: error.response?.data?.detail || t('common.errorOccurred'),
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { data: formData, status, visibility, category_ids: selectedCategories };
    if (isEdit) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleFieldChange = (slug: string, value: any) => {
    setFormData((prev) => ({ ...prev, [slug]: value }));
  };

  const renderFieldInput = (field: any) => {
    const value = formData[field.slug] || '';

    switch (field.type) {
      case 'text':
        return (
          <Input
            value={value}
            onChange={(e) => handleFieldChange(field.slug, e.target.value)}
            placeholder={`Enter ${field.name.toLowerCase()}...`}
          />
        );
      case 'rich_text':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleFieldChange(field.slug, e.target.value)}
            placeholder={`Enter ${field.name.toLowerCase()}...`}
            rows={5}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.slug, parseFloat(e.target.value))}
            placeholder="0"
          />
        );
      case 'boolean':
        return (
          <Switch
            checked={!!value}
            onCheckedChange={(checked) => handleFieldChange(field.slug, checked)}
          />
        );
      case 'url':
        return (
          <Input
            type="url"
            value={value}
            onChange={(e) => handleFieldChange(field.slug, e.target.value)}
            placeholder="https://..."
          />
        );
      case 'email':
        return (
          <Input
            type="email"
            value={value}
            onChange={(e) => handleFieldChange(field.slug, e.target.value)}
            placeholder="email@example.com"
          />
        );
      default:
        return (
          <Input
            value={typeof value === 'object' ? JSON.stringify(value) : value}
            onChange={(e) => handleFieldChange(field.slug, e.target.value)}
            placeholder={`Enter ${field.name.toLowerCase()}...`}
          />
        );
    }
  };

  if (isLoadingType || (isEdit && isLoadingItem)) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Set initial values from content item
  if (isEdit && contentItem && Object.keys(formData).length === 0) {
    setFormData(contentItem.data || {});
    setStatus(contentItem.status);
    setVisibility(contentItem.visibility);
    if (contentItem.categories && selectedCategories.length === 0) {
      setSelectedCategories(contentItem.categories.map((c: ContentCategory) => c.id));
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to={`/dashboard/knowledge-base/${kbId}/content/${typeSlug}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">
            {isEdit ? `Edit ${contentType?.name}` : `New ${contentType?.name}`}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Update this content item' : 'Create a new content item'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Content Fields */}
        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
            <CardDescription>Fill in the fields for this {contentType?.name?.toLowerCase()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {contentType?.field_schema?.map((field: any) => (
              <div key={field.slug} className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">
                    {field.name}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </label>
                  {field.searchable && (
                    <Badge variant="outline" className="text-xs">Searchable</Badge>
                  )}
                </div>
                {renderFieldInput(field)}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Categories */}
        {categories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderTree className="w-5 h-5" />
                {t('knowledgeBase.detailPage.categories.title')}
              </CardTitle>
              <CardDescription>
                {t('knowledgeBase.detailPage.categories.subtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <FolderTree className="w-4 h-4" />
                      {selectedCategories.length > 0
                        ? `${selectedCategories.length} ${t('knowledgeBase.detailPage.categories.selected')}`
                        : t('knowledgeBase.detailPage.categories.selectCategories')}
                    </span>
                    <ChevronDown className="w-4 h-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                    {categories.map((category) => (
                      <div key={category.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`category-${category.id}`}
                          checked={selectedCategories.includes(category.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedCategories([...selectedCategories, category.id]);
                            } else {
                              setSelectedCategories(selectedCategories.filter((id) => id !== category.id));
                            }
                          }}
                        />
                        <label
                          htmlFor={`category-${category.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {category.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Display selected categories as badges */}
              {selectedCategories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedCategories.map((catId) => {
                    const category = categories.find((c) => c.id === catId);
                    return category ? (
                      <Badge key={catId} variant="secondary" className="flex items-center gap-1">
                        {category.name}
                        <X
                          className="w-3 h-3 cursor-pointer hover:text-destructive"
                          onClick={() => setSelectedCategories(selectedCategories.filter((id) => id !== catId))}
                        />
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Publishing Options */}
        <Card>
          <CardHeader>
            <CardTitle>Publishing</CardTitle>
            <CardDescription>Control how this content is published and who can access it</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published (indexed for RAG)</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Visibility</label>
                <Select value={visibility} onValueChange={setVisibility}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="marketplace">Marketplace</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {status === 'published' && (
              <p className="text-sm text-muted-foreground bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                Published content is automatically indexed in ChromaDB and will be included in RAG queries.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link to={`/dashboard/knowledge-base/${kbId}/content/${typeSlug}`}>
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {(createMutation.isPending || updateMutation.isPending) ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isEdit ? 'Save Changes' : 'Create Content'}
          </Button>
        </div>
      </form>
    </div>
  );
};

// ==================== Exports ====================

export const KBContentTypeCreatePage = () => <KBContentTypeFormPage mode="create" />;
export const KBContentTypeEditPage = () => <KBContentTypeFormPage mode="edit" />;
export const KBContentItemsListPage = KBContentItemsPage;
export const KBContentItemCreatePage = () => <KBContentItemFormPage mode="create" />;
export const KBContentItemEditPage = () => <KBContentItemFormPage mode="edit" />;
