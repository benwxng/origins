"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface FamilyMember {
  id: string;
  full_name: string;
  relationship: string;
  user_id?: string;
  profile_image_url?: string;
}

export async function getFamilyMembers(): Promise<FamilyMember[]> {
  const supabase = await createClient();

  const { data: members, error } = await supabase
    .from("family_members")
    .select("id, full_name, relationship, user_id, avatar_url")
    .order("full_name");

  console.log("getFamilyMembers - Raw data:", members); // Debug log
  console.log("getFamilyMembers - Error:", error); // Debug log

  if (error) {
    console.error("Error fetching family members:", error);
    return [];
  }

  console.log("getFamilyMembers - Returning:", members || []); // Debug log
  return members || [];
}

export async function addFamilyRelationship(
  relatedPersonId: string,
  relationshipType: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    // Get current user's family member record
    const { data: currentMember } = await supabase
      .from("family_members")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!currentMember) {
      return { success: false, error: "Family member record not found" };
    }

    // Get the related person's info
    const { data: relatedMember } = await supabase
      .from("family_members")
      .select("id, full_name")
      .eq("id", relatedPersonId)
      .single();

    if (!relatedMember) {
      return { success: false, error: "Related family member not found" };
    }

    // Check if relationship already exists
    const { data: existingRelationship } = await supabase
      .from("family_relationships")
      .select("id")
      .eq("person_a_id", currentMember.id)
      .eq("person_b_id", relatedPersonId)
      .eq("relationship_type", relationshipType)
      .single();

    if (existingRelationship) {
      return { success: false, error: "This relationship already exists" };
    }

    // Create the relationship (using actual column names: person_a_id, person_b_id)
    const { error: relationshipError } = await supabase
      .from("family_relationships")
      .insert({
        person_a_id: currentMember.id,
        person_b_id: relatedPersonId,
        relationship_type: relationshipType,
        is_inferred: false,
      });

    if (relationshipError) {
      console.error("Error creating relationship:", relationshipError);
      return { success: false, error: relationshipError.message };
    }

    // Create the reverse relationship
    const reverseRelationship = getReverseRelationship(relationshipType);
    if (reverseRelationship) {
      // Check if reverse relationship already exists
      const { data: existingReverse } = await supabase
        .from("family_relationships")
        .select("id")
        .eq("person_a_id", relatedPersonId)
        .eq("person_b_id", currentMember.id)
        .eq("relationship_type", reverseRelationship)
        .single();

      if (!existingReverse) {
        await supabase.from("family_relationships").insert({
          person_a_id: relatedPersonId,
          person_b_id: currentMember.id,
          relationship_type: reverseRelationship,
          is_inferred: false,
        });
      }
    }

    revalidatePath("/protected");
    revalidatePath("/protected/family-tree");
    return { success: true };
  } catch (error: any) {
    console.error("Error adding family relationship:", error);
    return { success: false, error: error.message };
  }
}

