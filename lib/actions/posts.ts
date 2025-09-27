"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createPost(formData: FormData) {
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
  const postType = formData.get("postType") as string;

  if (!title || !description) {
    throw new Error("Title and description are required");
  }

  try {
    // First, get or create the family member record for this user
    let { data: familyMember } = await supabase
      .from("family_members")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!familyMember) {
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
      familyMember = newMember;
    }

    // Handle image uploads (for now, we'll store placeholder URLs)
    // In a real implementation, you'd upload to Supabase Storage
    const imageUrls: string[] = [];

    // Create the post
    const { data: post, error: postError } = await supabase
      .from("family_posts")
      .insert({
        author_id: familyMember.id,
        content: `${title}\n\n${description}`,
        post_type: postType,
        image_urls: imageUrls.length > 0 ? imageUrls : null,
      })
      .select()
      .single();

    if (postError) throw postError;

    revalidatePath("/protected");
    return { success: true, post };
  } catch (error) {
    console.error("Error creating post:", error);
    throw error;
  }
}

export async function getPosts() {
  const supabase = await createClient();

  const { data: posts, error } = await supabase
    .from("family_posts")
    .select(
      `
      *,
      family_members!inner(
        full_name,
        relationship,
        profile_image_url
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching posts:", error);
    return [];
  }

  return posts || [];
}

export async function getPostReactions(postId: string) {
  const supabase = await createClient();

  const { data: reactions, error } = await supabase
    .from("post_reactions")
    .select("reaction_type")
    .eq("post_id", postId);

  if (error) {
    console.error("Error fetching reactions:", error);
    return [];
  }

  return reactions || [];
}

export async function togglePostReaction(
  postId: string,
  reactionType: string = "heart"
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get family member ID
  const { data: familyMember } = await supabase
    .from("family_members")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!familyMember) return;

  // Check if reaction already exists
  const { data: existingReaction } = await supabase
    .from("post_reactions")
    .select("id")
    .eq("post_id", postId)
    .eq("family_member_id", familyMember.id)
    .single();

  if (existingReaction) {
    // Remove reaction
    await supabase
      .from("post_reactions")
      .delete()
      .eq("id", existingReaction.id);
  } else {
    // Add reaction
    await supabase.from("post_reactions").insert({
      post_id: postId,
      family_member_id: familyMember.id,
      reaction_type: reactionType,
    });
  }

  revalidatePath("/protected");
}
