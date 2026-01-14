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
  const [activeGradientField, setActiveGradientField] = useState<'primary' | 'user_message' | 'user_text' | 'bot_message' | 'bot_text' | 'time' | null>(null);

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
    const fieldMap = {
      primary: 'primary_color',
      user_message: 'user_message_color',
      user_text: 'user_message_text_color',
      bot_message: 'bot_message_color',
      bot_text: 'bot_message_text_color',
      time: 'time_color'
    };
    updateCustomization(fieldMap[activeGradientField], gradient);
    setShowGradientEditor(false);
    setActiveGradientField(null);
    toast({ title: t('designer.gradientApplied') });
  };

  const openGradientEditor = (field: 'primary' | 'user_message' | 'user_text' | 'bot_message' | 'bot_text' | 'time') => {
    setActiveGradientField(field);
    setShowGradientEditor(true);
  };
  return (
    <Card className="border-0 shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-800 h-fit flex flex-col rounded-2xl overflow-hidden">
      <CardHeader className="border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 flex-shrink-0 py-5">
        <div className={`flex items-center justify-between mb-4`}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-md shadow-pink-500/25">
              <Palette className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-slate-900 dark:text-white text-xl font-semibold">{t('designer.webChatCustomization')}</CardTitle>
          </div>
          <div className={`flex items-center gap-2`}>
            {/* Publish Status Badge */}
            {publishStatus?.is_published && (
              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                publishStatus.is_active
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
              }`}>
                {publishStatus.is_active ? 'Published' : 'Unpublished'}
              </span>
            )}
            <Button onClick={handleSaveChanges} disabled={!selectedAgentId} className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-md shadow-pink-500/25 hover:shadow-pink-500/40 transition-all duration-200">
              <Save className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('designer.save')}
            </Button>
            <Button onClick={handlePublish} disabled={!selectedAgentId} variant="outline" className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200">
              <Send className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {publishStatus?.is_published && publishStatus?.is_active ? 'Update' : t('designer.publish')}
            </Button>
            {/* Unpublish Button - only show when published and active */}
            {publishStatus?.is_published && publishStatus?.is_active && handleUnpublish && (
              <Button onClick={handleUnpublish} variant="outline" className="border-red-200 dark:border-red-800 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200">
                Unpublish
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <Label htmlFor="agent-selector" className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2 block">{t('designer.selectAgent')}</Label>
            <select
              id="agent-selector"
              value={selectedAgentId ?? ""}
              onChange={(e) => onAgentChange?.(parseInt(e.target.value))}
              className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all text-sm"
            >
              <option value="" disabled>{t('designer.selectAnAgent')}</option>
              {agents?.map(agent => (
                <option key={agent.id} value={agent.id}>{agent.name}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="preview-type-selector" className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2 block">{t('designer.previewType')}</Label>
            <select
              id="preview-type-selector"
              value={previewType}
              onChange={(e) => onPreviewTypeChange?.(e.target.value)}
              className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all text-sm"
            >
              <option value="web">{t('designer.webChat')}</option>
              <option value="whatsapp">{t('designer.whatsapp')}</option>
              <option value="messenger">{t('designer.messenger')}</option>
              <option value="instagram">{t('designer.instagram')}</option>
              <option value="telegram">{t('designer.telegram')}</option>
              <option value="voice">{t('designer.voiceCall')}</option>
            </select>
          </div>
        </div>

        <CardDescription className="text-slate-500 dark:text-slate-400 mt-4 text-sm">
          {t('designer.customizeDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 max-h-[calc(100vh-400px)] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-100/80 dark:bg-slate-900/50 sticky top-0 z-10 p-1 rounded-xl">
            <TabsTrigger value="appearance" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm dark:text-slate-300 rounded-lg text-sm font-medium transition-all">{t('designer.appearance')}</TabsTrigger>
            <TabsTrigger value="behavior" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm dark:text-slate-300 rounded-lg text-sm font-medium transition-all">{t('designer.behaviorEmbed')}</TabsTrigger>
          </TabsList>

          <TabsContent value="appearance" className="space-y-5 pt-4">
            {/* Colors Section - Compact Grid */}
            <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-800/50 rounded-xl p-5 border border-slate-200/80 dark:border-slate-700/80">
              <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                    <Palette className="h-4 w-4 text-white" />
                  </div>
                  <h4 className="font-semibold text-slate-800 dark:text-white text-sm">{t('designer.colors')}</h4>
                </div>
                <Button
                  onClick={handleResetColors}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <RotateCcw className={`h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                  {t('designer.reset')}
                </Button>
              </div>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="primary_color" className="text-xs dark:text-gray-300 mb-1.5 block text-left">{t('designer.primaryColor')}</Label>
                  <div className={`flex items-center justify-between gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div
                      className="w-12 h-9 rounded border dark:border-slate-600 cursor-pointer"
                      style={{ background: customization.primary_color }}
                      onClick={() => {
                        if (customization.primary_color.includes('gradient')) {
                          openGradientEditor('primary');
                        }
                      }}
                    />
                    <Input value={customization.primary_color} onChange={(e) => updateCustomization("primary_color", e.target.value)} className={`text-xs dark:bg-slate-800 dark:border-slate-600 dark:text-white h-9 text-left`} />
                    <Button
                      onClick={() => openGradientEditor('primary')}
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0"
                      title="Gradient Editor"
                    >
                      <Palette className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="user_message_color" className="text-xs dark:text-gray-300 mb-1.5 block text-left">{t('designer.userMessage')}</Label>
                    <div className={`flex items-center justify-between gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div
                        className="w-12 h-9 rounded border dark:border-slate-600 cursor-pointer"
                        style={{ background: customization.user_message_color }}
                        onClick={() => {
                          if (customization.user_message_color.includes('gradient')) {
                            openGradientEditor('user_message');
                          }
                        }}
                      />
                      <Input value={customization.user_message_color} onChange={(e) => updateCustomization("user_message_color", e.target.value)} className={`text-xs dark:bg-slate-800 dark:border-slate-600 dark:text-white h-9 text-left`} />
                      <Button
                        onClick={() => openGradientEditor('user_message')}
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0"
                        title="Gradient Editor"
                      >
                        <Palette className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="user_message_text_color" className="text-xs dark:text-gray-300 mb-1.5 block text-left">{t('designer.userText')}</Label>
                    <div className={`flex items-center justify-between gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div
                        className="w-12 h-9 rounded border dark:border-slate-600 cursor-pointer"
                        style={{ background: customization.user_message_text_color }}
                        onClick={() => {
                          if (customization.user_message_text_color.includes('gradient')) {
                            openGradientEditor('user_text');
                          }
                        }}
                      />
                      <Input value={customization.user_message_text_color} onChange={(e) => updateCustomization("user_message_text_color", e.target.value)} className={`text-xs dark:bg-slate-800 dark:border-slate-600 dark:text-white h-9 text-left`} />
                      <Button
                        onClick={() => openGradientEditor('user_text')}
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0"
                        title="Gradient Editor"
                      >
                        <Palette className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="bot_message_color" className="text-xs dark:text-gray-300 mb-1.5 block text-left">{t('designer.botMessage')}</Label>
                    <div className={`flex items-center justify-between gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div
                        className="w-12 h-9 rounded border dark:border-slate-600 cursor-pointer"
                        style={{ background: customization.bot_message_color }}
                        onClick={() => {
                          if (customization.bot_message_color.includes('gradient')) {
                            openGradientEditor('bot_message');
                          }
                        }}
                      />
                      <Input value={customization.bot_message_color} onChange={(e) => updateCustomization("bot_message_color", e.target.value)} className={`text-xs dark:bg-slate-800 dark:border-slate-600 dark:text-white h-9 text-left`} />
                      <Button
                        onClick={() => openGradientEditor('bot_message')}
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0"
                        title="Gradient Editor"
                      >
                        <Palette className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="bot_message_text_color" className="text-xs dark:text-gray-300 mb-1.5 block text-left">{t('designer.botText')}</Label>
                    <div className={`flex items-center justify-between gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div
                        className="w-12 h-9 rounded border dark:border-slate-600 cursor-pointer"
                        style={{ background: customization.bot_message_text_color }}
                        onClick={() => {
                          if (customization.bot_message_text_color.includes('gradient')) {
                            openGradientEditor('bot_text');
                          }
                        }}
                      />
                      <Input value={customization.bot_message_text_color} onChange={(e) => updateCustomization("bot_message_text_color", e.target.value)} className={`text-xs dark:bg-slate-800 dark:border-slate-600 dark:text-white h-9 text-left`} />
                      <Button
                        onClick={() => openGradientEditor('bot_text')}
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0"
                        title="Gradient Editor"
                      >
                        <Palette className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="time_color" className="text-xs dark:text-gray-300 mb-1.5 block text-left">{t('designer.timeColor')}</Label>
                  <div className={`flex items-center justify-between gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div
                      className="w-12 h-9 rounded border dark:border-slate-600 cursor-pointer"
                      style={{ background: customization.time_color || '#9CA3AF' }}
                      onClick={() => {
                        if ((customization.time_color || '').includes('gradient')) {
                          openGradientEditor('time');
                        }
                      }}
                    />
                    <Input value={customization.time_color || '#9CA3AF'} onChange={(e) => updateCustomization("time_color", e.target.value)} className={`text-xs dark:bg-slate-800 dark:border-slate-600 dark:text-white h-9 text-left`} />
                    <Button
                      onClick={() => openGradientEditor('time')}
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0"
                      title="Gradient Editor"
                    >
                      <Palette className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Gradient Editor */}
              {showGradientEditor && (
                <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded-lg border-2 border-pink-500 dark:border-pink-600">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-semibold text-sm dark:text-white">{t('designer.gradientEditorTitle')}</h5>
                    <Button
                      onClick={() => {
                        setShowGradientEditor(false);
                        setActiveGradientField(null);
                      }}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                    >
                      ×
                    </Button>
                  </div>

                  <div className="space-y-3">
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

                    <Button
                      onClick={applyGradient}
                      className="w-full bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-700 hover:to-red-700 text-white"
                    >
                      {t('designer.applyGradient')}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Style & Settings Section */}
            <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-800/50 rounded-xl p-5 border border-slate-200/80 dark:border-slate-700/80">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                  <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </div>
                <h4 className="font-semibold text-slate-800 dark:text-white text-sm">{t('designer.styleSettings')}</h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {/* Widget Size - Presets + Sliders */}
                <div className="col-span-2">
                  <Label className="text-xs dark:text-gray-300 mb-1.5 block text-left">{t('designer.widgetSize')}</Label>
                  <div className="flex gap-2 mb-3">
                    <Button
                      type="button"
                      size="sm"
                      variant={customization.widget_width === 320 && customization.widget_height === 450 ? "default" : "outline"}
                      onClick={() => {
                        updateCustomization("widget_width", 320);
                        updateCustomization("widget_height", 450);
                        updateCustomization("widget_size", "small");
                      }}
                      className="flex-1 text-xs"
                    >
                      {t('designer.small')}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={customization.widget_width === 360 && customization.widget_height === 550 ? "default" : "outline"}
                      onClick={() => {
                        updateCustomization("widget_width", 360);
                        updateCustomization("widget_height", 550);
                        updateCustomization("widget_size", "medium");
                      }}
                      className="flex-1 text-xs"
                    >
                      {t('designer.medium')}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={customization.widget_width === 400 && customization.widget_height === 650 ? "default" : "outline"}
                      onClick={() => {
                        updateCustomization("widget_width", 400);
                        updateCustomization("widget_height", 650);
                        updateCustomization("widget_size", "large");
                      }}
                      className="flex-1 text-xs"
                    >
                      {t('designer.large')}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="widget_width" className="text-xs dark:text-gray-400 mb-1 block text-left">
                        {t('designer.width')}: {customization.widget_width || 360}px
                      </Label>
                      <Input
                        id="widget_width"
                        type="range"
                        min="280"
                        max="500"
                        value={customization.widget_width || 360}
                        onChange={(e) => updateCustomization("widget_width", parseInt(e.target.value))}
                        className="w-full dark:bg-slate-700"
                      />
                    </div>
                    <div>
                      <Label htmlFor="widget_height" className="text-xs dark:text-gray-400 mb-1 block text-left">
                        {t('designer.height')}: {customization.widget_height || 550}px
                      </Label>
                      <Input
                        id="widget_height"
                        type="range"
                        min="400"
                        max="800"
                        value={customization.widget_height || 550}
                        onChange={(e) => updateCustomization("widget_height", parseInt(e.target.value))}
                        className="w-full dark:bg-slate-700"
                      />
                    </div>
                  </div>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="font_family" className="text-xs dark:text-gray-300 mb-1.5 block text-left">{t('designer.fontFamily')}</Label>
                  <select id="font_family" value={customization.font_family} onChange={(e) => updateCustomization("font_family", e.target.value)} className={`w-full p-2 text-sm border rounded-md bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-pink-500 text-left`}>
                    <option value="Inter">Inter</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Open Sans">Open Sans</option>
                    <option value="Lato">Lato</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="border_radius" className="text-xs dark:text-gray-300 mb-1.5 block text-left">{t('designer.borderRadius')}: {customization.border_radius}px</Label>
                  <Input id="border_radius" type="range" min="0" max="30" value={customization.border_radius} onChange={(e) => updateCustomization("border_radius", parseInt(e.target.value))} className="w-full dark:bg-slate-700" />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="z_index" className="text-xs dark:text-gray-300 mb-1.5 block text-left">{t('designer.zIndex')}: {customization.meta?.z_index || 9999}</Label>
                  <Input
                    id="z_index"
                    type="number"
                    min="0"
                    max="999999"
                    value={customization.meta?.z_index || 9999}
                    onChange={(e) => updateCustomization("meta", { ...customization.meta, z_index: parseInt(e.target.value) })}
                    className={`w-full text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white text-left`}
                  />
                  <p className={`text-xs text-muted-foreground dark:text-gray-400 mt-1 text-left`}>{t('designer.zIndexDesc')}</p>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="communication_mode" className="text-xs dark:text-gray-300 mb-1.5 block text-left">{t('designer.communicationMode')}</Label>
                  <select id="communication_mode" value={customization.communication_mode} onChange={(e) => updateCustomization("communication_mode", e.target.value)} className={`w-full p-2 text-sm border rounded-md bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-pink-500 text-left`}>
                    <option value="chat_and_voice">{t('designer.chatAndVoice')}</option>
                    <option value="voice">{t('designer.voiceOnly')}</option>
                    <option value="chat">{t('designer.chatOnly')}</option>
                  </select>
                </div>
                <div className={`col-span-2 flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <Label className="text-xs dark:text-white font-medium">{t('designer.darkModeWidget')}</Label>
                    <p className="text-xs text-muted-foreground dark:text-gray-400">{t('designer.enableDarkTheme')}</p>
                  </div>
                  <Switch
                    checked={customization.dark_mode}
                    onCheckedChange={(checked) => updateCustomization("dark_mode", checked)}
                  />
                </div>
                <div className={`col-span-2 flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <Label className="text-xs dark:text-white font-medium">{t('designer.rtlMode')}</Label>
                    <p className="text-xs text-muted-foreground dark:text-gray-400">{t('designer.enableRtlSupport')}</p>
                  </div>
                  <Switch
                    checked={customization.meta?.rtl_enabled || false}
                    onCheckedChange={(checked) => updateCustomization("meta", { ...customization.meta, rtl_enabled: checked })}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="behavior" className="space-y-5 pt-4">
            {/* Multi-Language Support */}
            <LanguageManager
              languages={customization.meta?.languages || { en: { welcome_message: customization.welcome_message, header_title: customization.header_title, input_placeholder: customization.input_placeholder, proactive_message: customization.proactive_message } }}
              defaultLanguage={customization.meta?.default_language || 'en'}
              onLanguagesChange={(languages) => updateCustomization("meta", { ...customization.meta, languages })}
              onDefaultLanguageChange={(lang) => updateCustomization("meta", { ...customization.meta, default_language: lang })}
            />

            {/* URLs Section */}
            <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-800/50 rounded-xl p-5 border border-slate-200/80 dark:border-slate-700/80">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                </div>
                <h4 className="font-semibold text-slate-800 dark:text-white text-sm">{t('designer.urls')}</h4>
              </div>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="agent_avatar_url" className="text-xs dark:text-gray-300 mb-1.5 block text-left">{t('designer.agentAvatarUrl')}</Label>
                  <Input id="agent_avatar_url" value={customization.agent_avatar_url} onChange={(e) => updateCustomization("agent_avatar_url", e.target.value)} className={`text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white text-left`} placeholder="https://..." />
                </div>
                <div>
                  <Label htmlFor="client_website_url" className="text-xs dark:text-gray-300 mb-1.5 block text-left">{t('designer.clientWebsiteUrl')}</Label>
                  <Input id="client_website_url" value={customization.client_website_url} onChange={(e) => updateCustomization("client_website_url", e.target.value)} className={`text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white text-left`} placeholder="https://example.com" />
                </div>
              </div>
            </div>

            {/* Toggles Section */}
            <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-800/50 rounded-xl p-5 border border-slate-200/80 dark:border-slate-700/80">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="5" width="22" height="14" rx="7" ry="7"/>
                    <circle cx="16" cy="12" r="3"/>
                  </svg>
                </div>
                <h4 className="font-semibold text-slate-800 dark:text-white text-sm">{t('designer.toggles')}</h4>
              </div>
              <div className="space-y-2">
                <div className={`flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <Label className="text-xs dark:text-white font-medium">{t('designer.showHeader')}</Label>
                    <p className="text-xs text-muted-foreground dark:text-gray-400">{t('designer.toggleWidgetHeader')}</p>
                  </div>
                  <Switch checked={customization.show_header} onCheckedChange={(checked) => updateCustomization("show_header", checked)} />
                </div>
                <div className={`flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <Label className="text-xs dark:text-white font-medium">{t('designer.aiSuggestions')}</Label>
                    <p className="text-xs text-muted-foreground dark:text-gray-400">{t('designer.enableAiReplies')}</p>
                  </div>
                  <Switch checked={customization.suggestions_enabled} onCheckedChange={(checked) => updateCustomization("suggestions_enabled", checked)} />
                </div>
                <div className={`flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <Label className="text-xs dark:text-white font-medium">{t('designer.typingIndicator')}</Label>
                    <p className="text-xs text-muted-foreground dark:text-gray-400">{t('designer.showTypingStatus')}</p>
                  </div>
                  <Switch checked={customization.typing_indicator_enabled} onCheckedChange={(checked) => updateCustomization("typing_indicator_enabled", checked)} />
                </div>
              </div>
            </div>

            {/* Proactive Message Section */}
            <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-800/50 rounded-xl p-5 border border-slate-200/80 dark:border-slate-700/80">
              <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                    <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <h4 className="font-semibold text-slate-800 dark:text-white text-sm">{t('designer.proactiveMessage')}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('designer.autoEngageUsers')}</p>
                  </div>
                </div>
                <Switch
                  checked={customization.proactive_message_enabled}
                  onCheckedChange={(checked) => updateCustomization("proactive_message_enabled", checked)}
                />
              </div>
              {customization.proactive_message_enabled && (
                <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <div>
                    <Label htmlFor="proactive_message" className="text-xs dark:text-gray-300 mb-1.5 block text-left">{t('designer.messageText')}</Label>
                    <Input id="proactive_message" value={customization.proactive_message} onChange={(e) => updateCustomization("proactive_message", e.target.value)} className={`text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white text-left`} />
                  </div>
                  <div>
                    <Label htmlFor="proactive_message_delay" className="text-xs dark:text-gray-300 mb-1.5 block text-left">{t('designer.delaySeconds')}</Label>
                    <Input id="proactive_message_delay" type="number" value={customization.proactive_message_delay} onChange={(e) => updateCustomization("proactive_message_delay", parseInt(e.target.value))} className={`text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white text-left`} />
                  </div>
                </div>
              )}
            </div>

            {/* Embed Code Section */}
            <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-800/50 rounded-xl p-5 border border-slate-200/80 dark:border-slate-700/80">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                  <Code className="h-4 w-4 text-white" />
                </div>
                <h4 className="font-semibold text-slate-800 dark:text-white text-sm">{t('designer.embedCode')}</h4>
              </div>
              <div className={`p-4 bg-slate-900 dark:bg-slate-950 text-emerald-400 dark:text-emerald-300 rounded-xl font-mono text-xs overflow-x-auto border border-slate-700 dark:border-slate-800 max-h-32`}>
                <pre>{generateEmbedCode()}</pre>
              </div>
              <Button className={`mt-4 w-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white shadow-md shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-200 flex items-center justify-center ${isRTL ? 'flex-row-reverse' : ''}`} onClick={() => {
                navigator.clipboard.writeText(generateEmbedCode());
                toast({ title: t('designer.copiedClipboard') });
              }} disabled={!selectedAgentId}>
                <Code className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('designer.copyEmbedCodeButton')}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
