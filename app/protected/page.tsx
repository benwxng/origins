import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getPosts } from "@/lib/actions/posts";
import { FamilyFeedPage } from "@/components/family-feed-page";

interface FamilyMember {
  id: string;
  full_name: string;
  relationship: string;
  profile_image_url?: string;
  user_id: string | null;
  avatar_url?: string;
}

interface Post {
  id: string;
  content: string;
  post_type: string;
  image_urls?: string[];
  created_at: string;
  family_members: FamilyMember;
}

export default async function FamilyFeedPageServer() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  // Fetch real posts from database
  const posts = (await getPosts()) as Post[];

  return <FamilyFeedPage posts={posts} />;
}
