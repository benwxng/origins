"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface FamilyMember {
  id: string;
  full_name: string;
  relationship: string;
  user_id?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  location?: string | null;
  phone?: string | null;
  pronouns?: string | null;
}

export async function getAllFamilyMembers(): Promise<FamilyMember[]> {
  const supabase = await createClient();

  const { data: members, error } = await supabase
    .from("family_members")
    .select("*")
    .order("full_name");

  if (error) {
    console.error("Error fetching family members:", error);
    return [];
  }

  return members || [];
}

export async function addFamilyMember(
  fullName: string,
  pronouns?: string,
  phone_number?: string
): Promise<{ success: boolean; error?: string; data?: FamilyMember }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const { data, error } = await supabase
      .from("family_members")
      .insert({
        full_name: fullName,
        pronouns: pronouns || null,
        phone_number: phone_number || null,
        user_id: null, // Non-authenticated family member
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding family member:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/protected/family-members");
    return { success: true, data };
  } catch (error) {
    console.error("Error adding family member:", error);
    return { success: false, error: "Failed to add family member" };
  }
}

export async function updateFamilyMember(
  memberId: string,
  updates: {
    full_name?: string;
    bio?: string;
    phone_number?: string;
    pronouns?: string;
    avatar_url?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const { error } = await supabase
      .from("family_members")
      .update(updates)
      .eq("id", memberId);

    if (error) {
      console.error("Error updating family member:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/protected/family-members");
    revalidatePath(`/protected/profile/${memberId}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating family member:", error);
    return { success: false, error: "Failed to update family member" };
  }
}

export async function deleteFamilyMember(
  memberId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    // First, check if this family member has any relationships
    const { data: relationships, error: relationshipsError } = await supabase
      .from("family_relationships")
      .select("id")
      .or(`person_id.eq.${memberId},related_person_id.eq.${memberId}`);

    if (relationshipsError) {
      console.error("Error checking relationships:", relationshipsError);
      return { success: false, error: "Failed to check relationships" };
    }

    if (relationships && relationships.length > 0) {
      return { 
        success: false, 
        error: "Cannot delete family member with existing relationships. Please remove all relationships first." 
      };
    }

    // Check if this family member has any posts
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select("id")
      .eq("author_id", memberId);

    if (postsError) {
      console.error("Error checking posts:", postsError);
      return { success: false, error: "Failed to check posts" };
    }

    if (posts && posts.length > 0) {
      return { 
        success: false, 
        error: "Cannot delete family member with existing posts. Please delete all posts first." 
      };
    }

    // Delete the family member
    const { error } = await supabase
      .from("family_members")
      .delete()
      .eq("id", memberId);

    if (error) {
      console.error("Error deleting family member:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/protected/family-members");
    return { success: true };
  } catch (error) {
    console.error("Error deleting family member:", error);
    return { success: false, error: "Failed to delete family member" };
  }
}

export async function getFamilyMemberById(memberId: string): Promise<FamilyMember | null> {
  const supabase = await createClient();

  const { data: member, error } = await supabase
    .from("family_members")
    .select("*")
    .eq("id", memberId)
    .single();

  if (error) {
    console.error("Error fetching family member:", error);
    return null;
  }

  return member;
}
