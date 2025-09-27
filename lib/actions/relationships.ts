"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getReverseRelationship, type FamilyMember } from "@/lib/utils/relationships";

export async function getFamilyMembers(): Promise<FamilyMember[]> {
  const supabase = await createClient();
  
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, username, avatar_url")
    .order("full_name");

  if (error) {
    console.error("Error fetching family members:", error);
    return [];
  }

  return profiles || [];
}

export async function addFamilyRelationship(
  relatedPersonId: string,
  relationshipType: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    // Call the database function to create bidirectional relationship
    const reverseRelationship = getReverseRelationship(relationshipType);
    
    const { error } = await supabase.rpc('create_bidirectional_relationship', {
      person_a: user.id,
      person_b: relatedPersonId,
      rel_type_a_to_b: relationshipType,
      rel_type_b_to_a: reverseRelationship,
      is_inferred_rel: false
    });

    if (error) {
      console.error("Error creating relationship:", error);
      return { success: false, error: error.message };
    }

    // Trigger relationship inference
    const { error: inferError } = await supabase.rpc('infer_relationships', {
      new_person_id: user.id,
      related_person_id: relatedPersonId
    });

    if (inferError) {
      console.warn("Warning: Could not infer additional relationships:", inferError);
    }

    revalidatePath("/protected/profile");
    return { success: true };
  } catch (error: any) {
    console.error("Error adding family relationship:", error);
    return { success: false, error: error.message };
  }
}

export async function getUserRelationships(userId: string) {
  const supabase = await createClient();
  
  // First get the relationships
  const { data: relationships, error } = await supabase
    .from("family_relationships")
    .select("*")
    .eq("person_a_id", userId);

  if (error) {
    console.error("Error fetching user relationships:", error);
    return [];
  }

  if (!relationships || relationships.length === 0) {
    return [];
  }

  // Get all the person_b_ids to fetch their profiles
  const personBIds = relationships.map(rel => rel.person_b_id);
  
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, username, avatar_url")
    .in("id", personBIds);

  if (profileError) {
    console.error("Error fetching profiles:", profileError);
    return relationships.map(rel => ({
      ...rel,
      person_b: {
        id: rel.person_b_id,
        full_name: "Unknown",
        username: "unknown",
        avatar_url: null
      }
    }));
  }

  // Create a map of profiles by id
  const profileMap = new Map();
  profiles?.forEach(profile => {
    profileMap.set(profile.id, profile);
  });

  // Combine relationships with profile data
  const enrichedRelationships = relationships.map(rel => ({
    ...rel,
    person_b: profileMap.get(rel.person_b_id) || {
      id: rel.person_b_id,
      full_name: "Unknown",
      username: "unknown",
      avatar_url: null
    }
  }));

  return enrichedRelationships;
}

export async function getRelationshipBetweenUsers(userAId: string, userBId: string) {
  const supabase = await createClient();
  
  const { data: relationship, error } = await supabase
    .from("family_relationships")
    .select("relationship_type, is_inferred")
    .eq("person_a_id", userAId)
    .eq("person_b_id", userBId)
    .single();

  if (error) {
    return null;
  }

  return relationship;
}

