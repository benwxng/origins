"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { getGenderSpecificRelationship } from "@/lib/utils/relationships";

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  avatar_url?: string;
  is_inferred: boolean;
  generation: number;
  user_id?: string;
  pronouns?: string; // Added pronouns for gender-specific relationships
}

interface UserProfile {
  id: string;
  full_name: string;
  avatar_url?: string;
}

export default function GenerationFamilyTree() {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);


  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load family tree data
  useEffect(() => {
    async function loadFamilyTree() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          console.log("No user found");
          setIsLoading(false);
          return;
        }

        setCurrentUserId(user.id);

        console.log("Loading family tree for user:", user.id);

        // Get user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .eq("id", user.id)
          .single();

        console.log("User profile:", profile);
        setCurrentUserProfile(profile);

        // Get current user's family member ID
        const { data: userMember } = await supabase
          .from("family_members")
          .select("id, full_name, avatar_url, user_id, pronouns")
          .eq("user_id", user.id)
          .single();

        if (!userMember) {
          console.log("No family member record found for user");
          setIsLoading(false);
          return;
        }

        console.log("User family member ID:", userMember.id);

        // Get all direct parent-child relationships (just the relationship data)
        const { data: relationships } = await supabase
          .from("family_relationships")
          .select("*")
          .eq("relationship_type", "parent")
          .eq("is_inferred", false);

        console.log("Direct relationships:", relationships);

        if (!relationships || relationships.length === 0) {
          console.log("No relationships found");
          setIsLoading(false);
          return;
        }

        // Get all family members for reference
        const { data: allFamilyMembers } = await supabase
          .from("family_members")
          .select("id, full_name, avatar_url, user_id, pronouns");

        if (!allFamilyMembers) {
          console.log("No family members found");
          setIsLoading(false);
          return;
        }

        console.log("All family members:", allFamilyMembers);

        // Helper function to get family member by ID
        const getFamilyMemberById = (id: string) => {
          return allFamilyMembers.find(member => member.id === id);
        };

        // Build complete family tree by traversing up and down generations
        const allMembers = new Map<string, FamilyMember>();
        const processedIds = new Set<string>();

        // Add current user at generation 0
        const currentUser: FamilyMember = {
          id: userMember.id,
          name: userMember.full_name || "You",
          relationship: "self",
          avatar_url: userMember.avatar_url,
          is_inferred: false,
          generation: 0,
          user_id: userMember.user_id,
          pronouns: userMember.pronouns,
        };
        allMembers.set(userMember.id, currentUser);
        processedIds.add(userMember.id);

        // Function to traverse up the family tree (find ancestors)
        const traverseUp = (memberId: string, currentGeneration: number) => {
          const parentRels = relationships.filter(rel => rel.person_b_id === memberId);
          
          parentRels.forEach(rel => {
            const parentData = getFamilyMemberById(rel.person_a_id);
            if (parentData && !processedIds.has(parentData.id)) {
                      const parent: FamilyMember = {
                        id: parentData.id,
                        name: parentData.full_name || "Unknown",
                        relationship: "parent",
                        avatar_url: parentData.avatar_url,
                        is_inferred: false,
                        generation: currentGeneration - 1,
                        user_id: parentData.user_id,
                        pronouns: parentData.pronouns,
                      };
              allMembers.set(parentData.id, parent);
              processedIds.add(parentData.id);
              
              // Recursively find grandparents
              traverseUp(parentData.id, currentGeneration - 1);
            }
          });
        };

        // Function to traverse down the family tree (find descendants)
        const traverseDown = (memberId: string, currentGeneration: number) => {
          const childRels = relationships.filter(rel => rel.person_a_id === memberId);
          
          childRels.forEach(rel => {
            const childData = getFamilyMemberById(rel.person_b_id);
            if (childData && !processedIds.has(childData.id)) {
                      const child: FamilyMember = {
                        id: childData.id,
                        name: childData.full_name || "Unknown",
                        relationship: "child",
                        avatar_url: childData.avatar_url,
                        is_inferred: false,
                        generation: currentGeneration + 1,
                        user_id: childData.user_id,
                        pronouns: childData.pronouns,
                      };
              allMembers.set(childData.id, child);
              processedIds.add(childData.id);
              
              // Recursively find grandchildren
              traverseDown(childData.id, currentGeneration + 1);
            }
          });
        };

        // Start traversal from current user
        traverseUp(userMember.id, 0); // Find ancestors
        traverseDown(userMember.id, 0); // Find descendants

        console.log("All members after traversal:", Array.from(allMembers.values()));

        // Now find siblings and other relationships from the current user's perspective
        // Find siblings (people who share parents with current user)
        const currentUserParents = relationships
          .filter(rel => rel.person_b_id === userMember.id)
          .map(rel => rel.person_a_id);

        currentUserParents.forEach(parentId => {
          const siblingRels = relationships
            .filter(rel => rel.person_a_id === parentId && rel.person_b_id !== userMember.id);

          siblingRels.forEach(rel => {
            const siblingData = getFamilyMemberById(rel.person_b_id);
            if (siblingData && !processedIds.has(siblingData.id)) {
                      const siblingMember: FamilyMember = {
                        id: siblingData.id,
                        name: siblingData.full_name || "Unknown",
                        relationship: "sibling",
                        avatar_url: siblingData.avatar_url,
                        is_inferred: true,
                        generation: 0, // Same generation as current user
                        user_id: siblingData.user_id,
                        pronouns: siblingData.pronouns,
                      };
              allMembers.set(siblingData.id, siblingMember);
              processedIds.add(siblingData.id);
            }
          });
        });

        // Find aunts/uncles (siblings of current user's parents)
        currentUserParents.forEach(parentId => {
          const parentData = getFamilyMemberById(parentId);
          if (parentData) {
            // Find siblings of this parent
            const parentParents = relationships
              .filter(rel => rel.person_b_id === parentId)
              .map(rel => rel.person_a_id);

            parentParents.forEach(grandparentId => {
              const auntUncleRels = relationships
                .filter(rel => rel.person_a_id === grandparentId && rel.person_b_id !== parentId);

              auntUncleRels.forEach(rel => {
                const auntUncleData = getFamilyMemberById(rel.person_b_id);
                if (auntUncleData && !processedIds.has(auntUncleData.id)) {
                          const auntUncleMember: FamilyMember = {
                            id: auntUncleData.id,
                            name: auntUncleData.full_name || "Unknown",
                            relationship: "aunt_uncle", // Use generic aunt_uncle, will be gender-specific in display
                            avatar_url: auntUncleData.avatar_url,
                            is_inferred: true,
                            generation: -1, // Same generation as parents
                            user_id: auntUncleData.user_id,
                            pronouns: auntUncleData.pronouns,
                          };
                  allMembers.set(auntUncleData.id, auntUncleMember);
                  processedIds.add(auntUncleData.id);
                }
              });
            });
          }
        });

        // Convert map to array
        const allMembersArray = Array.from(allMembers.values());
        console.log("Final all members array:", allMembersArray);

        setFamilyMembers(allMembersArray);

      } catch (error) {
        console.error("Error loading family tree:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadFamilyTree();
  }, []);



  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading family tree...</div>
      </div>
    );
  }

  // Group members by generation for display
  const membersByGeneration = familyMembers.reduce((acc, member) => {
    if (!acc[member.generation]) {
      acc[member.generation] = [];
    }
    acc[member.generation].push(member);
    return acc;
  }, {} as { [key: number]: FamilyMember[] });

  const generationKeys = Object.keys(membersByGeneration).map(Number).sort((a, b) => a - b);

  return (
    <div className="w-full h-screen bg-background">
      <div className="p-4 border-b border-border">
        <h1 className="text-2xl font-bold text-foreground">Family Tree - Generation Chart</h1>
        <p className="text-muted-foreground">
          Scroll up and down to navigate generations | Each row represents a generation
        </p>
      </div>
      
      <div className="w-full h-full overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6 space-y-8">
          {generationKeys.map((generation) => {
            const members = membersByGeneration[generation];
            
            return (
              <div key={generation} className="space-y-4">
                {/* Generation Divider */}
                <div className="w-full h-px bg-border"></div>

                {/* Family Members in this Generation */}
                <div className="flex flex-wrap justify-center gap-6">
                  {members.map((member) => (
                    <Link
                      key={member.id}
                      href={member.user_id === currentUserId ? "/protected/profile" : `/protected/profile/${member.id}`}
                      className={`relative p-4 rounded-lg border-2 transition-all hover:shadow-md cursor-pointer ${
                        member.relationship === "self" 
                          ? "bg-primary/10 border-primary" 
                          : member.is_inferred 
                            ? "bg-muted/50 border-muted-foreground/30" 
                            : "bg-card border-border"
                      }`}
                    >
                      {/* Avatar */}
                      <div className="flex flex-col items-center space-y-2">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                          {member.avatar_url ? (
                            <img
                              src={member.avatar_url}
                              alt={member.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-lg font-semibold text-foreground">
                              {member.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        
                        {/* Name */}
                        <div className="text-center">
                          <h3 className="font-medium text-foreground text-sm">
                            {member.name}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {getGenderSpecificRelationship(member.relationship, member.pronouns)}
                          </p>
                        </div>
                      </div>

                      {/* Connection indicators */}
                      {member.relationship !== "self" && (
                        <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                          <div className={`w-2 h-2 rounded-full ${
                            member.is_inferred ? "bg-muted-foreground" : "bg-primary"
                          }`}></div>
                        </div>
                      )}
                    </Link>
                  ))}
                </div>

                {/* Connection lines to next generation */}
                {generation < Math.max(...generationKeys) && (
                  <div className="flex justify-center py-4">
                    <div className="w-px h-8 bg-border"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
