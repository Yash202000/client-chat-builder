import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ArrowLeft, Loader2, Save, Send, Archive, FolderTree, ChevronDown, X } from 'lucide-react';
import * as cmsService from '@/services/cmsService';
import {
  ContentType,
  ContentItem,
  ContentCategory,
  FieldDefinition,
  ContentStatus,
  ContentVisibility,
  FIELD_TYPE_INFO,
  STATUS_INFO,
  VISIBILITY_INFO,
} from '@/types/cms';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/hooks/useI18n';

interface ContentItemFormPageProps {
  mode: 'create' | 'edit';
}

const DynamicFieldRenderer = ({
  field,
  value,
  onChange,
}: {
  field: FieldDefinition;
  value: any;
  onChange: (value: any) => void;
}) => {
  const commonProps = {
    id: field.slug,
    placeholder: field.settings?.placeholder || `Enter ${field.name.toLowerCase()}...`,
  };

  switch (field.type) {
    case 'text':
    case 'url':
    case 'email':
      return (
        <Input
          {...commonProps}
          type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'rich_text':
      return (
        <Textarea
          {...commonProps}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          rows={6}
          className="font-mono"
        />
      );

    case 'number':
      return (
        <Input
          {...commonProps}
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          min={field.settings?.min}
          max={field.settings?.max}
        />
      );

    case 'boolean':
      return (
        <div className="flex items-center gap-2">
          <Switch
            id={field.slug}
            checked={!!value}
            onCheckedChange={onChange}
          />
          <Label htmlFor={field.slug} className="text-sm">
            {value ? 'Yes' : 'No'}
          </Label>
        </div>
      );

    case 'date':
      return (
        <Input
          {...commonProps}
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'datetime':
      return (
        <Input
          {...commonProps}
          type="datetime-local"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'select':
      return (
        <Select value={value || ''} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder={`Select ${field.name.toLowerCase()}...`} />
          </SelectTrigger>
          <SelectContent>
            {field.settings?.options?.map((option: string) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case 'tags':
      return (
        <Input
          {...commonProps}
          value={Array.isArray(value) ? value.join(', ') : value || ''}
          onChange={(e) =>
            onChange(e.target.value.split(',').map((t) => t.trim()).filter(Boolean))
          }
          placeholder="Enter tags separated by commas..."
        />
      );

    case 'json':
      return (
        <Textarea
          {...commonProps}
          value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value || ''}
          onChange={(e) => {
            try {
              onChange(JSON.parse(e.target.value));
            } catch {
              onChange(e.target.value);
            }
          }}
          rows={8}
          className="font-mono text-sm"
          placeholder="{}"
        />
      );

    case 'media':
    case 'audio':
    case 'video':
    case 'file':
      return (
        <div className="border-2 border-dashed rounded-lg p-4 text-center text-muted-foreground">
          <p className="text-sm">Media upload coming soon</p>
          <Input
            type="number"
            placeholder="Media ID (temporary)"
            value={value || ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
            className="mt-2"
          />
        </div>
      );

    case 'relation':
      return (
        <Input
          {...commonProps}
          type="text"
          value={Array.isArray(value) ? value.join(', ') : value || ''}
          onChange={(e) => {
            const vals = e.target.value.split(',').map((v) => v.trim()).filter(Boolean);
            onChange(field.settings?.multiple ? vals.map(Number) : Number(vals[0]) || null);
          }}
          placeholder="Enter related item IDs..."
        />
      );

    default:
      return (
        <Input
          {...commonProps}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
};

const ContentItemFormPage = ({ mode }: ContentItemFormPageProps) => {
  const { typeSlug, id } = useParams<{ typeSlug: string; id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useI18n();

  const isEdit = mode === 'edit';
  const itemId = id ? parseInt(id) : undefined;

  // State for selected categories
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);

  // Fetch content type schema
  const { data: contentType, isLoading: isLoadingType } = useQuery<ContentType>({
    queryKey: ['cms-content-type', typeSlug],
    queryFn: () => cmsService.getContentType(typeSlug!),
    enabled: !!typeSlug,
  });

  // Fetch categories - either for the knowledge base or all company categories
  const { data: categories = [] } = useQuery<ContentCategory[]>({
    queryKey: ['cms-categories', contentType?.knowledge_base_id],
    queryFn: () => cmsService.getCategories(contentType?.knowledge_base_id),
    enabled: !!contentType,
  });

  // Fetch existing item for edit mode
  const { data: existingItem, isLoading: isLoadingItem } = useQuery<ContentItem>({
    queryKey: ['cms-content-item', typeSlug, itemId],
    queryFn: () => cmsService.getContentItem(typeSlug!, itemId!),
    enabled: isEdit && !!typeSlug && !!itemId,
  });

  const form = useForm({
    defaultValues: {
      data: {} as Record<string, any>,
      status: 'draft' as ContentStatus,
      visibility: 'private' as ContentVisibility,
    },
  });

  // Set form values when existing item loads
  useEffect(() => {
    if (existingItem) {
      form.reset({
        data: existingItem.data || {},
        status: existingItem.status,
        visibility: existingItem.visibility,
      });
      // Set selected categories from existing item
      if (existingItem.categories) {
        setSelectedCategories(existingItem.categories.map((c: ContentCategory) => c.id));
      }
    }
  }, [existingItem, form]);

  const createMutation = useMutation({
    mutationFn: (values: { data: Record<string, any>; status: string; visibility: string; category_ids?: number[] }) =>
      cmsService.createContentItem(typeSlug!, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-content-items', typeSlug] });
      toast({ title: t('knowledgeBase.detailPage.contentItems.itemCreated') });
      navigate(`/dashboard/cms/content/${typeSlug}`);
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
    mutationFn: (values: { data: Record<string, any>; status: string; visibility: string; category_ids?: number[] }) =>
      cmsService.updateContentItem(typeSlug!, itemId!, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-content-items', typeSlug] });
      queryClient.invalidateQueries({ queryKey: ['cms-content-item', typeSlug, itemId] });
      toast({ title: t('knowledgeBase.detailPage.contentItems.itemUpdated') });
    },
    onError: (error: any) => {
      toast({
        title: t('knowledgeBase.detailPage.contentItems.updateFailed'),
        description: error.response?.data?.detail || t('common.errorOccurred'),
        variant: 'destructive',
      });
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => cmsService.publishContentItem(typeSlug!, itemId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-content-items', typeSlug] });
      queryClient.invalidateQueries({ queryKey: ['cms-content-item', typeSlug, itemId] });
      toast({ title: 'Item published' });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => cmsService.archiveContentItem(typeSlug!, itemId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-content-items', typeSlug] });
      queryClient.invalidateQueries({ queryKey: ['cms-content-item', typeSlug, itemId] });
      toast({ title: 'Item archived' });
    },
  });

  const onSubmit = (values: any) => {
    const submitData = {
      ...values,
      category_ids: selectedCategories,
    };
    if (isEdit) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleFieldChange = (slug: string, value: any) => {
    const currentData = form.getValues('data');
    form.setValue('data', { ...currentData, [slug]: value });
  };

  if (isLoadingType || (isEdit && isLoadingItem)) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const fieldSchema = contentType?.field_schema || [];
  const currentData = form.watch('data');
  const currentStatus = form.watch('status');

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={`/dashboard/cms/content/${typeSlug}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              {isEdit ? 'Edit' : 'New'} {contentType?.name || 'Item'}
            </h1>
            <p className="text-muted-foreground">
              {isEdit ? 'Update this content item' : 'Create a new content item'}
            </p>
          </div>
        </div>

        {isEdit && (
          <div className="flex items-center gap-2">
            {currentStatus === 'draft' && (
              <Button
                variant="outline"
                onClick={() => publishMutation.mutate()}
                disabled={publishMutation.isPending}
              >
                {publishMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Publish
              </Button>
            )}
            {currentStatus === 'published' && (
              <Button
                variant="outline"
                onClick={() => archiveMutation.mutate()}
                disabled={archiveMutation.isPending}
              >
                {archiveMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Archive className="w-4 h-4 mr-2" />
                )}
                Archive
              </Button>
            )}
          </div>
        )}
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Dynamic Fields */}
        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {fieldSchema.map((field: FieldDefinition) => (
              <div key={field.slug} className="space-y-2">
                <Label htmlFor={field.slug} className="flex items-center gap-2">
                  {field.name}
                  {field.required && <span className="text-destructive">*</span>}
                  <span className="text-xs text-muted-foreground">
                    ({FIELD_TYPE_INFO[field.type]?.label || field.type})
                  </span>
                </Label>
                <DynamicFieldRenderer
                  field={field}
                  value={currentData[field.slug]}
                  onChange={(value) => handleFieldChange(field.slug, value)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Status & Visibility */}
        <Card>
          <CardHeader>
            <CardTitle>Publishing</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.watch('status')}
                onValueChange={(v: ContentStatus) => form.setValue('status', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_INFO).map(([key, info]) => (
                    <SelectItem key={key} value={key}>
                      {info.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select
                value={form.watch('visibility')}
                onValueChange={(v: ContentVisibility) => form.setValue('visibility', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(VISIBILITY_INFO).map(([key, info]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex flex-col">
                        <span>{info.label}</span>
                        <span className="text-xs text-muted-foreground">{info.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link to={`/dashboard/cms/content/${typeSlug}`}>
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
            {isEdit ? 'Save Changes' : 'Create Item'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export const ContentItemCreatePage = () => <ContentItemFormPage mode="create" />;
export const ContentItemEditPage = () => <ContentItemFormPage mode="edit" />;

export default ContentItemFormPage;
