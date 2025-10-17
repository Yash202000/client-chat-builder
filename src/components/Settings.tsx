
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
  Database,
  Building,
  ChevronsUpDown
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { IntegrationsList } from "./IntegrationsList";
import { ApiKeys } from "./ApiKeys";
import { ProactiveMessageTester } from "./ProactiveMessageTester";
import { ApiDocs } from "./ApiDocs";
import { useQuery } from "@tanstack/react-query";
import { Company } from "@/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";


export const Settings = () => {
  const { toast } = useToast();
  const { user, companyId, setCompanyIdGlobaly, authFetch } = useAuth();

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
    logoUrl: "",
    primaryColor: "",
    secondaryColor: "",
    customDomain: "",
    maxFileSize: 10, // Initialize with default value
    sessionTimeout: 30, // Initialize with default value
  });

  const { data: companies } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/companies/`);
      if (!response.ok) throw new Error("Failed to fetch companies");
      return response.json();
    },
    enabled: !!user?.is_super_admin,
  });

  const currentCompany = companies?.find(c => c.id === companyId);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!companyId) return;
      try {
        const [userResponse, companyResponse, notificationResponse] = await Promise.all([
          authFetch(`/api/v1/settings/`),
          authFetch(`/api/v1/company-settings/`),
          authFetch(`/api/v1/notification-settings/`),
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
            logoUrl: companyData.logo_url,
            primaryColor: companyData.primary_color,
            secondaryColor: companyData.secondary_color,
            customDomain: companyData.custom_domain,
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
  }, [companyId, authFetch, toast]);

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveChanges = async () => {
    try {
      const [userResponse, companyResponse, notificationResponse] = await Promise.all([
        authFetch(`/api/v1/settings/`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ dark_mode: settings.darkMode }),
        }),
        authFetch(`/api/v1/company-settings/`, {
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
            logo_url: settings.logoUrl,
            primary_color: settings.primaryColor,
            secondary_color: settings.secondaryColor,
            custom_domain: settings.customDomain,
          }),
        }),
        authFetch(`/api/v1/notification-settings/`, {
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
    <div className="space-y-6 p-6 animate-fade-in">
      <div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-2">
          Settings
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg">Manage your platform configuration and preferences</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 bg-slate-100 dark:bg-slate-900 p-1">
          <TabsTrigger value="general" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400">⚙️ General</TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400">🔔 Notifications</TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400">🔒 Security</TabsTrigger>
          <TabsTrigger value="integrations" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400">🔌 Integrations</TabsTrigger>
          <TabsTrigger value="appearance" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400">🎨 Appearance</TabsTrigger>
          <TabsTrigger value="developer" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400">💻 Developer</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          {user?.is_super_admin && companies && (
            <Card className="card-shadow-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800">
              <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                <CardTitle className="dark:text-white flex items-center gap-2">
                  <Building className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                  Company Context
                </CardTitle>
                <CardDescription className="dark:text-gray-400">Switch between companies to manage their settings and data</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full md:w-1/2 flex items-center justify-between gap-2 dark:bg-slate-900 dark:border-slate-600 dark:text-white dark:hover:bg-slate-700">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        <span>{currentCompany?.name || "Select Company"}</span>
                      </div>
                      <ChevronsUpDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full md:w-1/2 dark:bg-slate-800 dark:border-slate-700">
                    <DropdownMenuLabel className="dark:text-white">Switch Company</DropdownMenuLabel>
                    {companies.map(c => (
                      <DropdownMenuItem key={c.id} onSelect={() => setCompanyIdGlobaly(c.id)} className="dark:text-white dark:focus:bg-slate-700">
                        {c.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          )}
          <Card className="card-shadow-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800">
            <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Globe className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                Company Information
              </CardTitle>
              <CardDescription className="dark:text-gray-400">Basic company details and branding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div>
                <Label htmlFor="companyName" className="dark:text-gray-300">Company Name</Label>
                <Input
                  id="companyName"
                  value={settings.companyName}
                  onChange={(e) => handleSettingChange("companyName", e.target.value)}
                  className="dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="supportEmail" className="dark:text-gray-300">Support Email</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => handleSettingChange("supportEmail", e.target.value)}
                  className="dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1.5"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="timezone" className="dark:text-gray-300">Timezone</Label>
                  <select
                    id="timezone"
                    value={settings.timezone}
                    onChange={(e) => handleSettingChange("timezone", e.target.value)}
                    className="w-full p-2 border rounded-md dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1.5"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="language" className="dark:text-gray-300">Language</Label>
                  <select
                    id="language"
                    value={settings.language}
                    onChange={(e) => handleSettingChange("language", e.target.value)}
                    className="w-full p-2 border rounded-md dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1.5"
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

          <Card className="card-shadow-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800">
            <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
              <CardTitle className="dark:text-white">Business Hours</CardTitle>
              <CardDescription className="dark:text-gray-400">Configure when your support team is available</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                  <Label htmlFor="businessHours" className="dark:text-white">Enable Business Hours</Label>
                  <Switch
                    id="businessHours"
                    checked={settings.businessHours}
                    onCheckedChange={(checked) => handleSettingChange("businessHours", checked)}
                  />
                </div>

                {settings.businessHours && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <Label htmlFor="businessHoursStartTime" className="dark:text-gray-300">Start Time</Label>
                      <Input
                        id="businessHoursStartTime"
                        type="time"
                        value={settings.businessHoursStartTime}
                        onChange={(e) => handleSettingChange("businessHoursStartTime", e.target.value)}
                        className="dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="businessHoursEndTime" className="dark:text-gray-300">End Time</Label>
                      <Input
                        id="businessHoursEndTime"
                        type="time"
                        value={settings.businessHoursEndTime}
                        onChange={(e) => handleSettingChange("businessHoursEndTime", e.target.value)}
                        className="dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="businessHoursDays" className="dark:text-gray-300">Days</Label>
                      <select
                        id="businessHoursDays"
                        value={settings.businessHoursDays}
                        onChange={(e) => handleSettingChange("businessHoursDays", e.target.value)}
                        className="w-full p-2 border rounded-md dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1.5"
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
          <Card className="card-shadow-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800">
            <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Bell className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                Notification Preferences
              </CardTitle>
              <CardDescription className="dark:text-gray-400">Configure how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                  <div>
                    <Label className="dark:text-white">Email Notifications</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => handleSettingChange("emailNotifications", checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                  <div>
                    <Label className="dark:text-white">Slack Notifications</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Send alerts to Slack channels</p>
                  </div>
                  <Switch
                    checked={settings.slackNotifications}
                    onCheckedChange={(checked) => handleSettingChange("slackNotifications", checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                  <div>
                    <Label className="dark:text-white">Auto Assignment</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Automatically assign conversations to agents</p>
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
          <Card className="card-shadow-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800">
            <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Shield className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                Security Settings
              </CardTitle>
              <CardDescription className="dark:text-gray-400">Configure security and access controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                  <div>
                    <Label className="dark:text-white">Require Authentication</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Require users to authenticate before chatting</p>
                  </div>
                  <Switch checked={true} />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                  <div>
                    <Label className="dark:text-white">Allow File Uploads</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Allow customers to upload files in chat</p>
                  </div>
                  <Switch checked={true} />
                </div>

                <div>
                  <Label htmlFor="maxFileSize" className="dark:text-gray-300">Max File Size (MB)</Label>
                  <Input
                    id="maxFileSize"
                    type="number"
                    value="10"
                    className="w-32 dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="sessionTimeout" className="dark:text-gray-300">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value="30"
                    className="w-32 dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1.5"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <IntegrationsList />
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card className="card-shadow-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800">
            <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Palette className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                Platform Appearance
              </CardTitle>
              <CardDescription className="dark:text-gray-400">Customize the look and feel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div>
                <Label className="dark:text-gray-300 mb-3 block">Theme</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div
                    onClick={() => handleSettingChange("darkMode", false)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      !settings.darkMode
                        ? 'bg-gradient-to-br from-slate-50 to-slate-100 border-cyan-500 dark:border-cyan-400 shadow-md'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="text-center">
                      <div className="w-full h-16 rounded-lg mb-3 bg-white border-2 border-slate-200 shadow-sm"></div>
                      <span className={`text-sm font-medium ${!settings.darkMode ? 'text-cyan-600' : 'dark:text-white'}`}>☀️ Light Mode</span>
                    </div>
                  </div>
                  <div
                    onClick={() => handleSettingChange("darkMode", true)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      settings.darkMode
                        ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-cyan-500 dark:border-cyan-400 shadow-md'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="text-center">
                      <div className="w-full h-16 rounded-lg mb-3 bg-slate-900 border-2 border-slate-700 shadow-sm"></div>
                      <span className={`text-sm font-medium ${settings.darkMode ? 'text-cyan-400' : 'dark:text-white'}`}>🌙 Dark Mode</span>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="logoUrl" className="dark:text-gray-300">Logo URL</Label>
                <Input
                  id="logoUrl"
                  value={settings.logoUrl}
                  onChange={(e) => handleSettingChange("logoUrl", e.target.value)}
                  className="dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1.5"
                  placeholder="https://example.com/logo.png"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primaryColor" className="dark:text-gray-300">Primary Color</Label>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) => handleSettingChange("primaryColor", e.target.value)}
                      className="w-16 h-10 cursor-pointer"
                    />
                    <Input
                      value={settings.primaryColor}
                      onChange={(e) => handleSettingChange("primaryColor", e.target.value)}
                      className="flex-1 dark:bg-slate-900 dark:border-slate-600 dark:text-white font-mono text-sm"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="secondaryColor" className="dark:text-gray-300">Secondary Color</Label>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={settings.secondaryColor}
                      onChange={(e) => handleSettingChange("secondaryColor", e.target.value)}
                      className="w-16 h-10 cursor-pointer"
                    />
                    <Input
                      value={settings.secondaryColor}
                      onChange={(e) => handleSettingChange("secondaryColor", e.target.value)}
                      className="flex-1 dark:bg-slate-900 dark:border-slate-600 dark:text-white font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="customDomain" className="dark:text-gray-300">Custom Domain</Label>
                <Input
                  id="customDomain"
                  value={settings.customDomain}
                  onChange={(e) => handleSettingChange("customDomain", e.target.value)}
                  className="dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1.5"
                  placeholder="chat.yourdomain.com"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="developer" className="space-y-6">
          <Tabs defaultValue="api-keys" className="space-y-6">
            <TabsList>
              <TabsTrigger value="api-keys">API Keys</TabsTrigger>
              <TabsTrigger value="tester">Tester</TabsTrigger>
              <TabsTrigger value="documentation">Documentation</TabsTrigger>
            </TabsList>
            <TabsContent value="api-keys">
              <ApiKeys />
            </TabsContent>
            <TabsContent value="tester">
              <ProactiveMessageTester />
            </TabsContent>
            <TabsContent value="documentation">
              <ApiDocs />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSaveChanges} className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white btn-hover-lift px-6">
          Save Changes
        </Button>
      </div>
    </div>
  );
};
