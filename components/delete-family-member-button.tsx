"use client";

import { useState } from "react";
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
import { Trash2 } from "lucide-react";
import { deleteFamilyMember } from "@/lib/actions/family-members";
import { toast } from "sonner";

interface DeleteFamilyMemberButtonProps {
  memberId: string;
  memberName: string;
}

export function DeleteFamilyMemberButton({ memberId, memberName }: DeleteFamilyMemberButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);

    try {
      const result = await deleteFamilyMember(memberId);

      if (result.success) {
        toast.success("Family member deleted successfully!");
        setOpen(false);
      } else {
        toast.error(result.error || "Failed to delete family member");
      }
    } catch (error) {
      console.error("Error deleting family member:", error);
      toast.error("Failed to delete family member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Family Member</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{memberName}</strong>? This action cannot be undone.
            <br />
            <br />
            <strong>Note:</strong> This family member must not have any relationships or posts before deletion.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
