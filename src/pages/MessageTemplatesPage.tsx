import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Plus, Trash2, Edit2, Search, Sparkles, Info,
  Loader2, MessageSquare, Hash, Tag, X, ChevronRight,
  Users, Lock, Zap,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import {
  listTemplates, createTemplate, updateTemplate,
  deleteTemplate, getAvailableVariables,
  MessageTemplate, AvailableVariables, TemplateCreateData,
} from '@/services/messageTemplateService';

/* ─── keyframes ─────────────────────────────────────────────── */
const ANIM = `
  @keyframes fade-up {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes slide-in-right {
    from { opacity: 0; transform: translateX(24px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  .card-enter { animation: fade-up 0.3s ease both; }
  .panel-enter { animation: slide-in-right 0.25s ease both; }
  .fade-in { animation: fade-in 0.2s ease both; }
`;

/* ─── Skeleton ───────────────────────────────────────────────── */
const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded-lg bg-muted ${className}`} />
);

/* ─── TemplateCard ───────────────────────────────────────────── */
function TemplateCard({
  template, delay, onEdit, onDelete,
}: { template: MessageTemplate; delay: number; onEdit: () => void; onDelete: () => void }) {
  return (
    <div
      className="card-enter group relative flex flex-col rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all duration-200 overflow-hidden"
      style={{ animationDelay: `${delay}s` }}
    >
      {/* Top stripe accent */}
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-border to-transparent group-hover:via-primary/30 transition-all duration-300" />

      <div className="flex flex-col flex-1 p-5 gap-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="inline-flex items-center gap-1 shrink-0 text-[11px] font-semibold tracking-tight px-2.5 py-1 rounded-lg bg-muted border border-border text-foreground font-mono">
              <Hash className="h-2.5 w-2.5 text-muted-foreground" />{template.shortcut}
            </span>
          </div>

          {/* Action buttons — always visible on touch, hover on desktop */}
          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={onEdit}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Name */}
        <div>
          <p className="text-sm font-semibold text-foreground leading-snug">{template.name}</p>
        </div>

        {/* Content preview */}
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 flex-1 bg-muted/40 rounded-xl p-3 border border-border/50">
          {template.content}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Scope badge */}
            <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${
              template.scope === 'shared'
                ? 'bg-primary/10 text-primary border-primary/20'
                : 'bg-muted text-muted-foreground border-border'
            }`}>
              {template.scope === 'shared'
                ? <Users className="h-2.5 w-2.5" />
                : <Lock className="h-2.5 w-2.5" />}
              {template.scope === 'shared' ? 'Shared' : 'Personal'}
            </span>

            {/* Tags */}
            {template.tags?.slice(0, 2).map(tag => (
              <span key={tag} className="inline-flex items-center gap-0.5 text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                <Tag className="h-2 w-2" />{tag}
              </span>
            ))}
            {(template.tags?.length ?? 0) > 2 && (
              <span className="text-[10px] text-muted-foreground">+{template.tags.length - 2}</span>
            )}
          </div>

          {/* Usage count */}
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
            <Zap className="h-2.5 w-2.5" />{template.usage_count}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── TemplateForm (right-panel) ─────────────────────────────── */
