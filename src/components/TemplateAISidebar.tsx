import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles, Settings2, Loader2, Wand2, Lightbulb, RefreshCw, Key, ChevronRight,
  Mail, MessageSquare, Phone, Tag, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  generateTemplate, suggestSubjects, improveContent,
  getAIProviders, AIGenerateRequest, AIProvider,
} from "@/services/templateService";

interface Credential { id: number; name: string; service: string; }
const SUPPORTED_AI = ["groq", "openai"];

const IMPROVE_OPTIONS = [
  { value: "more_engaging",  label: "More Engaging" },
  { value: "shorter",        label: "Shorter" },
  { value: "professional",   label: "Professional" },
  { value: "friendly",       label: "Friendly" },
  { value: "add_urgency",    label: "Add Urgency" },
  { value: "clearer_cta",    label: "Clearer CTA" },
];

const TYPE_ICONS: Record<string, any> = {
  email: Mail, sms: MessageSquare, whatsapp: MessageSquare, voice: Phone,
};

type Tab = "ai" | "settings";

interface SettingsState {
  name: string;
  description: string;
  templateType: "email" | "sms" | "whatsapp" | "voice";
  tags: string[];
}

interface TemplateAISidebarProps {
  // current content for AI context
  templateType: "email" | "sms" | "whatsapp" | "voice";
  subject?: string;
  body?: string;
  // settings
  settings: SettingsState;
  onSettingsChange: (s: SettingsState) => void;
  // AI callbacks
  onGenerated: (data: { subject?: string; body?: string; html_body?: string }) => void;
  onSubjectsGenerated: (subjects: string[]) => void;
  onImproved: (improved: string, field: "body" | "voice_script") => void;
  onAIGenerated: (v: boolean) => void;
  // lock type when editing existing template
  lockType?: boolean;
}

