import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, MapPin, Camera, Save } from "lucide-react";
import { ProfileForm } from "@/components/profile-form";
import { ProfileOverview } from "@/components/profile-overview";
import { ParentAssignmentDropdown } from "@/components/parent-assignment-dropdown";
import { ParentRelationshipsDisplay } from "@/components/parent-relationships-display";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  // Fetch user profile data from family_members table
  const { data: profile } = await supabase
    .from("family_members")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Get current user's family member ID (same as profile.id)
  const familyMember = profile ? { id: profile.id } : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="py-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your personal information and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Overview Card */}
        <div className="lg:col-span-1">
          <ProfileOverview profile={profile} user={user} />

            {/* Parent Assignment */}
            <Card className="bg-card shadow-sm border-border mt-4">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-card-foreground">
                  Family Relationships
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ParentAssignmentDropdown currentUserId={user.id} />
              </CardContent>
            </Card>

          {/* Parent Relationships Display */}
          {familyMember && (
            <ParentRelationshipsDisplay 
              familyMemberId={familyMember.id} 
              isOwnProfile={true}
              canEdit={true}
            />
          )}
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2">
          <ProfileForm profile={profile} user={user} />
        </div>
      </div>
    </div>
  );
}
