import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Code, Send, RotateCcw, Palette } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useI18n } from '@/hooks/useI18n';
import { LanguageManager } from './LanguageManager';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface PublishStatus {
  is_published: boolean;
  publish_id: string | null;
  is_active: boolean;
}

interface WebChatCustomizerProps {
  customization: any;
  updateCustomization: (key: string, value: any) => void;
  handleSaveChanges: () => void;
  handlePublish: () => void;
  handleUnpublish?: () => void;
  publishStatus?: PublishStatus | null;
  generateEmbedCode: () => string;
  toast: any;
  selectedAgentId: number | null;
}

interface WebChatCustomizerPropsExtended extends WebChatCustomizerProps {
  agents?: any[];
  selectedAgentId: number | null;
  onAgentChange?: (agentId: number) => void;
  previewType?: string;
  onPreviewTypeChange?: (type: string) => void;
}

export const WebChatCustomizer: React.FC<WebChatCustomizerPropsExtended> = ({
  customization,
  updateCustomization,
  handleSaveChanges,
  handlePublish,
  handleUnpublish,
  publishStatus,
  generateEmbedCode,
  toast,
  selectedAgentId,
  agents,
  onAgentChange,
  previewType,
  onPreviewTypeChange
}) => {
  const { t } = useTranslation();
  const { isRTL } = useI18n();
  const [showGradientEditor, setShowGradientEditor] = useState(false);
  const [gradientAngle, setGradientAngle] = useState(135);
  const [gradientColor1, setGradientColor1] = useState("#3B82F6");
  const [gradientColor2, setGradientColor2] = useState("#8B5CF6");
  const [gradientColor3, setGradientColor3] = useState("#EC4899");
  const [activeGradientField, setActiveGradientField] = useState<string | null>(null);

  const extractHexFromColor = (color: string): string => {
    if (!color) return '#000000';
    if (/^#[0-9A-Fa-f]{3,6}$/.test(color)) return color;
    const match = color.match(/#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}/);
    return match ? match[0] : '#000000';
  };

  const widgetSizeDefaults = {
    small: { width: 300, height: 400 },
    medium: { width: 350, height: 500 },
    large: { width: 400, height: 600 },
  };

  const defaultGradientColors = {
    primary_color: "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #EC4899 100%)",
    user_message_color: "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)",
    user_message_text_color: "#FFFFFF",
    bot_message_color: "linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)",
    bot_message_text_color: "#1E293B",
    time_color: "#9CA3AF",
  };

  const handleResetColors = () => {
    Object.entries(defaultGradientColors).forEach(([key, value]) => {
      updateCustomization(key, value);
    });
    toast({ title: t('designer.colorsReset') });
  };

  const applyGradient = () => {
    if (!activeGradientField) return;
    const gradient = `linear-gradient(${gradientAngle}deg, ${gradientColor1} 0%, ${gradientColor2} 50%, ${gradientColor3} 100%)`;
    updateCustomization(activeGradientField, gradient);
    setShowGradientEditor(false);
    setActiveGradientField(null);
    toast({ title: t('designer.gradientApplied') });
  };

  const openGradientEditor = (field: string) => {
    setActiveGradientField(field);
    setShowGradientEditor(true);
  };

  const renderColorInput = (field: string, label: string) => {
    return (
      <div>
        <Label htmlFor={field} className="text-xs dark:text-gray-300 mb-1 block text-left">{label}</Label>
        <div className="flex items-center gap-1.5">
          <input
            type="color"
            value={extractHexFromColor(customization[field])}
            onChange={(e) => updateCustomization(field, e.target.value)}
            className="w-8 h-8 p-0.5 rounded border dark:border-slate-600 cursor-pointer flex-shrink-0"
          />
          <Input
            value={customization[field]}
            onChange={(e) => updateCustomization(field, e.target.value)}
            className="text-xs dark:bg-slate-800 dark:border-slate-600 dark:text-white h-8"
          />
          <Button
            onClick={() => openGradientEditor(field)}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 flex-shrink-0"
            title="Gradient Editor"
          >
            <Palette className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card className="border-0 shadow-xl shadow-slate-200/50 dark:shadow-none app-surface h-fit flex flex-col rounded-2xl overflow-hidden">
      <CardHeader className="border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 flex-shrink-0 py-2 px-4">
        <div className={`flex items-center justify-between mb-2`}>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-md shadow-pink-500/25 flex-shrink-0">
              <Palette className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
            </div>
            <CardTitle className="text-slate-900 dark:text-white text-sm sm:text-xl font-semibold truncate">{t('designer.webChatCustomization')}</CardTitle>
          </div>
          <div className={`flex items-center gap-1.5 sm:gap-2 flex-shrink-0`}>
            {publishStatus?.is_published && (
              <span className={`hidden sm:inline-flex px-3 py-1.5 rounded-full text-xs font-semibold ${
                publishStatus.is_active
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                  : 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400'
              }`}>
                {publishStatus.is_active ? 'Published' : 'Unpublished'}
              </span>
            )}
            <Button onClick={handleSaveChanges} disabled={!selectedAgentId} className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-md shadow-pink-500/25 hover:shadow-pink-500/40 transition-all duration-200 px-2 sm:px-3">
              <Save className={`h-4 w-4 ${isRTL ? 'sm:ml-2' : 'sm:mr-2'}`} />
              <span className="hidden sm:inline">{t('designer.save')}</span>
            </Button>
            <Button onClick={handlePublish} disabled={!selectedAgentId} variant="outline" className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 px-2 sm:px-3">
              <Send className={`h-4 w-4 ${isRTL ? 'sm:ml-2' : 'sm:mr-2'}`} />
              <span className="hidden sm:inline">{publishStatus?.is_published && publishStatus?.is_active ? 'Update' : t('designer.publish')}</span>
            </Button>
            {publishStatus?.is_published && publishStatus?.is_active && handleUnpublish && (
              <Button onClick={handleUnpublish} variant="outline" className="border-red-200 dark:border-red-800 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 px-2 sm:px-3">
                <span className="hidden sm:inline">Unpublish</span>
                <span className="sm:hidden text-xs">✕</span>
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
          <div>
            <Label htmlFor="agent-selector" className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">{t('designer.selectAgent')}</Label>
            <select
              id="agent-selector"
              value={selectedAgentId ?? ""}
              onChange={(e) => onAgentChange?.(parseInt(e.target.value))}
              className="w-full p-1.5 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs"
            >
              <option value="" disabled>{t('designer.selectAnAgent')}</option>
              {agents?.map(agent => (
                <option key={agent.id} value={agent.id}>{agent.name}</option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">{t('designer.previewType')}</Label>
            <div className="w-full p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-muted/60 text-xs text-muted-foreground select-none">
              {t('designer.webChat')}
            </div>
          </div>
        </div>

        <CardDescription className="text-slate-500 dark:text-slate-400 mt-1 text-xs">
          {t('designer.customizeDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-100/80 dark:bg-slate-900/50 sticky top-0 z-10 p-0.5 rounded-xl h-8">
            <TabsTrigger value="appearance" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm dark:text-slate-300 rounded-lg text-sm font-medium transition-all">{t('designer.appearance')}</TabsTrigger>
            <TabsTrigger value="behavior" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm dark:text-slate-300 rounded-lg text-sm font-medium transition-all">{t('designer.behaviorEmbed')}</TabsTrigger>
          </TabsList>

          <TabsContent value="appearance" className="space-y-3 pt-3">
            {/* Style & Settings Section */}
            <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-800/50 rounded-xl p-3 border border-slate-200/80 dark:border-slate-700/80">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="h-6 w-6 rounded-md bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                  <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </div>
                <h4 className="font-semibold text-slate-800 dark:text-white text-xs">{t('designer.styleSettings')}</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="col-span-1 sm:col-span-2">
                  <Label className="text-xs dark:text-gray-300 mb-1 block text-left">{t('designer.widgetSize')}</Label>
                  <div className="grid grid-cols-3 gap-1.5 mb-2">
                    <Button type="button" size="sm" variant={customization.widget_size === "small" ? "default" : "outline"} className="h-7 text-xs" onClick={() => { updateCustomization("widget_size", "small"); updateCustomization("widget_width", widgetSizeDefaults.small.width); updateCustomization("widget_height", widgetSizeDefaults.small.height); }}>{t('designer.small')}</Button>
                    <Button type="button" size="sm" variant={customization.widget_size === "medium" ? "default" : "outline"} className="h-7 text-xs" onClick={() => { updateCustomization("widget_size", "medium"); updateCustomization("widget_width", widgetSizeDefaults.medium.width); updateCustomization("widget_height", widgetSizeDefaults.medium.height); }}>{t('designer.medium')}</Button>
                    <Button type="button" size="sm" variant={customization.widget_size === "large" ? "default" : "outline"} className="h-7 text-xs" onClick={() => { updateCustomization("widget_size", "large"); updateCustomization("widget_width", widgetSizeDefaults.large.width); updateCustomization("widget_height", widgetSizeDefaults.large.height); }}>{t('designer.large')}</Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs dark:text-gray-300 mb-1 block text-left">
                        Width: {customization.widget_width || widgetSizeDefaults[customization.widget_size as keyof typeof widgetSizeDefaults]?.width || 350}px
                      </Label>
                      <Input
                        type="range" min="260" max="520"
                        value={customization.widget_width || widgetSizeDefaults[customization.widget_size as keyof typeof widgetSizeDefaults]?.width || 350}
                        onChange={(e) => updateCustomization("widget_width", parseInt(e.target.value))}
                        className="w-full h-6 dark:bg-slate-700"
                      />
                    </div>
                    <div>
                      <Label className="text-xs dark:text-gray-300 mb-1 block text-left">
                        Height: {customization.widget_height || widgetSizeDefaults[customization.widget_size as keyof typeof widgetSizeDefaults]?.height || 500}px
                      </Label>
                      <Input
                        type="range" min="300" max="720"
                        value={customization.widget_height || widgetSizeDefaults[customization.widget_size as keyof typeof widgetSizeDefaults]?.height || 500}
                        onChange={(e) => updateCustomization("widget_height", parseInt(e.target.value))}
                        className="w-full h-6 dark:bg-slate-700"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="font_family" className="text-xs dark:text-gray-300 mb-1 block text-left">{t('designer.fontFamily')}</Label>
                  <select id="font_family" value={customization.font_family} onChange={(e) => updateCustomization("font_family", e.target.value)} className={`w-full p-1.5 text-xs border rounded-md bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-pink-500 text-left`}>
                    <option value="Inter">Inter</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Open Sans">Open Sans</option>
                    <option value="Lato">Lato</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="border_radius" className="text-xs dark:text-gray-300 mb-1 block text-left">{t('designer.borderRadius')}: {customization.border_radius}px</Label>
                  <Input id="border_radius" type="range" min="0" max="30" value={customization.border_radius} onChange={(e) => updateCustomization("border_radius", parseInt(e.target.value))} className="w-full h-6 dark:bg-slate-700" />
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <Label htmlFor="z_index" className="text-xs dark:text-gray-300 mb-1 block text-left">{t('designer.zIndex')}</Label>
                  <Input
                    id="z_index"
                    type="number"
                    min="0"
                    max="999999"
                    value={customization.meta?.z_index || 9999}
                    onChange={(e) => updateCustomization("meta", { ...customization.meta, z_index: parseInt(e.target.value) })}
                    className={`w-full text-xs h-8 dark:bg-slate-800 dark:border-slate-600 dark:text-white text-left`}
                  />
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <Label htmlFor="communication_mode" className="text-xs dark:text-gray-300 mb-1 block text-left">{t('designer.communicationMode')}</Label>
                  <select id="communication_mode" value={customization.communication_mode} onChange={(e) => updateCustomization("communication_mode", e.target.value)} className={`w-full p-1.5 text-xs border rounded-md bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-pink-500 text-left`}>
                    <option value="chat_and_voice">{t('designer.chatAndVoice')}</option>
                    <option value="voice">{t('designer.voiceOnly')}</option>
                    <option value="chat">{t('designer.chatOnly')}</option>
                  </select>
                </div>

                <div className={`col-span-1 flex items-center justify-between p-2 rounded-lg border border-border app-surface`}>
                  <Label className="text-xs dark:text-white font-medium">{t('designer.darkModeWidget')}</Label>
                  <Switch
                    checked={customization.dark_mode}
                    onCheckedChange={(checked) => updateCustomization("dark_mode", checked)}
                  />
                </div>
                <div className={`col-span-1 flex items-center justify-between p-2 rounded-lg border border-border app-surface`}>
                  <Label className="text-xs dark:text-white font-medium">{t('designer.rtlMode')}</Label>
                  <Switch
                    checked={customization.meta?.rtl_enabled || false}
                    onCheckedChange={(checked) => updateCustomization("meta", { ...customization.meta, rtl_enabled: checked })}
                  />
                </div>
              </div>
            </div>

            {/* Colors Section */}
            <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-800/50 rounded-xl p-3 border border-slate-200/80 dark:border-slate-700/80">
              <div className={`flex items-center justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="flex items-center gap-1.5">
                  <div className="h-6 w-6 rounded-md bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                    <Palette className="h-3.5 w-3.5 text-white" />
                  </div>
                  <h4 className="font-semibold text-slate-800 dark:text-white text-xs">{t('designer.colors')}</h4>
                </div>
                <Button
                  onClick={handleResetColors}
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 px-2"
                >
                  <RotateCcw className={`h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                  {t('designer.reset')}
                </Button>
              </div>
              <div className="space-y-1.5">
                <div className="grid grid-cols-2 gap-1.5">
                  {renderColorInput("primary_color", t('designer.primaryColor'))}
                  {renderColorInput("time_color", t('designer.timeColor'))}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {renderColorInput("user_message_color", t('designer.userMessage'))}
                  {renderColorInput("user_message_text_color", t('designer.userText'))}
                  {renderColorInput("bot_message_color", t('designer.botMessage'))}
                  {renderColorInput("bot_message_text_color", t('designer.botText'))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="behavior" className="space-y-4 pt-4">
            {/* Multi-Language Support */}
            <LanguageManager
              languages={customization.meta?.languages || { en: { welcome_message: customization.welcome_message, header_title: customization.header_title, input_placeholder: customization.input_placeholder, proactive_message: customization.proactive_message } }}
              defaultLanguage={customization.meta?.default_language || 'en'}
              onLanguagesChange={(languages) => updateCustomization("meta", { ...customization.meta, languages })}
              onDefaultLanguageChange={(lang) => updateCustomization("meta", { ...customization.meta, default_language: lang })}
            />

            {/* URLs + Toggles row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* URLs */}
              <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-800/50 rounded-xl p-2.5 border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="h-5 w-5 rounded bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                    </svg>
                  </div>
                  <h4 className="font-semibold text-slate-800 dark:text-white text-xs">{t('designer.urls')}</h4>
                </div>
                <div className="space-y-1.5">
                  <div>
                    <Label className="text-xs dark:text-gray-300 mb-0.5 block">{t('designer.agentAvatarUrl')}</Label>
                    <Input value={customization.agent_avatar_url} onChange={(e) => updateCustomization("agent_avatar_url", e.target.value)} className="text-xs h-7 dark:bg-slate-800 dark:border-slate-600 dark:text-white" placeholder="https://..." />
                  </div>
                  <div>
                    <Label className="text-xs dark:text-gray-300 mb-0.5 block">{t('designer.clientWebsiteUrl')}</Label>
                    <Input value={customization.client_website_url} onChange={(e) => updateCustomization("client_website_url", e.target.value)} className="text-xs h-7 dark:bg-slate-800 dark:border-slate-600 dark:text-white" placeholder="https://example.com" />
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-800/50 rounded-xl p-2.5 border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="h-5 w-5 rounded bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="5" width="22" height="14" rx="7" ry="7"/><circle cx="16" cy="12" r="3"/>
                    </svg>
                  </div>
                  <h4 className="font-semibold text-slate-800 dark:text-white text-xs">{t('designer.toggles')}</h4>
                </div>
                <div className="space-y-1">
                  {[
                    { label: t('designer.showHeader'), key: 'show_header', value: customization.show_header },
                    { label: t('designer.aiSuggestions'), key: 'suggestions_enabled', value: customization.suggestions_enabled },
                    { label: t('designer.typingIndicator'), key: 'typing_indicator_enabled', value: customization.typing_indicator_enabled },
                  ].map(({ label, key, value }) => (
                    <div key={key} className={`flex items-center justify-between px-2 py-1 rounded border border-border bg-card ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Label className="text-xs dark:text-white">{label}</Label>
                      <Switch checked={value} onCheckedChange={(checked) => updateCustomization(key, checked)} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Proactive Message + Embed Code row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Proactive Message */}
              <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-800/50 rounded-xl p-2.5 border border-slate-200/80 dark:border-slate-700/80">
                <div className={`flex items-center justify-between mb-1.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="flex items-center gap-1.5">
                    <div className="h-5 w-5 rounded bg-gradient-to-br from-violet-500 to-orange-500 flex items-center justify-center">
                      <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                    </div>
                    <h4 className="font-semibold text-slate-800 dark:text-white text-xs">{t('designer.proactiveMessage')}</h4>
                  </div>
                  <Switch checked={customization.proactive_message_enabled} onCheckedChange={(checked) => updateCustomization("proactive_message_enabled", checked)} />
                </div>
                {customization.proactive_message_enabled ? (
                  <div className="space-y-1.5 pt-1.5 border-t border-slate-200 dark:border-slate-700">
                    <div>
                      <Label className="text-xs dark:text-gray-300 mb-0.5 block">{t('designer.messageText')}</Label>
                      <Input value={customization.proactive_message} onChange={(e) => updateCustomization("proactive_message", e.target.value)} className="text-xs h-7 dark:bg-slate-800 dark:border-slate-600 dark:text-white" />
                    </div>
                    <div>
                      <Label className="text-xs dark:text-gray-300 mb-0.5 block">{t('designer.delaySeconds')}</Label>
                      <Input type="number" value={customization.proactive_message_delay} onChange={(e) => updateCustomization("proactive_message_delay", parseInt(e.target.value))} className="text-xs h-7 dark:bg-slate-800 dark:border-slate-600 dark:text-white" />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 dark:text-slate-500">{t('designer.autoEngageUsers')}</p>
                )}
              </div>

              {/* Embed Code */}
              <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-800/50 rounded-xl p-2.5 border border-slate-200/80 dark:border-slate-700/80 flex flex-col">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="h-5 w-5 rounded bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                      <Code className="h-3 w-3 text-white" />
                    </div>
                    <h4 className="font-semibold text-slate-800 dark:text-white text-xs">{t('designer.embedCode')}</h4>
                  </div>
                  <Button
                    size="sm"
                    className={`h-6 px-2 text-xs bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white ${isRTL ? 'flex-row-reverse' : ''}`}
                    onClick={() => { navigator.clipboard.writeText(generateEmbedCode()); toast({ title: t('designer.copiedClipboard') }); }}
                    disabled={!selectedAgentId}
                  >
                    <Code className={`h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                    {t('designer.copyEmbedCodeButton')}
                  </Button>
                </div>
                <div className="flex-1 p-2 bg-slate-900 dark:bg-slate-950 text-emerald-400 dark:text-emerald-300 rounded-lg font-mono text-xs overflow-auto border border-slate-700 dark:border-slate-800 max-h-40 sm:max-h-48">
                  <pre className="whitespace-pre-wrap break-all">{generateEmbedCode()}</pre>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        <Dialog open={showGradientEditor} onOpenChange={setShowGradientEditor}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('designer.gradientEditorTitle')}</DialogTitle>
              <DialogDescription>
                {t('designer.gradientEditorDesc')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-xs dark:text-gray-300 mb-1.5 block">{t('designer.angle')}: {gradientAngle}°</Label>
                <Input
                  type="range"
                  min="0"
                  max="360"
                  value={gradientAngle}
                  onChange={(e) => setGradientAngle(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs dark:text-gray-300 mb-1.5 block">{t('designer.color1')}</Label>
                  <input
                    type="color"
                    value={gradientColor1}
                    onChange={(e) => setGradientColor1(e.target.value)}
                    className="w-full h-10 rounded border dark:border-slate-600 cursor-pointer"
                  />
                </div>
                <div>
                  <Label className="text-xs dark:text-gray-300 mb-1.5 block">{t('designer.color2')}</Label>
                  <input
                    type="color"
                    value={gradientColor2}
                    onChange={(e) => setGradientColor2(e.target.value)}
                    className="w-full h-10 rounded border dark:border-slate-600 cursor-pointer"
                  />
                </div>
                <div>
                  <Label className="text-xs dark:text-gray-300 mb-1.5 block">{t('designer.color3')}</Label>
                  <input
                    type="color"
                    value={gradientColor3}
                    onChange={(e) => setGradientColor3(e.target.value)}
                    className="w-full h-10 rounded border dark:border-slate-600 cursor-pointer"
                  />
                </div>
              </div>
              <div
                className="w-full h-12 rounded border dark:border-slate-600"
                style={{ background: `linear-gradient(${gradientAngle}deg, ${gradientColor1} 0%, ${gradientColor2} 50%, ${gradientColor3} 100%)` }}
              />
            </div>
            <DialogFooter>
              <Button onClick={applyGradient} className="w-full bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-700 hover:to-red-700 text-white">
                {t('designer.applyGradient')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
