import { useState, useEffect } from "react";
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
import {
  User, Mail, Phone, Briefcase, Lock, Camera, Upload,
  Loader2, CheckCircle2, Info, Shield, Building2
} from "lucide-react";
import { useI18n } from "@/hooks/useI18n";

export const ProfilePage = () => {
  const { t, isRTL } = useI18n();
  const { authFetch, user: currentUser } = useAuth();
  const { toast } = useToast();
  const { playSuccessSound } = useNotifications();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 p-8 shadow-2xl shadow-violet-500/20">
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
                  <Badge variant="secondary" className="bg-amber-500/20 backdrop-blur-sm text-amber-100 border-0">
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
          <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
            <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-800 dark:text-amber-300">
              You have unsaved changes. Don't forget to save your profile.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleUpdate} className="space-y-6">
          {/* Personal Information Card */}
          <Card className="border-slate-200/80 dark:border-slate-700/60 dark:bg-slate-800/90 rounded-2xl shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800 dark:to-slate-900/50 border-b border-slate-200/80 dark:border-slate-700/60">
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
                    className="rounded-xl h-11 dark:bg-slate-900 dark:border-slate-600 dark:text-white"
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
                    className="rounded-xl h-11 dark:bg-slate-900 dark:border-slate-600 dark:text-white"
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
                    className="rounded-xl h-11 dark:bg-slate-900 dark:border-slate-600 dark:text-white"
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
                    className="rounded-xl h-11 dark:bg-slate-900 dark:border-slate-600 dark:text-white"
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
                    className="rounded-xl h-11 dark:bg-slate-900 dark:border-slate-600 dark:text-white"
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
                      className="rounded-xl h-11 dark:bg-slate-900 dark:border-slate-600 dark:text-white"
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

          {/* Security Card */}
          <Card className="border-slate-200/80 dark:border-slate-700/60 dark:bg-slate-800/90 rounded-2xl shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800 dark:to-slate-900/50 border-b border-slate-200/80 dark:border-slate-700/60">
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
                    className="rounded-xl h-11 dark:bg-slate-900 dark:border-slate-600 dark:text-white"
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
                    className="rounded-xl h-11 dark:bg-slate-900 dark:border-slate-600 dark:text-white"
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

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 sticky bottom-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-lg">
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
              className="rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 transition-all min-w-[140px]"
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
