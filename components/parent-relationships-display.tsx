"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Trash2, User } from "lucide-react";
import { getParentRelationships, deleteParentRelationship, type FamilyMember } from "@/lib/actions/relationship-inference";
import { getInitials } from "@/lib/utils/display";
import { toast } from "sonner";
import Link from "next/link";

interface ParentRelationshipsDisplayProps {
  familyMemberId: string;
  isOwnProfile?: boolean;
  canEdit?: boolean;
}

export function ParentRelationshipsDisplay({ 
  familyMemberId, 
  isOwnProfile = false, 
  canEdit = false 
}: ParentRelationshipsDisplayProps) {
  const [parents, setParents] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadParents();
  }, [familyMemberId]);

  const loadParents = async () => {
    setLoading(true);
    try {
      console.log("ParentRelationshipsDisplay - Loading parents for family member ID:", familyMemberId);
      console.log("ParentRelationshipsDisplay - Component props:", { familyMemberId, isOwnProfile, canEdit });
      const parentList = await getParentRelationships(familyMemberId);
      console.log("ParentRelationshipsDisplay - Retrieved parents:", parentList);
      console.log("ParentRelationshipsDisplay - Parents count:", parentList.length);
      setParents(parentList);
    } catch (error) {
      console.error("ParentRelationshipsDisplay - Error loading parents:", error);
      toast.error("Failed to load parent relationships");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteParent = async (parentId: string) => {
    if (!canEdit) return;

    setDeleting(parentId);
    try {
      const result = await deleteParentRelationship(familyMemberId, parentId);
      
      if (result.success) {
        toast.success("Parent relationship deleted successfully!");
        await loadParents(); // Reload the list
      } else {
        toast.error(result.error || "Failed to delete parent relationship");
      }
    } catch (error) {
      console.error("Error deleting parent relationship:", error);
      toast.error("Failed to delete parent relationship");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <Card className="bg-card shadow-sm border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-card-foreground flex items-center gap-2">
            <Users className="w-5 h-5" />
            Parents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Loading parents...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card shadow-sm border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-card-foreground flex items-center gap-2">
          <Users className="w-5 h-5" />
          Parents
          {parents.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {parents.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {parents.length === 0 ? (
          <div className="text-center py-6">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {isOwnProfile ? "You don't have any parents assigned yet." : "No parents assigned."}
            </p>
            {isOwnProfile && (
              <p className="text-sm text-muted-foreground mt-1">
                Use the "Add Parent" button above to assign parents.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {parents.map((parent) => (
              <div
                key={parent.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <Link
                  href={`/protected/profile/${parent.id}`}
                  className="flex items-center space-x-3 hover:opacity-80 transition-opacity flex-1"
                >
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                    {parent.avatar_url ? (
                      <img
                        src={parent.avatar_url}
                        alt={parent.full_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-foreground font-semibold text-sm">
                        {getInitials(parent.full_name)}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{parent.full_name}</p>
                    <p className="text-sm text-muted-foreground">{parent.relationship}</p>
                  </div>
                </Link>
                {canEdit && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteParent(parent.id)}
                    disabled={deleting === parent.id}
                  >
                    {deleting === parent.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
