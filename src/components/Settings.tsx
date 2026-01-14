
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
  ChevronsUpDown,
  PhoneCall
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { IntegrationsList } from "./IntegrationsList";
import { ApiKeys } from "./ApiKeys";
import { ProactiveMessageTester } from "./ProactiveMessageTester";
import { ApiDocs } from "./ApiDocs";
import { ApiIntegrationsList } from "./ApiIntegrationsList";
import { TwilioPhoneNumbersManager } from "./TwilioPhoneNumbersManager";
import { FreeSwitchPhoneNumbersManager } from "./FreeSwitchPhoneNumbersManager";
import { useQuery } from "@tanstack/react-query";
import { Company } from "@/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useTranslation } from 'react-i18next';
import { useI18n } from '@/hooks/useI18n';


export const Settings = () => {
  const { t } = useTranslation();
  const { isRTL } = useI18n();
  const { toast } = useToast();
  const { playSuccessSound } = useNotifications();
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
    maxFileSize: 10,
    sessionTimeout: 30,
    // SMTP Settings
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPassword: "",
    smtpUseTls: true,
    smtpFromEmail: "",
    smtpFromName: "",
  });

  const [testingSmtp, setTestingSmtp] = useState(false);
  const [testEmail, setTestEmail] = useState("");

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
            // SMTP Settings
            smtpHost: companyData.smtp_host || "",
            smtpPort: companyData.smtp_port || 587,
            smtpUser: companyData.smtp_user || "",
            smtpPassword: companyData.smtp_password || "",
            smtpUseTls: companyData.smtp_use_tls !== false,
            smtpFromEmail: companyData.smtp_from_email || "",
            smtpFromName: companyData.smtp_from_name || "",
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

  const handleTestSmtp = async () => {
    if (!testEmail) {
      toast({
        title: t('settings.error'),
        description: t('settings.enterTestEmail', 'Please enter a test email address'),
        variant: "destructive",
      });
      return;
    }

    try {
      setTestingSmtp(true);
      const response = await authFetch(`/api/v1/company-settings/test-smtp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          to_email: testEmail,
          smtp_host: settings.smtpHost,
          smtp_port: settings.smtpPort,
          smtp_user: settings.smtpUser,
          smtp_password: settings.smtpPassword,
          smtp_use_tls: settings.smtpUseTls,
          smtp_from_email: settings.smtpFromEmail,
          smtp_from_name: settings.smtpFromName,
        }),
      });

      if (response.ok) {
        toast({
          title: t('settings.success'),
          description: t('settings.testEmailSent', 'Test email sent successfully!'),
        });
        playSuccessSound();
      } else {
        const error = await response.json();
        toast({
          title: t('settings.error'),
          description: error.detail || t('settings.testEmailFailed', 'Failed to send test email'),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to test SMTP", error);
      toast({
        title: t('settings.error'),
        description: t('settings.unexpectedError'),
        variant: "destructive",
      });
    } finally {
      setTestingSmtp(false);
    }
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
            smtp_host: settings.smtpHost || null,
            smtp_port: settings.smtpPort || 587,
            smtp_user: settings.smtpUser || null,
            smtp_password: settings.smtpPassword || null,
            smtp_use_tls: settings.smtpUseTls,
            smtp_from_email: settings.smtpFromEmail || null,
            smtp_from_name: settings.smtpFromName || null,
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
        playSuccessSound();
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
      <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-xl shadow-cyan-500/25">
          <SettingsIcon className="h-8 w-8 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
            {t('settings.title')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">{t('settings.subtitle')}</p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 bg-slate-100/80 dark:bg-slate-900/80 p-1.5 rounded-xl backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60">
          <TabsTrigger value="general" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400 data-[state=active]:shadow-sm transition-all flex items-center gap-1.5 text-xs lg:text-sm">
            <Globe className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">{t('settings.general')}</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400 data-[state=active]:shadow-sm transition-all flex items-center gap-1.5 text-xs lg:text-sm">
            <Mail className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">{t('settings.email', 'Email')}</span>
          </TabsTrigger>
          <TabsTrigger value="voice" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400 data-[state=active]:shadow-sm transition-all flex items-center gap-1.5 text-xs lg:text-sm">
            <PhoneCall className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">{t('settings.voice', 'Voice')}</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400 data-[state=active]:shadow-sm transition-all flex items-center gap-1.5 text-xs lg:text-sm">
            <Bell className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">{t('settings.notifications')}</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400 data-[state=active]:shadow-sm transition-all flex items-center gap-1.5 text-xs lg:text-sm">
            <Shield className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">{t('settings.security')}</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400 data-[state=active]:shadow-sm transition-all flex items-center gap-1.5 text-xs lg:text-sm">
            <Zap className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">{t('settings.integrations')}</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400 data-[state=active]:shadow-sm transition-all flex items-center gap-1.5 text-xs lg:text-sm">
            <Palette className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">{t('settings.appearance')}</span>
          </TabsTrigger>
          <TabsTrigger value="developer" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400 data-[state=active]:shadow-sm transition-all flex items-center gap-1.5 text-xs lg:text-sm">
            <Database className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">{t('settings.developer')}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {user?.is_super_admin && companies && (
              <div className="rounded-2xl border border-cyan-200/80 dark:border-cyan-700/60 bg-gradient-to-br from-white to-cyan-50 dark:from-slate-800 dark:to-slate-900 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 transition-all">
                <div className="p-5 pb-3">
                  <h3 className={`dark:text-white flex items-center gap-2 text-base font-semibold`}>
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
                      <Building className="h-3.5 w-3.5 text-white" />
                    </div>
                    {t('settings.companyContext')}
                  </h3>
                </div>
                <div className="px-5 pb-5">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className={`w-full flex items-center justify-between gap-2 rounded-xl dark:bg-slate-900 dark:border-slate-600 dark:text-white dark:hover:bg-slate-700 hover:scale-[1.01] transition-all`}>
                        <div className={`flex items-center gap-2`}>
                          <Building className="h-4 w-4" />
                          <span>{currentCompany?.name || t('settings.selectCompany')}</span>
                        </div>
                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full dark:bg-slate-800 dark:border-slate-700 rounded-xl">
                      <DropdownMenuLabel className="dark:text-white">{t('settings.switchCompany')}</DropdownMenuLabel>
                      {companies.map(c => (
                        <DropdownMenuItem key={c.id} onSelect={() => setCompanyIdGlobaly(c.id)} className="dark:text-white dark:focus:bg-slate-700 rounded-lg">
                          {c.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 shadow-lg shadow-slate-500/10 hover:shadow-slate-500/20 transition-all lg:col-span-2">
              <div className="p-5 pb-3">
                <h3 className={`flex items-center gap-2 dark:text-white text-base font-semibold`}>
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
                    <Globe className="h-3.5 w-3.5 text-white" />
                  </div>
                  {t('settings.companyInfo')}
                </h3>
              </div>
              <div className="px-5 pb-5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="lg:col-span-2">
                    <Label htmlFor="companyName" className="dark:text-gray-300 text-sm">{t('settings.companyName')}</Label>
                    <Input
                      id="companyName"
                      value={settings.companyName}
                      onChange={(e) => handleSettingChange("companyName", e.target.value)}
                      className="dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1 h-9 rounded-xl"
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <Label htmlFor="supportEmail" className="dark:text-gray-300 text-sm">{t('settings.supportEmail')}</Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={settings.supportEmail}
                      onChange={(e) => handleSettingChange("supportEmail", e.target.value)}
                      className="dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1 h-9 rounded-xl"
                    />
                  </div>

                  <div>
                    <Label htmlFor="timezone" className="dark:text-gray-300 text-sm">{t('settings.timezone')}</Label>
                    <select
                      id="timezone"
                      value={settings.timezone}
                      onChange={(e) => handleSettingChange("timezone", e.target.value)}
                      className="w-full h-9 px-3 border rounded-xl dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1 text-sm"
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
                      className="w-full h-9 px-3 border rounded-xl dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1 text-sm"
                    >
                      <option value="en">{t('settings.english')}</option>
                      <option value="es">{t('settings.spanish')}</option>
                      <option value="fr">{t('settings.french')}</option>
                      <option value="de">{t('settings.german')}</option>
                    </select>
                  </div>

                  <div className="lg:col-span-4 pt-3 border-t border-slate-200/80 dark:border-slate-700/60 mt-3">
                    <div className={`flex items-center justify-between p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/60`}>
                      <Label htmlFor="businessHours" className="dark:text-white text-sm font-semibold">{t('settings.businessHours')}</Label>
                      <Switch
                        id="businessHours"
                        checked={settings.businessHours}
                        onCheckedChange={(checked) => handleSettingChange("businessHours", checked)}
                      />
                    </div>

                    {settings.businessHours && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                        <div>
                          <Label htmlFor="businessHoursStartTime" className="dark:text-gray-300 text-sm">{t('settings.startTime')}</Label>
                          <Input
                            id="businessHoursStartTime"
                            type="time"
                            value={settings.businessHoursStartTime}
                            onChange={(e) => handleSettingChange("businessHoursStartTime", e.target.value)}
                            className="dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1 h-9 rounded-xl"
                          />
                        </div>
                        <div>
                          <Label htmlFor="businessHoursEndTime" className="dark:text-gray-300 text-sm">{t('settings.endTime')}</Label>
                          <Input
                            id="businessHoursEndTime"
                            type="time"
                            value={settings.businessHoursEndTime}
                            onChange={(e) => handleSettingChange("businessHoursEndTime", e.target.value)}
                            className="dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1 h-9 rounded-xl"
                          />
                        </div>
                        <div>
                          <Label htmlFor="businessHoursDays" className="dark:text-gray-300 text-sm">{t('settings.days')}</Label>
                          <select
                            id="businessHoursDays"
                            value={settings.businessHoursDays}
                            onChange={(e) => handleSettingChange("businessHoursDays", e.target.value)}
                            className="w-full h-9 px-3 border rounded-xl dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1 text-sm"
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
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="email" className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="rounded-2xl border border-blue-200/80 dark:border-blue-700/60 bg-gradient-to-br from-white to-blue-50 dark:from-slate-800 dark:to-slate-900 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all">
            <div className="p-6 border-b border-blue-200/60 dark:border-blue-700/40 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-slate-800/50 dark:to-slate-900/50 rounded-t-2xl">
              <h3 className="flex items-center gap-3 dark:text-white text-lg font-semibold">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/25">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                {t('settings.smtpConfiguration', 'SMTP Configuration')}
              </h3>
              <p className="dark:text-gray-400 text-sm mt-1 ml-12">
                {t('settings.smtpDescription', 'Configure your email server settings for sending campaign emails')}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtpHost" className="dark:text-gray-300">{t('settings.smtpHost', 'SMTP Host')}</Label>
                  <Input
                    id="smtpHost"
                    value={settings.smtpHost}
                    onChange={(e) => handleSettingChange("smtpHost", e.target.value)}
                    className="dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1.5 rounded-xl"
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div>
                  <Label htmlFor="smtpPort" className="dark:text-gray-300">{t('settings.smtpPort', 'SMTP Port')}</Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    value={settings.smtpPort}
                    onChange={(e) => handleSettingChange("smtpPort", parseInt(e.target.value) || 587)}
                    className="dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1.5 rounded-xl"
                    placeholder="587"
                  />
                </div>
                <div>
                  <Label htmlFor="smtpUser" className="dark:text-gray-300">{t('settings.smtpUser', 'SMTP Username')}</Label>
                  <Input
                    id="smtpUser"
                    value={settings.smtpUser}
                    onChange={(e) => handleSettingChange("smtpUser", e.target.value)}
                    className="dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1.5 rounded-xl"
                    placeholder="your-email@gmail.com"
                  />
                </div>
                <div>
                  <Label htmlFor="smtpPassword" className="dark:text-gray-300">{t('settings.smtpPassword', 'SMTP Password')}</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    value={settings.smtpPassword}
                    onChange={(e) => handleSettingChange("smtpPassword", e.target.value)}
                    className="dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1.5 rounded-xl"
                    placeholder="••••••••••••"
                  />
                </div>
                <div>
                  <Label htmlFor="smtpFromEmail" className="dark:text-gray-300">{t('settings.smtpFromEmail', 'From Email')}</Label>
                  <Input
                    id="smtpFromEmail"
                    type="email"
                    value={settings.smtpFromEmail}
                    onChange={(e) => handleSettingChange("smtpFromEmail", e.target.value)}
                    className="dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1.5 rounded-xl"
                    placeholder="noreply@yourcompany.com"
                  />
                </div>
                <div>
                  <Label htmlFor="smtpFromName" className="dark:text-gray-300">{t('settings.smtpFromName', 'From Name')}</Label>
                  <Input
                    id="smtpFromName"
                    value={settings.smtpFromName}
                    onChange={(e) => handleSettingChange("smtpFromName", e.target.value)}
                    className="dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1.5 rounded-xl"
                    placeholder="Your Company Name"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-900/50">
                <div>
                  <Label className="dark:text-white font-medium">{t('settings.smtpUseTls', 'Use TLS')}</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('settings.smtpUseTlsDesc', 'Enable TLS encryption for secure email transmission')}</p>
                </div>
                <Switch
                  checked={settings.smtpUseTls}
                  onCheckedChange={(checked) => handleSettingChange("smtpUseTls", checked)}
                />
              </div>

              <div className="pt-4 border-t border-slate-200/80 dark:border-slate-700/60">
                <h4 className="font-medium dark:text-white mb-3">{t('settings.testSmtp', 'Test Configuration')}</h4>
                <div className="flex gap-3">
                  <Input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="flex-1 dark:bg-slate-900 dark:border-slate-600 dark:text-white rounded-xl"
                    placeholder={t('settings.testEmailPlaceholder', 'Enter email to send test')}
                  />
                  <Button
                    onClick={handleTestSmtp}
                    disabled={testingSmtp || !settings.smtpHost || !settings.smtpUser}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl"
                  >
                    {testingSmtp ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        {t('settings.sending', 'Sending...')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {t('settings.sendTestEmail', 'Send Test Email')}
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="voice" className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
          <TwilioPhoneNumbersManager />
          <FreeSwitchPhoneNumbersManager />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="rounded-2xl border border-amber-200/80 dark:border-amber-700/60 bg-gradient-to-br from-white to-amber-50 dark:from-slate-800 dark:to-slate-900 shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 transition-all">
            <div className="p-6 border-b border-amber-200/60 dark:border-amber-700/40 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-slate-800/50 dark:to-slate-900/50 rounded-t-2xl">
              <h3 className="flex items-center gap-3 dark:text-white text-lg font-semibold">
                <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25">
                  <Bell className="h-5 w-5 text-white" />
                </div>
                {t('settings.notificationPreferences')}
              </h3>
              <p className="dark:text-gray-400 text-sm mt-1 ml-12">{t('settings.configureNotifications')}</p>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-900/50 hover:shadow-md transition-all">
                <div>
                  <Label className="dark:text-white font-medium">{t('settings.emailNotifications')}</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('settings.emailNotificationsDesc')}</p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => handleSettingChange("emailNotifications", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-900/50 hover:shadow-md transition-all">
                <div>
                  <Label className="dark:text-white font-medium">{t('settings.slackNotifications')}</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('settings.slackNotificationsDesc')}</p>
                </div>
                <Switch
                  checked={settings.slackNotifications}
                  onCheckedChange={(checked) => handleSettingChange("slackNotifications", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-900/50 hover:shadow-md transition-all">
                <div>
                  <Label className="dark:text-white font-medium">{t('settings.autoAssignment')}</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('settings.autoAssignmentDesc')}</p>
                </div>
                <Switch
                  checked={settings.autoAssignment}
                  onCheckedChange={(checked) => handleSettingChange("autoAssignment", checked)}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="rounded-2xl border border-emerald-200/80 dark:border-emerald-700/60 bg-gradient-to-br from-white to-emerald-50 dark:from-slate-800 dark:to-slate-900 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all">
            <div className="p-6 border-b border-emerald-200/60 dark:border-emerald-700/40 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-slate-800/50 dark:to-slate-900/50 rounded-t-2xl">
              <h3 className="flex items-center gap-3 dark:text-white text-lg font-semibold">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                {t('settings.securitySettings')}
              </h3>
              <p className="dark:text-gray-400 text-sm mt-1 ml-12">{t('settings.securitySettingsDesc')}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-900/50 hover:shadow-md transition-all">
                <div>
                  <Label className="dark:text-white font-medium">{t('settings.requireAuth')}</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('settings.requireAuthDesc')}</p>
                </div>
                <Switch checked={true} />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-900/50 hover:shadow-md transition-all">
                <div>
                  <Label className="dark:text-white font-medium">{t('settings.allowFileUploads')}</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('settings.allowFileUploadsDesc')}</p>
                </div>
                <Switch checked={true} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-200/80 dark:border-slate-700/60">
                <div>
                  <Label htmlFor="maxFileSize" className="dark:text-gray-300">{t('settings.maxFileSize')}</Label>
                  <Input
                    id="maxFileSize"
                    type="number"
                    value="10"
                    className="w-full dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1.5 rounded-xl"
                  />
                </div>

                <div>
                  <Label htmlFor="sessionTimeout" className="dark:text-gray-300">{t('settings.sessionTimeout')}</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value="30"
                    className="w-full dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1.5 rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
          <IntegrationsList />
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="rounded-2xl border border-purple-200/80 dark:border-purple-700/60 bg-gradient-to-br from-white to-purple-50 dark:from-slate-800 dark:to-slate-900 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 transition-all">
            <div className="p-6 border-b border-purple-200/60 dark:border-purple-700/40 bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-slate-800/50 dark:to-slate-900/50 rounded-t-2xl">
              <h3 className="flex items-center gap-3 dark:text-white text-lg font-semibold">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/25">
                  <Palette className="h-5 w-5 text-white" />
                </div>
                {t('settings.platformAppearance')}
              </h3>
              <p className="dark:text-gray-400 text-sm mt-1 ml-12">{t('settings.platformAppearanceDesc')}</p>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <Label className="dark:text-gray-300 mb-3 block font-medium">{t('settings.theme')}</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div
                    onClick={() => handleSettingChange("darkMode", false)}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all hover:scale-[1.02] ${
                      !settings.darkMode
                        ? 'bg-gradient-to-br from-slate-50 to-slate-100 border-purple-500 dark:border-purple-400 shadow-lg shadow-purple-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="text-center">
                      <div className="w-full h-16 rounded-xl mb-3 bg-white border-2 border-slate-200 shadow-sm"></div>
                      <span className={`text-sm font-medium ${!settings.darkMode ? 'text-purple-600' : 'dark:text-white'}`}>{t('settings.lightMode')}</span>
                    </div>
                  </div>
                  <div
                    onClick={() => handleSettingChange("darkMode", true)}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all hover:scale-[1.02] ${
                      settings.darkMode
                        ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-purple-500 dark:border-purple-400 shadow-lg shadow-purple-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="text-center">
                      <div className="w-full h-16 rounded-xl mb-3 bg-slate-900 border-2 border-slate-700 shadow-sm"></div>
                      <span className={`text-sm font-medium ${settings.darkMode ? 'text-purple-400' : 'dark:text-white'}`}>{t('settings.darkMode')}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="logoUrl" className="dark:text-gray-300 font-medium">{t('settings.logoUrl')}</Label>
                <div className="flex items-center gap-4 mt-1.5">
                  <Input
                    id="logoUrl"
                    value={settings.logoUrl}
                    onChange={(e) => handleSettingChange("logoUrl", e.target.value)}
                    className="dark:bg-slate-900 dark:border-slate-600 dark:text-white flex-1 rounded-xl"
                    placeholder={t('settings.logoUrlPlaceholder')}
                  />
                  {settings.logoUrl && (
                    <div className="flex-shrink-0 h-12 w-12 border-2 rounded-xl overflow-hidden bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                      <img
                        src={settings.logoUrl}
                        alt="Logo preview"
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primaryColor" className="dark:text-gray-300 font-medium">{t('settings.primaryColor')}</Label>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) => handleSettingChange("primaryColor", e.target.value)}
                      className="w-16 h-10 cursor-pointer rounded-xl border-2"
                    />
                    <Input
                      value={settings.primaryColor}
                      onChange={(e) => handleSettingChange("primaryColor", e.target.value)}
                      className="flex-1 dark:bg-slate-900 dark:border-slate-600 dark:text-white font-mono text-sm rounded-xl"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="secondaryColor" className="dark:text-gray-300 font-medium">{t('settings.secondaryColor')}</Label>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={settings.secondaryColor}
                      onChange={(e) => handleSettingChange("secondaryColor", e.target.value)}
                      className="w-16 h-10 cursor-pointer rounded-xl border-2"
                    />
                    <Input
                      value={settings.secondaryColor}
                      onChange={(e) => handleSettingChange("secondaryColor", e.target.value)}
                      className="flex-1 dark:bg-slate-900 dark:border-slate-600 dark:text-white font-mono text-sm rounded-xl"
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="customDomain" className="dark:text-gray-300 font-medium">{t('settings.customDomain')}</Label>
                <Input
                  id="customDomain"
                  value={settings.customDomain}
                  onChange={(e) => handleSettingChange("customDomain", e.target.value)}
                  className="dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1.5 rounded-xl"
                  placeholder={t('settings.customDomainPlaceholder')}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="developer" className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 shadow-lg shadow-slate-500/10 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 shadow-lg shadow-slate-500/25">
                <Database className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="dark:text-white text-lg font-semibold">{t('settings.developer')}</h3>
                <p className="dark:text-gray-400 text-sm">API keys, integrations, and documentation</p>
              </div>
            </div>
            <Tabs defaultValue="api-keys" className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
              <TabsList className="bg-slate-100/80 dark:bg-slate-900/80 p-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <TabsTrigger value="api-keys" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">{t('settings.apiKeys')}</TabsTrigger>
                <TabsTrigger value="api-integrations" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">{t('settings.apiIntegrations', 'API Channel')}</TabsTrigger>
                <TabsTrigger value="tester" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">{t('settings.tester')}</TabsTrigger>
                <TabsTrigger value="documentation" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">{t('settings.documentation')}</TabsTrigger>
              </TabsList>
              <TabsContent value="api-keys">
                <ApiKeys />
              </TabsContent>
              <TabsContent value="api-integrations">
                <ApiIntegrationsList />
              </TabsContent>
              <TabsContent value="tester">
                <ProactiveMessageTester />
              </TabsContent>
              <TabsContent value="documentation">
                <ApiDocs />
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>
      </Tabs>

      <div className={`flex ${isRTL ? 'justify-start' : 'justify-end'}`}>
        <Button onClick={handleSaveChanges} className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl px-8 py-2.5 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] transition-all">
          {t('settings.saveChanges')}
        </Button>
      </div>
    </div>
  );
};
