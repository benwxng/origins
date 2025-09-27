"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, MoreHorizontal, Trash2, Calendar, User } from "lucide-react";
import { toggleFavoriteMemory, deleteMemory } from "@/lib/actions/memories";

interface MemoryCardProps {
  memory: any;
}

export function MemoryCard({ memory }: MemoryCardProps) {
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this memory? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteMemory(memory.id);
      setShowDeleteMenu(false);
    } catch (error) {
      console.error("Error deleting memory:", error);
      alert("Failed to delete memory. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      await toggleFavoriteMemory(memory.id);
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  return (
    <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg mb-1">
              {memory.title}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              {memory.memory_date && (
                <div className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(memory.memory_date).toLocaleDateString()}
                </div>
              )}
              {memory.family_members && (
                <div className="flex items-center">
                  <User className="w-3 h-3 mr-1" />
                  {memory.family_members.full_name}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 ${
                memory.is_favorite ? "text-yellow-500" : "text-gray-400"
              }`}
              onClick={handleToggleFavorite}
            >
              <Star
                className={`w-4 h-4 ${
                  memory.is_favorite ? "fill-current" : ""
                }`}
              />
            </Button>
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
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Memory Image Placeholder */}
        {memory.image_urls && memory.image_urls.length > 0 && (
          <div className="mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg h-32 flex items-center justify-center">
            <span className="text-gray-500 text-sm">📸 Memory Photos</span>
          </div>
        )}

        <p className="text-gray-700 text-sm leading-relaxed mb-4">
          {memory.description}
        </p>

        {/* Tags */}
        {memory.tags && memory.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {memory.tags.map((tag: string, index: number) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Created by info */}
        {memory.created_by_member && (
          <div className="text-xs text-gray-500 mt-4 pt-3 border-t border-gray-100">
            Added by {memory.created_by_member.full_name}
          </div>
        )}
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
