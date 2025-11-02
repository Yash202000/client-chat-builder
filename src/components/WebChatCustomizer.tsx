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

interface WebChatCustomizerProps {
  customization: any;
  updateCustomization: (key: string, value: any) => void;
  handleSaveChanges: () => void;
  handlePublish: () => void;
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
    <Card className="card-shadow-lg bg-white dark:bg-slate-800 h-fit flex flex-col">
      <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 flex-shrink-0">
        <div className={`flex items-center justify-between mb-4 `}>
          <CardTitle className="dark:text-white text-2xl">{t('designer.webChatCustomization')}</CardTitle>
          <div className={`flex gap-2 `}>
            <Button onClick={handleSaveChanges} disabled={!selectedAgentId} className="bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-700 hover:to-red-700 text-white btn-hover-lift">
              <Save className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('designer.save')}
            </Button>
            <Button onClick={handlePublish} disabled={!selectedAgentId} variant="outline" className="btn-hover-lift">
              <Send className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('designer.publish')}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <Label htmlFor="agent-selector" className="text-sm font-medium dark:text-gray-300 mb-2 block">{t('designer.selectAgent')}</Label>
            <select
              id="agent-selector"
              value={selectedAgentId ?? ""}
              onChange={(e) => onAgentChange?.(parseInt(e.target.value))}
              className="w-full p-2.5 border-2 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
            >
              <option value="" disabled>{t('designer.selectAnAgent')}</option>
              {agents?.map(agent => (
                <option key={agent.id} value={agent.id}>{agent.name}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="preview-type-selector" className="text-sm font-medium dark:text-gray-300 mb-2 block">{t('designer.previewType')}</Label>
            <select
              id="preview-type-selector"
              value={previewType}
              onChange={(e) => onPreviewTypeChange?.(e.target.value)}
              className="w-full p-2.5 border-2 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
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

        <CardDescription className="dark:text-gray-400 mt-4">
          {t('designer.customizeDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 max-h-[calc(100vh-400px)] overflow-y-auto">
        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-900 sticky top-0 z-10">
            <TabsTrigger value="appearance" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 dark:text-gray-300">{t('designer.appearance')}</TabsTrigger>
            <TabsTrigger value="behavior" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 dark:text-gray-300">{t('designer.behaviorEmbed')}</TabsTrigger>
          </TabsList>

          <TabsContent value="appearance" className="space-y-5 pt-4">
            {/* Colors Section - Compact Grid */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className={`flex items-center justify-between mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <h4 className="font-semibold dark:text-white text-sm uppercase tracking-wider text-gray-700 dark:text-gray-300">{t('designer.colors')}</h4>
                <Button
                  onClick={handleResetColors}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
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
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <h4 className={`font-semibold dark:text-white text-sm uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-3 text-left`}>{t('designer.styleSettings')}</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="widget_size" className="text-xs dark:text-gray-300 mb-1.5 block text-left">{t('designer.widgetSize')}</Label>
                  <select id="widget_size" value={customization.widget_size} onChange={(e) => updateCustomization("widget_size", e.target.value)} className={`w-full p-2 text-sm border rounded-md bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-pink-500 text-left`}>
                    <option value="small">{t('designer.small')}</option>
                    <option value="medium">{t('designer.medium')}</option>
                    <option value="large">{t('designer.large')}</option>
                  </select>
                </div>
                <div>
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
              </div>
            </div>
          </TabsContent>

          <TabsContent value="behavior" className="space-y-5 pt-4">
            {/* Widget Texts Section */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <h4 className={`font-semibold dark:text-white text-sm uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-3 text-left`}>{t('designer.widgetTexts')}</h4>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="header_title" className="text-xs dark:text-gray-300 mb-1.5 block text-left">{t('designer.headerTitle')}</Label>
                  <Input id="header_title" value={customization.header_title} onChange={(e) => updateCustomization("header_title", e.target.value)} className={`text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white text-left`} />
                </div>
                <div>
                  <Label htmlFor="welcome_message" className="text-xs dark:text-gray-300 mb-1.5 block text-left">{t('designer.welcomeMessage')}</Label>
                  <Input id="welcome_message" value={customization.welcome_message} onChange={(e) => updateCustomization("welcome_message", e.target.value)} className={`text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white text-left`} />
                </div>
                <div>
                  <Label htmlFor="input_placeholder" className="text-xs dark:text-gray-300 mb-1.5 block text-left">{t('designer.inputPlaceholder')}</Label>
                  <Input id="input_placeholder" value={customization.input_placeholder} onChange={(e) => updateCustomization("input_placeholder", e.target.value)} className={`text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white text-left`} />
                </div>
              </div>
            </div>

            {/* URLs Section */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <h4 className={`font-semibold dark:text-white text-sm uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-3 text-left`}>{t('designer.urls')}</h4>
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
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <h4 className={` flex items-center justify-between font-semibold dark:text-white text-sm uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-3 text-left`}>{t('designer.toggles')}</h4>
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
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className={`flex items-center justify-between mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <h4 className="font-semibold dark:text-white text-sm">{t('designer.proactiveMessage')}</h4>
                  <p className="text-xs text-muted-foreground dark:text-gray-400">{t('designer.autoEngageUsers')}</p>
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
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <h4 className={`font-semibold dark:text-white text-sm uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-3 text-left`}>{t('designer.embedCode')}</h4>
              <div className={`p-3 bg-gray-900 dark:bg-slate-950 text-green-400 dark:text-green-300 rounded-lg font-mono text-xs overflow-x-auto border border-gray-700 dark:border-slate-800 max-h-32 text-left`}>
                <pre>{generateEmbedCode()}</pre>
              </div>
              <Button className={`mt-3 w-full bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-700 hover:to-red-700 text-white btn-hover-lift flex items-center justify-center ${isRTL ? 'flex-row-reverse' : ''}`} onClick={() => {
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
