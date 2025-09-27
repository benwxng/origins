import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share } from "lucide-react";

export default async function FamilyFeedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  // Placeholder posts data - will be replaced with real data later
  const samplePosts = [
    {
      id: 1,
      author: "Sarah Johnson",
      content: "Just moved into my new apartment! The view is amazing 🏙️",
      timestamp: "2 hours ago",
      likes: 12,
      comments: 3,
      type: "milestone",
    },
    {
      id: 2,
      author: "Michael Johnson",
      content: "Baby took his first steps today! So proud 👶👣",
      timestamp: "1 day ago",
      likes: 24,
      comments: 8,
      type: "milestone",
    },
    {
      id: 3,
      author: "Eleanor Thompson",
      content:
        "Found some old photos from when the kids were little. Such precious memories! 📸",
      timestamp: "2 days ago",
      likes: 18,
      comments: 5,
      type: "memory",
    },
    {
      id: 4,
      author: "David Johnson",
      content:
        "Hiked to the summit this weekend. The fall colors are beautiful this year 🍂",
      timestamp: "3 days ago",
      likes: 15,
      comments: 4,
      type: "general",
    },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center py-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Family Feed</h1>
        <p className="text-gray-600">Stay connected with your loved ones</p>
      </div>

      {/* Create Post Card */}
      <Card className="bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="flex space-x-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold">
                {user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <textarea
                className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Share a memory, milestone, or update with your family..."
                rows={3}
              />
              <div className="flex justify-between items-center mt-4">
                <div className="flex space-x-4">
                  <Button variant="ghost" size="sm" className="text-gray-500">
                    📷 Photo
                  </Button>
                  <Button variant="ghost" size="sm" className="text-gray-500">
                    🎉 Milestone
                  </Button>
                  <Button variant="ghost" size="sm" className="text-gray-500">
                    💭 Memory
                  </Button>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700">Share</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts Feed */}
      <div className="space-y-4">
        {samplePosts.map((post) => (
          <Card key={post.id} className="bg-white shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-semibold">
                      {post.author
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{post.author}</p>
                    <p className="text-sm text-gray-500">{post.timestamp}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {post.type === "milestone" && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Milestone
                    </span>
                  )}
                  {post.type === "memory" && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                      Memory
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-gray-800 mb-4">{post.content}</p>

              {/* Placeholder for images */}
              {post.id === 3 && (
                <div className="mb-4 bg-gray-100 rounded-lg h-48 flex items-center justify-center">
                  <span className="text-gray-500">📸 Family Photos</span>
                </div>
              )}

              {/* Post Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex space-x-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-red-500"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    {post.likes}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-blue-500"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    {post.comments}
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
        ))}
      </div>
    </div>
  );
}
