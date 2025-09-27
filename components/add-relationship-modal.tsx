"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, User } from "lucide-react";
import { addFamilyRelationship, getFamilyMembers } from "@/lib/actions/relationships";
import { RELATIONSHIP_OPTIONS, type FamilyMember } from "@/lib/utils/relationships";
import { getInitials } from "@/lib/utils/display";

interface AddRelationshipModalProps {
  children: React.ReactNode;
  currentUserId: string;
}

export function AddRelationshipModal({ children, currentUserId }: AddRelationshipModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'select-person' | 'select-relationship'>('select-person');
  const [selectedPerson, setSelectedPerson] = useState<FamilyMember | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<string>("");
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpen = async () => {
    setIsOpen(true);
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

  const handleClose = () => {
    setIsOpen(false);
    setStep('select-person');
    setSelectedPerson(null);
    setSelectedRelationship("");
    setFamilyMembers([]);
  };

  const handlePersonSelect = (person: FamilyMember) => {
    setSelectedPerson(person);
    setStep('select-relationship');
  };

  const handleRelationshipSelect = (relationshipType: string) => {
    setSelectedRelationship(relationshipType);
  };

  const handleSubmit = async () => {
    if (!selectedPerson || !selectedRelationship) return;

    setIsSubmitting(true);
    try {
      const result = await addFamilyRelationship(selectedPerson.id, selectedRelationship);
      
      if (result.success) {
        handleClose();
        // Optionally show success message
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild onClick={handleOpen}>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Add Family Relationship
          </DialogTitle>
        </DialogHeader>

        {step === 'select-person' && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Select a family member to establish your relationship with:
            </p>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading family members...</p>
              </div>
            ) : familyMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No other family members found.</p>
                <p className="text-sm text-gray-400 mt-1">
                  Invite more family members to start building your family tree!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {familyMembers.map((member) => (
                  <Card
                    key={member.id}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handlePersonSelect(member)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          {member.avatar_url ? (
                            <img
                              src={member.avatar_url}
                              alt="Profile"
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-600 font-semibold text-sm">
                              {getInitials(member.full_name)}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{member.full_name}</p>
                          <p className="text-sm text-gray-500">@{member.username}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 'select-relationship' && selectedPerson && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                {selectedPerson.avatar_url ? (
                  <img
                    src={selectedPerson.avatar_url}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-gray-600 font-semibold text-sm">
                    {getInitials(selectedPerson.full_name)}
                  </span>
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">{selectedPerson.full_name}</p>
                <p className="text-sm text-gray-500">@{selectedPerson.username}</p>
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">How is this person related to you?</Label>
              <p className="text-sm text-gray-600 mb-4">
                Select the relationship that best describes how {selectedPerson.full_name} is related to you.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {RELATIONSHIP_OPTIONS.map((option) => (
                <Card
                  key={option.value}
                  className={`cursor-pointer transition-colors ${
                    selectedRelationship === option.value
                      ? 'ring-2 ring-blue-500 bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleRelationshipSelect(option.value)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{option.label}</p>
                        <p className="text-sm text-gray-600">{option.description}</p>
                      </div>
                      {selectedRelationship === option.value && (
                        <Badge variant="default">Selected</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setStep('select-person')}
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!selectedRelationship || isSubmitting}
                className="flex-1"
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
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
