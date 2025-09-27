import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserRelationships } from "@/lib/actions/relationships";
import { InteractiveFamilyTree } from "@/components/interactive-family-tree";
import { AddRelationshipDropdown } from "@/components/add-relationship-dropdown";

export default async function FamilyTreePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  // Get current user's family member record (which now has avatar_url)
  const { data: currentUserFamilyMember } = await supabase
    .from("family_members")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Get current user's profile from profiles table for additional info
  const { data: currentUserProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", currentUserFamilyMember?.full_name)
    .single();

  // Combine both sources - prioritize family_members.avatar_url
  const combinedProfile = {
    ...currentUserProfile,
    ...currentUserFamilyMember,
    avatar_url:
      currentUserFamilyMember?.avatar_url || currentUserProfile?.avatar_url,
    full_name:
      currentUserFamilyMember?.full_name ||
      currentUserProfile?.full_name ||
      "You",
  };

  // Get all relationships for the current user
  const relationships = await getUserRelationships(user.id);

  // Debug: Log what relationships are being fetched
  console.log("Family Tree Page - User ID:", user.id);
  console.log(
    "Family Tree Page - Current User Family Member:",
    currentUserFamilyMember
  );
  console.log("Family Tree Page - Fetched Relationships:", relationships);

  return (
    <div className="w-full h-screen relative">
      <InteractiveFamilyTree
        currentUserId={user.id}
        relationships={relationships}
        currentUserProfile={combinedProfile}
      />

      {/* Add Relationship Dropdown - Pinned to bottom right */}
      <div className="fixed bottom-6 right-6 z-50 w-80">
        <AddRelationshipDropdown currentUserId={user.id} />
      </div>
    </div>
  );
}
