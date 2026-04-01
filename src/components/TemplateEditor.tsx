import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  Mail,
  MessageSquare,
  Phone,
  Sparkles,
  Code,
  Eye,
  Copy,
  ChevronDown,
  Loader2,
  Wand2,
  RefreshCw,
  Lightbulb,
  Key,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  generateTemplate,
  suggestSubjects,
  improveContent,
  getAvailableTokens,
  getAIProviders,
  AIGenerateRequest,
  AIProvider,
} from '@/services/templateService';

// Credential interface
interface Credential {
  id: number;
  name: string;
  service: string;
}

// Supported AI providers for template generation
const SUPPORTED_AI_SERVICES = ['groq', 'openai'];

interface TemplateEditorProps {
  templateType: 'email' | 'sms' | 'whatsapp' | 'voice';
  subject?: string;
  body?: string;
  htmlBody?: string;
  voiceScript?: string;
  ttsVoiceId?: string;
  personalizationTokens?: string[];
  onChange: (data: {
    subject?: string;
    body?: string;
    html_body?: string;
    voice_script?: string;
    tts_voice_id?: string;
    personalization_tokens?: string[];
  }) => void;
  onAIGenerated?: (isAIGenerated: boolean) => void;
}

const AVAILABLE_TOKENS = [
  { token: '{{first_name}}', description: "Contact's first name" },
  { token: '{{last_name}}', description: "Contact's last name" },
  { token: '{{full_name}}', description: "Contact's full name" },
  { token: '{{email}}', description: "Contact's email" },
  { token: '{{company}}', description: "Contact's company" },
  { token: '{{job_title}}', description: "Contact's job title" },
  { token: '{{unsubscribe_link}}', description: 'Unsubscribe link' },
];

const IMPROVEMENT_OPTIONS = [
  { value: 'more_engaging', label: 'More Engaging' },
  { value: 'shorter', label: 'Shorter & Concise' },
  { value: 'professional', label: 'More Professional' },
  { value: 'friendly', label: 'More Friendly' },
  { value: 'add_urgency', label: 'Add Urgency' },
  { value: 'clearer_cta', label: 'Clearer CTA' },
];

