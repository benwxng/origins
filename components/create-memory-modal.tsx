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
import { createMemory } from "@/lib/actions/memories";

interface FamilyMember {
  id: string;
  full_name: string;
  relationship: string;
}

interface CreateMemoryModalProps {
  children: React.ReactNode;
  familyMembers: FamilyMember[];
  initialTitle?: string;
}

export function CreateMemoryModal({
  children,
  familyMembers,
  initialTitle = "",
}: CreateMemoryModalProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState("");
  const [memoryDate, setMemoryDate] = useState("");
  const [tags, setTags] = useState("");
  const [familyMemberId, setFamilyMemberId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("memoryDate", memoryDate);
      formData.append("tags", tags);
      formData.append("familyMemberId", familyMemberId);

      await createMemory(formData);

      // Reset form
      setTitle("");
      setDescription("");
      setMemoryDate("");
      setTags("");
      setFamilyMemberId("");
      setOpen(false);
    } catch (error) {
      console.error("Error creating memory:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add a Family Memory</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Input */}
          <div className="space-y-2">
            <Label htmlFor="title">Memory Title</Label>
            <Input
              id="title"
              placeholder="What memory would you like to share?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <Label htmlFor="description">Memory Description</Label>
            <textarea
              id="description"
              className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[120px]"
              placeholder="Tell the story of this memory in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* Who is this memory about */}
          <div className="space-y-2">
            <Label htmlFor="familyMember">Who is this memory about?</Label>
            <select
              id="familyMember"
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={familyMemberId}
              onChange={(e) => setFamilyMemberId(e.target.value)}
            >
              <option value="">Select a family member (optional)</option>
              {familyMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.full_name} ({member.relationship})
                </option>
              ))}
            </select>
          </div>

          {/* Memory Date */}
          <div className="space-y-2">
            <Label htmlFor="memoryDate">When did this happen? (optional)</Label>
            <Input
              id="memoryDate"
              type="date"
              value={memoryDate}
              onChange={(e) => setMemoryDate(e.target.value)}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (optional)</Label>
            <Input
              id="tags"
              placeholder="wedding, childhood, vacation, holiday (comma separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Add tags to help organize and find this memory later
            </p>
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
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? "Saving..." : "Save Memory"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
