import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share, Plus } from "lucide-react";
import { CreatePostModal } from "@/components/create-post-modal";
import { getPosts } from "@/lib/actions/posts";
import { PostCard } from "@/components/post-card";

export default async function FamilyFeedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  // Fetch real posts from database
  const posts = await getPosts();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header with Post Button */}
      <div className="flex items-center justify-between py-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Family Feed</h1>
          <p className="text-gray-600">Stay connected with your loved ones</p>
        </div>
        <CreatePostModal>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </Button>
        </CreatePostModal>
      </div>

      {/* Posts Feed */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <Card className="bg-white shadow-sm">
            <CardContent className="p-12 text-center">
              <div className="space-y-4">
                <Heart className="w-16 h-16 text-gray-300 mx-auto" />
                <h3 className="text-lg font-semibold text-gray-700">
                  No posts yet
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Be the first to share a memory, milestone, or update with your
                  family!
                </p>
                <CreatePostModal>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Post
                  </Button>
                </CreatePostModal>
              </div>
            </CardContent>
          </Card>
        ) : (
          posts.map((post: any) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}
