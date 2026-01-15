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
import { Plus, Trash2, Edit, Search, Sparkles, Info, Loader2, MessageSquare, Hash, Tag } from 'lucide-react';
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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-all" />
            <div className="relative p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-xl shadow-purple-500/25">
              <MessageSquare className="h-8 w-8 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">
              Message Templates
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              Create quick reply templates with variables. Type "/" in chat to use them.
            </p>
          </div>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all">
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-2xl">
            <TemplateForm
              variables={variables}
              onSubmit={(data) => createMutation.mutate(data)}
              onCancel={() => setCreateModalOpen(false)}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search templates by name, shortcut, or content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl h-11 dark:bg-slate-900 dark:border-slate-600"
          />
        </div>
        <VariablesInfoDialog variables={variables} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
            <p className="text-slate-600 dark:text-slate-400">Loading templates...</p>
          </div>
        </div>
      ) : templatesData && templatesData.templates.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/30">
          <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-xl shadow-purple-500/25 mb-5">
            <MessageSquare className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-semibold mb-2 dark:text-white">No templates yet</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Create your first template to get started with quick replies.
          </p>
          <Button onClick={() => setCreateModalOpen(true)} className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl shadow-lg shadow-purple-500/25">
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Template
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templatesData?.templates.map((template) => (
            <Card key={template.id} className="group bg-white dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/60 rounded-xl hover:shadow-lg hover:shadow-purple-500/5 hover:border-purple-200 dark:hover:border-purple-800/50 transition-all">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <code className="text-sm bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 px-3 py-1.5 rounded-lg text-purple-700 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-700/50">
                        <Hash className="h-3 w-3 inline mr-1" />{template.shortcut}
                      </code>
                    </CardTitle>
                    <CardDescription className="mt-2 font-medium">{template.name}</CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(template)}
                      className="rounded-lg hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 transition-all"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(template)}
                      className="rounded-lg hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3 mb-3 whitespace-pre-wrap bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200/80 dark:border-slate-700/60">
                  {template.content}
                </p>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {template.tags && template.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <Tag className="h-3 w-3 mr-1" />{tag}
                    </Badge>
                  ))}
                  <Badge variant={template.scope === 'shared' ? 'default' : 'outline'} className={`text-xs rounded-lg ${template.scope === 'shared' ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0' : ''}`}>
                    {template.scope === 'shared' ? 'Shared' : 'Personal'}
                  </Badge>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Used {template.usage_count} times
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      {editingTemplate && (
        <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-2xl">
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
        <AlertDialogContent className="rounded-2xl sm:rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-500/25">
                <Trash2 className="h-5 w-5 text-white" />
              </div>
              <span>Delete Template?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-2">
              Are you sure you want to delete the template "/{deletingTemplate?.shortcut}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-4 border-t border-slate-200/80 dark:border-slate-700/60">
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-lg shadow-red-500/25"
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
      <DialogHeader className="pb-4 border-b border-slate-200/80 dark:border-slate-700/60">
        <DialogTitle className="flex items-center gap-3 text-xl">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/25">
            {template ? <Edit className="h-5 w-5 text-white" /> : <Plus className="h-5 w-5 text-white" />}
          </div>
          <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {template ? 'Edit Template' : 'Create Template'}
          </span>
        </DialogTitle>
        <DialogDescription className="mt-2">
          Create a quick reply template with variables. Use "/" followed by the shortcut in chat.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium dark:text-gray-300">Template Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Welcome Message"
              required
              className="rounded-xl h-11 dark:bg-slate-900 dark:border-slate-600"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shortcut" className="text-sm font-medium dark:text-gray-300">Shortcut * <span className="text-xs text-slate-500">(used after /)</span></Label>
            <Input
              id="shortcut"
              value={formData.shortcut}
              onChange={(e) => setFormData({ ...formData, shortcut: e.target.value.toLowerCase() })}
              placeholder="e.g., welcome"
              required
              className="rounded-xl h-11 dark:bg-slate-900 dark:border-slate-600"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="content" className="text-sm font-medium dark:text-gray-300">Content *</Label>
          <Textarea
            id="content"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="Hi {{contact_name}}, welcome to {{company_name}}! I'm {{agent_name}}, how can I help?"
            rows={6}
            required
            className="rounded-xl dark:bg-slate-900 dark:border-slate-600 resize-none"
          />
          <p className="text-xs text-slate-500">
            Use variables like {'{{contact_name}}'}, {'{{agent_name}}'}, etc. Click variables below to insert.
          </p>
        </div>

        {/* Available Variables */}
        {variables && (
          <div className="border border-slate-200/80 dark:border-slate-700/60 rounded-xl p-4 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/30">
            <Label className="text-xs font-semibold mb-3 block flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              Available Variables (click to insert)
            </Label>
            <ScrollArea className="h-32">
              <div className="space-y-3">
                {Object.entries(variables).map(([category, vars]) => (
                  <div key={category}>
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 capitalize">
                      {category.replace('_variables', '')}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {vars.map((v) => (
                        <Button
                          key={v.variable}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 rounded-lg hover:border-purple-300 hover:bg-purple-50 dark:hover:border-purple-700 dark:hover:bg-purple-900/20 transition-all"
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

        <div className="space-y-2">
          <Label htmlFor="tags" className="text-sm font-medium dark:text-gray-300">Tags <span className="text-xs text-slate-500">(comma-separated)</span></Label>
          <Input
            id="tags"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="e.g., greeting, support, sales"
            className="rounded-xl h-11 dark:bg-slate-900 dark:border-slate-600"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium dark:text-gray-300">Visibility</Label>
          <RadioGroup value={formData.scope} onValueChange={(value) => setFormData({ ...formData, scope: value })} className="space-y-2">
            <div className="flex items-center space-x-3 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <RadioGroupItem value="personal" id="personal" />
              <Label htmlFor="personal" className="font-normal cursor-pointer flex-1">
                <span className="font-medium">Personal</span>
                <span className="text-xs text-slate-500 ml-2">Only visible to you</span>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <RadioGroupItem value="shared" id="shared" />
              <Label htmlFor="shared" className="font-normal cursor-pointer flex-1">
                <span className="font-medium">Shared</span>
                <span className="text-xs text-slate-500 ml-2">Visible to everyone in your company</span>
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>
      <DialogFooter className="pt-4 border-t border-slate-200/80 dark:border-slate-700/60">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="rounded-xl">
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading} className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg shadow-purple-500/25">
          {isLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : template ? 'Update' : 'Create'}
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
        <Button variant="outline" className="rounded-xl hover:border-purple-300 hover:bg-purple-50 dark:hover:border-purple-700 dark:hover:bg-purple-900/20 transition-all">
          <Info className="h-4 w-4 mr-2" />
          Variables
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl rounded-2xl sm:rounded-2xl">
        <DialogHeader className="pb-4 border-b border-slate-200/80 dark:border-slate-700/60">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/25">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Available Template Variables
            </span>
          </DialogTitle>
          <DialogDescription className="mt-2">
            Use these variables in your templates. They'll be replaced with actual values when you send a message.
          </DialogDescription>
        </DialogHeader>
        {variables && (
          <div className="space-y-5 py-4">
            {Object.entries(variables).map(([category, vars]) => (
              <div key={category}>
                <h3 className="font-semibold text-sm mb-3 capitalize text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-600" />
                  {category.replace('_variables', ' Variables')}
                </h3>
                <div className="space-y-2">
                  {vars.map((v) => (
                    <div key={v.variable} className="flex items-start gap-3 text-sm p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <code className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 px-2.5 py-1 rounded-lg text-xs font-medium text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700/50 whitespace-nowrap">
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
