/**
 * Message Templates Management Page
 *
 * Full CRUD interface for managing message templates (saved replies).
 * Features:
 * - List all templates with search and filtering
 * - Create new templates
 * - Edit existing templates
 * - Delete templates
 * - View available variables
 * - Usage statistics
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Edit, Search, Sparkles, Info } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import {
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getAvailableVariables,
  MessageTemplate,
  AvailableVariables,
  TemplateCreateData,
} from '@/services/messageTemplateService';

export default function MessageTemplatesPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<MessageTemplate | null>(null);
  const queryClient = useQueryClient();

  // Fetch templates
  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['messageTemplates', search],
    queryFn: () => listTemplates({ search, page_size: 100 }),
  });

  // Fetch available variables
  const { data: variables } = useQuery<AvailableVariables>({
    queryKey: ['templateVariables'],
    queryFn: getAvailableVariables,
  });

  // Create template mutation
  const createMutation = useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messageTemplates'] });
      setCreateModalOpen(false);
      toast({
        title: t('success'),
        description: 'Template created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update template mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messageTemplates'] });
      setEditingTemplate(null);
      toast({
        title: t('success'),
        description: 'Template updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete template mutation
  const deleteMutation = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messageTemplates'] });
      setDeletingTemplate(null);
      toast({
        title: t('success'),
        description: 'Template deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleEdit = (template: MessageTemplate) => {
    setEditingTemplate(template);
  };

  const handleDelete = (template: MessageTemplate) => {
    setDeletingTemplate(template);
  };

  const confirmDelete = () => {
    if (deletingTemplate) {
      deleteMutation.mutate(deletingTemplate.id);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-purple-600" />
            Message Templates
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Create quick reply templates with variables. Type "/" in chat to use them.
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <TemplateForm
              variables={variables}
              onSubmit={(data) => createMutation.mutate(data)}
              onCancel={() => setCreateModalOpen(false)}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search templates by name, shortcut, or content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <VariablesInfoDialog variables={variables} />
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em]"></div>
          <p className="mt-4 text-slate-600">Loading templates...</p>
        </div>
      ) : templatesData && templatesData.templates.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="pt-6">
            <Sparkles className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
            <p className="text-slate-600 mb-4">
              Create your first template to get started with quick replies.
            </p>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templatesData?.templates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <code className="text-sm bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded text-purple-700 dark:text-purple-300">
                        /{template.shortcut}
                      </code>
                    </CardTitle>
                    <CardDescription className="mt-1">{template.name}</CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(template)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3 mb-3 whitespace-pre-wrap">
                  {template.content}
                </p>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {template.tags && template.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  <Badge variant={template.scope === 'shared' ? 'default' : 'outline'} className="text-xs">
                    {template.scope === 'shared' ? 'Shared' : 'Personal'}
                  </Badge>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Used {template.usage_count} times
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      {editingTemplate && (
        <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <TemplateForm
              template={editingTemplate}
              variables={variables}
              onSubmit={(data) =>
                updateMutation.mutate({ id: editingTemplate.id, data })
              }
              onCancel={() => setEditingTemplate(null)}
              isLoading={updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingTemplate} onOpenChange={() => setDeletingTemplate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the template "/{deletingTemplate?.shortcut}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/**
 * Template Form Component
 */
interface TemplateFormProps {
  template?: MessageTemplate;
  variables?: AvailableVariables;
  onSubmit: (data: TemplateCreateData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

function TemplateForm({ template, variables, onSubmit, onCancel, isLoading }: TemplateFormProps) {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    shortcut: template?.shortcut || '',
    content: template?.content || '',
    tags: template?.tags?.join(', ') || '',
    scope: template?.scope || 'personal',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: formData.name,
      shortcut: formData.shortcut,
      content: formData.content,
      tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
      scope: formData.scope as 'personal' | 'shared',
    });
  };

  const insertVariable = (variable: string) => {
    setFormData((prev) => ({
      ...prev,
      content: prev.content + variable,
    }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{template ? 'Edit Template' : 'Create Template'}</DialogTitle>
        <DialogDescription>
          Create a quick reply template with variables. Use "/" followed by the shortcut in chat.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 mt-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Welcome Message"
              required
            />
          </div>
          <div>
            <Label htmlFor="shortcut">Shortcut * <span className="text-xs text-slate-500">(used after /)</span></Label>
            <Input
              id="shortcut"
              value={formData.shortcut}
              onChange={(e) => setFormData({ ...formData, shortcut: e.target.value.toLowerCase() })}
              placeholder="e.g., welcome"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="content">Content *</Label>
          <Textarea
            id="content"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="Hi {{contact_name}}, welcome to {{company_name}}! I'm {{agent_name}}, how can I help?"
            rows={6}
            required
          />
          <p className="text-xs text-slate-500 mt-1">
            Use variables like {'{{contact_name}}'}, {'{{agent_name}}'}, etc. Click variables below to insert.
          </p>
        </div>

        {/* Available Variables */}
        {variables && (
          <div className="border rounded-lg p-3 bg-slate-50 dark:bg-slate-900">
            <Label className="text-xs font-semibold mb-2 block">Available Variables (click to insert)</Label>
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {Object.entries(variables).map(([category, vars]) => (
                  <div key={category}>
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 capitalize">
                      {category.replace('_variables', '')}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {vars.map((v) => (
                        <Button
                          key={v.variable}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => insertVariable(v.variable)}
                          title={v.description}
                        >
                          {v.variable}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <div>
          <Label htmlFor="tags">Tags <span className="text-xs text-slate-500">(comma-separated)</span></Label>
          <Input
            id="tags"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="e.g., greeting, support, sales"
          />
        </div>

        <div>
          <Label>Visibility</Label>
          <RadioGroup value={formData.scope} onValueChange={(value) => setFormData({ ...formData, scope: value })}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="personal" id="personal" />
              <Label htmlFor="personal" className="font-normal cursor-pointer">
                Personal - Only visible to you
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="shared" id="shared" />
              <Label htmlFor="shared" className="font-normal cursor-pointer">
                Shared - Visible to everyone in your company
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>
      <DialogFooter className="mt-6">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : template ? 'Update' : 'Create'}
        </Button>
      </DialogFooter>
    </form>
  );
}

/**
 * Variables Info Dialog
 */
function VariablesInfoDialog({ variables }: { variables?: AvailableVariables }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Info className="h-4 w-4 mr-2" />
          Variables
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Available Template Variables</DialogTitle>
          <DialogDescription>
            Use these variables in your templates. They'll be replaced with actual values when you send a message.
          </DialogDescription>
        </DialogHeader>
        {variables && (
          <div className="space-y-4 mt-4">
            {Object.entries(variables).map(([category, vars]) => (
              <div key={category}>
                <h3 className="font-semibold text-sm mb-2 capitalize">
                  {category.replace('_variables', ' Variables')}
                </h3>
                <div className="space-y-1">
                  {vars.map((v) => (
                    <div key={v.variable} className="flex items-start gap-2 text-sm">
                      <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs">
                        {v.variable}
                      </code>
                      <span className="text-slate-600 dark:text-slate-400">{v.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
