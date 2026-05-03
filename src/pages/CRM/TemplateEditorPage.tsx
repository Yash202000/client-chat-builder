import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import TemplateEditor from '@/components/TemplateEditor';
import TemplateAISidebar from '@/components/TemplateAISidebar';
import {
  getTemplate, createTemplate, updateTemplate,
  Template, TemplateCreate,
} from '@/services/templateService';

const TYPE_COLORS: Record<string, string> = {
  email: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  sms: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  whatsapp: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  voice: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

export default function TemplateEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const isEditMode = !!id && id !== 'new';

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [subjectSuggestions, setSubjectSuggestions] = useState<string[]>([]);
  const [isAIGenerated, setIsAIGenerated] = useState(false);

  const unlayerExportRef = useRef<(() => Promise<void>) | null>(null);

  // Settings (managed in sidebar)
  const [settings, setSettings] = useState({
    name: '',
    description: '',
    templateType: 'email' as 'email' | 'sms' | 'whatsapp' | 'voice',
    tags: [] as string[],
  });

  // Content (managed in editor)
  const [content, setContent] = useState<{
    subject?: string;
    body?: string;
    html_body?: string;
    design?: Record<string, any>;
    voice_script?: string;
    tts_voice_id?: string;
    personalization_tokens?: string[];
  }>({});

  useEffect(() => {
    if (isEditMode) fetchTemplate();
  }, [id]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const t = await getTemplate(parseInt(id!));
      setSettings({
        name: t.name,
        description: t.description || '',
        templateType: t.template_type,
        tags: t.tags || [],
      });
      setContent({
        subject: t.subject,
        body: t.body,
        html_body: t.html_body,
        design: t.design,
        voice_script: t.voice_script,
        tts_voice_id: t.tts_voice_id,
        personalization_tokens: t.personalization_tokens,
      });
      setIsAIGenerated(t.is_ai_generated);
    } catch {
      toast({ title: 'Error', description: 'Failed to load template', variant: 'destructive' });
      navigate('/dashboard/crm/templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings.name.trim()) {
      toast({ title: 'Name Required', description: 'Enter a template name in Settings →', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (unlayerExportRef.current) await unlayerExportRef.current();

      const data: TemplateCreate = {
        name: settings.name,
        description: settings.description || undefined,
        template_type: settings.templateType,
        subject: content.subject,
        body: content.body,
        html_body: content.html_body,
        design: content.design,
        voice_script: content.voice_script,
        tts_voice_id: content.tts_voice_id,
        personalization_tokens: content.personalization_tokens || [],
        tags: settings.tags,
        is_ai_generated: isAIGenerated,
      };

      if (isEditMode) {
        await updateTemplate(parseInt(id!), data);
        toast({ title: 'Saved', description: 'Template updated successfully' });
      } else {
        await createTemplate(data);
        toast({ title: 'Created', description: 'Template created successfully' });
        navigate('/dashboard/crm/templates');
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to save template', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // When AI generates content, merge into existing content state
  const handleAIGenerated = (data: { subject?: string; body?: string; html_body?: string }) => {
    setContent((prev) => ({
      ...prev,
      subject: data.subject ?? prev.subject,
      body: data.body ?? prev.body,
      html_body: data.html_body ?? prev.html_body,
    }));
  };

  const handleImproved = (improved: string, field: "body" | "voice_script") => {
    setContent((prev) => ({ ...prev, [field]: improved }));
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5 border-b border-border bg-card z-10">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => navigate('/dashboard/crm/templates')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold truncate">
              {settings.name || (isEditMode ? 'Edit Template' : 'New Template')}
            </h1>
            <Badge
              className={`text-[10px] font-medium px-2 py-0 capitalize ${TYPE_COLORS[settings.templateType]}`}
              variant="secondary"
            >
              {settings.templateType}
            </Badge>
            {isAIGenerated && (
              <Badge variant="secondary" className="text-[10px] px-2 py-0 bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                AI-generated
              </Badge>
            )}
          </div>
          {!settings.name && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Add a name in the Settings tab →
            </p>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setSidebarOpen((o) => !o)}
          title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {sidebarOpen
            ? <PanelRightClose className="h-4 w-4" />
            : <PanelRightOpen className="h-4 w-4" />
          }
        </Button>

        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving || !settings.name.trim()}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white gap-1.5"
        >
          {saving
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Save className="h-3.5 w-3.5" />
          }
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Main editor */}
        <div className="flex-1 overflow-y-auto p-5 min-w-0">
          {/* Subject suggestions strip */}
          {subjectSuggestions.length > 0 && settings.templateType === 'email' && (
            <div className="mb-4 p-3 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg">
              <p className="text-xs font-medium text-violet-700 dark:text-violet-400 mb-2">
                AI Subject Suggestions — click to use:
              </p>
              <div className="flex flex-wrap gap-2">
                {subjectSuggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setContent((prev) => ({ ...prev, subject: s }))}
                    className="text-xs px-3 py-1.5 rounded-full border border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-800/40 transition-colors"
                  >
                    {s}
                  </button>
                ))}
                <button
                  onClick={() => setSubjectSuggestions([])}
                  className="text-xs px-2 py-1.5 text-muted-foreground hover:text-foreground"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          <TemplateEditor
            templateType={settings.templateType}
            subject={content.subject}
            body={content.body}
            htmlBody={content.html_body}
            design={content.design}
            voiceScript={content.voice_script}
            ttsVoiceId={content.tts_voice_id}
            personalizationTokens={content.personalization_tokens}
            onChange={setContent}
            onAIGenerated={setIsAIGenerated}
            exportRef={unlayerExportRef}
          />
        </div>

        {/* AI + Settings sidebar */}
        {sidebarOpen && (
          <div className="flex-shrink-0 w-72 border-l border-border overflow-hidden">
            <TemplateAISidebar
              templateType={settings.templateType}
              subject={content.subject}
              body={content.body}
              settings={settings}
              onSettingsChange={setSettings}
              onGenerated={handleAIGenerated}
              onSubjectsGenerated={setSubjectSuggestions}
              onImproved={handleImproved}
              onAIGenerated={setIsAIGenerated}
              lockType={isEditMode}
            />
          </div>
        )}
      </div>
    </div>
  );
}