// Generate all relationships dynamically (simpler approach)
export async function generateUserRelationships(userId: string) {
  const supabase = await createClient();

  try {
    // Get family member ID for this user
    const { data: userMember } = await supabase
      .from("family_members")
      .select("id")
      .eq("user_id", userId)
      .single();

    console.log("generateUserRelationships - User ID:", userId);
    console.log("generateUserRelationships - User Member:", userMember);

    if (!userMember) {
      console.log("generateUserRelationships - No user member found, returning empty array");
      return [];
    }

    // Get only direct parent relationships (no inferred ones)
    const { data: directRelationships, error } = await supabase
      .from("family_relationships")
      .select("*")
      .eq("is_inferred", false);

    if (error) {
      console.error("Error fetching direct relationships:", error);
      return [];
    }

    console.log("generateUserRelationships - Direct relationships:", directRelationships);

    if (!directRelationships || directRelationships.length === 0) {
      return [];
    }

    // Get all family members
    const { data: familyMembers } = await supabase
      .from("family_members")
      .select("id, full_name, relationship, user_id, avatar_url, pronouns");

    if (!familyMembers) {
      return [];
    }

    // Generate all relationships for the current user
    const userRelationships = [];
    const processedIds = new Set<string>();

    // Find relationships where current user is involved
    for (const rel of directRelationships) {
      let relatedMemberId = null;
      let relationshipType = null;

      console.log(`Processing relationship: person_a_id=${rel.person_a_id}, person_b_id=${rel.person_b_id}, userMember.id=${userMember.id}`);

      if (rel.person_a_id === userMember.id) {
        // Current user is person_a (parent), so person_b is their child
        relatedMemberId = rel.person_b_id;
        relationshipType = "child";
        console.log(`Found child relationship: ${relatedMemberId}`);
      } else if (rel.person_b_id === userMember.id) {
        // Current user is person_b (child), so person_a is their parent
        relatedMemberId = rel.person_a_id;
        relationshipType = "parent";
        console.log(`Found parent relationship: ${relatedMemberId}`);
      } else {
        console.log(`Relationship not involving current user`);
      }

      if (relatedMemberId && !processedIds.has(relatedMemberId)) {
        const relatedMember = familyMembers.find(m => m.id === relatedMemberId);
        console.log(`Looking for family member with ID: ${relatedMemberId}`);
        console.log(`Found family member:`, relatedMember);
        if (relatedMember) {
          userRelationships.push({
            ...rel,
            person_b: {
              id: relatedMember.id,
              full_name: relatedMember.full_name,
              relationship: relatedMember.relationship,
              user_id: relatedMember.user_id,
              avatar_url: relatedMember.avatar_url,
              pronouns: relatedMember.pronouns,
              username: relatedMember.full_name?.toLowerCase().replace(/\s+/g, "") || "unknown",
            },
            relationship_type: relationshipType,
            is_inferred: false
          });
          processedIds.add(relatedMemberId);
        }
      }
    }

    // Now generate inferred relationships (siblings, etc.)
    const inferredRelationships = generateInferredRelationships(userMember.id, directRelationships, familyMembers);
    userRelationships.push(...inferredRelationships);

    console.log("generateUserRelationships - Final relationships:", userRelationships);
    return userRelationships;
  } catch (error) {
    console.error("Error generating user relationships:", error);
    return [];
  }
}

// Helper function to generate inferred relationships
function generateInferredRelationships(userId: string, directRelationships: any[], familyMembers: any[]) {
  const inferred = [];
  const processedIds = new Set<string>();

  // Find siblings (people who share the same parents)
  const userParents = directRelationships
    .filter(rel => rel.person_b_id === userId && rel.relationship_type === "parent")
    .map(rel => rel.person_a_id);

  console.log("generateInferredRelationships - User parents:", userParents);

  for (const parentId of userParents) {
    // Find other children of the same parent
    const siblings = directRelationships
      .filter(rel => rel.person_a_id === parentId && rel.person_b_id !== userId && rel.relationship_type === "parent")
      .map(rel => rel.person_b_id);

    for (const siblingId of siblings) {
      if (!processedIds.has(siblingId)) {
        const sibling = familyMembers.find(m => m.id === siblingId);
        if (sibling) {
          inferred.push({
            person_a_id: userId,
            person_b_id: siblingId,
            relationship_type: "sibling",
            is_inferred: true,
            person_b: {
              id: sibling.id,
              full_name: sibling.full_name,
              relationship: sibling.relationship,
              user_id: sibling.user_id,
              avatar_url: sibling.avatar_url,
              pronouns: sibling.pronouns,
              username: sibling.full_name?.toLowerCase().replace(/\s+/g, "") || "unknown",
            }
          });
          processedIds.add(siblingId);
        }
      }
    }
  }

  console.log("generateInferredRelationships - Generated inferred relationships:", inferred);
  return inferred;
}