function TemplateForm({
  template, variables, onSubmit, onCancel, isLoading,
}: {
  template?: MessageTemplate;
  variables?: AvailableVariables;
  onSubmit: (data: TemplateCreateData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      scope: formData.scope as 'personal' | 'shared',
    });
  };

  const insertVariable = (variable: string) => {
    const el = textareaRef.current;
    if (!el) {
      setFormData(p => ({ ...p, content: p.content + variable }));
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = formData.content.slice(0, start) + variable + formData.content.slice(end);
    setFormData(p => ({ ...p, content: next }));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + variable.length, start + variable.length);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border shrink-0">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {template ? 'Edit template' : 'New template'}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {template ? `Editing /${template.shortcut}` : 'Type / in chat to use your shortcut'}
          </p>
        </div>
        <button type="button" onClick={onCancel}
          className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable body */}
      <ScrollArea className="flex-1">
        <div className="p-4 sm:p-6 space-y-5">

          {/* Name + Shortcut */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Name</Label>
              <input
                className="w-full h-9 px-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-shadow"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Welcome message"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Shortcut <span className="normal-case font-normal">(after /)</span>
              </Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  className="w-full h-9 pl-8 pr-3 rounded-xl border border-border bg-background text-sm text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-shadow"
                  value={formData.shortcut}
                  onChange={e => setFormData({ ...formData, shortcut: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                  placeholder="welcome"
                  required
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Content</Label>
            <textarea
              ref={textareaRef}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-shadow resize-none leading-relaxed"
              rows={6}
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
              placeholder={`Hi {{contact_name}}, welcome to {{company_name}}!`}
              required
            />
          </div>

          {/* Variables */}
          {variables && Object.keys(variables).length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-muted-foreground" />
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Insert variable
                </Label>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-3">
                {Object.entries(variables).map(([category, vars]) => (
                  <div key={category}>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                      {category.replace('_variables', '')}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {vars.map(v => (
                        <button
                          key={v.variable}
                          type="button"
                          title={v.description}
                          onClick={() => insertVariable(v.variable)}
                          className="inline-flex items-center text-[10px] font-mono font-medium px-2 py-1 rounded-lg bg-background border border-border text-foreground hover:border-primary/50 hover:bg-primary/5 transition-colors"
                        >
                          {v.variable}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Tags <span className="normal-case font-normal">(comma-separated)</span>
            </Label>
            <input
              className="w-full h-9 px-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-shadow"
              value={formData.tags}
              onChange={e => setFormData({ ...formData, tags: e.target.value })}
              placeholder="greeting, support, sales"
            />
          </div>

          {/* Scope */}
          <div className="space-y-2">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Visibility</Label>
            <RadioGroup value={formData.scope} onValueChange={v => setFormData({ ...formData, scope: v })} className="space-y-2">
              {[
                { value: 'personal', label: 'Personal', desc: 'Only visible to you', Icon: Lock },
                { value: 'shared',   label: 'Shared',   desc: 'Visible to your whole team', Icon: Users },
              ].map(({ value, label, desc, Icon }) => (
                <label key={value}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    formData.scope === value
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <RadioGroupItem value={value} id={value} className="shrink-0" />
                  <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-[11px] text-muted-foreground">{desc}</p>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-border flex items-center justify-end gap-2 shrink-0">
        <button type="button" onClick={onCancel} disabled={isLoading}
          className="h-9 px-4 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted border border-border transition-colors disabled:opacity-50">
          Cancel
        </button>
        <button type="submit" disabled={isLoading}
          className="h-9 px-5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2">
          {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {template ? 'Save changes' : 'Create template'}
        </button>
      </div>
    </form>
  );
}

/* ─── Variables reference panel ──────────────────────────────── */
function VariablesPanel({ variables, onClose }: { variables?: AvailableVariables; onClose: () => void }) {
  return (
    <div className="panel-enter flex flex-col h-full">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">Template variables</p>
        </div>
        <button onClick={onClose}
          className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 sm:p-6 space-y-6">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Use these variables in your templates — they're replaced with real values when you send a message.
          </p>
          {variables && Object.entries(variables).map(([category, vars]) => (
            <div key={category}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                {category.replace('_variables', ' variables')}
              </p>
              <div className="space-y-1.5">
                {vars.map(v => (
                  <div key={v.variable} className="flex items-start gap-3 py-1">
                    <code className="text-[11px] font-mono font-medium px-2 py-1 rounded-lg bg-muted border border-border text-foreground shrink-0 mt-0.5">
                      {v.variable}
                    </code>
                    <p className="text-xs text-muted-foreground leading-relaxed pt-1">{v.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────── */
export default function MessageTemplatesPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [panel, setPanel] = useState<null | 'create' | 'edit' | 'variables'>(null);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<MessageTemplate | null>(null);
  const queryClient = useQueryClient();

  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['messageTemplates', search],
    queryFn: () => listTemplates({ search, page_size: 100 }),
  });

  const { data: variables } = useQuery<AvailableVariables>({
    queryKey: ['templateVariables'],
    queryFn: getAvailableVariables,
  });

  const createMutation = useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messageTemplates'] });
      setPanel(null);
      toast({ title: 'Template created' });
    },
    onError: (e: Error) => toast({ title: t('error'), description: e.message, variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messageTemplates'] });
      setPanel(null);
      setEditingTemplate(null);
      toast({ title: 'Template updated' });
    },
    onError: (e: Error) => toast({ title: t('error'), description: e.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messageTemplates'] });
      setDeletingTemplate(null);
      toast({ title: 'Template deleted' });
    },
    onError: (e: Error) => toast({ title: t('error'), description: e.message, variant: 'destructive' }),
  });

  const openEdit = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setPanel('edit');
  };

  const closePanel = () => { setPanel(null); setEditingTemplate(null); };

  const templates = templatesData?.templates ?? [];
  const panelOpen = panel !== null;

  return (
    <>
      <style>{ANIM}</style>
      <div className="flex h-full bg-background overflow-hidden">

        {/* ── Main content ── */}
        <div className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ${panelOpen ? 'sm:mr-[420px]' : ''}`}>

          {/* Header */}
          <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border bg-card">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-semibold text-foreground tracking-tight">Message Templates</h1>
                <p className="text-[11px] text-muted-foreground mt-0.5 hidden sm:block">Type / in chat to use a shortcut</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setPanel(p => p === 'variables' ? null : 'variables')}
                className={`flex items-center gap-1.5 h-8 px-2 sm:px-3 rounded-lg text-xs font-medium border transition-colors ${
                  panel === 'variables'
                    ? 'border-primary/30 bg-primary/5 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Info className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Variables</span>
              </button>
              <button
                onClick={() => { setEditingTemplate(null); setPanel('create'); }}
                className="flex items-center gap-1.5 h-8 px-2.5 sm:px-3.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">New template</span>
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="shrink-0 px-4 sm:px-6 py-3 border-b border-border bg-background">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                className="w-full h-9 pl-9 pr-3 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-shadow"
                placeholder="Search templates…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 sm:p-6 py-4 sm:py-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-6 w-20 rounded-lg" />
                    </div>
                    <Skeleton className="h-4 w-2/3 rounded" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-14 rounded-full" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-6">
                {/* Stacked icon arrangement */}
                <div className="relative h-20 w-20">
                  <div className="absolute inset-0 rounded-2xl bg-muted border border-border rotate-6 opacity-40" />
                  <div className="absolute inset-0 rounded-2xl bg-muted border border-border rotate-3 opacity-70" />
                  <div className="absolute inset-0 rounded-2xl bg-card border border-border flex items-center justify-center">
                    <MessageSquare className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>
                <div className="text-center space-y-1.5">
                  <p className="text-base font-semibold text-foreground">
                    {search ? `No results for "${search}"` : 'No templates yet'}
                  </p>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    {search
                      ? 'Try a different search term or clear the filter.'
                      : 'Create your first template to speed up replies with quick shortcuts.'}
                  </p>
                </div>
                {!search && (
                  <button
                    onClick={() => { setEditingTemplate(null); setPanel('create'); }}
                    className="flex items-center gap-2 h-9 px-5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    <Plus className="h-4 w-4" /> Create first template
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Stats row */}
                <div className="flex items-center gap-4 mb-5 text-xs text-muted-foreground">
                  <span>{templates.length} template{templates.length !== 1 ? 's' : ''}</span>
                  <span>·</span>
                  <span>{templates.filter(t => t.scope === 'shared').length} shared</span>
                  <span>·</span>
                  <span>{templates.reduce((a, t) => a + (t.usage_count ?? 0), 0)} total uses</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {templates.map((tpl, i) => (
                    <TemplateCard
                      key={tpl.id}
                      template={tpl}
                      delay={i * 0.04}
                      onEdit={() => openEdit(tpl)}
                      onDelete={() => setDeletingTemplate(tpl)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Slide-in right panel ── */}
        {panelOpen && (
          <>
            {/* Mobile backdrop */}
            <div className="sm:hidden fixed inset-0 bg-black/40 z-30" onClick={closePanel} />
          </>
        )}
        {panelOpen && (
          <div className="panel-enter fixed right-0 top-0 bottom-0 w-full sm:w-[420px] border-l border-border bg-card flex flex-col z-40 shadow-xl">
            {panel === 'create' && (
              <TemplateForm
                variables={variables}
                onSubmit={data => createMutation.mutate(data)}
                onCancel={closePanel}
                isLoading={createMutation.isPending}
              />
            )}
            {panel === 'edit' && editingTemplate && (
              <TemplateForm
                template={editingTemplate}
                variables={variables}
                onSubmit={data => updateMutation.mutate({ id: editingTemplate.id, data })}
                onCancel={closePanel}
                isLoading={updateMutation.isPending}
              />
            )}
            {panel === 'variables' && (
              <VariablesPanel variables={variables} onClose={closePanel} />
            )}
          </div>
        )}

        {/* ── Delete confirmation ── */}
        <AlertDialog open={!!deletingTemplate} onOpenChange={() => setDeletingTemplate(null)}>
          <AlertDialogContent className="rounded-2xl sm:rounded-2xl max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </div>
                Delete template?
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-1">
                <span className="font-medium text-foreground">/{deletingTemplate?.shortcut}</span> will be permanently removed.
                This can't be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="pt-4 border-t border-border">
              <AlertDialogCancel className="rounded-xl h-9 px-4 text-sm">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deletingTemplate && deleteMutation.mutate(deletingTemplate.id)}
                className="rounded-xl h-9 px-4 text-sm bg-destructive text-destructive-foreground hover:opacity-90"
              >
                {deleteMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}
