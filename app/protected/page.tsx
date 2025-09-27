import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share, Plus } from "lucide-react";
import { CreatePostModal } from "@/components/create-post-modal";
import { getPosts, togglePostReaction } from "@/lib/actions/posts";

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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24)
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7)
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;

    return date.toLocaleDateString();
  };

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
          posts.map((post: any) => {
            // Parse content to get title and description
            const contentLines = post.content.split("\n\n");
            const title = contentLines[0] || "";
            const description = contentLines.slice(1).join("\n\n") || "";

            return (
              <Card key={post.id} className="bg-white shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 font-semibold">
                          {post.family_members.full_name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {post.family_members.full_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatTimeAgo(post.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {post.post_type === "milestone" && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Milestone
                        </span>
                      )}
                      {post.post_type === "memory" && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                          Memory
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {title && (
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {title}
                    </h3>
                  )}
                  <p className="text-gray-800 mb-4">{description}</p>

                  {/* Placeholder for images */}
                  {post.image_urls && post.image_urls.length > 0 && (
                    <div className="mb-4 bg-gray-100 rounded-lg h-48 flex items-center justify-center">
                      <span className="text-gray-500">📸 Family Photos</span>
                    </div>
                  )}

                  {/* Post Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex space-x-6">
                      <form
                        action={togglePostReaction.bind(null, post.id, "heart")}
                      >
                        <Button
                          type="submit"
                          variant="ghost"
                          size="sm"
                          className="text-gray-500 hover:text-red-500"
                        >
                          <Heart className="w-4 h-4 mr-2" />0
                        </Button>
                      </form>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-blue-500"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />0
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-green-500"
                      >
                        <Share className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
