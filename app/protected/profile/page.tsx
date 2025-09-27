import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, MapPin, Camera, Save } from "lucide-react";
import { ProfileForm } from "@/components/profile-form";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  // Fetch user profile data
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="py-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
        <p className="text-gray-700">Manage your personal information and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Overview Card */}
        <div className="lg:col-span-1">
          <Card className="bg-white shadow-sm">
            <CardHeader className="text-center pb-4">
              <div className="relative inline-block">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                >
                  <Camera className="w-4 h-4" />
                </Button>
              </div>
              <CardTitle className="text-xl text-gray-900">
                {profile?.full_name || user.user_metadata?.full_name || "Your Name"}
              </CardTitle>
              <p className="text-gray-700 text-sm">
                {profile?.username || user.email?.split("@")[0] || "username"}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm text-gray-800">
                <Mail className="w-4 h-4 mr-2 text-gray-600" />
                <span className="truncate">{user.email}</span>
              </div>
              {profile?.phone && (
                <div className="flex items-center text-sm text-gray-800">
                  <Phone className="w-4 h-4 mr-2 text-gray-600" />
                  <span>{profile.phone}</span>
                </div>
              )}
              {profile?.location && (
                <div className="flex items-center text-sm text-gray-800">
                  <MapPin className="w-4 h-4 mr-2 text-gray-600" />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile?.pronouns && (
                <div className="flex items-center text-sm text-gray-800">
                  <span className="font-medium mr-2">Pronouns:</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">{profile.pronouns}</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2">
          <ProfileForm profile={profile} user={user} />
        </div>
      </div>
    </div>
  );
}
