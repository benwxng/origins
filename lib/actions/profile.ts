"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: any, avatarFile: File | null) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  try {
    let avatarUrl = formData.avatar_url;

    // Handle avatar upload if a new file is provided
    if (avatarFile || formData.avatar_base64) {
      try {
        let fileToUpload: File;
        
        if (formData.avatar_base64) {
          // Convert base64 to File object
          const base64Data = formData.avatar_base64.split(',')[1];
          const binaryData = atob(base64Data);
          const bytes = new Uint8Array(binaryData.length);
          for (let i = 0; i < binaryData.length; i++) {
            bytes[i] = binaryData.charCodeAt(i);
          }
          fileToUpload = new File([bytes], formData.avatar_filename, { type: formData.avatar_type });
        } else {
          fileToUpload = avatarFile!;
        }

        const fileExt = fileToUpload.name.split(".").pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = fileName; // Upload directly to bucket root, not in a subfolder

        console.log('Attempting to upload avatar file...', { 
          fileName, 
          filePath, 
          fileSize: fileToUpload.size, 
          fileType: fileToUpload.type 
        });
        
        // Try to upload the file directly - if bucket doesn't exist, we'll get a clear error
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, fileToUpload);

        if (uploadError) {
          console.error('Upload error details:', {
            message: uploadError.message,
            statusCode: uploadError.statusCode,
            error: uploadError.error
          });
          
          // Provide more helpful error messages
          if (uploadError.message.includes('not found') || uploadError.message.includes('does not exist')) {
            throw new Error('Storage bucket "avatars" does not exist. Please create it in the Supabase dashboard under Storage > Buckets.');
          } else if (uploadError.message.includes('policy')) {
            throw new Error('Storage policy error. Please check that the avatars bucket has proper policies set up.');
          } else {
            throw new Error(`Failed to upload avatar: ${uploadError.message}`);
          }
        }

        console.log('Upload successful:', uploadData);

        // Get the public URL
        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        avatarUrl = urlData.publicUrl;
        console.log('Avatar uploaded successfully:', avatarUrl);
        
      } catch (error) {
        console.error('Avatar upload failed:', error);
        throw new Error(`Avatar upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Update family member data (since we're not using profiles table anymore)
    const { error: profileError } = await supabase
      .from("family_members")
      .update({
        full_name: formData.full_name,
        phone_number: formData.phone || null,
        pronouns: formData.pronouns || null,
        bio: formData.bio || null,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (profileError) {
      throw new Error(`Failed to update profile: ${profileError.message}`);
    }

    // Revalidate the profile page to show updated data
    revalidatePath("/protected/profile");

    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
}

export async function getProfile(userId: string) {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 is "not found" error, which is expected for new users
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }

  return profile;
}
