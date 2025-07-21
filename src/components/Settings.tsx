
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Settings as SettingsIcon, 
  Globe, 
  Bell, 
  Shield, 
  Palette, 
  Zap,
  Mail,
  Lock,
  Users,
  Database
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";

export const Settings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    companyName: "",
    supportEmail: "",
    timezone: "",
    language: "",
    businessHours: false,
    businessHoursStartTime: "09:00",
    businessHoursEndTime: "17:00",
    businessHoursDays: "Monday - Friday",
    darkMode: false,
    emailNotifications: false,
    slackNotifications: false,
    autoAssignment: false,
  });

  const userId = 1; // Hardcoded user ID for now
  const companyId = 1; // Hardcoded company ID for now
  const { authFetch } = useAuth();
  

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [userResponse, companyResponse, notificationResponse] = await Promise.all([
          authFetch(`http://localhost:8000/api/v1/settings/`),
          authFetch(`http://localhost:8000/api/v1/company-settings/`),
          authFetch(`http://localhost:8000/api/v1/notification-settings/`),
        ]);

        if (userResponse.ok && companyResponse.ok && notificationResponse.ok) {
          const userData = await userResponse.json();
          const companyData = await companyResponse.json();
          const notificationData = await notificationResponse.json();
          setSettings(prev => ({
            ...prev,
            darkMode: userData.dark_mode,
            companyName: companyData.company_name,
            supportEmail: companyData.support_email,
            timezone: companyData.timezone,
            language: companyData.language,
            businessHours: companyData.business_hours,
            emailNotifications: notificationData.email_notifications_enabled,
            slackNotifications: notificationData.slack_notifications_enabled,
            autoAssignment: notificationData.auto_assignment_enabled,
          }));
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch settings.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Failed to fetch settings", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    };

    fetchSettings();
  }, [userId, companyId, toast]);

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveChanges = async () => {
    try {
      const [userResponse, companyResponse, notificationResponse] = await Promise.all([
        authFetch(`http://localhost:8000/api/v1/settings/`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ dark_mode: settings.darkMode }),
        }),
        authFetch(`http://localhost:8000/api/v1/company-settings/`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            company_name: settings.companyName,
            support_email: settings.supportEmail,
            timezone: settings.timezone,
            language: settings.language,
            business_hours: settings.businessHours,
          }),
        }),
        authFetch(`http://localhost:8000/api/v1/notification-settings/`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email_notifications_enabled: settings.emailNotifications,
            slack_notifications_enabled: settings.slackNotifications,
            auto_assignment_enabled: settings.autoAssignment,
          }),
        }),
      ]);

      if (userResponse.ok && companyResponse.ok && notificationResponse.ok) {
        toast({
          title: "Success",
          description: "Settings saved successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save settings.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to save settings", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600">Manage your platform configuration</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Company Information
              </CardTitle>
              <CardDescription>Basic company details and branding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={settings.companyName}
                  onChange={(e) => handleSettingChange("companyName", e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="supportEmail">Support Email</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => handleSettingChange("supportEmail", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    value={settings.timezone}
                    onChange={(e) => handleSettingChange("timezone", e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="language">Language</Label>
                  <select
                    id="language"
                    value={settings.language}
                    onChange={(e) => handleSettingChange("language", e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Business Hours</CardTitle>
              <CardDescription>Configure when your support team is available</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="businessHours">Enable Business Hours</Label>
                  <Switch
                    id="businessHours"
                    checked={settings.businessHours}
                    onCheckedChange={(checked) => handleSettingChange("businessHours", checked)}
                  />
                </div>
                
                {settings.businessHours && (
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                      <Label htmlFor="businessHoursStartTime">Start Time</Label>
                      <Input
                        id="businessHoursStartTime"
                        type="time"
                        value={settings.businessHoursStartTime}
                        onChange={(e) => handleSettingChange("businessHoursStartTime", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="businessHoursEndTime">End Time</Label>
                      <Input
                        id="businessHoursEndTime"
                        type="time"
                        value={settings.businessHoursEndTime}
                        onChange={(e) => handleSettingChange("businessHoursEndTime", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="businessHoursDays">Days</Label>
                      <select
                        id="businessHoursDays"
                        value={settings.businessHoursDays}
                        onChange={(e) => handleSettingChange("businessHoursDays", e.target.value)}
                        className="w-full p-2 border rounded-md"
                      >
                        <option>Monday - Friday</option>
                        <option>Monday - Saturday</option>
                        <option>Every Day</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Configure how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-600">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => handleSettingChange("emailNotifications", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Slack Notifications</Label>
                    <p className="text-sm text-gray-600">Send alerts to Slack channels</p>
                  </div>
                  <Switch
                    checked={settings.slackNotifications}
                    onCheckedChange={(checked) => handleSettingChange("slackNotifications", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto Assignment</Label>
                    <p className="text-sm text-gray-600">Automatically assign conversations to agents</p>
                  </div>
                  <Switch
                    checked={settings.autoAssignment}
                    onCheckedChange={(checked) => handleSettingChange("autoAssignment", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>Configure security and access controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Authentication</Label>
                    <p className="text-sm text-gray-600">Require users to authenticate before chatting</p>
                  </div>
                  <Switch
                    checked={true}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow File Uploads</Label>
                    <p className="text-sm text-gray-600">Allow customers to upload files in chat</p>
                  </div>
                  <Switch
                    checked={true}
                  />
                </div>

                <div>
                  <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                  <Input
                    id="maxFileSize"
                    type="number"
                    value="10"
                    className="w-32"
                  />
                </div>

                <div>
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value="30"
                    className="w-32"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Third-party Integrations
              </CardTitle>
              <CardDescription>Connect with external services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: "Slack", description: "Team communication", connected: true },
                  { name: "Zapier", description: "Automation workflows", connected: false },
                  { name: "HubSpot", description: "CRM integration", connected: false },
                  { name: "Salesforce", description: "Sales management", connected: false },
                  { name: "Stripe", description: "Payment processing", connected: true },
                  { name: "Intercom", description: "Customer messaging", connected: false },
                ].map((integration) => (
                  <div key={integration.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{integration.name}</h4>
                      <p className="text-sm text-gray-600">{integration.description}</p>
                    </div>
                    <Button 
                      variant={integration.connected ? "destructive" : "default"}
                      size="sm"
                    >
                      {integration.connected ? "Disconnect" : "Connect"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Platform Appearance
              </CardTitle>
              <CardDescription>Customize the look and feel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Theme</Label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div onClick={() => handleSettingChange("darkMode", false)} className={`p-4 border rounded-lg cursor-pointer ${!settings.darkMode ? 'bg-gray-50' : ''}`}>
                    <div className="text-center">
                      <div className="w-full h-12 rounded mb-2 bg-white border"></div>
                      <span className="text-sm">Light</span>
                    </div>
                  </div>
                  <div onClick={() => handleSettingChange("darkMode", true)} className={`p-4 border rounded-lg cursor-pointer ${settings.darkMode ? 'bg-gray-900 text-white' : ''}`}>
                    <div className="text-center">
                      <div className="w-full h-12 rounded mb-2 bg-gray-900"></div>
                      <span className="text-sm">Dark</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Advanced Configuration
              </CardTitle>
              <CardDescription>Advanced platform settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="apiKey">API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="apiKey"
                    type="password"
                    value="sk-1234567890abcdef"
                    readOnly
                    className="flex-1"
                  />
                  <Button variant="outline">Regenerate</Button>
                </div>
              </div>

              <div>
                <Label htmlFor="webhookUrl">Webhook URL</Label>
                <Input
                  id="webhookUrl"
                  placeholder="https://your-app.com/webhook"
                />
              </div>

              <div>
                <Label>Data Export</Label>
                <div className="flex gap-2 mt-2">
                  <Button variant="outline">Export Conversations</Button>
                  <Button variant="outline">Export Analytics</Button>
                  <Button variant="outline">Export Users</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSaveChanges}>Save Changes</Button>
      </div>
    </div>
  );
};
