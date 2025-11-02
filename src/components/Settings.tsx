
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
import { useTranslation } from 'react-i18next';
import { useI18n } from '@/hooks/useI18n';


export const Settings = () => {
  const { t } = useTranslation();
  const { isRTL } = useI18n();
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
            title: t('settings.error'),
            description: t('settings.failedFetchSettings'),
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Failed to fetch settings", error);
        toast({
          title: t('settings.error'),
          description: t('settings.unexpectedError'),
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
          title: t('settings.success'),
          description: t('settings.settingsSaved'),
        });
      } else {
        toast({
          title: t('settings.error'),
          description: t('settings.failedSaveSettings'),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to save settings", error);
      toast({
        title: t('settings.error'),
        description: t('settings.unexpectedError'),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 p-6 animate-fade-in" dir={isRTL ? 'rtl' : 'ltr'}>
      <div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-2">
          {t('settings.title')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg">{t('settings.subtitle')}</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 bg-slate-100 dark:bg-slate-900 p-1">
          <TabsTrigger value="general" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400">{t('settings.general')}</TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400">{t('settings.notifications')}</TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400">{t('settings.security')}</TabsTrigger>
          <TabsTrigger value="integrations" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400">{t('settings.integrations')}</TabsTrigger>
          <TabsTrigger value="appearance" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400">{t('settings.appearance')}</TabsTrigger>
          <TabsTrigger value="developer" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400">{t('settings.developer')}</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {user?.is_super_admin && companies && (
              <Card className="card-shadow-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className={`dark:text-white flex items-center gap-2 text-base text-left`}>
                    <Building className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                    {t('settings.companyContext')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className={`w-full flex items-center justify-between gap-2 dark:bg-slate-900 dark:border-slate-600 dark:text-white dark:hover:bg-slate-700`}>
                        <div className={`flex items-center gap-2`}>
                          <Building className="h-4 w-4" />
                          <span>{currentCompany?.name || t('settings.selectCompany')}</span>
                        </div>
                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full dark:bg-slate-800 dark:border-slate-700">
                      <DropdownMenuLabel className="dark:text-white">{t('settings.switchCompany')}</DropdownMenuLabel>
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

            <Card className="card-shadow-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className={`flex items-center gap-2 dark:text-white text-base`}>
                  <Globe className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                  {t('settings.companyInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="lg:col-span-2">
                    <Label htmlFor="companyName" className="dark:text-gray-300 text-sm">{t('settings.companyName')}</Label>
                    <Input
                      id="companyName"
                      value={settings.companyName}
                      onChange={(e) => handleSettingChange("companyName", e.target.value)}
                      className="dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1 h-9"
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <Label htmlFor="supportEmail" className="dark:text-gray-300 text-sm">{t('settings.supportEmail')}</Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={settings.supportEmail}
                      onChange={(e) => handleSettingChange("supportEmail", e.target.value)}
                      className="dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1 h-9"
                    />
                  </div>

                  <div>
                    <Label htmlFor="timezone" className="dark:text-gray-300 text-sm">{t('settings.timezone')}</Label>
                    <select
                      id="timezone"
                      value={settings.timezone}
                      onChange={(e) => handleSettingChange("timezone", e.target.value)}
                      className="w-full h-9 px-3 border rounded-md dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1 text-sm"
                    >
                      <option value="UTC">{t('settings.utc')}</option>
                      <option value="America/New_York">{t('settings.easternTime')}</option>
                      <option value="America/Chicago">{t('settings.centralTime')}</option>
                      <option value="America/Los_Angeles">{t('settings.pacificTime')}</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="language" className="dark:text-gray-300 text-sm">{t('settings.language')}</Label>
                    <select
                      id="language"
                      value={settings.language}
                      onChange={(e) => handleSettingChange("language", e.target.value)}
                      className="w-full h-9 px-3 border rounded-md dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1 text-sm"
                    >
                      <option value="en">{t('settings.english')}</option>
                      <option value="es">{t('settings.spanish')}</option>
                      <option value="fr">{t('settings.french')}</option>
                      <option value="de">{t('settings.german')}</option>
                    </select>
                  </div>

                  <div className="lg:col-span-4 pt-2 border-t border-slate-200 dark:border-slate-700 mt-2">
                    <div className={`flex items-center justify-between mb-3`}>
                      <Label htmlFor="businessHours" className="dark:text-white text-sm font-semibold">{t('settings.businessHours')}</Label>
                      <Switch
                        id="businessHours"
                        checked={settings.businessHours}
                        onCheckedChange={(checked) => handleSettingChange("businessHours", checked)}
                      />
                    </div>

                    {settings.businessHours && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <Label htmlFor="businessHoursStartTime" className="dark:text-gray-300 text-sm">{t('settings.startTime')}</Label>
                          <Input
                            id="businessHoursStartTime"
                            type="time"
                            value={settings.businessHoursStartTime}
                            onChange={(e) => handleSettingChange("businessHoursStartTime", e.target.value)}
                            className="dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1 h-9"
                          />
                        </div>
                        <div>
                          <Label htmlFor="businessHoursEndTime" className="dark:text-gray-300 text-sm">{t('settings.endTime')}</Label>
                          <Input
                            id="businessHoursEndTime"
                            type="time"
                            value={settings.businessHoursEndTime}
                            onChange={(e) => handleSettingChange("businessHoursEndTime", e.target.value)}
                            className="dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1 h-9"
                          />
                        </div>
                        <div>
                          <Label htmlFor="businessHoursDays" className="dark:text-gray-300 text-sm">{t('settings.days')}</Label>
                          <select
                            id="businessHoursDays"
                            value={settings.businessHoursDays}
                            onChange={(e) => handleSettingChange("businessHoursDays", e.target.value)}
                            className="w-full h-9 px-3 border rounded-md dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1 text-sm"
                          >
                            <option>{t('settings.mondayFriday')}</option>
                            <option>{t('settings.mondaySaturday')}</option>
                            <option>{t('settings.everyDay')}</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
          <Card className="card-shadow-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800">
            <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Bell className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                {t('settings.notificationPreferences')}
              </CardTitle>
              <CardDescription className="dark:text-gray-400">{t('settings.configureNotifications')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                  <div>
                    <Label className="dark:text-white">{t('settings.emailNotifications')}</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('settings.emailNotificationsDesc')}</p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => handleSettingChange("emailNotifications", checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                  <div>
                    <Label className="dark:text-white">{t('settings.slackNotifications')}</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('settings.slackNotificationsDesc')}</p>
                  </div>
                  <Switch
                    checked={settings.slackNotifications}
                    onCheckedChange={(checked) => handleSettingChange("slackNotifications", checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                  <div>
                    <Label className="dark:text-white">{t('settings.autoAssignment')}</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('settings.autoAssignmentDesc')}</p>
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

        <TabsContent value="security" className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
          <Card className="card-shadow-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800">
            <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Shield className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                {t('settings.securitySettings')}
              </CardTitle>
              <CardDescription className="dark:text-gray-400">{t('settings.securitySettingsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                  <div>
                    <Label className="dark:text-white">{t('settings.requireAuth')}</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('settings.requireAuthDesc')}</p>
                  </div>
                  <Switch checked={true} />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                  <div>
                    <Label className="dark:text-white">{t('settings.allowFileUploads')}</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('settings.allowFileUploadsDesc')}</p>
                  </div>
                  <Switch checked={true} />
                </div>

                <div>
                  <Label htmlFor="maxFileSize" className="dark:text-gray-300">{t('settings.maxFileSize')}</Label>
                  <Input
                    id="maxFileSize"
                    type="number"
                    value="10"
                    className="w-32 dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="sessionTimeout" className="dark:text-gray-300">{t('settings.sessionTimeout')}</Label>
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

        <TabsContent value="integrations" className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
          <IntegrationsList />
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
          <Card className="card-shadow-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800">
            <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Palette className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                {t('settings.platformAppearance')}
              </CardTitle>
              <CardDescription className="dark:text-gray-400">{t('settings.platformAppearanceDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div>
                <Label className="dark:text-gray-300 mb-3 block">{t('settings.theme')}</Label>
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
                      <span className={`text-sm font-medium ${!settings.darkMode ? 'text-cyan-600' : 'dark:text-white'}`}>{t('settings.lightMode')}</span>
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
                      <span className={`text-sm font-medium ${settings.darkMode ? 'text-cyan-400' : 'dark:text-white'}`}>{t('settings.darkMode')}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="logoUrl" className="dark:text-gray-300">{t('settings.logoUrl')}</Label>
                <Input
                  id="logoUrl"
                  value={settings.logoUrl}
                  onChange={(e) => handleSettingChange("logoUrl", e.target.value)}
                  className="dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1.5"
                  placeholder={t('settings.logoUrlPlaceholder')}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primaryColor" className="dark:text-gray-300">{t('settings.primaryColor')}</Label>
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
                  <Label htmlFor="secondaryColor" className="dark:text-gray-300">{t('settings.secondaryColor')}</Label>
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
                <Label htmlFor="customDomain" className="dark:text-gray-300">{t('settings.customDomain')}</Label>
                <Input
                  id="customDomain"
                  value={settings.customDomain}
                  onChange={(e) => handleSettingChange("customDomain", e.target.value)}
                  className="dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1.5"
                  placeholder={t('settings.customDomainPlaceholder')}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="developer" className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
          <Tabs defaultValue="api-keys" className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
            <TabsList>
              <TabsTrigger value="api-keys">{t('settings.apiKeys')}</TabsTrigger>
              <TabsTrigger value="tester">{t('settings.tester')}</TabsTrigger>
              <TabsTrigger value="documentation">{t('settings.documentation')}</TabsTrigger>
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

      <div className={`flex ${isRTL ? 'justify-start' : 'justify-end'}`}>
        <Button onClick={handleSaveChanges} className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white btn-hover-lift px-6">
          {t('settings.saveChanges')}
        </Button>
      </div>
    </div>
  );
};
