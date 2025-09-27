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

    // Handle image uploads to Supabase Storage
    const imageUrls: string[] = [];
    const imageFiles: File[] = [];

    // Collect all image files from formData
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("image-") && value instanceof File && value.size > 0) {
        imageFiles.push(value);
      }
    }

    // Upload each image to Supabase Storage
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}-${i}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("family-photos")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Error uploading image:", uploadError);
        continue; // Skip this image but continue with others
      }

      // Get the public URL for the uploaded image
      const { data: urlData } = supabase.storage
        .from("family-photos")
        .getPublicUrl(fileName);

      if (urlData.publicUrl) {
        imageUrls.push(urlData.publicUrl);
      }
    }

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

export async function deletePost(postId: string) {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  try {
    // Get the post and verify ownership
    const { data: post, error: fetchError } = await supabase
      .from("family_posts")
      .select(
        `
        *,
        family_members!inner(user_id)
      `
      )
      .eq("id", postId)
      .single();

    if (fetchError || !post) {
      throw new Error("Post not found");
    }

    // Check if the current user is the author of the post
    if (post.family_members.user_id !== user.id) {
      throw new Error("You can only delete your own posts");
    }

    // Delete associated images from storage
    if (post.image_urls && post.image_urls.length > 0) {
      for (const imageUrl of post.image_urls) {
        // Extract the file path from the public URL
        const urlParts = imageUrl.split(
          "/storage/v1/object/public/family-photos/"
        );
        if (urlParts.length > 1) {
          const filePath = urlParts[1];

          const { error: deleteError } = await supabase.storage
            .from("family-photos")
            .remove([filePath]);

          if (deleteError) {
            console.error("Error deleting image from storage:", deleteError);
            // Continue with post deletion even if image deletion fails
          }
        }
      }
    }

    // Delete post reactions first (due to foreign key constraints)
    await supabase.from("post_reactions").delete().eq("post_id", postId);

    // Delete post comments (if any exist)
    await supabase.from("post_comments").delete().eq("post_id", postId);

    // Delete the post
    const { error: deletePostError } = await supabase
      .from("family_posts")
      .delete()
      .eq("id", postId);

    if (deletePostError) throw deletePostError;

    revalidatePath("/protected");
    return { success: true };
  } catch (error) {
    console.error("Error deleting post:", error);
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
        profile_image_url,
        user_id
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
