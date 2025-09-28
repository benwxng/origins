"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const generationVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1,
    },
  },
};

const memberVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
  hover: {
    scale: 1.05,
    y: -5,
    transition: {
      duration: 0.2,
    },
  },
  tap: {
    scale: 0.95,
    transition: {
      duration: 0.1,
    },
  },
};

const avatarVariants = {
  hidden: { scale: 0 },
  visible: {
    scale: 1,
    transition: {
      duration: 0.6,
    },
  },
};

const loadingVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export default function GenerationFamilyTree() {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [currentUserProfile, setCurrentUserProfile] =
    useState<UserProfile | null>(null);
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

        console.log("All family members:", allFamilyMembers);

        if (!allFamilyMembers) {
          console.log("No family members found");
          setIsLoading(false);
          return;
        }

        // Helper function to get family member data by ID
        const getFamilyMemberById = (id: string) => {
          return allFamilyMembers.find((member) => member.id === id);
        };

        // Build the family tree starting from direct relationships
        const allMembers = new Map<string, FamilyMember>();
        const processedIds = new Set<string>();

        // Add current user first
        const currentUserData = getFamilyMemberById(userMember.id);
        if (currentUserData) {
          const currentUserMember: FamilyMember = {
            id: currentUserData.id,
            name: currentUserData.full_name || "You",
            relationship: "self",
            avatar_url: currentUserData.avatar_url,
            is_inferred: false,
            generation: 0,
            user_id: currentUserData.user_id,
            pronouns: currentUserData.pronouns,
          };
          allMembers.set(currentUserData.id, currentUserMember);
          processedIds.add(currentUserData.id);
        }

        // Find current user's parents
        const currentUserParents = relationships
          .filter((rel) => rel.person_b_id === userMember.id)
          .map((rel) => rel.person_a_id);

        console.log("Current user parents:", currentUserParents);

        // Add parents (generation -1)
        currentUserParents.forEach((parentId) => {
          const parentData = getFamilyMemberById(parentId);
          if (parentData && !processedIds.has(parentData.id)) {
            const parentMember: FamilyMember = {
              id: parentData.id,
              name: parentData.full_name || "Unknown",
              relationship: "parent",
              avatar_url: parentData.avatar_url,
              is_inferred: false,
              generation: -1,
              user_id: parentData.user_id,
              pronouns: parentData.pronouns,
            };
            allMembers.set(parentData.id, parentMember);
            processedIds.add(parentData.id);
          }
        });

        // Find current user's children
        const currentUserChildren = relationships
          .filter((rel) => rel.person_a_id === userMember.id)
          .map((rel) => rel.person_b_id);

        console.log("Current user children:", currentUserChildren);

        // Add children (generation +1)
        currentUserChildren.forEach((childId) => {
          const childData = getFamilyMemberById(childId);
          if (childData && !processedIds.has(childData.id)) {
            const childMember: FamilyMember = {
              id: childData.id,
              name: childData.full_name || "Unknown",
              relationship: "child",
              avatar_url: childData.avatar_url,
              is_inferred: false,
              generation: 1,
              user_id: childData.user_id,
              pronouns: childData.pronouns,
            };
            allMembers.set(childData.id, childMember);
            processedIds.add(childData.id);
          }
        });

        // Find grandparents (parents of parents)
        currentUserParents.forEach((parentId) => {
          const grandparents = relationships
            .filter((rel) => rel.person_b_id === parentId)
            .map((rel) => rel.person_a_id);

          grandparents.forEach((grandparentId) => {
            const grandparentData = getFamilyMemberById(grandparentId);
            if (grandparentData && !processedIds.has(grandparentData.id)) {
              const grandparentMember: FamilyMember = {
                id: grandparentData.id,
                name: grandparentData.full_name || "Unknown",
                relationship: "grandparent",
                avatar_url: grandparentData.avatar_url,
                is_inferred: true,
                generation: -2,
                user_id: grandparentData.user_id,
                pronouns: grandparentData.pronouns,
              };
              allMembers.set(grandparentData.id, grandparentMember);
              processedIds.add(grandparentData.id);
            }
          });
        });

        // Find grandchildren (children of children)
        currentUserChildren.forEach((childId) => {
          const grandchildren = relationships
            .filter((rel) => rel.person_a_id === childId)
            .map((rel) => rel.person_b_id);

          grandchildren.forEach((grandchildId) => {
            const grandchildData = getFamilyMemberById(grandchildId);
            if (grandchildData && !processedIds.has(grandchildData.id)) {
              const grandchildMember: FamilyMember = {
                id: grandchildData.id,
                name: grandchildData.full_name || "Unknown",
                relationship: "grandchild",
                avatar_url: grandchildData.avatar_url,
                is_inferred: true,
                generation: 2,
                user_id: grandchildData.user_id,
                pronouns: grandchildData.pronouns,
              };
              allMembers.set(grandchildData.id, grandchildMember);
              processedIds.add(grandchildData.id);
            }
          });
        });

        // Find siblings (people who share the same parents as current user)
        currentUserParents.forEach((parentId) => {
          const siblingRels = relationships.filter(
            (rel) =>
              rel.person_a_id === parentId && rel.person_b_id !== userMember.id
          );

          siblingRels.forEach((rel) => {
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
        currentUserParents.forEach((parentId) => {
          const parentData = getFamilyMemberById(parentId);
          if (parentData) {
            // Find siblings of this parent
            const parentParents = relationships
              .filter((rel) => rel.person_b_id === parentId)
              .map((rel) => rel.person_a_id);

            parentParents.forEach((grandparentId) => {
              const auntUncleRels = relationships.filter(
                (rel) =>
                  rel.person_a_id === grandparentId &&
                  rel.person_b_id !== parentId
              );

              auntUncleRels.forEach((rel) => {
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
      <motion.div
        className="flex items-center justify-center h-96"
        variants={loadingVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="text-muted-foreground text-center"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <motion.div
            className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          Loading family tree...
        </motion.div>
      </motion.div>
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

  const generationKeys = Object.keys(membersByGeneration)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <motion.div
      className="w-full h-screen bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="p-4 border-b border-border"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1
          className="text-2xl font-bold text-foreground"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Family Tree - Generation Chart
        </motion.h1>
        <motion.p
          className="text-muted-foreground"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Scroll up and down to navigate generations | Each row represents a
          generation
        </motion.p>
      </motion.div>

      <div className="w-full h-full overflow-y-auto">
        <motion.div
          className="max-w-6xl mx-auto p-6 space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence>
            {generationKeys.map((generation, generationIndex) => {
              const members = membersByGeneration[generation];

              return (
                <motion.div
                  key={generation}
                  className="space-y-4"
                  variants={generationVariants}
                  custom={generationIndex}
                >
                  {/* Generation Divider */}
                  <motion.div
                    className="w-full h-px bg-border"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: generationIndex * 0.1 }}
                  />

                  {/* Family Members in this Generation */}
                  <motion.div
                    className="flex flex-wrap justify-center gap-6"
                    variants={containerVariants}
                  >
                    {members.map((member, memberIndex) => (
                      <motion.div
                        key={member.id}
                        variants={memberVariants}
                        whileHover="hover"
                        whileTap="tap"
                        custom={memberIndex}
                        layout
                      >
                        <Link
                          href={
                            member.user_id === currentUserId
                              ? "/protected/profile"
                              : `/protected/profile/${member.id}`
                          }
                          className={`relative p-4 rounded-lg border-2 transition-all cursor-pointer block ${
                            member.relationship === "self"
                              ? "bg-primary/10 border-primary"
                              : member.is_inferred
                              ? "bg-muted/50 border-muted-foreground/30"
                              : "bg-card border-border"
                          }`}
                        >
                          {/* Avatar */}
                          <div className="flex flex-col items-center space-y-2">
                            <motion.div
                              className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden"
                              variants={avatarVariants}
                            >
                              {member.avatar_url ? (
                                <motion.img
                                  src={member.avatar_url}
                                  alt={member.name}
                                  className="w-full h-full object-cover"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ duration: 0.3 }}
                                />
                              ) : (
                                <motion.span
                                  className="text-lg font-semibold text-foreground"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ duration: 0.3, delay: 0.1 }}
                                >
                                  {member.name.charAt(0)}
                                </motion.span>
                              )}
                            </motion.div>

                            {/* Name */}
                            <motion.div
                              className="text-center"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.4, delay: 0.2 }}
                            >
                              <h3 className="font-medium text-foreground text-sm">
                                {member.name}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                {getGenderSpecificRelationship(
                                  member.relationship,
                                  member.pronouns
                                )}
                              </p>
                            </motion.div>
                          </div>

                          {/* Connection indicators */}
                          {member.relationship !== "self" && (
                            <motion.div
                              className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center"
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ duration: 0.4, delay: 0.3 }}
                            >
                              <motion.div
                                className={`w-2 h-2 rounded-full ${
                                  member.is_inferred
                                    ? "bg-muted-foreground"
                                    : "bg-primary"
                                }`}
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              />
                            </motion.div>
                          )}
                        </Link>
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Connection lines to next generation */}
                  {generation < Math.max(...generationKeys) && (
                    <motion.div
                      className="flex justify-center py-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                    >
                      <motion.div
                        className="w-px h-8 bg-border"
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                      />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
}
