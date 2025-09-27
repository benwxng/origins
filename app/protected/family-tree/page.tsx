import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserRelationships } from "@/lib/actions/relationships";
import { InteractiveFamilyTree } from "@/components/interactive-family-tree";

export default async function FamilyTreePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  // Get current user's profile
  const { data: currentUserProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Get all relationships for the current user
  const relationships = await getUserRelationships(user.id);

  return (
    <div className="w-full h-screen">
      <InteractiveFamilyTree 
        currentUserId={user.id}
        relationships={relationships}
        currentUserProfile={currentUserProfile}
      />
    </div>
  );
}