export async function getUserRelationships(userId: string) {
  const supabase = await createClient();

  try {
    // Get family member ID for this user
    const { data: userMember } = await supabase
      .from("family_members")
      .select("id")
      .eq("user_id", userId)
      .single();

    console.log("getUserRelationships - User ID:", userId);
    console.log("getUserRelationships - User Member:", userMember);

    if (!userMember) {
      console.log("getUserRelationships - No user member found, returning empty array");
      return [];
    }

    // Get relationships in both directions - where user is person_a and person_b
    const { data: relationshipsA, error: errorA } = await supabase
      .from("family_relationships")
      .select("*")
      .eq("person_a_id", userMember.id);

    const { data: relationshipsB, error: errorB } = await supabase
      .from("family_relationships")
      .select("*")
      .eq("person_b_id", userMember.id);

    if (errorA || errorB) {
      console.error("Error fetching user relationships:", errorA || errorB);
      return [];
    }

    // Combine both directions of relationships
    const relationships = [
      ...(relationshipsA || []),
      ...(relationshipsB || [])
    ];
    
    console.log("getUserRelationships - Relationships A (person_a):", relationshipsA);
    console.log("getUserRelationships - Relationships B (person_b):", relationshipsB);
    console.log("getUserRelationships - Combined relationships:", relationships);

    if (!relationships || relationships.length === 0) {
      return [];
    }

    // Get the related family members info - for relationships where user is person_a, get person_b
    // For relationships where user is person_b, get person_a
    const relatedMemberIds = relationships.map((rel) => 
      rel.person_a_id === userMember.id ? rel.person_b_id : rel.person_a_id
    );
    const { data: relatedMembers, error: membersError } = await supabase
      .from("family_members")
      .select("id, full_name, relationship, user_id, avatar_url")
      .in("id", relatedMemberIds);

    if (membersError) {
      console.error("Error fetching related members:", membersError);
      return [];
    }

    // Get profile data (avatar_url) from profiles table - but make it optional
    const relatedUsernames =
      relatedMembers?.map((member) => member.full_name).filter(Boolean) || [];
    const { data: relatedProfiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, avatar_url, username, full_name")
      .in("username", relatedUsernames);

    if (profilesError) {
      console.error("Error fetching profiles (non-critical):", profilesError);
      // Don't fail - just continue without profile data
    }

    // Combine relationships with member data (profile data is optional)
    const enrichedRelationships = relationships.map((rel) => {
      // Determine which person is the related member (not the current user)
      const relatedMemberId = rel.person_a_id === userMember.id ? rel.person_b_id : rel.person_a_id;
      
      const relatedMember = relatedMembers?.find(
        (member) => member.id === relatedMemberId
      );
      const relatedProfile = relatedProfiles?.find(
        (profile) => profile.username === relatedMember?.full_name
      );

      return {
        ...rel,
        person_b: {
          id: relatedMemberId,
          full_name: relatedMember?.full_name || "Unknown",
          relationship: relatedMember?.relationship || "unknown",
          user_id: relatedMember?.user_id,
          // Use avatar from family_members first, then profiles, then null
          avatar_url:
            relatedMember?.avatar_url || relatedProfile?.avatar_url || null,
          username:
            relatedProfile?.username || relatedMember?.full_name || "unknown",
        },
      };
    });

    console.log("Enriched relationships:", enrichedRelationships); // Debug log

    return enrichedRelationships;
  } catch (error) {
    console.error("Error in getUserRelationships:", error);
    return [];
  }
}

export async function getRelationshipBetweenUsers(
  userAId: string,
  userBId: string
) {
  const supabase = await createClient();

  // Get family member IDs
  const { data: memberA } = await supabase
    .from("family_members")
    .select("id")
    .eq("user_id", userAId)
    .single();

  const { data: memberB } = await supabase
    .from("family_members")
    .select("id")
    .eq("user_id", userBId)
    .single();

  if (!memberA || !memberB) return null;

  const { data: relationship, error } = await supabase
    .from("family_relationships")
    .select("relationship_type")
    .eq("person_a_id", memberA.id)
    .eq("person_b_id", memberB.id)
    .single();

  if (error) {
    return null;
  }

  return relationship;
}

// Helper function to get reverse relationships
function getReverseRelationship(relationshipType: string): string {
  const reverseMap: { [key: string]: string } = {
    parent: "child",
    child: "parent",
    sibling: "sibling",
    spouse: "spouse",
    grandparent: "grandchild",
    grandchild: "grandparent",
  };

  return reverseMap[relationshipType] || relationshipType;
}
