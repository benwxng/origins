import { createClient } from "@/lib/supabase/server";

export async function getUserProfile(userId: string) {
  const supabase = await createClient();
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  return profile;
}

export async function getUserDisplayInfo(user: any) {
  const profile = await getUserProfile(user.id);
  
  return {
    fullName: profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
    username: profile?.username || user.email?.split("@")[0] || "username",
    avatarUrl: profile?.avatar_url || null,
    email: user.email || "",
    phone: profile?.phone_number || null,
    location: profile?.location || null,
    pronouns: profile?.pronouns || null,
    bio: profile?.bio || null,
    relation: profile?.relation || null,
  };
}

