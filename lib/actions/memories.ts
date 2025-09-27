"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { extractMemoryContext } from "./context-extraction";

export async function createMemory(formData: FormData) {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const memoryDate = formData.get("memoryDate") as string;
  const tags = formData.get("tags") as string;
  const familyMemberId = formData.get("familyMemberId") as string; // Who this memory is about

  if (!title || !description) {
    throw new Error("Title and description are required");
  }

  try {
    // Get the current user's family member record (who is creating the memory)
    let { data: createdByMember } = await supabase
      .from("family_members")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!createdByMember) {
      // Create a family member record if it doesn't exist
      const { data: newMember, error: memberError } = await supabase
        .from("family_members")
        .insert({
          user_id: user.id,
          full_name: user.email?.split("@")[0] || "Family Member",
          relationship: "member",
        })
        .select("id")
        .single();

      if (memberError) throw memberError;
      createdByMember = newMember;
    }

    // Parse tags
    const tagArray = tags
      ? tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0)
      : [];

    // Create the memory
    const { data: memory, error: memoryError } = await supabase
      .from("memories")
      .insert({
        family_member_id: familyMemberId || createdByMember.id, // Who the memory is about
        title,
        description,
        memory_date: memoryDate || null,
        tags: tagArray.length > 0 ? tagArray : null,
        created_by: createdByMember.id,
        is_favorite: false,
      })
      .select()
      .single();

    if (memoryError) throw memoryError;

    // 🚀 AUTOMATIC CONTEXT EXTRACTION - Extract context for this new memory
    try {
      await extractMemoryContext(memory.id);
      console.log(
        `✅ Automatically extracted context for memory: ${memory.id}`
      );
    } catch (contextError) {
      console.error("⚠️ Context extraction failed for memory:", contextError);
      // Don't fail the memory creation if context extraction fails
    }

    revalidatePath("/protected/reminisce");
    return { success: true, memory };
  } catch (error) {
    console.error("Error creating memory:", error);
    throw error;
  }
}

export async function getMemories() {
  const supabase = await createClient();

  const { data: memories, error } = await supabase
    .from("memories")
    .select(
      `
      *,
      family_members!memories_family_member_id_fkey(
        full_name,
        relationship,
        user_id
      ),
      created_by_member:family_members!memories_created_by_fkey(
        full_name,
        relationship
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching memories:", error);
    return [];
  }

  return memories || [];
}

export async function getFamilyMembers() {
  const supabase = await createClient();

  const { data: members, error } = await supabase
    .from("family_members")
    .select("id, full_name, relationship")
    .order("full_name");

  if (error) {
    console.error("Error fetching family members:", error);
    return [];
  }

  return members || [];
}

export async function toggleFavoriteMemory(memoryId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  try {
    // Get current memory status
    const { data: memory, error: fetchError } = await supabase
      .from("memories")
      .select("is_favorite")
      .eq("id", memoryId)
      .single();

    if (fetchError) throw fetchError;

    // Toggle favorite status
    const { error: updateError } = await supabase
      .from("memories")
      .update({ is_favorite: !memory.is_favorite })
      .eq("id", memoryId);

    if (updateError) throw updateError;

    revalidatePath("/protected/reminisce");
    return { success: true };
  } catch (error) {
    console.error("Error toggling favorite memory:", error);
    throw error;
  }
}

export async function deleteMemory(memoryId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  try {
    // Verify user can delete this memory (either created by them or about them)
    const { data: memory, error: fetchError } = await supabase
      .from("memories")
      .select(
        `
        *,
        family_members!memories_family_member_id_fkey(user_id),
        created_by_member:family_members!memories_created_by_fkey(user_id)
      `
      )
      .eq("id", memoryId)
      .single();

    if (fetchError || !memory) {
      throw new Error("Memory not found");
    }

    // Check if user can delete (either created it or it's about them)
    const canDelete =
      memory.created_by_member?.user_id === user.id ||
      memory.family_members?.user_id === user.id;

    if (!canDelete) {
      throw new Error(
        "You can only delete memories you created or memories about you"
      );
    }

    // Delete associated context entries
    await supabase
      .from("user_context")
      .delete()
      .eq("source_type", "memory")
      .eq("source_id", memoryId);

    // Delete the memory
    const { error: deleteError } = await supabase
      .from("memories")
      .delete()
      .eq("id", memoryId);

    if (deleteError) throw deleteError;

    revalidatePath("/protected/reminisce");
    return { success: true };
  } catch (error) {
    console.error("Error deleting memory:", error);
    throw error;
  }
}
