import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  User, Mail, Phone, Briefcase, Lock, Camera, Upload,
  Loader2, CheckCircle2, Info, Shield, Building2, Tag, X, Plus, ShieldCheck, ShieldOff, QrCode,
} from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { API_BASE_URL } from "@/config/api";

export const ProfilePage = () => {
  const { t, isRTL } = useI18n();
  const { authFetch, user: currentUser } = useAuth();
  const { toast } = useToast();
  const { playSuccessSound } = useNotifications();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [isSavingSkills, setIsSavingSkills] = useState(false);

  // 2FA state
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [twoFaDialog, setTwoFaDialog] = useState<"setup" | "disable" | null>(null);
  const [twoFaSetupData, setTwoFaSetupData] = useState<{ qr_code: string; secret: string } | null>(null);
  const [twoFaCode, setTwoFaCode] = useState("");
  const [twoFaLoading, setTwoFaLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    jobTitle: "",
    profilePictureUrl: "",
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await authFetch("/api/v1/profile/me");
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        setUser(data);
        if (Array.isArray(data.skills)) setSkills(data.skills);
        setTwoFaEnabled(!!data.totp_enabled);
        setFormData({
          email: data.email || "",
          password: "",
          confirmPassword: "",
          firstName: data.first_name || "",
          lastName: data.last_name || "",
          phoneNumber: data.phone_number || "",
          jobTitle: data.job_title || "",
          profilePictureUrl: data.profile_picture_url || "",
        });
      } catch (error) {
        toast({ title: "Failed to fetch user data", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  const addSkill = () => {
    const s = skillInput.trim().toLowerCase();
    if (s && !skills.includes(s)) setSkills(prev => [...prev, s]);
    setSkillInput('');
  };

  const removeSkill = (skill: string) => setSkills(prev => prev.filter(s => s !== skill));

  const handleSaveSkills = async () => {
    if (!user) return;
    setIsSavingSkills(true);
    try {
      const res = await authFetch(`/api/v1/agent-skills/${(user as any).id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'Skills updated' });
    } catch (e: any) {
      toast({ title: 'Failed to update skills', description: e.message, variant: 'destructive' });
    } finally {
      setIsSavingSkills(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    // Validate password match
    if (formData.password && formData.password !== formData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await authFetch("/api/v1/profile/me", {
        method: "PUT",
        body: JSON.stringify({
          email: formData.email,
          password: formData.password || undefined,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone_number: formData.phoneNumber,
          job_title: formData.jobTitle,
          profile_picture_url: formData.profilePictureUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const data = await response.json();
      setUser(data);
      setFormData(prev => ({
        ...prev,
        password: "",
        confirmPassword: "",
      }));
      setHasChanges(false);
      toast({ title: "Profile updated successfully" });
      playSuccessSound();
    } catch (error) {
      toast({ title: "Failed to update profile", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handle2FASetup = async () => {
    setTwoFaLoading(true);
    try {
      const res = await authFetch(`/api/v1/auth/2fa/setup`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).detail || "Failed");
      const data = await res.json();
      setTwoFaSetupData(data);
      setTwoFaCode("");
      setTwoFaDialog("setup");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setTwoFaLoading(false);
    }
  };

  const handle2FAVerifySetup = async () => {
    setTwoFaLoading(true);
    try {
      const res = await authFetch(`/api/v1/auth/2fa/verify-setup`, {
        method: "POST",
        body: JSON.stringify({ code: twoFaCode }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || "Invalid code");
      setTwoFaEnabled(true);
      setTwoFaDialog(null);
      setTwoFaSetupData(null);
      toast({ title: "2FA Enabled", description: "Your account is now protected with two-factor authentication." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setTwoFaLoading(false);
    }
  };

  const handle2FADisable = async () => {
    setTwoFaLoading(true);
    try {
      const res = await authFetch(`/api/v1/auth/2fa/disable`, {
        method: "POST",
        body: JSON.stringify({ code: twoFaCode }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || "Invalid code");
      setTwoFaEnabled(false);
      setTwoFaDialog(null);
      setTwoFaCode("");
      toast({ title: "2FA Disabled" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setTwoFaLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="relative w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center shadow-xl shadow-violet-500/25">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
          </div>
          <span className="text-gray-600 dark:text-gray-400 font-medium">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const getInitials = () => {
    const first = formData.firstName?.[0] || "";
    const last = formData.lastName?.[0] || "";
    return (first + last).toUpperCase() || "U";
  };

  return (
    <div className="min-h-screen app-surface p-6 relative overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Aurora ambient bloom */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-violet-600/[0.05] dark:bg-violet-500/[0.07] blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-cyan-500/[0.03] dark:bg-cyan-400/[0.05] blur-[100px]" />
      </div>
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in relative z-10">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600/90 via-violet-500/80 to-cyan-600/70 p-8 shadow-2xl shadow-violet-500/20">
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
          <div className="relative flex items-center gap-6">
            <div className="relative group">
              <Avatar className="relative h-24 w-24 ring-4 ring-white/20 shadow-xl">
                <AvatarImage src={formData.profilePictureUrl} alt={`${formData.firstName} ${formData.lastName}`} />
                <AvatarFallback className="text-2xl font-bold bg-white/10 backdrop-blur-sm text-white">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-white text-violet-600 hover:bg-white/90 shadow-lg p-0"
                title="Change photo"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-1">
                {formData.firstName || formData.lastName
                  ? `${formData.firstName} ${formData.lastName}`.trim()
                  : "Your Profile"}
              </h1>
              <p className="text-violet-100/80 flex items-center gap-2">
                {formData.jobTitle && (
                  <>
                    <Briefcase className="h-4 w-4" />
                    {formData.jobTitle}
                  </>
                )}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="secondary" className="bg-white/20 backdrop-blur-sm text-white border-0 hover:bg-white/30">
                  <Mail className="h-3 w-3 mr-1" />
                  {formData.email}
                </Badge>
                {currentUser?.is_super_admin && (
                  <Badge variant="secondary" className="bg-violet-500/20 backdrop-blur-sm text-violet-100 border-0">
                    <Shield className="h-3 w-3 mr-1" />
                    Admin
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Alert for unsaved changes */}
        {hasChanges && (
          <Alert className="border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20">
            <Info className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            <AlertDescription className="text-violet-800 dark:text-violet-300">
              You have unsaved changes. Don't forget to save your profile.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleUpdate} className="space-y-6">
          {/* Personal Information Card */}
          <Card className="border-border dark:bg-card rounded-2xl shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-violet-500/[0.06] to-transparent border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl dark:text-white">Personal Information</CardTitle>
                  <CardDescription className="text-sm dark:text-gray-400">
                    Update your personal details and contact information
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium dark:text-gray-200 flex items-center gap-2">
                    <User className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    className="rounded-xl h-11"
                    placeholder="Enter your first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium dark:text-gray-200 flex items-center gap-2">
                    <User className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    className="rounded-xl h-11"
                    placeholder="Enter your last name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium dark:text-gray-200 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="rounded-xl h-11"
                    placeholder="your.email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-sm font-medium dark:text-gray-200 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    Phone Number
                  </Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => handleChange("phoneNumber", e.target.value)}
                    className="rounded-xl h-11"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="jobTitle" className="text-sm font-medium dark:text-gray-200 flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    Job Title
                  </Label>
                  <Input
                    id="jobTitle"
                    type="text"
                    value={formData.jobTitle}
                    onChange={(e) => handleChange("jobTitle", e.target.value)}
                    className="rounded-xl h-11"
                    placeholder="e.g. Customer Support Manager"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="profilePictureUrl" className="text-sm font-medium dark:text-gray-200 flex items-center gap-2">
                    <Camera className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    Profile Picture URL
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="profilePictureUrl"
                      type="url"
                      value={formData.profilePictureUrl}
                      onChange={(e) => handleChange("profilePictureUrl", e.target.value)}
                      className="rounded-xl h-11"
                      placeholder="https://example.com/photo.jpg"
                    />
                    <Button type="button" variant="outline" size="sm" className="rounded-xl px-4">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Enter a direct URL to your profile picture or upload a new one
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Skills Card */}
          <Card className="border-border dark:bg-card rounded-2xl shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-violet-500/[0.06] to-transparent border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
                  <Tag className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl dark:text-white">Skills</CardTitle>
                  <CardDescription className="text-sm dark:text-gray-400">
                    Skills used for routing calls to the right agent
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex gap-2">
                <Input
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                  placeholder="e.g. billing, spanish, technical"
                  className="rounded-xl h-10 text-sm"
                />
                <Button type="button" variant="outline" onClick={addSkill} className="rounded-xl px-3 h-10 flex-shrink-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {skills.map(skill => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    >
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)} className="hover:text-emerald-900 dark:hover:text-emerald-200">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No skills added yet. Type a skill above and press Enter.</p>
              )}
            </CardContent>
            <CardFooter className="px-6 pb-5 pt-0">
              <Button
                type="button"
                onClick={handleSaveSkills}
                disabled={isSavingSkills}
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg"
              >
                {isSavingSkills ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Save Skills
              </Button>
            </CardFooter>
          </Card>

          {/* Security Card */}
          <Card className="border-border dark:bg-card rounded-2xl shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-violet-500/[0.06] to-transparent border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-500/25">
                  <Lock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl dark:text-white">Security Settings</CardTitle>
                  <CardDescription className="text-sm dark:text-gray-400">
                    Change your password to keep your account secure
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium dark:text-gray-200 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-red-600 dark:text-red-400" />
                    New Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    className="rounded-xl h-11"
                    placeholder="Enter new password"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Leave blank to keep your current password
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium dark:text-gray-200 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-red-600 dark:text-red-400" />
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange("confirmPassword", e.target.value)}
                    className="rounded-xl h-11"
                    placeholder="Confirm new password"
                    disabled={!formData.password}
                  />
                  {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-xs text-red-600 dark:text-red-400">Passwords do not match</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Two-Factor Authentication */}
          <Card className="rounded-2xl border border-border shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl dark:text-white">Two-Factor Authentication</CardTitle>
                  <CardDescription className="text-sm dark:text-gray-400">
                    Add an extra layer of security to your account
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-border">
                <div className="flex items-center gap-3">
                  {twoFaEnabled
                    ? <ShieldCheck className="h-5 w-5 text-green-500" />
                    : <ShieldOff className="h-5 w-5 text-gray-400" />}
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                      Authenticator app
                    </p>
                    <p className="text-xs text-gray-500">
                      {twoFaEnabled ? "Active — your account is protected" : "Not configured"}
                    </p>
                  </div>
                  {twoFaEnabled && (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0 text-xs">
                      Enabled
                    </Badge>
                  )}
                </div>
                {twoFaEnabled ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                    onClick={() => { setTwoFaCode(""); setTwoFaDialog("disable"); }}
                  >
                    Disable 2FA
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    className="bg-violet-600 hover:bg-violet-700 text-white"
                    onClick={handle2FASetup}
                    disabled={twoFaLoading}
                  >
                    {twoFaLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <QrCode className="w-4 h-4 mr-1" />}
                    Enable 2FA
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 2FA Dialogs */}
          <Dialog open={twoFaDialog === "setup"} onOpenChange={open => !open && setTwoFaDialog(null)}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Set up two-factor authentication</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Scan this QR code with Google Authenticator, Authy, or any TOTP app.
                </p>
                {twoFaSetupData?.qr_code && (
                  <div className="flex justify-center">
                    <img src={twoFaSetupData.qr_code} alt="QR Code" className="w-44 h-44 rounded-xl border" />
                  </div>
                )}
                {twoFaSetupData?.secret && (
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
                    <p className="text-xs text-gray-500 mb-1">Manual entry key</p>
                    <code className="text-xs font-mono break-all text-gray-800 dark:text-gray-200">
                      {twoFaSetupData.secret}
                    </code>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label>Enter the 6-digit code to confirm</Label>
                  <Input
                    placeholder="123456"
                    value={twoFaCode}
                    onChange={e => setTwoFaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    inputMode="numeric"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setTwoFaDialog(null)}>Cancel</Button>
                <Button onClick={handle2FAVerifySetup} disabled={twoFaCode.length !== 6 || twoFaLoading}>
                  {twoFaLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Activate 2FA
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={twoFaDialog === "disable"} onOpenChange={open => !open && setTwoFaDialog(null)}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Disable two-factor authentication</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Enter your current authenticator code to disable 2FA.
                </p>
                <div className="space-y-1.5">
                  <Label>Authenticator code</Label>
                  <Input
                    placeholder="123456"
                    value={twoFaCode}
                    onChange={e => setTwoFaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    inputMode="numeric"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setTwoFaDialog(null)}>Cancel</Button>
                <Button
                  variant="destructive"
                  onClick={handle2FADisable}
                  disabled={twoFaCode.length !== 6 || twoFaLoading}
                >
                  {twoFaLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Disable 2FA
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 sticky bottom-6 bg-background/80 dark:bg-card/80 backdrop-blur-xl p-4 rounded-2xl border border-border shadow-lg">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.location.reload()}
              className="rounded-xl"
              disabled={!hasChanges || isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!hasChanges || isSaving}
              className="rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 text-white shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 transition-all min-w-[140px]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
