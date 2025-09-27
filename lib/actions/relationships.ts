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

export async function getUserRelationships(userId: string) {
  const supabase = await createClient();

  try {
    // Get family member ID for this user
    const { data: userMember } = await supabase
      .from("family_members")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (!userMember) return [];

    // Get relationships using actual column names (person_a_id, person_b_id)
    const { data: relationships, error } = await supabase
      .from("family_relationships")
      .select("*")
      .eq("person_a_id", userMember.id);

    if (error) {
      console.error("Error fetching user relationships:", error);
      return [];
    }

    if (!relationships || relationships.length === 0) {
      return [];
    }

    // Get the related family members info
    const relatedMemberIds = relationships.map((rel) => rel.person_b_id);
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
      const relatedMember = relatedMembers?.find(
        (member) => member.id === rel.person_b_id
      );
      const relatedProfile = relatedProfiles?.find(
        (profile) => profile.username === relatedMember?.full_name
      );

      return {
        ...rel,
        person_b: {
          id: rel.person_b_id,
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
