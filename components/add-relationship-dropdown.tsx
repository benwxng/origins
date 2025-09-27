"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Check, ChevronDown, User } from "lucide-react";
import { addFamilyRelationship, getFamilyMembers } from "@/lib/actions/relationships";
import { RELATIONSHIP_OPTIONS, type FamilyMember } from "@/lib/utils/relationships";
import { getInitials } from "@/lib/utils/display";

interface AddRelationshipDropdownProps {
  currentUserId: string;
  onRelationshipAdded?: () => void;
}

export function AddRelationshipDropdown({ currentUserId, onRelationshipAdded }: AddRelationshipDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<FamilyMember | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<string>("");
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPersonDropdown, setShowPersonDropdown] = useState(false);
  const [showRelationshipDropdown, setShowRelationshipDropdown] = useState(false);

  useEffect(() => {
    loadFamilyMembers();
  }, [currentUserId]);

  const loadFamilyMembers = async () => {
    setIsLoading(true);
    try {
      const members = await getFamilyMembers();
      // Filter out the current user
      setFamilyMembers(members.filter(member => member.id !== currentUserId));
    } catch (error) {
      console.error("Error loading family members:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedPerson || !selectedRelationship) return;

    setIsSubmitting(true);
    try {
      const result = await addFamilyRelationship(selectedPerson.id, selectedRelationship);
      
      if (result.success) {
        // Reset form
        setSelectedPerson(null);
        setSelectedRelationship("");
        setIsOpen(false);
        onRelationshipAdded?.();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error adding relationship:", error);
      alert("Failed to add relationship. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSelectedPerson(null);
      setSelectedRelationship("");
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
          <Users className="w-4 h-4" />
          {isOpen ? "Cancel Adding Relationship" : "Add Family Relationship"}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </Button>

      {/* Dropdown Content */}
      {isOpen && (
        <Card className="mt-3 border-2 border-blue-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Add Family Relationship</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Person Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Select Family Member</Label>
              <div className="relative">
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => setShowPersonDropdown(!showPersonDropdown)}
                  disabled={familyMembers.length === 0}
                >
                  {selectedPerson ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                        {selectedPerson.avatar_url ? (
                          <img
                            src={selectedPerson.avatar_url}
                            alt="Profile"
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-semibold text-gray-600">
                            {getInitials(selectedPerson.full_name)}
                          </span>
                        )}
                      </div>
                      <span className="text-sm">{selectedPerson.full_name}</span>
                    </div>
                  ) : (
                    <span className="text-gray-500">
                      {familyMembers.length === 0 ? "No family members found" : "Choose a family member..."}
                    </span>
                  )}
                  <ChevronDown className="w-4 h-4" />
                </Button>

                {/* Person Dropdown */}
                {showPersonDropdown && familyMembers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {familyMembers.map((member) => (
                      <button
                        key={member.id}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                        onClick={() => {
                          setSelectedPerson(member);
                          setShowPersonDropdown(false);
                        }}
                      >
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          {member.avatar_url ? (
                            <img
                              src={member.avatar_url}
                              alt="Profile"
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-semibold text-gray-600">
                              {getInitials(member.full_name)}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{member.full_name}</p>
                          <p className="text-xs text-gray-500">@{member.username}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Relationship Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {selectedPerson ? `What is your relationship to ${selectedPerson.full_name}?` : "Select Your Relationship"}
              </Label>
              <p className="text-xs text-gray-500">
                Define how you are related to this person (from your perspective)
              </p>
              <div className="relative">
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => setShowRelationshipDropdown(!showRelationshipDropdown)}
                  disabled={!selectedPerson}
                >
                  {selectedRelationship ? (
                    <span className="text-sm">
                      {RELATIONSHIP_OPTIONS.find(opt => opt.value === selectedRelationship)?.label}
                    </span>
                  ) : (
                    <span className="text-gray-500">Choose relationship...</span>
                  )}
                  <ChevronDown className="w-4 h-4" />
                </Button>

                {/* Relationship Dropdown */}
                {showRelationshipDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {RELATIONSHIP_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50"
                        onClick={() => {
                          setSelectedRelationship(option.value);
                          setShowRelationshipDropdown(false);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{option.label}</p>
                            <p className="text-xs text-gray-500">{option.description}</p>
                          </div>
                          {selectedRelationship === option.value && (
                            <Check className="w-4 h-4 text-blue-600" />
                          )}
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
              disabled={!selectedPerson || !selectedRelationship || isSubmitting}
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
                  Add Relationship
                </>
              )}
            </Button>

            {/* Selected Summary */}
            {selectedPerson && selectedRelationship && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>{selectedPerson.full_name}</strong> will be added as your{" "}
                  <strong>{RELATIONSHIP_OPTIONS.find(opt => opt.value === selectedRelationship)?.label}</strong>
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  The system will automatically infer other family relationships.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