export default function TemplateEditor({
  templateType,
  subject: initialSubject = '',
  body: initialBody = '',
  htmlBody: initialHtmlBody = '',
  voiceScript: initialVoiceScript = '',
  ttsVoiceId: initialTtsVoiceId = '',
  personalizationTokens: initialTokens = [],
  onChange,
  onAIGenerated,
}: TemplateEditorProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { authFetch } = useAuth();

  // State
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [htmlBody, setHtmlBody] = useState(initialHtmlBody);
  const [voiceScript, setVoiceScript] = useState(initialVoiceScript);
  const [ttsVoiceId, setTtsVoiceId] = useState(initialTtsVoiceId);
  const [tokens, setTokens] = useState<string[]>(initialTokens);
  const [showPreview, setShowPreview] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);

  // AI state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTone, setAiTone] = useState<string>('professional');
  const [aiLoading, setAiLoading] = useState(false);
  const [subjectSuggestions, setSubjectSuggestions] = useState<string[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [improveLoading, setImproveLoading] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  const [selectedCredentialId, setSelectedCredentialId] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('');

  // Fetch credentials from vault
  const { data: credentials = [] } = useQuery<Credential[]>({
    queryKey: ['credentials'],
    queryFn: async () => {
      const response = await authFetch('/api/v1/credentials/');
      if (!response.ok) throw new Error('Failed to fetch credentials');
      return response.json();
    },
  });

  // Fetch AI providers
  const { data: providersData } = useQuery({
    queryKey: ['ai-providers'],
    queryFn: getAIProviders,
  });

  // Filter credentials that support AI generation (groq, openai)
  const aiCredentials = credentials.filter((cred) =>
    SUPPORTED_AI_SERVICES.includes(cred.service.toLowerCase())
  );

  // Get available models for selected credential
  const selectedCredential = aiCredentials.find((c) => c.id === selectedCredentialId);
  const selectedProvider = providersData?.providers?.find(
    (p) => p.service === selectedCredential?.service.toLowerCase()
  );
  const availableModels = selectedProvider?.models || [];

  // Auto-select first credential if available
  useEffect(() => {
    if (aiCredentials.length > 0 && !selectedCredentialId) {
      setSelectedCredentialId(aiCredentials[0].id);
    }
  }, [aiCredentials.length]); // Only depend on length to avoid infinite loop

  // Auto-select default model when credential changes
  useEffect(() => {
    if (selectedProvider && !selectedModel) {
      setSelectedModel(selectedProvider.default_model);
    }
  }, [selectedProvider?.default_model]); // Only depend on default_model

  // Update parent on changes
  useEffect(() => {
    onChange({
      subject: templateType === 'email' ? subject : undefined,
      body,
      html_body: templateType === 'email' ? htmlBody : undefined,
      voice_script: templateType === 'voice' ? voiceScript : undefined,
      tts_voice_id: templateType === 'voice' ? ttsVoiceId : undefined,
      personalization_tokens: tokens,
    });
  }, [subject, body, htmlBody, voiceScript, ttsVoiceId, tokens]);

  // Extract tokens from content
  const extractTokens = (content: string) => {
    const pattern = /\{\{([^}]+)\}\}/g;
    const matches = content.match(pattern) || [];
    return [...new Set(matches)];
  };

  // Update tokens when content changes
  useEffect(() => {
    const allContent = `${subject} ${body} ${htmlBody} ${voiceScript}`;
    const foundTokens = extractTokens(allContent);
    if (JSON.stringify(foundTokens) !== JSON.stringify(tokens)) {
      setTokens(foundTokens);
    }
  }, [subject, body, htmlBody, voiceScript]);

  // Insert token at cursor position
  const insertToken = (token: string, targetField: 'subject' | 'body' | 'htmlBody' | 'voiceScript') => {
    switch (targetField) {
      case 'subject':
        setSubject((prev) => prev + token);
        break;
      case 'body':
        setBody((prev) => prev + token);
        break;
      case 'htmlBody':
        setHtmlBody((prev) => prev + token);
        break;
      case 'voiceScript':
        setVoiceScript((prev) => prev + token);
        break;
    }
  };

  // AI Generate Template
  const handleAIGenerate = async () => {
    if (!selectedCredentialId) {
      toast({
        title: t('crm.templates.ai.credentialRequired', 'API Key Required'),
        description: t('crm.templates.ai.selectCredential', 'Please select an API key from the vault'),
        variant: 'destructive',
      });
      return;
    }

    if (!aiPrompt.trim()) {
      toast({
        title: t('crm.templates.ai.promptRequired', 'Prompt Required'),
        description: t('crm.templates.ai.enterPrompt', 'Please enter a prompt for AI generation'),
        variant: 'destructive',
      });
      return;
    }

    setAiLoading(true);
    try {
      const request: AIGenerateRequest = {
        credential_id: selectedCredentialId,
        model: selectedModel || undefined,
        template_type: templateType,
        prompt: aiPrompt,
        tone: aiTone as any,
        include_cta: true,
      };

      const response = await generateTemplate(request);

      if (response.subject) setSubject(response.subject);
      if (response.body) setBody(response.body);
      if (response.html_body) setHtmlBody(response.html_body);
      if (response.personalization_tokens) setTokens(response.personalization_tokens);

      onAIGenerated?.(true);

      toast({
        title: t('crm.templates.ai.generated', 'Template Generated'),
        description: t('crm.templates.ai.generatedDesc', 'AI has generated your template content'),
      });
    } catch (error: any) {
      console.error('AI generation error:', error);
      toast({
        title: t('crm.common.error'),
        description: error?.response?.data?.detail || t('crm.templates.ai.generateError', 'Failed to generate template'),
        variant: 'destructive',
      });
    } finally {
      setAiLoading(false);
    }
  };

  // AI Suggest Subjects
  const handleSuggestSubjects = async () => {
    if (!selectedCredentialId) {
      toast({
        title: t('crm.templates.ai.credentialRequired', 'API Key Required'),
        description: t('crm.templates.ai.selectCredential', 'Please select an API key from the vault'),
        variant: 'destructive',
      });
      return;
    }

    if (!body.trim()) {
      toast({
        title: t('crm.templates.ai.bodyRequired', 'Body Required'),
        description: t('crm.templates.ai.enterBody', 'Please enter body content first'),
        variant: 'destructive',
      });
      return;
    }

    setSuggestionsLoading(true);
    try {
      const response = await suggestSubjects({
        credential_id: selectedCredentialId,
        model: selectedModel || undefined,
        body,
        count: 5,
        tone: aiTone,
      });
      setSubjectSuggestions(response.subjects);
    } catch (error) {
      toast({
        title: t('crm.common.error'),
        description: t('crm.templates.ai.suggestError', 'Failed to generate suggestions'),
        variant: 'destructive',
      });
    } finally {
      setSuggestionsLoading(false);
    }
  };

  // AI Improve Content
  const handleImprove = async (improvement: string) => {
    if (!selectedCredentialId) {
      toast({
        title: t('crm.templates.ai.credentialRequired', 'API Key Required'),
        description: t('crm.templates.ai.selectCredential', 'Please select an API key from the vault'),
        variant: 'destructive',
      });
      return;
    }

    const content = templateType === 'voice' ? voiceScript : body;
    if (!content.trim()) return;

    setImproveLoading(true);
    try {
      const response = await improveContent({
        credential_id: selectedCredentialId,
        model: selectedModel || undefined,
        content,
        content_type: templateType === 'voice' ? 'voice_script' : 'body',
        improvements: [improvement],
      });

      if (templateType === 'voice') {
        setVoiceScript(response.improved_content);
      } else {
        setBody(response.improved_content);
      }

      toast({
        title: t('crm.templates.ai.improved', 'Content Improved'),
        description: response.changes_made.join(', '),
      });
    } catch (error) {
      toast({
        title: t('crm.common.error'),
        description: t('crm.templates.ai.improveError', 'Failed to improve content'),
        variant: 'destructive',
      });
    } finally {
      setImproveLoading(false);
    }
  };

  // Token Picker Component
  const TokenPicker = ({ onSelect }: { onSelect: (token: string) => void }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Code className="h-4 w-4 mr-2" />
          {t('crm.templates.insertToken', 'Insert Token')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2">
        <div className="space-y-1">
          {AVAILABLE_TOKENS.map((item) => (
            <button
              key={item.token}
              onClick={() => onSelect(item.token)}
              className="w-full text-left px-3 py-2 text-sm rounded hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <span className="font-mono text-purple-600 dark:text-purple-400">{item.token}</span>
              <span className="text-gray-500 dark:text-gray-400 ml-2">- {item.description}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );

  return (
    <div className="space-y-6">
      {/* AI Assistant Panel */}
      <Collapsible open={aiPanelOpen} onOpenChange={setAiPanelOpen}>
        <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
                  <Sparkles className="h-5 w-5" />
                  {t('crm.templates.ai.assistant', 'AI Assistant')}
                </CardTitle>
                <ChevronDown className={`h-5 w-5 transition-transform ${aiPanelOpen ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {/* API Key & Model Selection */}
              {aiCredentials.length === 0 ? (
                <div className="p-4 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg">
                  <div className="flex items-center gap-2 text-violet-700 dark:text-violet-400">
                    <Key className="h-5 w-5" />
                    <span className="font-medium">{t('crm.templates.ai.noApiKeys', 'No API Keys Found')}</span>
                  </div>
                  <p className="text-sm text-violet-600 dark:text-violet-500 mt-1">
                    {t('crm.templates.ai.addApiKey', 'Please add a Groq or OpenAI API key in the Vault to use AI features.')}
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap items-end gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-600 dark:text-gray-400">{t('crm.templates.ai.apiKey', 'API Key')}</Label>
                    <Select
                      value={selectedCredentialId?.toString() || ''}
                      onValueChange={(val) => {
                        setSelectedCredentialId(parseInt(val));
                        setSelectedModel(''); // Reset model when credential changes
                      }}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={t('crm.templates.ai.selectApiKey', 'Select API key')} />
                      </SelectTrigger>
                      <SelectContent>
                        {aiCredentials.map((cred) => (
                          <SelectItem key={cred.id} value={cred.id.toString()}>
                            <div className="flex items-center gap-2">
                              <Key className="h-3 w-3" />
                              <span>{cred.name}</span>
                              <Badge variant="outline" className="text-xs ml-1">
                                {cred.service}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {availableModels.length > 0 && (
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-600 dark:text-gray-400">{t('crm.templates.ai.model', 'Model')}</Label>
                      <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder={t('crm.templates.ai.selectModel', 'Select model')} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableModels.map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                              {model.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              {/* AI Prompt */}
              <div className="space-y-2">
                <Label>{t('crm.templates.ai.prompt', 'Describe what you want to create')}</Label>
                <div className="flex gap-2">
                  <Textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder={t('crm.templates.ai.promptPlaceholder', 'E.g., A welcome email for new customers that highlights our product benefits...')}
                    className="min-h-[80px]"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Select value={aiTone} onValueChange={setAiTone}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="persuasive">Persuasive</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={handleAIGenerate}
                  disabled={aiLoading || !aiPrompt.trim() || !selectedCredentialId}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                >
                  {aiLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4 mr-2" />
                  )}
                  {t('crm.templates.ai.generate', 'Generate')}
                </Button>

                {templateType === 'email' && body && (
                  <Button
                    variant="outline"
                    onClick={handleSuggestSubjects}
                    disabled={suggestionsLoading || !selectedCredentialId}
                  >
                    {suggestionsLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Lightbulb className="h-4 w-4 mr-2" />
                    )}
                    {t('crm.templates.ai.suggestSubjects', 'Suggest Subjects')}
                  </Button>
                )}
              </div>

              {/* Subject Suggestions */}
              {subjectSuggestions.length > 0 && (
                <div className="space-y-2">
                  <Label>{t('crm.templates.ai.subjectSuggestions', 'Subject Line Suggestions')}</Label>
                  <div className="flex flex-wrap gap-2">
                    {subjectSuggestions.map((suggestion, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30 py-1.5 px-3"
                        onClick={() => setSubject(suggestion)}
                      >
                        {suggestion}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Improve Options */}
              {(body || voiceScript) && (
                <div className="space-y-2">
                  <Label>{t('crm.templates.ai.improve', 'Improve Content')}</Label>
                  <div className="flex flex-wrap gap-2">
                    {IMPROVEMENT_OPTIONS.map((option) => (
                      <Button
                        key={option.value}
                        variant="outline"
                        size="sm"
                        onClick={() => handleImprove(option.value)}
                        disabled={improveLoading}
                      >
                        {improveLoading ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3 mr-1" />
                        )}
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Template Editor by Type */}
      {templateType === 'email' && (
        <div className="space-y-4">
          {/* Subject Line */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t('crm.templates.subject', 'Subject Line')}</Label>
              <TokenPicker onSelect={(token) => insertToken(token, 'subject')} />
            </div>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t('crm.templates.subjectPlaceholder', 'Enter email subject...')}
              maxLength={500}
            />
            <p className="text-xs text-gray-500">{subject.length}/500</p>
          </div>

          {/* Body Tabs */}
          <Tabs defaultValue="visual" className="space-y-4">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="visual">{t('crm.templates.visual', 'Visual')}</TabsTrigger>
                <TabsTrigger value="html">{t('crm.templates.html', 'HTML')}</TabsTrigger>
                <TabsTrigger value="preview">{t('crm.templates.preview', 'Preview')}</TabsTrigger>
              </TabsList>
              <TokenPicker onSelect={(token) => insertToken(token, showCodeEditor ? 'htmlBody' : 'body')} />
            </div>

            <TabsContent value="visual" className="space-y-2">
              <Label className="text-sm text-gray-600 dark:text-gray-400">
                {t('crm.templates.plainTextBody', 'Plain Text Version (used as fallback)')}
              </Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={t('crm.templates.bodyPlaceholder', 'Write your email content...')}
                className="min-h-[300px]"
              />
            </TabsContent>

            <TabsContent value="html" className="space-y-2">
              <Label className="text-sm text-gray-600 dark:text-gray-400">
                {t('crm.templates.htmlBodyLabel', 'HTML Version (rich formatting)')}
              </Label>
              <Textarea
                value={htmlBody}
                onChange={(e) => setHtmlBody(e.target.value)}
                placeholder={t('crm.templates.htmlPlaceholder', '<html>...</html>')}
                className="min-h-[300px] font-mono text-sm bg-slate-50 dark:bg-slate-900"
              />
            </TabsContent>

            <TabsContent value="preview">
              <div className="border rounded-lg bg-white dark:bg-slate-900 min-h-[300px] overflow-hidden">
                {htmlBody ? (
                  <iframe
                    srcDoc={`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;padding:20px;margin:0;}a{color:#6366f1;}h1,h2,h3{margin-top:0;}</style></head><body>${htmlBody}</body></html>`}
                    className="w-full h-[400px] border-0"
                    title="Email Preview"
                    sandbox="allow-same-origin"
                  />
                ) : body ? (
                  <div className="whitespace-pre-wrap p-4 text-gray-800 dark:text-gray-200">{body}</div>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-400">
                    {t('crm.templates.noPreview', 'No content to preview')}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {templateType === 'sms' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t('crm.templates.message', 'Message')}</Label>
              <TokenPicker onSelect={(token) => insertToken(token, 'body')} />
            </div>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t('crm.templates.smsPlaceholder', 'Write your SMS message...')}
              className="min-h-[150px]"
              maxLength={320}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{body.length <= 160 ? '1 SMS' : '2 SMS segments'}</span>
              <span className={body.length > 320 ? 'text-red-500' : ''}>{body.length}/320</span>
            </div>
          </div>
        </div>
      )}

      {templateType === 'whatsapp' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t('crm.templates.message', 'Message')}</Label>
              <TokenPicker onSelect={(token) => insertToken(token, 'body')} />
            </div>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t('crm.templates.whatsappPlaceholder', 'Write your WhatsApp message...')}
              className="min-h-[200px]"
              maxLength={1024}
            />
            <p className="text-xs text-gray-500">{body.length}/1024</p>
          </div>
        </div>
      )}

      {templateType === 'voice' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t('crm.templates.voiceScript', 'Voice Script')}</Label>
              <TokenPicker onSelect={(token) => insertToken(token, 'voiceScript')} />
            </div>
            <Textarea
              value={voiceScript}
              onChange={(e) => setVoiceScript(e.target.value)}
              placeholder={t('crm.templates.voicePlaceholder', 'Write your voice call script...\n\nUse [pause] for pauses\nUse (pronunciation) for pronunciation notes')}
              className="min-h-[300px]"
            />
          </div>

          <div className="space-y-2">
            <Label>{t('crm.templates.ttsVoice', 'TTS Voice')}</Label>
            <Select value={ttsVoiceId} onValueChange={setTtsVoiceId}>
              <SelectTrigger>
                <SelectValue placeholder={t('crm.templates.selectVoice', 'Select a voice')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default Voice</SelectItem>
                <SelectItem value="alloy">Alloy</SelectItem>
                <SelectItem value="echo">Echo</SelectItem>
                <SelectItem value="fable">Fable</SelectItem>
                <SelectItem value="onyx">Onyx</SelectItem>
                <SelectItem value="nova">Nova</SelectItem>
                <SelectItem value="shimmer">Shimmer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Used Tokens Display */}
      {tokens.length > 0 && (
        <div className="space-y-2">
          <Label>{t('crm.templates.usedTokens', 'Personalization Tokens Used')}</Label>
          <div className="flex flex-wrap gap-2">
            {tokens.map((token) => (
              <Badge key={token} variant="secondary" className="font-mono">
                {token}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
