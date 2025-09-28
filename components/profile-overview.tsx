"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Mail, Phone, MapPin, Camera } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Image from "next/image";

interface ProfileOverviewProps {
  profile: any;
  user: any;
}

export function ProfileOverview({ profile, user }: ProfileOverviewProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    setIsUploading(true);

    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      if (userError || !currentUser) {
        throw new Error("User not authenticated");
      }

      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      console.log('Uploading avatar file...', { 
        fileName, 
        filePath, 
        fileSize: file.size, 
        fileType: file.type 
      });

      // Upload directly to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        
        if (uploadError.message.includes('not found') || uploadError.message.includes('does not exist')) {
          throw new Error('Storage bucket "avatars" does not exist. Please create it in the Supabase dashboard under Storage > Buckets.');
        } else if (uploadError.message.includes('policy')) {
          throw new Error('Storage policy error. Please check that the avatars bucket has proper policies set up.');
        } else {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatarUrl = urlData.publicUrl;

      // Update the family member with the new avatar URL
      const { error: profileError } = await supabase
        .from("family_members")
        .update({
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", currentUser.id);

      if (profileError) {
        throw new Error(`Failed to update profile: ${profileError.message}`);
      }

      toast.success("Profile picture updated successfully!");
      
      // Refresh the page to show the updated avatar
      window.location.reload();
    } catch (error) {
      console.error("Error updating profile picture:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update profile picture");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="bg-card shadow-sm border-border">
      <CardHeader className="text-center pb-4">
        <div className="relative inline-block">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt="Profile"
                width={96}
                height={96}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <User className="w-12 h-12 text-muted-foreground" />
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
            onClick={() => document.getElementById('avatar-upload')?.click()}
            disabled={isUploading}
          >
            <Camera className="w-4 h-4" />
          </Button>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        <CardTitle className="text-xl text-card-foreground">
          {profile?.full_name || user.user_metadata?.full_name || "Your Name"}
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          {profile?.username || user.email?.split("@")[0] || "username"}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center text-sm text-foreground">
          <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
          <span className="truncate">{user.email}</span>
        </div>
        {profile?.phone_number && (
          <div className="flex items-center text-sm text-foreground">
            <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
            <span>{profile.phone_number}</span>
          </div>
        )}
        {profile?.location && (
          <div className="flex items-center text-sm text-foreground">
            <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
            <span>{profile.location}</span>
          </div>
        )}
        {profile?.pronouns && (
          <div className="flex items-center text-sm text-foreground">
            <span className="font-medium mr-2">Pronouns:</span>
            <Badge variant="secondary">{profile.pronouns}</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
