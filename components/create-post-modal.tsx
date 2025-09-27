"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Upload, X, Image as ImageIcon } from "lucide-react";
import { createPost } from "@/lib/actions/posts";

interface CreatePostModalProps {
  children: React.ReactNode;
}

export function CreatePostModal({ children }: CreatePostModalProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [postType, setPostType] = useState<"general" | "milestone" | "memory">(
    "general"
  );
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages((prev) => [...prev, ...files].slice(0, 5)); // Max 5 images
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("postType", postType);

      images.forEach((image, index) => {
        formData.append(`image-${index}`, image);
      });

      await createPost(formData);

      // Reset form
      setTitle("");
      setDescription("");
      setPostType("general");
      setImages([]);
      setOpen(false);
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Share with your family</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Input */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="What would you like to share?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px]"
              placeholder="Tell your family about this moment..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* Post Type Selection */}
          <div className="space-y-2">
            <Label>Post Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={postType === "general" ? "default" : "outline"}
                size="sm"
                onClick={() => setPostType("general")}
              >
                📝 General
              </Button>
              <Button
                type="button"
                variant={postType === "milestone" ? "default" : "outline"}
                size="sm"
                onClick={() => setPostType("milestone")}
              >
                🎉 Milestone
              </Button>
              <Button
                type="button"
                variant={postType === "memory" ? "default" : "outline"}
                size="sm"
                onClick={() => setPostType("memory")}
              >
                💭 Memory
              </Button>
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Photos (optional)</Label>
            <div className="space-y-3">
              {/* Upload Button */}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <Label
                  htmlFor="image-upload"
                  className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Upload Photos
                </Label>
                <span className="text-sm text-gray-500">
                  {images.length}/5 photos
                </span>
              </div>

              {/* Image Preview */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {images.map((image, index) => (
                    <Card key={index} className="relative">
                      <CardContent className="p-2">
                        <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center relative overflow-hidden">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 h-6 w-6 p-0"
                            onClick={() => removeImage(index)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || !description.trim() || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? "Sharing..." : "Share Post"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
