"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit } from "lucide-react";
import { updateFamilyMember, getFamilyMemberById } from "@/lib/actions/family-members";
import { toast } from "sonner";

const pronounOptions = [
  "he/him",
  "she/her",
  "they/them",
  "he/they",
  "she/they",
  "other",
];

interface EditFamilyMemberModalProps {
  memberId: string;
  currentData: {
    full_name: string;
    bio?: string | null;
    phone_number?: string | null;
    pronouns?: string | null;
  };
}

export function EditFamilyMemberModal({ memberId, currentData }: EditFamilyMemberModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    bio: "",
    phone_number: "",
    pronouns: "",
  });

  useEffect(() => {
    if (currentData) {
      setFormData({
        full_name: currentData.full_name || "",
        bio: currentData.bio || "",
        phone_number: currentData.phone_number || "",
        pronouns: currentData.pronouns || "",
      });
    }
  }, [currentData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await updateFamilyMember(memberId, {
        full_name: formData.full_name,
        bio: formData.bio || null,
        phone_number: formData.phone_number || null,
        pronouns: formData.pronouns || null,
      });

      if (result.success) {
        toast.success("Family member updated successfully!");
        setOpen(false);
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        toast.error(result.error || "Failed to update family member");
      }
    } catch (error) {
      console.error("Error updating family member:", error);
      toast.error("Failed to update family member");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const phoneNumber = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (phoneNumber.length >= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    } else if (phoneNumber.length >= 3) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    } else if (phoneNumber.length > 0) {
      return `(${phoneNumber}`;
    }
    return phoneNumber;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    handleInputChange('phone_number', formatted);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-1" />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Family Member</DialogTitle>
          <DialogDescription>
            Update the information for this family member.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="full_name" className="text-right">
                Full Name *
              </Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => handleInputChange("full_name", e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bio" className="text-right">
                Bio
              </Label>
              <Input
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                className="col-span-3"
                placeholder="Brief description..."
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone_number" className="text-right">
                Phone
              </Label>
              <Input
                id="phone_number"
                value={formData.phone_number}
                onChange={handlePhoneChange}
                className="col-span-3"
                placeholder="(555) 123-4567"
                maxLength={14}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pronouns" className="text-right">
                Pronouns
              </Label>
              <select
                id="pronouns"
                value={formData.pronouns}
                onChange={(e) => handleInputChange("pronouns", e.target.value)}
                className="col-span-3 h-10 px-3 py-2 border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
              >
                <option value="">Select pronouns</option>
                {pronounOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Family Member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
