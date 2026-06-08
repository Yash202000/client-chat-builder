
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  PhoneCall,
  ShieldCheck,
  UserPlus,
  Archive,
  Copy,
  RefreshCw,
  Download,
  AlertTriangle,
  Loader2,
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
import { useNavigate } from 'react-router-dom';


export const Settings = () => {
  const { t } = useTranslation();
  const { isRTL } = useI18n();
  const { toast } = useToast();
  const { playSuccessSound } = useNotifications();
  const { user, companyId, setCompanyIdGlobaly, authFetch, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
    emailSignature: "",
  });

  const [testingSmtp, setTestingSmtp] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  // Danger Zone state
  const [dangerDialogType, setDangerDialogType] = useState<'account' | 'workspace' | null>(null);
  const [dangerPassword, setDangerPassword] = useState("");
  const [dangerLoading, setDangerLoading] = useState(false);

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
            emailSignature: companyData.email_signature || "",
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
            email_signature: settings.emailSignature || null,
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

  const handleDangerDelete = async () => {
    if (!dangerPassword) return;
    const endpoint = dangerDialogType === 'workspace'
      ? '/api/v1/gdpr/erase-company-data'
      : '/api/v1/gdpr/erase-my-data';
    try {
      setDangerLoading(true);
      const res = await authFetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: dangerPassword }),
      });
      if (res.ok) {
        toast({
          title: dangerDialogType === 'workspace' ? 'Workspace deleted' : 'Account deleted',
          description: dangerDialogType === 'workspace'
            ? 'The workspace and all its data have been permanently deleted.'
            : 'Your account and personal data have been permanently deleted.',
        });
        setDangerDialogType(null);
        setDangerPassword('');
        logout();
        navigate('/login');
      } else {
        const err = await res.json();
        toast({ title: 'Error', description: err.detail || 'Could not delete. Please check your password.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Unexpected error. Please try again.', variant: 'destructive' });
    } finally {
      setDangerLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-4 sm:py-6">
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
            <SettingsIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight">{t('settings.title')}</h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t('settings.subtitle')}</p>
          </div>
        </div>
      </div>
      <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-6">

      <Tabs defaultValue="general" className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Scrollable tab bar — single row with horizontal scroll on mobile */}
        <div className="overflow-x-auto -mx-1 px-1 pb-px">
          <TabsList className="flex w-max min-w-full bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 gap-0.5">
            <TabsTrigger value="general" className="flex-shrink-0 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400 data-[state=active]:shadow-sm transition-all flex items-center gap-1.5 text-xs lg:text-sm px-2.5 sm:px-3">
              <Globe className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">{t('settings.general')}</span>
            </TabsTrigger>
            <TabsTrigger value="email" className="flex-shrink-0 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm transition-all flex items-center gap-1.5 text-xs lg:text-sm px-2.5 sm:px-3">
              <Mail className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">{t('settings.email', 'Email')}</span>
            </TabsTrigger>
            <TabsTrigger value="voice" className="flex-shrink-0 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400 data-[state=active]:shadow-sm transition-all flex items-center gap-1.5 text-xs lg:text-sm px-2.5 sm:px-3">
              <PhoneCall className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">{t('settings.voice', 'Voice')}</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex-shrink-0 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-violet-600 dark:data-[state=active]:text-violet-400 data-[state=active]:shadow-sm transition-all flex items-center gap-1.5 text-xs lg:text-sm px-2.5 sm:px-3">
              <Bell className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">{t('settings.notifications')}</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex-shrink-0 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm transition-all flex items-center gap-1.5 text-xs lg:text-sm px-2.5 sm:px-3">
              <Shield className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">{t('settings.security')}</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex-shrink-0 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-violet-600 dark:data-[state=active]:text-violet-400 data-[state=active]:shadow-sm transition-all flex items-center gap-1.5 text-xs lg:text-sm px-2.5 sm:px-3">
              <Zap className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">{t('settings.integrations')}</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex-shrink-0 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400 data-[state=active]:shadow-sm transition-all flex items-center gap-1.5 text-xs lg:text-sm px-2.5 sm:px-3">
              <Palette className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">{t('settings.appearance')}</span>
            </TabsTrigger>
            <TabsTrigger value="developer" className="flex-shrink-0 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-slate-700 dark:data-[state=active]:text-slate-300 data-[state=active]:shadow-sm transition-all flex items-center gap-1.5 text-xs lg:text-sm px-2.5 sm:px-3">
              <Database className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">{t('settings.developer')}</span>
            </TabsTrigger>
            <TabsTrigger value="identity" className="flex-shrink-0 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-sm transition-all flex items-center gap-1.5 text-xs lg:text-sm px-2.5 sm:px-3">
              <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">Identity</span>
            </TabsTrigger>
            <TabsTrigger value="guests" className="flex-shrink-0 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm transition-all flex items-center gap-1.5 text-xs lg:text-sm px-2.5 sm:px-3">
              <UserPlus className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">Guests</span>
            </TabsTrigger>
            <TabsTrigger value="retention" className="flex-shrink-0 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-400 data-[state=active]:shadow-sm transition-all flex items-center gap-1.5 text-xs lg:text-sm px-2.5 sm:px-3">
              <Archive className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">Retention</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="general" className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {user?.is_super_admin && companies && (
              <div className="rounded-xl border border-cyan-200 dark:border-cyan-800/50 bg-white dark:bg-slate-900 shadow-sm">
                <div className="p-5 pb-3 border-b border-cyan-100 dark:border-cyan-800/30">
                  <h3 className={`dark:text-white flex items-center gap-2 text-base font-semibold`}>
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
                      <Building className="h-3.5 w-3.5 text-white" />
                    </div>
                    {t('settings.companyContext')}
                  </h3>
                </div>
                <div className="px-5 pb-5 pt-4">
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
                        <DropdownMenuItem key={c.id} onSelect={() => { setCompanyIdGlobaly(c.id); queryClient.invalidateQueries(); }} className="dark:text-white dark:focus:bg-slate-700 rounded-lg">
                          {c.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-cyan-200 dark:border-cyan-800/50 bg-white dark:bg-slate-900 shadow-sm lg:col-span-2">
              <div className="p-5 pb-3 border-b border-cyan-100 dark:border-cyan-800/30">
                <h3 className={`flex items-center gap-2 dark:text-white text-base font-semibold`}>
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
                    <Globe className="h-3.5 w-3.5 text-white" />
                  </div>
                  {t('settings.companyInfo')}
                </h3>
              </div>
              <div className="px-5 pb-5 pt-4">
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

                  <div className="lg:col-span-4 pt-3 border-t border-slate-200 dark:border-slate-800 mt-3">
                    <div className={`flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700`}>
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
          <div className="rounded-xl border border-blue-200 dark:border-blue-800/50 bg-white dark:bg-slate-900 shadow-sm">
            <div className="p-6 border-b border-blue-100 dark:border-blue-800/30">
              <h3 className="flex items-center gap-3 dark:text-white text-base font-semibold">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600">
                  <Mail className="h-4 w-4 text-white" />
                </div>
                {t('settings.smtpConfiguration', 'SMTP Configuration')}
              </h3>
              <p className="dark:text-gray-400 text-sm mt-1 text-slate-500">
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

              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <div>
                  <Label className="dark:text-white font-medium">{t('settings.smtpUseTls', 'Use TLS')}</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('settings.smtpUseTlsDesc', 'Enable TLS encryption for secure email transmission')}</p>
                </div>
                <Switch
                  checked={settings.smtpUseTls}
                  onCheckedChange={(checked) => handleSettingChange("smtpUseTls", checked)}
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <h4 className="font-medium dark:text-white mb-1">{t('settings.emailSignature', 'Email Signature')}</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{t('settings.emailSignatureDesc', 'This signature will be automatically appended to outbound emails')}</p>
                <textarea
                  value={settings.emailSignature}
                  onChange={(e) => handleSettingChange("emailSignature", e.target.value)}
                  rows={5}
                  placeholder={"Best regards,\nYour Name\nYour Company\nphone@email.com"}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-white px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <h4 className="font-medium dark:text-white mb-3">{t('settings.testSmtp', 'Test Configuration')}</h4>
                <div className="flex flex-col sm:flex-row gap-3">
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
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl flex-shrink-0"
                  >
                    {testingSmtp ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                        <span className="hidden sm:inline">{t('settings.sending', 'Sending...')}</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span className="hidden sm:inline">{t('settings.sendTestEmail', 'Send Test Email')}</span>
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
          <div className="rounded-xl border border-violet-200 dark:border-violet-800/50 bg-white dark:bg-slate-900 shadow-sm">
            <div className="p-6 border-b border-violet-100 dark:border-violet-800/30">
              <h3 className="flex items-center gap-3 dark:text-white text-base font-semibold">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-orange-600">
                  <Bell className="h-4 w-4 text-white" />
                </div>
                {t('settings.notificationPreferences')}
              </h3>
              <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">{t('settings.configureNotifications')}</p>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <div>
                  <Label className="dark:text-white font-medium">{t('settings.emailNotifications')}</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('settings.emailNotificationsDesc')}</p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => handleSettingChange("emailNotifications", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <div>
                  <Label className="dark:text-white font-medium">{t('settings.slackNotifications')}</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('settings.slackNotificationsDesc')}</p>
                </div>
                <Switch
                  checked={settings.slackNotifications}
                  onCheckedChange={(checked) => handleSettingChange("slackNotifications", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
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
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-white dark:bg-slate-900 shadow-sm">
            <div className="p-6 border-b border-emerald-100 dark:border-emerald-800/30">
              <h3 className="flex items-center gap-3 dark:text-white text-base font-semibold">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                  <Shield className="h-4 w-4 text-white" />
                </div>
                {t('settings.securitySettings')}
              </h3>
              <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">{t('settings.securitySettingsDesc')}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <div>
                  <Label className="dark:text-white font-medium">{t('settings.requireAuth')}</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('settings.requireAuthDesc')}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">System-enforced — always enabled</p>
                </div>
                <Switch checked={true} disabled />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <div>
                  <Label className="dark:text-white font-medium">{t('settings.allowFileUploads')}</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('settings.allowFileUploadsDesc')}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">System-enforced — always enabled</p>
                </div>
                <Switch checked={true} disabled />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-200 dark:border-slate-700">
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

          {/* GDPR / Data Rights */}
          {(() => {
            const [gdprOpen, setGdprOpen] = useState(false);
            const [gdprPassword, setGdprPassword] = useState("");
            const [gdprConfirm, setGdprConfirm] = useState("");
            const [gdprLoading, setGdprLoading] = useState(false);

            const handleErase = async () => {
              if (gdprConfirm !== "DELETE MY ACCOUNT") {
                toast({ title: "Confirmation required", description: 'Type "DELETE MY ACCOUNT" exactly to confirm.', variant: "destructive" });
                return;
              }
              try {
                setGdprLoading(true);
                const res = await authFetch("/api/v1/gdpr/erase-my-data", {
                  method: "DELETE",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ password: gdprPassword, confirmation: gdprConfirm }),
                });
                if (res.ok) {
                  toast({ title: "Account erased", description: "Your data has been permanently deleted. You will now be signed out." });
                  setTimeout(() => { localStorage.clear(); window.location.href = "/login"; }, 2000);
                } else {
                  const err = await res.json();
                  toast({ title: "Error", description: err.detail || "Could not erase account.", variant: "destructive" });
                }
              } catch {
                toast({ title: "Error", description: "Unexpected error. Please try again.", variant: "destructive" });
              } finally {
                setGdprLoading(false);
              }
            };

            return (
              <>
                <div className="rounded-xl border border-red-200 dark:border-red-800/50 bg-white dark:bg-slate-900 shadow-sm">
                  <div className="p-6 border-b border-red-100 dark:border-red-800/30">
                    <h3 className="flex items-center gap-3 dark:text-white text-base font-semibold">
                      <div className="p-1.5 rounded-lg bg-gradient-to-br from-red-500 to-rose-600">
                        <Lock className="h-4 w-4 text-white" />
                      </div>
                      Data Rights &amp; GDPR
                    </h3>
                    <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">
                      Download your data or permanently erase your account in accordance with GDPR Art. 17 &amp; 20.
                    </p>
                  </div>
                  <div className="p-6 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex-1">
                        <p className="font-medium dark:text-white text-sm">Download my data</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Export all your data as a ZIP of CSV files (contacts, leads, deals, campaigns, etc.)</p>
                      </div>
                      <Button
                        variant="outline"
                        className="rounded-xl dark:border-slate-600 dark:text-slate-300 self-start sm:self-auto flex-shrink-0"
                        onClick={async () => {
                          const res = await authFetch("/api/v1/export/data", { method: "POST" });
                          if (res.ok) {
                            const blob = await res.blob();
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url; a.download = `my_data_${new Date().toISOString().slice(0,10)}.zip`;
                            document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
                          } else {
                            toast({ title: "Export failed", variant: "destructive" });
                          }
                        }}
                      >
                        <Download className="h-4 w-4 mr-1.5" /> Download
                      </Button>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50/50 dark:bg-red-900/10">
                      <div className="flex-1">
                        <p className="font-medium text-red-700 dark:text-red-400 text-sm">Delete my account</p>
                        <p className="text-sm text-red-500/80 dark:text-red-400/70">Permanently erases your account and personal data. This cannot be undone.</p>
                      </div>
                      <Button
                        variant="outline"
                        className="rounded-xl border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20 self-start sm:self-auto flex-shrink-0"
                        onClick={() => setGdprOpen(true)}
                      >
                        <Lock className="h-4 w-4 mr-1.5" /> Delete account
                      </Button>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex-1">
                        <p className="font-medium dark:text-white text-sm">Sub-processors &amp; security information</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">View the third-party processors that handle your data and our security controls.</p>
                      </div>
                      <Button
                        variant="outline"
                        className="rounded-xl dark:border-slate-600 dark:text-slate-300 self-start sm:self-auto flex-shrink-0"
                        onClick={() => window.open("/security", "_blank")}
                      >
                        View security page
                      </Button>
                    </div>
                  </div>
                </div>

                <Dialog open={gdprOpen} onOpenChange={setGdprOpen}>
                  <DialogContent className="dark:bg-slate-900 dark:border-slate-700 rounded-2xl sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="dark:text-white flex items-center gap-2 text-red-600 dark:text-red-400">
                        <Lock className="h-4 w-4" /> Delete My Account
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-sm text-red-700 dark:text-red-400">
                        This will <strong>permanently delete</strong> your account and all personal data. Your messages will be anonymised. This action cannot be undone.
                      </div>
                      <div>
                        <Label htmlFor="gdpr-password" className="dark:text-gray-300">Current password</Label>
                        <Input id="gdpr-password" type="password" value={gdprPassword} onChange={(e) => setGdprPassword(e.target.value)} className="dark:bg-slate-800 dark:border-slate-600 dark:text-white mt-1.5 rounded-xl" />
                      </div>
                      <div>
                        <Label htmlFor="gdpr-confirm" className="dark:text-gray-300">
                          Type <span className="font-mono font-bold">DELETE MY ACCOUNT</span> to confirm
                        </Label>
                        <Input id="gdpr-confirm" value={gdprConfirm} onChange={(e) => setGdprConfirm(e.target.value)} className="dark:bg-slate-800 dark:border-slate-600 dark:text-white mt-1.5 rounded-xl" placeholder="DELETE MY ACCOUNT" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="ghost" className="rounded-xl dark:text-slate-300" onClick={() => setGdprOpen(false)}>Cancel</Button>
                      <Button
                        disabled={gdprLoading || gdprConfirm !== "DELETE MY ACCOUNT" || !gdprPassword}
                        className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
                        onClick={handleErase}
                      >
                        {gdprLoading ? "Deleting…" : "Permanently delete"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            );
          })()}
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
          <IntegrationsList />
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="rounded-xl border border-purple-200 dark:border-purple-800/50 bg-white dark:bg-slate-900 shadow-sm">
            <div className="p-6 border-b border-purple-100 dark:border-purple-800/30">
              <h3 className="flex items-center gap-3 dark:text-white text-base font-semibold">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600">
                  <Palette className="h-4 w-4 text-white" />
                </div>
                {t('settings.platformAppearance')}
              </h3>
              <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">{t('settings.platformAppearanceDesc')}</p>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <Label className="dark:text-gray-300 mb-3 block font-medium">{t('settings.theme')}</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div
                    onClick={() => handleSettingChange("darkMode", false)}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      !settings.darkMode
                        ? 'border-purple-500 dark:border-purple-400 bg-slate-50'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="text-center">
                      <div className="w-full h-16 rounded-xl mb-3 bg-white border-2 border-slate-200 shadow-sm"></div>
                      <span className={`text-sm font-medium ${!settings.darkMode ? 'text-purple-600' : 'dark:text-white text-slate-600'}`}>{t('settings.lightMode')}</span>
                    </div>
                  </div>
                  <div
                    onClick={() => handleSettingChange("darkMode", true)}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      settings.darkMode
                        ? 'border-purple-500 dark:border-purple-400 bg-slate-800'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="text-center">
                      <div className="w-full h-16 rounded-xl mb-3 bg-slate-900 border-2 border-slate-700 shadow-sm"></div>
                      <span className={`text-sm font-medium ${settings.darkMode ? 'text-purple-400' : 'dark:text-white text-slate-600'}`}>{t('settings.darkMode')}</span>
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
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-200 dark:border-slate-700">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-slate-600 to-slate-800">
                <Database className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="dark:text-white text-lg font-semibold">{t('settings.developer')}</h3>
                <p className="dark:text-gray-400 text-sm">API keys, integrations, and documentation</p>
              </div>
            </div>
            <Tabs defaultValue="api-keys" className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
              <div className="overflow-x-auto -mx-1 px-1 pb-px">
                <TabsList className="flex w-max min-w-full bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 gap-0.5">
                  <TabsTrigger value="api-keys" className="flex-shrink-0 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm text-xs sm:text-sm px-2.5 sm:px-3">{t('settings.apiKeys')}</TabsTrigger>
                  <TabsTrigger value="api-integrations" className="flex-shrink-0 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm text-xs sm:text-sm px-2.5 sm:px-3">{t('settings.apiIntegrations', 'API Channel')}</TabsTrigger>
                  <TabsTrigger value="tester" className="flex-shrink-0 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm text-xs sm:text-sm px-2.5 sm:px-3">{t('settings.tester')}</TabsTrigger>
                  <TabsTrigger value="documentation" className="flex-shrink-0 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm text-xs sm:text-sm px-2.5 sm:px-3">{t('settings.documentation')}</TabsTrigger>
                </TabsList>
              </div>
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

        {/* ── Identity / SAML Tab ─────────────────────────────────────── */}
        <TabsContent value="identity" className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
          {(() => {
            const [ssoEnabled, setSsoEnabled] = useState(false);
            const [scimEnabled, setScimEnabled] = useState(false);
            const [entityId, setEntityId] = useState("");
            const [ssoUrl, setSsoUrl] = useState("");
            const [sloUrl, setSloUrl] = useState("");
            const [certificate, setCertificate] = useState("");
            const [bearerToken, setBearerToken] = useState("scim_tok_xxxxxxxxxxxxxxxxxxxxxxxx");

            const copyToClipboard = (text: string, label: string) => {
              navigator.clipboard.writeText(text);
              toast({ title: "Copied", description: `${label} copied to clipboard.` });
            };

            const spInfo = [
              { label: "ACS URL", value: "https://app.yourdomain.com/auth/saml/callback" },
              { label: "Entity ID", value: "https://app.yourdomain.com" },
              { label: "Metadata URL", value: "https://app.yourdomain.com/auth/saml/metadata" },
            ];

            return (
              <>
                {/* Enable SSO */}
                <div className="rounded-xl border border-indigo-200 dark:border-indigo-800/50 bg-white dark:bg-slate-900 shadow-sm">
                  <div className="p-6 border-b border-indigo-100 dark:border-indigo-800/30">
                    <h3 className="flex items-center gap-3 dark:text-white text-base font-semibold">
                      <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                        <ShieldCheck className="h-4 w-4 text-white" />
                      </div>
                      SAML 2.0 / Single Sign-On
                    </h3>
                    <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">Configure SAML 2.0 SSO so your team can log in via your identity provider.</p>
                  </div>
                  <div className="p-6 space-y-6">
                    {/* SSO Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                      <div>
                        <Label className="dark:text-white font-medium">Enable Single Sign-On (SAML 2.0)</Label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Allow users to authenticate via your IdP instead of username/password.</p>
                      </div>
                      <Switch checked={ssoEnabled} onCheckedChange={setSsoEnabled} />
                    </div>

                    {/* Identity Provider Settings */}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
                        <h4 className="font-semibold dark:text-white text-sm">Identity Provider Settings</h4>
                      </div>
                      <div className="p-5 space-y-4">
                        <div>
                          <Label htmlFor="saml-entity-id" className="dark:text-gray-300">Entity ID / Issuer URL</Label>
                          <Input
                            id="saml-entity-id"
                            value={entityId}
                            onChange={(e) => setEntityId(e.target.value)}
                            placeholder="https://your-idp.com/metadata"
                            className="dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1.5 rounded-xl"
                          />
                        </div>
                        <div>
                          <Label htmlFor="saml-sso-url" className="dark:text-gray-300">SSO URL (Login)</Label>
                          <Input
                            id="saml-sso-url"
                            value={ssoUrl}
                            onChange={(e) => setSsoUrl(e.target.value)}
                            placeholder="https://your-idp.com/sso/saml"
                            className="dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1.5 rounded-xl"
                          />
                        </div>
                        <div>
                          <Label htmlFor="saml-slo-url" className="dark:text-gray-300">SLO URL (Logout) <span className="text-slate-400 font-normal">— optional</span></Label>
                          <Input
                            id="saml-slo-url"
                            value={sloUrl}
                            onChange={(e) => setSloUrl(e.target.value)}
                            placeholder="https://your-idp.com/slo/saml"
                            className="dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1.5 rounded-xl"
                          />
                        </div>
                        <div>
                          <Label htmlFor="saml-cert" className="dark:text-gray-300">X.509 Certificate</Label>
                          <textarea
                            id="saml-cert"
                            value={certificate}
                            onChange={(e) => setCertificate(e.target.value)}
                            rows={6}
                            placeholder="-----BEGIN CERTIFICATE-----&#10;MIICpDCCAYwCCQD...&#10;-----END CERTIFICATE-----"
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-white px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 mt-1.5 font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Service Provider Info */}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
                        <h4 className="font-semibold dark:text-white text-sm">Service Provider Info <span className="text-slate-400 font-normal text-xs ml-1">(provide these to your IdP)</span></h4>
                      </div>
                      <div className="p-5 space-y-3">
                        {spInfo.map(({ label, value }) => (
                          <div key={label} className="flex items-center gap-3">
                            <div className="flex-1">
                              <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">{label}</p>
                              <p className="text-sm font-mono dark:text-white text-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 select-all">{value}</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-xl flex-shrink-0 dark:border-slate-600 dark:text-slate-300"
                              onClick={() => copyToClipboard(value, label)}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SCIM Provisioning */}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
                        <h4 className="font-semibold dark:text-white text-sm">SCIM Provisioning</h4>
                      </div>
                      <div className="p-5 space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                          <div>
                            <Label className="dark:text-white font-medium">Enable SCIM</Label>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Automatically provision and deprovision users from your IdP.</p>
                          </div>
                          <Switch checked={scimEnabled} onCheckedChange={setScimEnabled} />
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <Label className="dark:text-gray-300">SCIM Endpoint URL</Label>
                            <p className="text-sm font-mono dark:text-white text-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 mt-1.5 select-all">https://app.yourdomain.com/scim/v2</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl flex-shrink-0 mt-6 dark:border-slate-600 dark:text-slate-300"
                            onClick={() => copyToClipboard("https://app.yourdomain.com/scim/v2", "SCIM Endpoint URL")}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div>
                          <Label className="dark:text-gray-300">Bearer Token</Label>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Input
                              type="password"
                              value={bearerToken}
                              readOnly
                              className="flex-1 dark:bg-slate-900 dark:border-slate-600 dark:text-white rounded-xl font-mono"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-xl flex-shrink-0 dark:border-slate-600 dark:text-slate-300"
                              onClick={() => {
                                const newToken = "scim_tok_" + Math.random().toString(36).substring(2, 26);
                                setBearerToken(newToken);
                                toast({ title: "Token regenerated", description: "Copy the new bearer token now — it won't be shown again." });
                              }}
                            >
                              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Regenerate
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl px-8"
                        onClick={() => {
                          toast({ title: "Identity settings saved", description: "Your SAML / SSO configuration has been updated." });
                          playSuccessSound();
                        }}
                      >
                        Save Identity Settings
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </TabsContent>

        {/* ── Guest Access Tab ────────────────────────────────────────── */}
        <TabsContent value="guests" className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
          {(() => {
            const sampleGuests = [
              { email: "alice@partnerco.com", permission: "Collaborate", invitedBy: "admin@yourco.com", expires: "2026-05-27", status: "active" as const },
              { email: "bob@agency.io", permission: "View Only", invitedBy: "sarah@yourco.com", expires: "2026-04-15", status: "expired" as const },
              { email: "carol@client.com", permission: "Comment", invitedBy: "admin@yourco.com", expires: "2026-07-27", status: "pending" as const },
            ];

            const [inviteEmail, setInviteEmail] = useState("");
            const [invitePermission, setInvitePermission] = useState("View Only");
            const [inviteExpiry, setInviteExpiry] = useState("30 days");
            const [allowGuestInvite, setAllowGuestInvite] = useState(false);
            const [requireApproval, setRequireApproval] = useState(true);
            const [notifyAdmins, setNotifyAdmins] = useState(true);

            const statusColor: Record<string, string> = {
              active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
              expired: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
              pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
            };

            return (
              <>
                {/* Invite form */}
                <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-white dark:bg-slate-900 shadow-sm">
                  <div className="p-6 border-b border-emerald-100 dark:border-emerald-800/30">
                    <h3 className="flex items-center gap-3 dark:text-white text-base font-semibold">
                      <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                        <UserPlus className="h-4 w-4 text-white" />
                      </div>
                      Invite Guest
                    </h3>
                    <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">Send a time-limited access invite to an external collaborator.</p>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex flex-col md:flex-row gap-3">
                      <Input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="guest@example.com"
                        className="flex-1 dark:bg-slate-900 dark:border-slate-600 dark:text-white rounded-xl"
                      />
                      <Select value={invitePermission} onValueChange={setInvitePermission}>
                        <SelectTrigger className="w-full md:w-40 dark:bg-slate-900 dark:border-slate-600 dark:text-white rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                          <SelectItem value="View Only">View Only</SelectItem>
                          <SelectItem value="Comment">Comment</SelectItem>
                          <SelectItem value="Collaborate">Collaborate</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={inviteExpiry} onValueChange={setInviteExpiry}>
                        <SelectTrigger className="w-full md:w-36 dark:bg-slate-900 dark:border-slate-600 dark:text-white rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                          <SelectItem value="7 days">7 days</SelectItem>
                          <SelectItem value="30 days">30 days</SelectItem>
                          <SelectItem value="90 days">90 days</SelectItem>
                          <SelectItem value="Never">Never</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl"
                        onClick={() => {
                          if (!inviteEmail) {
                            toast({ title: "Email required", description: "Please enter the guest's email address.", variant: "destructive" });
                            return;
                          }
                          toast({ title: "Invite sent", description: `Invite sent to ${inviteEmail}.` });
                          playSuccessSound();
                          setInviteEmail("");
                        }}
                      >
                        <UserPlus className="h-4 w-4 mr-1.5" /> Send Invite
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Active Guests table */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                    <h4 className="font-semibold dark:text-white">Active Guests</h4>
                  </div>
                  {sampleGuests.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 dark:text-slate-500">
                      <UserPlus className="h-10 w-10 mx-auto mb-3 opacity-40" />
                      <p className="text-sm">No guests invited yet.</p>
                    </div>
                  ) : (
                    <>
                      {/* Mobile cards */}
                      <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
                        {sampleGuests.map((g, i) => (
                          <div key={i} className="px-5 py-4 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-sm font-medium dark:text-white break-all">{g.email}</span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize flex-shrink-0 ${statusColor[g.status]}`}>
                                {g.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                              <span>{g.permission}</span>
                              <span>·</span>
                              <span>Expires {g.expires}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-400 dark:text-slate-500">by {g.invitedBy}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-xs h-7"
                                onClick={() => toast({ title: "Access revoked", description: `Guest access for ${g.email} has been revoked.` })}
                              >
                                Revoke
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Desktop table */}
                      <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                              <th className="text-left px-5 py-3 font-medium text-slate-600 dark:text-slate-400">Email</th>
                              <th className="text-left px-5 py-3 font-medium text-slate-600 dark:text-slate-400">Permission</th>
                              <th className="text-left px-5 py-3 font-medium text-slate-600 dark:text-slate-400">Invited By</th>
                              <th className="text-left px-5 py-3 font-medium text-slate-600 dark:text-slate-400">Expires</th>
                              <th className="text-left px-5 py-3 font-medium text-slate-600 dark:text-slate-400">Status</th>
                              <th className="text-left px-5 py-3 font-medium text-slate-600 dark:text-slate-400">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sampleGuests.map((g, i) => (
                              <tr key={i} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="px-5 py-3 dark:text-white font-medium">{g.email}</td>
                                <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{g.permission}</td>
                                <td className="px-5 py-3 text-slate-500 dark:text-slate-400 text-xs">{g.invitedBy}</td>
                                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{g.expires}</td>
                                <td className="px-5 py-3">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor[g.status]}`}>
                                    {g.status}
                                  </span>
                                </td>
                                <td className="px-5 py-3">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-xs h-7"
                                    onClick={() => toast({ title: "Access revoked", description: `Guest access for ${g.email} has been revoked.` })}
                                  >
                                    Revoke
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>

                {/* Guest Access Settings */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
                  <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                    <h4 className="font-semibold dark:text-white">Guest Access Settings</h4>
                  </div>
                  <div className="p-6 space-y-3">
                    {[
                      { label: "Allow guests to invite others", desc: "Guests can share their access link with additional people.", value: allowGuestInvite, setter: setAllowGuestInvite },
                      { label: "Require approval for guest invites", desc: "An admin must approve before a guest invite is activated.", value: requireApproval, setter: setRequireApproval },
                      { label: "Notify admins on guest login", desc: "Send an email alert whenever a guest signs in.", value: notifyAdmins, setter: setNotifyAdmins },
                    ].map(({ label, desc, value, setter }) => (
                      <div key={label} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <div>
                          <Label className="dark:text-white font-medium">{label}</Label>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{desc}</p>
                        </div>
                        <Switch checked={value} onCheckedChange={setter} />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            );
          })()}
        </TabsContent>

        {/* ── Retention Policy Tab ────────────────────────────────────── */}
        <TabsContent value="retention" className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
          {(() => {
            const initialPolicies = [
              { category: "Conversations", period: "1 year", action: "Archive", status: "Active" as const },
              { category: "Messages", period: "1 year", action: "Archive", status: "Active" as const },
              { category: "Leads", period: "2 years", action: "Archive", status: "Active" as const },
              { category: "Contacts", period: "5 years", action: "Archive", status: "Active" as const },
              { category: "Call Recordings", period: "90 days", action: "Delete", status: "Active" as const },
              { category: "Audit Logs", period: "5 years", action: "Archive", status: "Draft" as const },
            ];

            const [policies, setPolicies] = useState(initialPolicies);
            const [editIdx, setEditIdx] = useState<number | null>(null);
            const [editPeriod, setEditPeriod] = useState("");
            const [editAction, setEditAction] = useState("");
            const [auditFrom, setAuditFrom] = useState("");
            const [auditTo, setAuditTo] = useState("");
            const [exportFormat, setExportFormat] = useState("JSON");
            const [legalHoldOpen, setLegalHoldOpen] = useState(false);
            const [holdCase, setHoldCase] = useState("");
            const [holdPatterns, setHoldPatterns] = useState("");
            const [holdFrom, setHoldFrom] = useState("");
            const [holdTo, setHoldTo] = useState("");
            const [holdNotes, setHoldNotes] = useState("");

            const periodOptions = ["30 days", "90 days", "1 year", "2 years", "5 years", "Forever"];

            const statusColor: Record<string, string> = {
              Active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
              Draft: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
            };

            return (
              <>
                {/* Data Retention Rules */}
                <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-amber-100 dark:border-amber-800/30">
                    <h3 className="flex items-center gap-3 dark:text-white text-base font-semibold">
                      <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                        <Archive className="h-4 w-4 text-white" />
                      </div>
                      Data Retention Rules
                    </h3>
                    <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">Define how long each data category is retained before archiving or deletion.</p>
                  </div>
                  {/* Mobile cards */}
                  <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
                    {policies.map((p, i) => (
                      <div key={p.category} className="px-5 py-4 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium dark:text-white">{p.category}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[p.status]}`}>
                            {p.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <span>{p.period}</span>
                          <span>·</span>
                          <span>{p.action}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400 dark:text-slate-500">Last run: 2026-04-01</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg text-xs h-7"
                            onClick={() => { setEditIdx(i); setEditPeriod(p.period); setEditAction(p.action); }}
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Desktop table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left px-5 py-3 font-medium text-slate-600 dark:text-slate-400">Category</th>
                          <th className="text-left px-5 py-3 font-medium text-slate-600 dark:text-slate-400">Retention Period</th>
                          <th className="text-left px-5 py-3 font-medium text-slate-600 dark:text-slate-400">Action</th>
                          <th className="text-left px-5 py-3 font-medium text-slate-600 dark:text-slate-400">Status</th>
                          <th className="text-left px-5 py-3 font-medium text-slate-600 dark:text-slate-400">Last Run</th>
                          <th className="text-left px-5 py-3 font-medium text-slate-600 dark:text-slate-400"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {policies.map((p, i) => (
                          <tr key={p.category} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-5 py-3 dark:text-white font-medium">{p.category}</td>
                            <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{p.period}</td>
                            <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{p.action}</td>
                            <td className="px-5 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[p.status]}`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-slate-400 dark:text-slate-500 text-xs">2026-04-01 02:00</td>
                            <td className="px-5 py-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg text-xs h-7"
                                onClick={() => { setEditIdx(i); setEditPeriod(p.period); setEditAction(p.action); }}
                              >
                                Edit
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Inline edit row (appears when editing) */}
                {editIdx !== null && (
                  <div className="rounded-xl border border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 p-5 space-y-3">
                    <p className="text-sm font-semibold dark:text-white">Editing: {policies[editIdx].category}</p>
                    <div className="flex flex-wrap gap-3 items-end">
                      <div>
                        <Label className="dark:text-gray-300 text-xs">Retention Period</Label>
                        <Select value={editPeriod} onValueChange={setEditPeriod}>
                          <SelectTrigger className="w-36 dark:bg-slate-900 dark:border-slate-600 dark:text-white rounded-xl mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                            {periodOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="dark:text-gray-300 text-xs">Action</Label>
                        <Select value={editAction} onValueChange={setEditAction}>
                          <SelectTrigger className="w-32 dark:bg-slate-900 dark:border-slate-600 dark:text-white rounded-xl mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                            <SelectItem value="Archive">Archive</SelectItem>
                            <SelectItem value="Delete">Delete</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                        onClick={() => {
                          setPolicies(prev => prev.map((p, i) => i === editIdx ? { ...p, period: editPeriod, action: editAction, status: "Active" as const } : p));
                          setEditIdx(null);
                          toast({ title: "Policy updated", description: `${policies[editIdx].category} retention policy saved.` });
                          playSuccessSound();
                        }}
                      >
                        Save
                      </Button>
                      <Button variant="ghost" size="sm" className="rounded-xl dark:text-slate-300" onClick={() => setEditIdx(null)}>Cancel</Button>
                    </div>
                  </div>
                )}

                {/* Audit Log Export */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
                  <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                    <h4 className="font-semibold dark:text-white flex items-center gap-2">
                      <Download className="h-4 w-4 text-amber-500" />
                      Audit Log Export
                    </h4>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="audit-from" className="dark:text-gray-300">From</Label>
                        <Input id="audit-from" type="date" value={auditFrom} onChange={(e) => setAuditFrom(e.target.value)} className="dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1.5 rounded-xl" />
                      </div>
                      <div>
                        <Label htmlFor="audit-to" className="dark:text-gray-300">To</Label>
                        <Input id="audit-to" type="date" value={auditTo} onChange={(e) => setAuditTo(e.target.value)} className="dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-1.5 rounded-xl" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="dark:text-gray-300">Category</Label>
                        <div className="grid grid-cols-2 gap-2 mt-1.5">
                          {["Conversations", "Messages", "Auth Events", "Admin Actions"].map(cat => (
                            <label key={cat} className="flex items-center gap-2 text-sm dark:text-slate-300 cursor-pointer">
                              <input type="checkbox" defaultChecked className="rounded accent-amber-500" />
                              {cat}
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="dark:text-gray-300">Export Format</Label>
                        <Select value={exportFormat} onValueChange={setExportFormat}>
                          <SelectTrigger className="dark:bg-slate-900 dark:border-slate-600 dark:text-white rounded-xl mt-1.5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                            <SelectItem value="JSON">JSON</SelectItem>
                            <SelectItem value="CSV">CSV</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <Button
                        className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl"
                        onClick={() => {
                          toast({ title: "Export started", description: "Export started — you'll receive an email when your download is ready." });
                        }}
                      >
                        <Download className="h-4 w-4 mr-1.5" /> Export Audit Log
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Legal Hold */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
                  <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                    <h4 className="font-semibold dark:text-white flex items-center gap-2">
                      <Lock className="h-4 w-4 text-red-500" />
                      Legal Hold
                    </h4>
                  </div>
                  <div className="p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <p className="dark:text-white font-medium">Active holds: <span className="text-amber-600 dark:text-amber-400">0</span></p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Legal holds prevent data from being deleted or archived during litigation.</p>
                    </div>
                    <Button
                      variant="outline"
                      className="rounded-xl border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 self-start sm:self-auto flex-shrink-0"
                      onClick={() => setLegalHoldOpen(true)}
                    >
                      <Lock className="h-4 w-4 mr-1.5" /> Create Legal Hold
                    </Button>
                  </div>
                </div>

                {/* Legal Hold Dialog */}
                <Dialog open={legalHoldOpen} onOpenChange={setLegalHoldOpen}>
                  <DialogContent className="dark:bg-slate-900 dark:border-slate-700 rounded-2xl sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="dark:text-white flex items-center gap-2">
                        <Lock className="h-4 w-4 text-red-500" /> Create Legal Hold
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div>
                        <Label htmlFor="hold-case" className="dark:text-gray-300">Case Name</Label>
                        <Input id="hold-case" value={holdCase} onChange={(e) => setHoldCase(e.target.value)} placeholder="e.g. Litigation 2026-01" className="dark:bg-slate-800 dark:border-slate-600 dark:text-white mt-1.5 rounded-xl" />
                      </div>
                      <div>
                        <Label htmlFor="hold-patterns" className="dark:text-gray-300">Email Patterns <span className="text-slate-400 font-normal">(comma-separated)</span></Label>
                        <Input id="hold-patterns" value={holdPatterns} onChange={(e) => setHoldPatterns(e.target.value)} placeholder="@example.com, john.doe@client.com" className="dark:bg-slate-800 dark:border-slate-600 dark:text-white mt-1.5 rounded-xl" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="hold-from" className="dark:text-gray-300">From Date</Label>
                          <Input id="hold-from" type="date" value={holdFrom} onChange={(e) => setHoldFrom(e.target.value)} className="dark:bg-slate-800 dark:border-slate-600 dark:text-white mt-1.5 rounded-xl" />
                        </div>
                        <div>
                          <Label htmlFor="hold-to" className="dark:text-gray-300">To Date</Label>
                          <Input id="hold-to" type="date" value={holdTo} onChange={(e) => setHoldTo(e.target.value)} className="dark:bg-slate-800 dark:border-slate-600 dark:text-white mt-1.5 rounded-xl" />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="hold-notes" className="dark:text-gray-300">Notes</Label>
                        <textarea
                          id="hold-notes"
                          value={holdNotes}
                          onChange={(e) => setHoldNotes(e.target.value)}
                          rows={3}
                          placeholder="Optional notes for this legal hold..."
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 mt-1.5"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="ghost" className="rounded-xl dark:text-slate-300" onClick={() => setLegalHoldOpen(false)}>Cancel</Button>
                      <Button
                        className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
                        onClick={() => {
                          if (!holdCase) {
                            toast({ title: "Case name required", variant: "destructive" });
                            return;
                          }
                          toast({ title: "Legal hold created", description: `Hold "${holdCase}" is now active.` });
                          playSuccessSound();
                          setLegalHoldOpen(false);
                          setHoldCase(""); setHoldPatterns(""); setHoldFrom(""); setHoldTo(""); setHoldNotes("");
                        }}
                      >
                        Create Hold
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            );
          })()}
        </TabsContent>
      </Tabs>

      {/* ── Data Export ─────────────────────────────────────────────────── */}
      {(() => {
        const [exporting, setExporting] = useState(false);

        const handleExport = async () => {
          setExporting(true);
          try {
            const res = await authFetch("/api/v1/export/data", { method: "POST" });
            if (!res.ok) throw new Error("Export failed");
            const blob = await res.blob();
            const today = new Date().toISOString().slice(0, 10);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `export_${today}.zip`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            toast({ title: "Export ready", description: "Your data has been downloaded as a ZIP file." });
          } catch {
            toast({ title: "Export failed", description: "Could not generate data export. Please try again.", variant: "destructive" });
          } finally {
            setExporting(false);
          }
        };

        return (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm mt-6">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="flex items-center gap-3 dark:text-white text-base font-semibold">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                  <Download className="h-4 w-4 text-white" />
                </div>
                Data Export
              </h3>
              <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">
                Download a ZIP archive containing all your company data as CSV files — contacts, leads, deals, campaigns, sequences, templates, and more.
              </p>
            </div>
            <div className="p-6 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="text-sm text-slate-500 dark:text-slate-400 flex-1">
                Includes: contacts.csv, leads.csv, deals.csv, campaigns.csv, sequences.csv, templates.csv
              </div>
              <Button
                onClick={handleExport}
                disabled={exporting}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl px-5 flex items-center gap-2 flex-shrink-0 self-start sm:self-auto"
              >
                {exporting ? (
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {exporting ? "Exporting…" : "Export All Data"}
              </Button>
            </div>
          </div>
        );
      })()}

      {/* ── Danger Zone ─────────────────────────────────────────────── */}
      <div className="rounded-xl border-2 border-red-300 dark:border-red-800 bg-white dark:bg-slate-900 shadow-sm mt-6">
        <div className="p-6 border-b border-red-200 dark:border-red-800/50">
          <h3 className="flex items-center gap-3 text-red-700 dark:text-red-400 text-base font-semibold">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-red-500 to-rose-600">
              <AlertTriangle className="h-4 w-4 text-white" />
            </div>
            Danger Zone
          </h3>
          <p className="text-red-500/80 dark:text-red-400/70 text-sm mt-1">
            These actions are permanent and cannot be undone.
          </p>
        </div>
        <div className="p-6 space-y-4">
          {/* Delete my account */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50/50 dark:bg-red-900/10">
            <div className="flex-1">
              <p className="font-medium text-red-700 dark:text-red-400 text-sm">Delete my account</p>
              <p className="text-sm text-red-500/80 dark:text-red-400/70 mt-0.5">
                Permanently delete your user account and all personal data. This cannot be undone.
              </p>
            </div>
            <Button
              variant="outline"
              className="rounded-xl border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20 self-start sm:self-auto flex-shrink-0"
              onClick={() => { setDangerDialogType('account'); setDangerPassword(''); }}
            >
              Delete my account
            </Button>
          </div>

          {/* Delete workspace — admins only */}
          {(user?.is_super_admin || user?.is_admin) && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-red-300 dark:border-red-700/60 bg-red-100/50 dark:bg-red-900/20">
              <div className="flex-1">
                <p className="font-medium text-red-700 dark:text-red-400 text-sm">Delete entire workspace</p>
                <p className="text-sm text-red-500/80 dark:text-red-400/70 mt-0.5">
                  Permanently delete this workspace, all agents, contacts, conversations, and company data. This cannot be undone.
                </p>
              </div>
              <Button
                className="rounded-xl bg-red-600 hover:bg-red-700 text-white self-start sm:self-auto flex-shrink-0"
                onClick={() => { setDangerDialogType('workspace'); setDangerPassword(''); }}
              >
                Delete workspace
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone Dialog */}
      <Dialog open={dangerDialogType !== null} onOpenChange={(open) => { if (!open) { setDangerDialogType(null); setDangerPassword(''); } }}>
        <DialogContent className="dark:bg-slate-900 dark:border-slate-700 rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="dark:text-white flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-4 w-4" />
              {dangerDialogType === 'workspace' ? 'Delete Entire Workspace' : 'Delete My Account'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-sm text-red-700 dark:text-red-400">
              {dangerDialogType === 'workspace' ? (
                <>This will <strong>permanently delete</strong> this entire workspace — all agents, contacts, conversations, and company data. <strong>This cannot be undone.</strong></>
              ) : (
                <>This will <strong>permanently delete</strong> your user account and all personal data. Your messages will be anonymised. <strong>This cannot be undone.</strong></>
              )}
            </div>
            <div>
              <Label htmlFor="danger-password" className="dark:text-gray-300">Enter your password to confirm</Label>
              <Input
                id="danger-password"
                type="password"
                value={dangerPassword}
                onChange={(e) => setDangerPassword(e.target.value)}
                className="dark:bg-slate-800 dark:border-slate-600 dark:text-white mt-1.5 rounded-xl"
                placeholder="Your current password"
                onKeyDown={(e) => { if (e.key === 'Enter' && dangerPassword) handleDangerDelete(); }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              className="rounded-xl dark:text-slate-300"
              onClick={() => { setDangerDialogType(null); setDangerPassword(''); }}
              disabled={dangerLoading}
            >
              Cancel
            </Button>
            <Button
              disabled={dangerLoading || !dangerPassword}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
              onClick={handleDangerDelete}
            >
              {dangerLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting…
                </span>
              ) : (
                dangerDialogType === 'workspace' ? 'Delete workspace' : 'Delete my account'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className={`flex ${isRTL ? 'justify-start' : 'justify-end'} mt-6`}>
        <Button onClick={handleSaveChanges} className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl px-8 py-2.5">
          {t('settings.saveChanges')}
        </Button>
      </div>
      </div>
    </div>
  );
};
