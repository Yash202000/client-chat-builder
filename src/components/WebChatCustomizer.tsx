import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Code } from 'lucide-react';

interface WebChatCustomizerProps {
  customization: any;
  updateCustomization: (key: string, value: any) => void;
  handleSaveChanges: () => void;
  generateEmbedCode: () => string;
  toast: any;
  selectedAgentId: number | null;
}

export const WebChatCustomizer: React.FC<WebChatCustomizerProps> = ({
  customization,
  updateCustomization,
  handleSaveChanges,
  generateEmbedCode,
  toast,
  selectedAgentId
}) => {
  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            Web Chat Customization
          </div>
          <Button onClick={handleSaveChanges} disabled={!selectedAgentId}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </CardTitle>
        <CardDescription>
          Customize the chat widget. Changes are shown live.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="behavior">Behavior & Embed</TabsTrigger>
          </TabsList>
          
          <TabsContent value="appearance" className="space-y-4 pt-4">
            <h4 className="font-semibold">Colors</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="primary_color">Primary Color</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <input type="color" id="primary_color" value={customization.primary_color} onChange={(e) => updateCustomization("primary_color", e.target.value)} className="w-10 h-8 rounded border cursor-pointer p-1" />
                  <Input value={customization.primary_color} onChange={(e) => updateCustomization("primary_color", e.target.value)} />
                </div>
              </div>
              <div>
                <Label htmlFor="user_message_color">User Message</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <input type="color" id="user_message_color" value={customization.user_message_color} onChange={(e) => updateCustomization("user_message_color", e.target.value)} className="w-10 h-8 rounded border cursor-pointer p-1" />
                  <Input value={customization.user_message_color} onChange={(e) => updateCustomization("user_message_color", e.target.value)} />
                </div>
              </div>
              <div>
                <Label htmlFor="user_message_text_color">User Text</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <input type="color" id="user_message_text_color" value={customization.user_message_text_color} onChange={(e) => updateCustomization("user_message_text_color", e.target.value)} className="w-10 h-8 rounded border cursor-pointer p-1" />
                  <Input value={customization.user_message_text_color} onChange={(e) => updateCustomization("user_message_text_color", e.target.value)} />
                </div>
              </div>
               <div>
                <Label htmlFor="bot_message_color">Bot Message</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <input type="color" id="bot_message_color" value={customization.bot_message_color} onChange={(e) => updateCustomization("bot_message_color", e.target.value)} className="w-10 h-8 rounded border cursor-pointer p-1" />
                  <Input value={customization.bot_message_color} onChange={(e) => updateCustomization("bot_message_color", e.target.value)} />
                </div>
              </div>
              <div>
                <Label htmlFor="bot_message_text_color">Bot Text</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <input type="color" id="bot_message_text_color" value={customization.bot_message_text_color} onChange={(e) => updateCustomization("bot_message_text_color", e.target.value)} className="w-10 h-8 rounded border cursor-pointer p-1" />
                  <Input value={customization.bot_message_text_color} onChange={(e) => updateCustomization("bot_message_text_color", e.target.value)} />
                </div>
              </div>
            </div>
            <h4 className="font-semibold pt-2">Sizing & Style</h4>
             <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="widget_size">Widget Size</Label>
                <select id="widget_size" value={customization.widget_size} onChange={(e) => updateCustomization("widget_size", e.target.value)} className="w-full mt-1 p-2 border rounded-md">
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
              <div>
                <Label htmlFor="border_radius">Border Radius ({customization.border_radius}px)</Label>
                <Input id="border_radius" type="range" min="0" max="30" value={customization.border_radius} onChange={(e) => updateCustomization("border_radius", parseInt(e.target.value))} className="mt-2" />
              </div>
              <div>
                <Label htmlFor="font_family">Font Family</Label>
                <select id="font_family" value={customization.font_family} onChange={(e) => updateCustomization("font_family", e.target.value)} className="w-full mt-1 p-2 border rounded-md">
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Open Sans">Open Sans</option>
                  <option value="Lato">Lato</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <Label>Dark Mode</Label>
                <p className="text-xs text-muted-foreground">
                  Enable a dark theme for the widget.
                </p>
              </div>
              <Switch
                checked={customization.dark_mode}
                onCheckedChange={(checked) => updateCustomization("dark_mode", checked)}
              />
            </div>
          </TabsContent>

          <TabsContent value="behavior" className="space-y-4 pt-4">
             <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <Label>Show Header</Label>
                <p className="text-xs text-muted-foreground">
                  Toggle the visibility of the widget header.
                </p>
              </div>
              <Switch
                checked={customization.show_header}
                onCheckedChange={(checked) => updateCustomization("show_header", checked)}
              />
            </div>
            <div>
              <Label htmlFor="header_title">Header Title</Label>
              <Input id="header_title" value={customization.header_title} onChange={(e) => updateCustomization("header_title", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="welcome_message">Welcome Message</Label>
              <Input id="welcome_message" value={customization.welcome_message} onChange={(e) => updateCustomization("welcome_message", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="input_placeholder">Input Placeholder</Label>
              <Input id="input_placeholder" value={customization.input_placeholder} onChange={(e) => updateCustomization("input_placeholder", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="agent_avatar_url">Agent Avatar URL</Label>
              <Input id="agent_avatar_url" value={customization.agent_avatar_url} onChange={(e) => updateCustomization("agent_avatar_url", e.target.value)} className="mt-1" />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <Label>Proactive Message</Label>
                <p className="text-xs text-muted-foreground">
                  Engage users with a message after a delay.
                </p>
              </div>
              <Switch
                checked={customization.proactive_message_enabled}
                onCheckedChange={(checked) => updateCustomization("proactive_message_enabled", checked)}
              />
            </div>
            {customization.proactive_message_enabled && (
              <div className="space-y-4 pl-4 border-l-2 ml-3">
                <div>
                  <Label htmlFor="proactive_message">Proactive Message</Label>
                  <Input id="proactive_message" value={customization.proactive_message} onChange={(e) => updateCustomization("proactive_message", e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="proactive_message_delay">Delay (seconds)</Label>
                  <Input id="proactive_message_delay" type="number" value={customization.proactive_message_delay} onChange={(e) => updateCustomization("proactive_message_delay", parseInt(e.target.value))} className="mt-1" />
                </div>
              </div>
            )}
            <div>
              <Label>Embed Code</Label>
              <div className="mt-1 p-3 bg-gray-900 text-green-400 rounded-lg font-mono text-sm overflow-x-auto">
                <pre>{generateEmbedCode()}</pre>
              </div>
              <Button className="mt-2 w-full" onClick={() => {
                navigator.clipboard.writeText(generateEmbedCode());
                toast({ title: "Copied to clipboard!" });
              }} disabled={!selectedAgentId}>
                <Code className="h-4 w-4 mr-2" />
                Copy Embed Code
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <Label>AI Suggestions</Label>
                <p className="text-xs text-muted-foreground">
                  Enable AI-powered reply suggestions for agents.
                </p>
              </div>
              <Switch
                checked={customization.suggestions_enabled}
                onCheckedChange={(checked) => updateCustomization("suggestions_enabled", checked)}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <Label>Typing Indicator</Label>
                <p className="text-xs text-muted-foreground">
                  Show a typing indicator when the agent is responding.
                </p>
              </div>
              <Switch
                checked={customization.typing_indicator_enabled}
                onCheckedChange={(checked) => updateCustomization("typing_indicator_enabled", checked)}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