export default function TemplateAISidebar({
  templateType, subject, body,
  settings, onSettingsChange,
  onGenerated, onSubjectsGenerated, onImproved, onAIGenerated,
  lockType = false,
}: TemplateAISidebarProps) {
  const { toast } = useToast();
  const { authFetch } = useAuth();
  const [tab, setTab] = useState<Tab>("ai");

  // AI state
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("professional");
  const [generating, setGenerating] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [improving, setImproving] = useState<string | null>(null);
  const [credId, setCredId] = useState<number | null>(null);
  const [model, setModel] = useState("");

  // Settings — tag input
  const [tagInput, setTagInput] = useState("");

  const { data: credentials = [] } = useQuery<Credential[]>({
    queryKey: ["credentials"],
    queryFn: async () => {
      const r = await authFetch("/api/v1/credentials/");
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  const { data: providersData } = useQuery({
    queryKey: ["ai-providers"],
    queryFn: getAIProviders,
  });

  const aiCreds = credentials.filter((c) =>
    SUPPORTED_AI.includes(c.service.toLowerCase())
  );
  const selectedCred = aiCreds.find((c) => c.id === credId);
  const provider: AIProvider | undefined = providersData?.providers?.find(
    (p) => p.service === selectedCred?.service.toLowerCase()
  );
  const models = provider?.models ?? [];

  useEffect(() => {
    if (aiCreds.length > 0 && !credId) setCredId(aiCreds[0].id);
  }, [aiCreds.length]);

  useEffect(() => {
    if (provider && !model) setModel(provider.default_model);
  }, [provider?.default_model]);

  const requireCred = () => {
    if (!credId) {
      toast({ title: "API Key Required", description: "Select an API key in the AI tab", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleGenerate = async () => {
    if (!requireCred() || !prompt.trim()) return;
    setGenerating(true);
    try {
      const req: AIGenerateRequest = {
        credential_id: credId!,
        model: model || undefined,
        template_type: templateType,
        prompt,
        tone: tone as any,
        include_cta: true,
      };
      const res = await generateTemplate(req);
      onGenerated({ subject: res.subject, body: res.body, html_body: res.html_body });
      onAIGenerated(true);
      toast({ title: "Generated!", description: "AI wrote your template content" });
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.detail ?? "Generation failed", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleSuggestSubjects = async () => {
    if (!requireCred() || !body?.trim()) return;
    setSuggesting(true);
    try {
      const res = await suggestSubjects({ credential_id: credId!, model: model || undefined, body: body!, count: 5, tone });
      onSubjectsGenerated(res.subjects);
    } catch {
      toast({ title: "Error", description: "Failed to suggest subjects", variant: "destructive" });
    } finally {
      setSuggesting(false);
    }
  };

  const handleImprove = async (opt: string) => {
    if (!requireCred()) return;
    const content = templateType === "voice" ? body : body;
    if (!content?.trim()) return;
    setImproving(opt);
    try {
      const res = await improveContent({
        credential_id: credId!,
        model: model || undefined,
        content: content!,
        content_type: templateType === "voice" ? "voice_script" : "body",
        improvements: [opt],
      });
      onImproved(res.improved_content, templateType === "voice" ? "voice_script" : "body");
      toast({ title: "Improved", description: res.changes_made.join(", ") });
    } catch {
      toast({ title: "Error", description: "Failed to improve content", variant: "destructive" });
    } finally {
      setImproving(null);
    }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !settings.tags.includes(t)) {
      onSettingsChange({ ...settings, tags: [...settings.tags, t] });
      setTagInput("");
    }
  };

  const removeTag = (t: string) =>
    onSettingsChange({ ...settings, tags: settings.tags.filter((x) => x !== t) });

  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      {/* Tab bar */}
      <div className="flex-shrink-0 flex items-center border-b border-border px-2 pt-1.5 gap-0.5 bg-card">
        <button
          onClick={() => setTab("ai")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-all",
            tab === "ai"
              ? "bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 border border-b-0 border-violet-200 dark:border-violet-800"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Sparkles className="w-3.5 h-3.5" />
          AI
        </button>
        <button
          onClick={() => setTab("settings")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-all",
            tab === "settings"
              ? "bg-card text-foreground border border-b-0 border-border"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Settings2 className="w-3.5 h-3.5" />
          Settings
        </button>
      </div>

      {/* AI Tab */}
      {tab === "ai" && (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Credential + model */}
          {aiCreds.length === 0 ? (
            <div className="p-3 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg">
              <div className="flex items-center gap-2 text-violet-700 dark:text-violet-400 text-xs font-medium">
                <Key className="w-3.5 h-3.5" /> No API Keys Found
              </div>
              <p className="text-xs text-violet-600 dark:text-violet-500 mt-1">
                Add a Groq or OpenAI key in Vault to use AI features.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">API Key</Label>
              <Select
                value={credId?.toString() ?? ""}
                onValueChange={(v) => { setCredId(parseInt(v)); setModel(""); }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select key" />
                </SelectTrigger>
                <SelectContent>
                  {aiCreds.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()} className="text-xs">
                      <div className="flex items-center gap-2">
                        <Key className="w-3 h-3" /> {c.name}
                        <Badge variant="outline" className="text-[10px] ml-1">{c.service}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {models.length > 0 && (
                <>
                  <Label className="text-xs text-muted-foreground">Model</Label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((m) => (
                        <SelectItem key={m.id} value={m.id} className="text-xs">{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
          )}

          {/* Generate */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground">Generate Content</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to create… e.g. A welcome email for new SaaS customers"
              className="text-xs min-h-[80px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate();
              }}
            />
            <div className="flex gap-2">
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="h-8 text-xs flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["professional", "friendly", "casual", "formal", "persuasive"].map((t) => (
                    <SelectItem key={t} value={t} className="text-xs capitalize">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handleGenerate}
                disabled={generating || !prompt.trim() || !credId}
                className="bg-violet-600 hover:bg-violet-700 text-white text-xs px-3 gap-1"
              >
                {generating
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <Wand2 className="w-3 h-3" />
                }
                {generating ? "Writing…" : "Generate"}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">Tip: ⌘+Enter to generate</p>
          </div>

          {/* Suggest subjects */}
          {templateType === "email" && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground">Subject Ideas</Label>
              <p className="text-[10px] text-muted-foreground">Generates 5 subject line options based on your email body.</p>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs gap-1"
                onClick={handleSuggestSubjects}
                disabled={suggesting || !credId || !body?.trim()}
              >
                {suggesting
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <Lightbulb className="w-3 h-3" />
                }
                {suggesting ? "Thinking…" : "Suggest Subjects"}
              </Button>
            </div>
          )}

          {/* Improve */}
          {body?.trim() && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground">Improve Content</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {IMPROVE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleImprove(opt.value)}
                    disabled={!!improving || !credId}
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-md border transition-colors",
                      "text-muted-foreground border-border hover:bg-muted hover:text-foreground",
                      improving === opt.value && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {improving === opt.value
                      ? <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />
                      : <RefreshCw className="w-3 h-3 flex-shrink-0" />
                    }
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {tab === "settings" && (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Template Name *</Label>
            <Input
              value={settings.name}
              onChange={(e) => onSettingsChange({ ...settings, name: e.target.value })}
              placeholder="e.g. Welcome Email"
              className="h-8 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Description</Label>
            <Textarea
              value={settings.description}
              onChange={(e) => onSettingsChange({ ...settings, description: e.target.value })}
              placeholder="What's this template for?"
              rows={2}
              className="text-sm resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Type</Label>
            <Select
              value={settings.templateType}
              onValueChange={(v: any) => onSettingsChange({ ...settings, templateType: v })}
              disabled={lockType}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[
                  { v: "email", label: "Email", Icon: Mail },
                  { v: "sms", label: "SMS", Icon: MessageSquare },
                  { v: "whatsapp", label: "WhatsApp", Icon: MessageSquare },
                  { v: "voice", label: "Voice", Icon: Phone },
                ].map(({ v, label, Icon }) => (
                  <SelectItem key={v} value={v} className="text-sm">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5" /> {label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {lockType && (
              <p className="text-[10px] text-muted-foreground">Type cannot be changed when editing.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Tags</Label>
            <div className="flex gap-1.5">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTag()}
                placeholder="Add tag…"
                className="h-8 text-sm flex-1"
              />
              <Button variant="outline" size="sm" onClick={addTag} className="h-8 px-2">
                <Tag className="w-3.5 h-3.5" />
              </Button>
            </div>
            {settings.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {settings.tags.map((t) => (
                  <Badge key={t} variant="secondary" className="text-xs gap-1 pr-1">
                    {t}
                    <button onClick={() => removeTag(t)} className="hover:text-red-500">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
