import { useState, useEffect, useRef } from 'react';
import { Code, Layers, Loader2, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import UnlayerEditor, { UnlayerEditorRef } from './UnlayerEditor';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const TOKENS = [
  { token: '{{first_name}}', description: "Contact's first name" },
  { token: '{{last_name}}',  description: "Contact's last name" },
  { token: '{{full_name}}',  description: "Contact's full name" },
  { token: '{{email}}',      description: "Contact's email" },
  { token: '{{company}}',    description: "Contact's company" },
  { token: '{{job_title}}',  description: "Contact's job title" },
  { token: '{{unsubscribe_link}}', description: 'Unsubscribe link' },
];

interface TemplateEditorProps {
  templateType: 'email' | 'sms' | 'whatsapp' | 'voice';
  subject?: string;
  body?: string;
  htmlBody?: string;
  design?: Record<string, any>;
  voiceScript?: string;
  ttsVoiceId?: string;
  personalizationTokens?: string[];
  onChange: (data: {
    subject?: string;
    body?: string;
    html_body?: string;
    design?: Record<string, any>;
    voice_script?: string;
    tts_voice_id?: string;
    personalization_tokens?: string[];
  }) => void;
  onAIGenerated?: (v: boolean) => void;
  exportRef?: React.MutableRefObject<(() => Promise<void>) | null>;
}

function TokenPicker({ onSelect }: { onSelect: (t: string) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
          <Code className="h-3 w-3" /> Insert token
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-1.5">
        {TOKENS.map((item) => (
          <button
            key={item.token}
            onClick={() => onSelect(item.token)}
            className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-muted"
          >
            <span className="font-mono text-violet-600 dark:text-violet-400">{item.token}</span>
            <span className="text-muted-foreground ml-2">– {item.description}</span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export default function TemplateEditor({
  templateType,
  subject: initialSubject = '',
  body: initialBody = '',
  htmlBody: initialHtmlBody = '',
  design: initialDesign,
  voiceScript: initialVoiceScript = '',
  ttsVoiceId: initialTtsVoiceId = '',
  personalizationTokens: initialTokens = [],
  onChange,
  onAIGenerated,
  exportRef,
}: TemplateEditorProps) {
  // Content state
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [htmlBody, setHtmlBody] = useState(initialHtmlBody);
  const [voiceScript, setVoiceScript] = useState(initialVoiceScript);
  const [ttsVoiceId, setTtsVoiceId] = useState(initialTtsVoiceId);
  const [tokens, setTokens] = useState<string[]>(initialTokens);

  // Unlayer
  const unlayerRef = useRef<UnlayerEditorRef>(null);
  const [emailMode, setEmailMode] = useState<'drag-drop' | 'code'>(
    initialDesign ? 'drag-drop' : (initialHtmlBody && !initialDesign ? 'code' : 'drag-drop')
  );
  const [unlayerReady, setUnlayerReady] = useState(false);

  // Sync incoming prop changes (e.g. AI generation sets subject/body from outside)
  useEffect(() => { setSubject(initialSubject ?? ''); }, [initialSubject]);
  useEffect(() => { setBody(initialBody ?? ''); }, [initialBody]);
  useEffect(() => { setHtmlBody(initialHtmlBody ?? ''); }, [initialHtmlBody]);
  useEffect(() => { setVoiceScript(initialVoiceScript ?? ''); }, [initialVoiceScript]);

  // Wire Unlayer export for parent save
  useEffect(() => {
    if (!exportRef) return;
    if (templateType !== 'email' || emailMode !== 'drag-drop') {
      exportRef.current = null;
      return;
    }
    exportRef.current = async () => {
      if (!unlayerRef.current) return;
      const { html, design } = await unlayerRef.current.exportHtml();
      setHtmlBody(html);
      onChange({ subject, body, html_body: html, design, personalization_tokens: tokens });
    };
  }, [templateType, emailMode, subject, body, tokens]);

  // Propagate changes to parent (not for Unlayer drag-drop — that exports on demand)
  useEffect(() => {
    if (templateType === 'email' && emailMode === 'drag-drop') return;
    onChange({
      subject: templateType === 'email' ? subject : undefined,
      body,
      html_body: templateType === 'email' ? htmlBody : undefined,
      voice_script: templateType === 'voice' ? voiceScript : undefined,
      tts_voice_id: templateType === 'voice' ? ttsVoiceId : undefined,
      personalization_tokens: tokens,
    });
  }, [subject, body, htmlBody, voiceScript, ttsVoiceId, tokens, emailMode]);

  // Auto-extract {{tokens}} from content
  useEffect(() => {
    const allContent = `${subject} ${body} ${htmlBody} ${voiceScript}`;
    const found = [...new Set((allContent.match(/\{\{[^}]+\}\}/g) || []))];
    if (JSON.stringify(found) !== JSON.stringify(tokens)) setTokens(found);
  }, [subject, body, htmlBody, voiceScript]);

  const insert = (token: string, field: 'subject' | 'body' | 'htmlBody' | 'voiceScript') => {
    if (field === 'subject') setSubject((p) => p + token);
    else if (field === 'body') setBody((p) => p + token);
    else if (field === 'htmlBody') setHtmlBody((p) => p + token);
    else setVoiceScript((p) => p + token);
  };

  // ── Email ──────────────────────────────────────────────────────────────────
  if (templateType === 'email') {
    return (
      <div className="space-y-4">
        {/* Subject */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Subject Line</Label>
            <TokenPicker onSelect={(t) => insert(t, 'subject')} />
          </div>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter email subject…"
            maxLength={500}
            className="text-sm"
          />
          <p className="text-[11px] text-muted-foreground text-right">{subject.length}/500</p>
        </div>

        {/* Plain text fallback */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-muted-foreground">
              Plain Text Fallback
              <span className="ml-1.5 text-[10px] font-normal">(used by email clients that block HTML)</span>
            </Label>
            <TokenPicker onSelect={(t) => insert(t, 'body')} />
          </div>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Plain text version of your email…"
            className="text-sm min-h-[72px] resize-none"
          />
        </div>

        {/* Mode toggle — segmented control */}
        <div className="flex items-center gap-0 p-1 bg-muted rounded-lg w-fit">
          <button
            onClick={() => setEmailMode('drag-drop')}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-md transition-all",
              emailMode === 'drag-drop'
                ? "bg-white dark:bg-card shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Layers className="h-3.5 w-3.5" />
            Drag &amp; Drop
          </button>
          <button
            onClick={() => setEmailMode('code')}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-md transition-all",
              emailMode === 'code'
                ? "bg-white dark:bg-card shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Code className="h-3.5 w-3.5" />
            HTML
          </button>
        </div>

        {/* Unlayer */}
        {emailMode === 'drag-drop' && (
          <div className="rounded-xl overflow-hidden border border-border">
            {!unlayerReady && (
              <div className="flex items-center justify-center h-40 bg-muted/40 text-muted-foreground text-sm gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading email builder…
              </div>
            )}
            <div className={unlayerReady ? 'block' : 'hidden'}>
              <UnlayerEditor
                ref={unlayerRef}
                initialDesign={initialDesign}
                onReady={() => setUnlayerReady(true)}
                minHeight={560}
              />
            </div>
          </div>
        )}

        {/* HTML + preview */}
        {emailMode === 'code' && (
          <Tabs defaultValue="html">
            <div className="flex items-center justify-between mb-2">
              <TabsList className="h-8">
                <TabsTrigger value="html" className="text-xs h-7">HTML</TabsTrigger>
                <TabsTrigger value="preview" className="text-xs h-7">
                  <Eye className="h-3 w-3 mr-1" /> Preview
                </TabsTrigger>
              </TabsList>
              <TokenPicker onSelect={(t) => insert(t, 'htmlBody')} />
            </div>
            <TabsContent value="html">
              <Textarea
                value={htmlBody}
                onChange={(e) => setHtmlBody(e.target.value)}
                placeholder="<html>…</html>"
                className="min-h-[480px] font-mono text-xs bg-slate-50 dark:bg-slate-900 resize-none"
              />
            </TabsContent>
            <TabsContent value="preview">
              <div className="border rounded-lg bg-white dark:bg-slate-900 overflow-hidden">
                {htmlBody ? (
                  <iframe
                    srcDoc={`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;padding:20px;margin:0;}a{color:#6366f1;}</style></head><body>${htmlBody}</body></html>`}
                    className="w-full h-[480px] border-0"
                    title="Preview"
                    sandbox="allow-same-origin"
                  />
                ) : (
                  <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                    No HTML content yet
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Tokens used */}
        {tokens.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tokens.map((t) => (
              <Badge key={t} variant="secondary" className="font-mono text-xs">
                {t}
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── SMS / WhatsApp ─────────────────────────────────────────────────────────
  if (templateType === 'sms' || templateType === 'whatsapp') {
    const maxLen = templateType === 'sms' ? 320 : 1024;
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Message</Label>
          <TokenPicker onSelect={(t) => insert(t, 'body')} />
        </div>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={`Write your ${templateType === 'sms' ? 'SMS' : 'WhatsApp'} message…`}
          className="text-sm min-h-[200px] resize-none"
          maxLength={maxLen}
        />
        <div className="flex justify-between text-[11px] text-muted-foreground">
          {templateType === 'sms' && <span>{body.length <= 160 ? '1 SMS' : '2 SMS segments'}</span>}
          <span className={cn("ml-auto", body.length > maxLen * 0.9 && "text-orange-500")}>
            {body.length}/{maxLen}
          </span>
        </div>
        {tokens.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tokens.map((t) => <Badge key={t} variant="secondary" className="font-mono text-xs">{t}</Badge>)}
          </div>
        )}
      </div>
    );
  }

  // ── Voice ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Voice Script</Label>
        <TokenPicker onSelect={(t) => insert(t, 'voiceScript')} />
      </div>
      <Textarea
        value={voiceScript}
        onChange={(e) => setVoiceScript(e.target.value)}
        placeholder="Write your voice call script…&#10;&#10;Use [pause] for pauses"
        className="text-sm min-h-[300px] resize-none"
      />
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">TTS Voice</Label>
        <Select value={ttsVoiceId} onValueChange={setTtsVoiceId}>
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Select a voice" />
          </SelectTrigger>
          <SelectContent>
            {["default", "alloy", "echo", "fable", "onyx", "nova", "shimmer"].map((v) => (
              <SelectItem key={v} value={v} className="text-sm capitalize">{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {tokens.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tokens.map((t) => <Badge key={t} variant="secondary" className="font-mono text-xs">{t}</Badge>)}
        </div>
      )}
    </div>
  );
}
