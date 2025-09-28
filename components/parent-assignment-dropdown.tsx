"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Users, Plus, Check, ChevronDown, UserPlus } from "lucide-react";
import {
  addParentRelationshipByFamilyMemberId,
  getAvailableParents,
  getAvailableChildren,
  type FamilyMember,
} from "@/lib/actions/relationship-inference";
import { getInitials } from "@/lib/utils/display";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface ParentAssignmentDropdownProps {
  currentUserId: string;
  targetFamilyMemberId?: string; // Optional: if provided, assign parent to this family member instead of current user
}

export function ParentAssignmentDropdown({
  currentUserId,
  targetFamilyMemberId,
}: ParentAssignmentDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<FamilyMember | null>(null);
  const [relationshipType] = useState<"parent">("parent");
  const [availablePeople, setAvailablePeople] = useState<FamilyMember[]>([]);
  const [currentUserFamilyMemberId, setCurrentUserFamilyMemberId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPersonDropdown, setShowPersonDropdown] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAvailablePeople();
    }
  }, [isOpen, currentUserId, targetFamilyMemberId]);

  const loadAvailablePeople = async () => {
    setIsLoading(true);
    try {
      // Get all family members to find current user's ID
      const allPeople = await getAvailableParents(currentUserId);
      
      // If targetFamilyMemberId is provided, use that; otherwise get current user's family member ID
      if (targetFamilyMemberId) {
        setCurrentUserFamilyMemberId(targetFamilyMemberId);
      } else {
        const supabase = await createClient();
        const { data: currentUserMember } = await supabase
          .from("family_members")
          .select("id")
          .eq("user_id", currentUserId)
          .single();
        
        if (currentUserMember) {
          setCurrentUserFamilyMemberId(currentUserMember.id);
        }
      }
      
      setAvailablePeople(allPeople);
    } catch (error) {
      console.error("Error loading available people:", error);
      toast.error("Failed to load family members");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedPerson || !currentUserFamilyMemberId) return;

    setIsSubmitting(true);
    try {
      // If targetFamilyMemberId is provided, assign parent to that family member
      // Otherwise, assign parent to current user
      const childId = targetFamilyMemberId || currentUserFamilyMemberId;
      const result = await addParentRelationshipByFamilyMemberId(childId, selectedPerson.id);

      if (result.success) {
        toast.success("Parent relationship added successfully!");
        console.log("Parent relationship added successfully");
        // Reset form
        setSelectedPerson(null);
        setIsOpen(false);
        // Refresh the page to show new relationships
        window.location.reload();
      } else {
        console.error("Failed to add parent relationship:", result.error);
        toast.error(result.error || "Failed to add parent relationship");
      }
    } catch (error) {
      console.error("Error adding parent relationship:", error);
      toast.error("Failed to add parent relationship");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSelectedPerson(null);
    }
  };


  return (
    <div className="w-full">
      {/* Toggle Button */}
      <Button
        onClick={toggleOpen}
        variant={isOpen ? "secondary" : "outline"}
        className="w-full justify-between"
        disabled={isLoading}
      >
        <span className="flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          {isOpen ? "Cancel Adding Parent" : targetFamilyMemberId ? "Assign Parent" : "Add Parent"}
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </Button>

      {/* Dropdown Content */}
      {isOpen && (
        <Card className="mt-3 border-2 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{targetFamilyMemberId ? "Assign Parent" : "Add Parent"}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {targetFamilyMemberId 
                ? "Select someone to be this family member's parent. All other family relationships will be automatically inferred."
                : "Select someone to be your parent. All other family relationships will be automatically inferred."
              }
            </p>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Person Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Select Family Member
              </Label>
              <div className="relative">
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => setShowPersonDropdown(!showPersonDropdown)}
                  disabled={availablePeople.length === 0}
                >
                  {selectedPerson ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center">
                        {selectedPerson.avatar_url ? (
                          <img
                            src={selectedPerson.avatar_url}
                            alt="Profile"
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-semibold text-muted-foreground">
                            {getInitials(selectedPerson.full_name)}
                          </span>
                        )}
                      </div>
                      <span className="text-sm">
                        {selectedPerson.full_name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">
                      {availablePeople.length === 0
                        ? "No family members found"
                        : targetFamilyMemberId ? "Choose a parent for this family member..." : "Choose a parent..."}
                    </span>
                  )}
                  <ChevronDown className="w-4 h-4" />
                </Button>

                {/* Person Dropdown */}
                {showPersonDropdown && availablePeople.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {availablePeople.map((person) => (
                      <button
                        key={person.id}
                        className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-3"
                        onClick={() => {
                          setSelectedPerson(person);
                          setShowPersonDropdown(false);
                        }}
                      >
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                          {person.avatar_url ? (
                            <img
                              src={person.avatar_url}
                              alt="Profile"
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-semibold text-muted-foreground">
                              {getInitials(person.full_name)}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground">
                            {person.full_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {person.relationship}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!selectedPerson || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding Relationship...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  {targetFamilyMemberId ? "Assign Parent" : "Add Parent"}
                </>
              )}
            </Button>

            {/* Selected Summary */}
            {selectedPerson && (
              <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm text-primary">
                  <strong>{selectedPerson.full_name}</strong> will be added as{" "}
                  {targetFamilyMemberId ? "this family member's" : "your"}{" "}
                  <strong>parent</strong>
                </p>
                <p className="text-xs text-primary/80 mt-1">
                  All other family relationships (siblings, grandparents, aunts/uncles, etc.) will be automatically inferred.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
