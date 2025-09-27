"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Heart,
  MessageCircle,
  Share,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { togglePostReaction, deletePost } from "@/lib/actions/posts";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

interface PostCardProps {
  post: any;
}

export function PostCard({ post }: PostCardProps) {
  const [timeAgo, setTimeAgo] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Update time on client side to avoid hydration mismatch
  useEffect(() => {
    setTimeAgo(formatTimeAgo(post.created_at));
  }, [post.created_at]);

  // Get current user to check if they can delete this post
  useEffect(() => {
    const getCurrentUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  // Parse content to get title and description
  const contentLines = post.content.split("\n\n");
  const title = contentLines[0] || "";
  const description = contentLines.slice(1).join("\n\n") || "";

  // Check if current user is the author of this post
  const canDelete = currentUserId === post.family_members.user_id;

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this post? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await deletePost(post.id);
      setShowDeleteMenu(false);
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="bg-white shadow-sm">
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
              <p className="text-sm text-gray-500" suppressHydrationWarning>
                {timeAgo}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Post Type Badges */}
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

            {/* Delete Menu for Post Author */}
            {canDelete && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowDeleteMenu(!showDeleteMenu)}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>

                {showDeleteMenu && (
                  <div className="absolute right-0 top-8 z-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {isDeleting ? "Deleting..." : "Delete Post"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Text Content */}
        {title && <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>}
        <p className="text-gray-800 mb-4">{description}</p>

        {/* Images - Preserve aspect ratio, natural positioning */}
        {post.image_urls && post.image_urls.length > 0 && (
          <div className="space-y-3">
            {post.image_urls.map((imageUrl: string, index: number) => (
              <div key={index} className="flex justify-start">
                <div className="relative inline-block rounded-lg overflow-hidden max-w-full">
                  <Image
                    src={imageUrl}
                    alt={`Family photo ${index + 1}`}
                    width={0}
                    height={0}
                    sizes="100vw"
                    className="w-auto h-auto max-w-full max-h-96 object-contain"
                    style={{ width: "auto", height: "auto" }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Post Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
          <div className="flex space-x-6">
            <form action={togglePostReaction.bind(null, post.id, "heart")}>
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

      {/* Overlay to close delete menu when clicking outside */}
      {showDeleteMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowDeleteMenu(false)}
        />
      )}
    </Card>
  );
}
