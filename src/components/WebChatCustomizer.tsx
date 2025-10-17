import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Code, Send } from 'lucide-react';

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
  return (
    <Card className="card-shadow-lg bg-white dark:bg-slate-800 h-fit flex flex-col">
      <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="dark:text-white text-2xl">Web Chat Customization</CardTitle>
          <div className="flex gap-2">
            <Button onClick={handleSaveChanges} disabled={!selectedAgentId} className="bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-700 hover:to-red-700 text-white btn-hover-lift">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button onClick={handlePublish} disabled={!selectedAgentId} variant="outline" className="btn-hover-lift">
              <Send className="h-4 w-4 mr-2" />
              Publish
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <Label htmlFor="agent-selector" className="text-sm font-medium dark:text-gray-300 mb-2 block">Select Agent</Label>
            <select
              id="agent-selector"
              value={selectedAgentId ?? ""}
              onChange={(e) => onAgentChange?.(parseInt(e.target.value))}
              className="w-full p-2.5 border-2 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
            >
              <option value="" disabled>Select an agent</option>
              {agents?.map(agent => (
                <option key={agent.id} value={agent.id}>{agent.name}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="preview-type-selector" className="text-sm font-medium dark:text-gray-300 mb-2 block">Preview Type</Label>
            <select
              id="preview-type-selector"
              value={previewType}
              onChange={(e) => onPreviewTypeChange?.(e.target.value)}
              className="w-full p-2.5 border-2 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
            >
              <option value="web">💬 Web Chat</option>
              <option value="whatsapp">📱 WhatsApp</option>
              <option value="messenger">💙 Messenger</option>
              <option value="instagram">📷 Instagram</option>
              <option value="telegram">✈️ Telegram</option>
              <option value="voice">🎤 Voice Call</option>
            </select>
          </div>
        </div>

        <CardDescription className="dark:text-gray-400 mt-4">
          Customize the chat widget appearance and behavior. Changes are reflected in real-time.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 max-h-[calc(100vh-400px)] overflow-y-auto">
        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-900 sticky top-0 z-10">
            <TabsTrigger value="appearance" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 dark:text-gray-300">Appearance</TabsTrigger>
            <TabsTrigger value="behavior" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 dark:text-gray-300">Behavior & Embed</TabsTrigger>
          </TabsList>

          <TabsContent value="appearance" className="space-y-5 pt-4">
            {/* Colors Section - Compact Grid */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold dark:text-white text-sm uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-3">🎨 Colors</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="primary_color" className="text-xs dark:text-gray-300 mb-1.5 block">Primary</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" id="primary_color" value={customization.primary_color} onChange={(e) => updateCustomization("primary_color", e.target.value)} className="w-12 h-9 rounded border dark:border-slate-600 cursor-pointer" />
                    <Input value={customization.primary_color} onChange={(e) => updateCustomization("primary_color", e.target.value)} className="text-xs dark:bg-slate-800 dark:border-slate-600 dark:text-white h-9" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="user_message_color" className="text-xs dark:text-gray-300 mb-1.5 block">User Message</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" id="user_message_color" value={customization.user_message_color} onChange={(e) => updateCustomization("user_message_color", e.target.value)} className="w-12 h-9 rounded border dark:border-slate-600 cursor-pointer" />
                    <Input value={customization.user_message_color} onChange={(e) => updateCustomization("user_message_color", e.target.value)} className="text-xs dark:bg-slate-800 dark:border-slate-600 dark:text-white h-9" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="bot_message_color" className="text-xs dark:text-gray-300 mb-1.5 block">Bot Message</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" id="bot_message_color" value={customization.bot_message_color} onChange={(e) => updateCustomization("bot_message_color", e.target.value)} className="w-12 h-9 rounded border dark:border-slate-600 cursor-pointer" />
                    <Input value={customization.bot_message_color} onChange={(e) => updateCustomization("bot_message_color", e.target.value)} className="text-xs dark:bg-slate-800 dark:border-slate-600 dark:text-white h-9" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="bot_message_text_color" className="text-xs dark:text-gray-300 mb-1.5 block">Bot Text</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" id="bot_message_text_color" value={customization.bot_message_text_color} onChange={(e) => updateCustomization("bot_message_text_color", e.target.value)} className="w-12 h-9 rounded border dark:border-slate-600 cursor-pointer" />
                    <Input value={customization.bot_message_text_color} onChange={(e) => updateCustomization("bot_message_text_color", e.target.value)} className="text-xs dark:bg-slate-800 dark:border-slate-600 dark:text-white h-9" />
                  </div>
                </div>
              </div>
            </div>

            {/* Style & Settings Section */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold dark:text-white text-sm uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-3">⚙️ Style & Settings</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="widget_size" className="text-xs dark:text-gray-300 mb-1.5 block">Widget Size</Label>
                  <select id="widget_size" value={customization.widget_size} onChange={(e) => updateCustomization("widget_size", e.target.value)} className="w-full p-2 text-sm border rounded-md bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-pink-500">
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="font_family" className="text-xs dark:text-gray-300 mb-1.5 block">Font Family</Label>
                  <select id="font_family" value={customization.font_family} onChange={(e) => updateCustomization("font_family", e.target.value)} className="w-full p-2 text-sm border rounded-md bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-pink-500">
                    <option value="Inter">Inter</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Open Sans">Open Sans</option>
                    <option value="Lato">Lato</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="border_radius" className="text-xs dark:text-gray-300 mb-1.5 block">Border Radius: {customization.border_radius}px</Label>
                  <Input id="border_radius" type="range" min="0" max="30" value={customization.border_radius} onChange={(e) => updateCustomization("border_radius", parseInt(e.target.value))} className="w-full dark:bg-slate-700" />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="communication_mode" className="text-xs dark:text-gray-300 mb-1.5 block">Communication Mode</Label>
                  <select id="communication_mode" value={customization.communication_mode} onChange={(e) => updateCustomization("communication_mode", e.target.value)} className="w-full p-2 text-sm border rounded-md bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-pink-500">
                    <option value="chat_and_voice">💬 Chat & Voice</option>
                    <option value="voice">🎤 Voice Only</option>
                    <option value="chat">💬 Chat Only</option>
                  </select>
                </div>
                <div className="col-span-2 flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <div>
                    <Label className="text-xs dark:text-white font-medium">Dark Mode Widget</Label>
                    <p className="text-xs text-muted-foreground dark:text-gray-400">Enable dark theme</p>
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
              <h4 className="font-semibold dark:text-white text-sm uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-3">📝 Widget Texts</h4>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="header_title" className="text-xs dark:text-gray-300 mb-1.5 block">Header Title</Label>
                  <Input id="header_title" value={customization.header_title} onChange={(e) => updateCustomization("header_title", e.target.value)} className="text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white" />
                </div>
                <div>
                  <Label htmlFor="welcome_message" className="text-xs dark:text-gray-300 mb-1.5 block">Welcome Message</Label>
                  <Input id="welcome_message" value={customization.welcome_message} onChange={(e) => updateCustomization("welcome_message", e.target.value)} className="text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white" />
                </div>
                <div>
                  <Label htmlFor="input_placeholder" className="text-xs dark:text-gray-300 mb-1.5 block">Input Placeholder</Label>
                  <Input id="input_placeholder" value={customization.input_placeholder} onChange={(e) => updateCustomization("input_placeholder", e.target.value)} className="text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white" />
                </div>
              </div>
            </div>

            {/* URLs Section */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold dark:text-white text-sm uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-3">🔗 URLs</h4>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="agent_avatar_url" className="text-xs dark:text-gray-300 mb-1.5 block">Agent Avatar URL</Label>
                  <Input id="agent_avatar_url" value={customization.agent_avatar_url} onChange={(e) => updateCustomization("agent_avatar_url", e.target.value)} className="text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white" placeholder="https://..." />
                </div>
                <div>
                  <Label htmlFor="client_website_url" className="text-xs dark:text-gray-300 mb-1.5 block">Client Website URL</Label>
                  <Input id="client_website_url" value={customization.client_website_url} onChange={(e) => updateCustomization("client_website_url", e.target.value)} className="text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white" placeholder="https://example.com" />
                </div>
              </div>
            </div>

            {/* Toggles Section */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold dark:text-white text-sm uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-3">🎛️ Toggles</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <div>
                    <Label className="text-xs dark:text-white font-medium">Show Header</Label>
                    <p className="text-xs text-muted-foreground dark:text-gray-400">Toggle widget header</p>
                  </div>
                  <Switch checked={customization.show_header} onCheckedChange={(checked) => updateCustomization("show_header", checked)} />
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <div>
                    <Label className="text-xs dark:text-white font-medium">AI Suggestions</Label>
                    <p className="text-xs text-muted-foreground dark:text-gray-400">Enable AI replies</p>
                  </div>
                  <Switch checked={customization.suggestions_enabled} onCheckedChange={(checked) => updateCustomization("suggestions_enabled", checked)} />
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <div>
                    <Label className="text-xs dark:text-white font-medium">Typing Indicator</Label>
                    <p className="text-xs text-muted-foreground dark:text-gray-400">Show typing status</p>
                  </div>
                  <Switch checked={customization.typing_indicator_enabled} onCheckedChange={(checked) => updateCustomization("typing_indicator_enabled", checked)} />
                </div>
              </div>
            </div>

            {/* Proactive Message Section */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold dark:text-white text-sm">💬 Proactive Message</h4>
                  <p className="text-xs text-muted-foreground dark:text-gray-400">Auto-engage users</p>
                </div>
                <Switch
                  checked={customization.proactive_message_enabled}
                  onCheckedChange={(checked) => updateCustomization("proactive_message_enabled", checked)}
                />
              </div>
              {customization.proactive_message_enabled && (
                <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <div>
                    <Label htmlFor="proactive_message" className="text-xs dark:text-gray-300 mb-1.5 block">Message Text</Label>
                    <Input id="proactive_message" value={customization.proactive_message} onChange={(e) => updateCustomization("proactive_message", e.target.value)} className="text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white" />
                  </div>
                  <div>
                    <Label htmlFor="proactive_message_delay" className="text-xs dark:text-gray-300 mb-1.5 block">Delay (seconds)</Label>
                    <Input id="proactive_message_delay" type="number" value={customization.proactive_message_delay} onChange={(e) => updateCustomization("proactive_message_delay", parseInt(e.target.value))} className="text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white" />
                  </div>
                </div>
              )}
            </div>

            {/* Embed Code Section */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold dark:text-white text-sm uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-3">📋 Embed Code</h4>
              <div className="p-3 bg-gray-900 dark:bg-slate-950 text-green-400 dark:text-green-300 rounded-lg font-mono text-xs overflow-x-auto border border-gray-700 dark:border-slate-800 max-h-32">
                <pre>{generateEmbedCode()}</pre>
              </div>
              <Button className="mt-3 w-full bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-700 hover:to-red-700 text-white btn-hover-lift" onClick={() => {
                navigator.clipboard.writeText(generateEmbedCode());
                toast({ title: "Copied to clipboard!" });
              }} disabled={!selectedAgentId}>
                <Code className="h-4 w-4 mr-2" />
                Copy Embed Code
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
