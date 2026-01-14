import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
import { ArrowLeft, Plus, Trash, GripVertical, Loader2, Save } from 'lucide-react';
import * as cmsService from '@/services/cmsService';
import { FieldType, FIELD_TYPE_INFO } from '@/types/cms';
import { useToast } from '@/hooks/use-toast';

const fieldTypes = Object.keys(FIELD_TYPE_INFO) as FieldType[];

const fieldSchema = z.object({
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z][a-z0-9_]*$/, 'Slug must be lowercase with underscores'),
  name: z.string().min(1, 'Name is required'),
  type: z.enum(fieldTypes as [FieldType, ...FieldType[]]),
  required: z.boolean().optional(),
  searchable: z.boolean().optional(),
  settings: z.record(z.any()).optional(),
});

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z][a-z0-9-]*$/, 'Slug must be lowercase with hyphens'),
  description: z.string().optional(),
  icon: z.string().optional(),
  allow_public_publish: z.boolean().optional(),
  field_schema: z.array(fieldSchema).min(1, 'At least one field is required'),
});

type FormValues = z.infer<typeof formSchema>;

interface ContentTypeFormPageProps {
  mode: 'create' | 'edit';
}

const ContentTypeFormPage = ({ mode }: ContentTypeFormPageProps) => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const isEdit = mode === 'edit';

  const { data: contentType, isLoading: isLoadingType } = useQuery({
    queryKey: ['cms-content-type', slug],
    queryFn: () => cmsService.getContentType(slug!),
    enabled: isEdit && !!slug,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
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

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'field_schema',
  });

  const createMutation = useMutation({
    mutationFn: (data: FormValues) => cmsService.createContentType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-content-types'] });
      toast({ title: 'Content type created' });
      navigate('/dashboard/cms/types');
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
    mutationFn: (data: FormValues) => cmsService.updateContentType(slug!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-content-types'] });
      queryClient.invalidateQueries({ queryKey: ['cms-content-type', slug] });
      toast({ title: 'Content type updated' });
      navigate('/dashboard/cms/types');
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update content type',
        description: error.response?.data?.detail || 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: FormValues) => {
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
        <Link to="/dashboard/cms/types">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">
            {isEdit ? 'Edit Content Type' : 'Create Content Type'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Modify the schema for this content type' : 'Define a new content schema'}
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
                          placeholder="e.g., Blog Post"
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
                        <Input {...field} placeholder="e.g., blog-post" disabled={isEdit} />
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
                        Users can publish content with "public" visibility
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
                  <CardDescription>Define the fields for this content type</CardDescription>
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
            <Link to="/dashboard/cms/types">
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

export const ContentTypeCreatePage = () => <ContentTypeFormPage mode="create" />;
export const ContentTypeEditPage = () => <ContentTypeFormPage mode="edit" />;

export default ContentTypeFormPage;
