import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const ProfilePage = () => {
  const { authFetch } = useAuth();
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await authFetch("/api/v1/profile/me");
        const data = await response.json();
        setUser(data);
        setEmail(data.email);
        setFirstName(data.first_name || "");
        setLastName(data.last_name || "");
        setPhoneNumber(data.phone_number || "");
        setJobTitle(data.job_title || "");
        setProfilePictureUrl(data.profile_picture_url || "");
      } catch (error) {
        toast({ title: "Failed to fetch user data", variant: "destructive" });
      }
    };
    fetchUser();
  }, [authFetch, toast]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await authFetch("/api/v1/profile/me", {
        method: "PUT",
        body: JSON.stringify({
          email,
          password: password || undefined, // Only send password if it's changed
          first_name: firstName,
          last_name: lastName,
          phone_number: phoneNumber,
          job_title: jobTitle,
          profile_picture_url: profilePictureUrl,
        }),
      });
      const data = await response.json();
      setUser(data);
      setEmail(data.email);
      setFirstName(data.first_name || "");
      setLastName(data.last_name || "");
      setPhoneNumber(data.phone_number || "");
      setJobTitle(data.job_title || "");
      setProfilePictureUrl(data.profile_picture_url || "");
      toast({ title: "Profile updated successfully" });
    } catch (error) {
      toast({ title: "Failed to update profile", variant: "destructive" });
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="job_title">Job Title</Label>
              <Input
                id="job_title"
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="profile_picture_url">Profile Picture URL</Label>
              <Input
                id="profile_picture_url"
                type="url"
                value={profilePictureUrl}
                onChange={(e) => setProfilePictureUrl(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">New Password (leave blank to keep current)</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit">Update Profile</Button>
        </form>
      </CardContent>
    </Card>
  );
};
