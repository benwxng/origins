"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface FamilyMember {
  id: string;
  full_name: string;
  relationship: string;
  user_id?: string | null;
  avatar_url?: string | null;
}

export interface Relationship {
  id: string;
  person_a_id: string;
  person_b_id: string;
  relationship_type: string;
  is_inferred: boolean;
}

// Add parent relationship (only allowed relationship type)
export async function addParentRelationship(
  childId: string,
  parentId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    // Check if relationship already exists
    const { data: existingRelationship } = await supabase
      .from("family_relationships")
      .select("id")
      .eq("person_a_id", childId)
      .eq("person_b_id", parentId)
      .eq("relationship_type", "parent")
      .single();

    if (existingRelationship) {
      return { success: false, error: "This parent relationship already exists" };
    }

    // Create the parent relationship
    const { error: relationshipError } = await supabase
      .from("family_relationships")
      .insert({
        person_a_id: childId,
        person_b_id: parentId,
        relationship_type: "parent",
        is_inferred: false,
      });

    if (relationshipError) {
      console.error("Error creating parent relationship:", relationshipError);
      return { success: false, error: relationshipError.message };
    }

    // Create the reverse child relationship
    const { error: childError } = await supabase
      .from("family_relationships")
      .insert({
        person_a_id: parentId,
        person_b_id: childId,
        relationship_type: "child",
        is_inferred: false,
      });

    if (childError) {
      console.error("Error creating child relationship:", childError);
      return { success: false, error: childError.message };
    }

    // Trigger relationship inference for the entire family
    await inferAllRelationships();

    revalidatePath("/protected/family-tree");
    revalidatePath("/protected/family-members");
    return { success: true };
  } catch (error) {
    console.error("Error adding parent relationship:", error);
    return { success: false, error: "Failed to add parent relationship" };
  }
}

// Infer all relationships based on parent-child relationships
export async function inferAllRelationships(): Promise<void> {
  const supabase = await createClient();

  try {
    // Get all family members
    const { data: familyMembers } = await supabase
      .from("family_members")
      .select("*");

    if (!familyMembers) return;

    // Get all existing parent-child relationships
    const { data: parentChildRels } = await supabase
      .from("family_relationships")
      .select("*")
      .eq("relationship_type", "parent");

    if (!parentChildRels) return;

    // Create a map of parent-child relationships
    const parentChildMap = new Map<string, string[]>();
    const childParentMap = new Map<string, string[]>();

    parentChildRels.forEach(rel => {
      // person_a is parent, person_b is child
      if (!parentChildMap.has(rel.person_a_id)) {
        parentChildMap.set(rel.person_a_id, []);
      }
      parentChildMap.get(rel.person_a_id)!.push(rel.person_b_id);

      if (!childParentMap.has(rel.person_b_id)) {
        childParentMap.set(rel.person_b_id, []);
      }
      childParentMap.get(rel.person_b_id)!.push(rel.person_a_id);
    });

    // Clear all existing inferred relationships
    await supabase
      .from("family_relationships")
      .delete()
      .eq("is_inferred", true);

    // Infer relationships for each person
    for (const person of familyMembers) {
      await inferRelationshipsForPerson(person.id, parentChildMap, childParentMap, familyMembers);
    }

    console.log("Relationship inference completed");
  } catch (error) {
    console.error("Error inferring relationships:", error);
  }
}

// Infer relationships for a specific person
async function inferRelationshipsForPerson(
  personId: string,
  parentChildMap: Map<string, string[]>,
  childParentMap: Map<string, string[]>,
  familyMembers: FamilyMember[]
): Promise<void> {
  const supabase = await createClient();

  try {
    const relationshipsToAdd: Array<{
      person_a_id: string;
      person_b_id: string;
      relationship_type: string;
      is_inferred: boolean;
    }> = [];

    // Get person's parents and children
    const parents = childParentMap.get(personId) || [];
    const children = parentChildMap.get(personId) || [];

    // Infer siblings (people who share at least one parent)
    const siblings = new Set<string>();
    parents.forEach(parentId => {
      const parentChildren = parentChildMap.get(parentId) || [];
      parentChildren.forEach(childId => {
        if (childId !== personId) {
          siblings.add(childId);
        }
      });
    });

    // Add sibling relationships
    siblings.forEach(siblingId => {
      relationshipsToAdd.push({
        person_a_id: personId,
        person_b_id: siblingId,
        relationship_type: "sibling",
        is_inferred: true,
      });
    });

    // Infer grandparents (parents of parents)
    const grandparents = new Set<string>();
    parents.forEach(parentId => {
      const grandParents = childParentMap.get(parentId) || [];
      grandParents.forEach(grandParentId => {
        grandparents.add(grandParentId);
      });
    });

    // Add grandparent relationships (from person's perspective)
    grandparents.forEach(grandParentId => {
      relationshipsToAdd.push({
        person_a_id: personId,
        person_b_id: grandParentId,
        relationship_type: "grandparent",
        is_inferred: true,
      });
    });

    // Infer grandchildren (children of children)
    const grandchildren = new Set<string>();
    children.forEach(childId => {
      const grandChildren = parentChildMap.get(childId) || [];
      grandChildren.forEach(grandChildId => {
        grandchildren.add(grandChildId);
      });
    });

    // Add grandchild relationships (from person's perspective)
    grandchildren.forEach(grandChildId => {
      relationshipsToAdd.push({
        person_a_id: personId,
        person_b_id: grandChildId,
        relationship_type: "grandchild",
        is_inferred: true,
      });
    });

    // Infer aunts/uncles (siblings of parents)
    const auntsUncles = new Set<string>();
    parents.forEach(parentId => {
      const parentSiblings = new Set<string>();
      const parentParents = childParentMap.get(parentId) || [];
      parentParents.forEach(grandParentId => {
        const grandParentChildren = parentChildMap.get(grandParentId) || [];
        grandParentChildren.forEach(uncleAuntId => {
          if (uncleAuntId !== parentId) {
            parentSiblings.add(uncleAuntId);
          }
        });
      });
      parentSiblings.forEach(auntUncleId => {
        auntsUncles.add(auntUncleId);
      });
    });

    // Add aunt/uncle relationships
    auntsUncles.forEach(auntUncleId => {
      relationshipsToAdd.push({
        person_a_id: personId,
        person_b_id: auntUncleId,
        relationship_type: "aunt_uncle",
        is_inferred: true,
      });
    });

    // Infer nieces/nephews (children of siblings)
    const niecesNephews = new Set<string>();
    siblings.forEach(siblingId => {
      const siblingChildren = parentChildMap.get(siblingId) || [];
      siblingChildren.forEach(nieceNephewId => {
        niecesNephews.add(nieceNephewId);
      });
    });

    // Add niece/nephew relationships
    niecesNephews.forEach(nieceNephewId => {
      relationshipsToAdd.push({
        person_a_id: personId,
        person_b_id: nieceNephewId,
        relationship_type: "niece_nephew",
        is_inferred: true,
      });
    });

    // Infer cousins (children of aunts/uncles)
    const cousins = new Set<string>();
    auntsUncles.forEach(auntUncleId => {
      const auntUncleChildren = parentChildMap.get(auntUncleId) || [];
      auntUncleChildren.forEach(cousinId => {
        cousins.add(cousinId);
      });
    });

    // Add cousin relationships
    cousins.forEach(cousinId => {
      relationshipsToAdd.push({
        person_a_id: personId,
        person_b_id: cousinId,
        relationship_type: "cousin",
        is_inferred: true,
      });
    });

    // Insert all inferred relationships
    if (relationshipsToAdd.length > 0) {
      await supabase
        .from("family_relationships")
        .insert(relationshipsToAdd);
    }
  } catch (error) {
    console.error(`Error inferring relationships for person ${personId}:`, error);
  }
}

// Get all family members that can be assigned as parents
export async function getAvailableParents(currentUserId: string): Promise<FamilyMember[]> {
  const supabase = await createClient();

  try {
    // Get all family members (including the current user)
    const { data: familyMembers } = await supabase
      .from("family_members")
      .select("*")
      .order("full_name");

    return familyMembers || [];
  } catch (error) {
    console.error("Error getting available parents:", error);
    return [];
  }
}

// Get all family members that can be assigned as children
export async function getAvailableChildren(currentUserId: string): Promise<FamilyMember[]> {
  const supabase = await createClient();

  try {
    // Get current user's family member record
    const { data: currentMember } = await supabase
      .from("family_members")
      .select("id")
      .eq("user_id", currentUserId)
      .single();

    if (!currentMember) {
      return [];
    }

    // Get all family members except the current user
    const { data: familyMembers } = await supabase
      .from("family_members")
      .select("*")
      .neq("id", currentMember.id)
      .order("full_name");

    return familyMembers || [];
  } catch (error) {
    console.error("Error getting available children:", error);
    return [];
  }
}

// Add parent relationship using family member IDs
export async function addParentRelationshipByFamilyMemberId(
  childFamilyMemberId: string,
  parentFamilyMemberId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    // Check for circular relationships
    const wouldCreateCycle = await wouldCreateCircularRelationship(childFamilyMemberId, parentFamilyMemberId);
    if (wouldCreateCycle) {
      return { success: false, error: "Cannot add this parent relationship as it would create a circular family structure" };
    }

    console.log("Creating parent relationship:", {
      childFamilyMemberId,
      parentFamilyMemberId
    });

    // Create the parent relationship (person_a is parent, person_b is child)
    const { error: relationshipError } = await supabase
      .from("family_relationships")
      .insert({
        person_a_id: parentFamilyMemberId,
        person_b_id: childFamilyMemberId,
        relationship_type: "parent",
        is_inferred: false,
      });

    if (relationshipError) {
      console.error("Error creating parent relationship:", relationshipError);
      return { success: false, error: relationshipError.message };
    }

    console.log("Parent relationship created successfully");

    // Trigger relationship inference for the entire family
    await inferAllRelationships();

    revalidatePath("/protected/family-tree");
    revalidatePath("/protected/family-members");
    revalidatePath("/protected/profile");
    return { success: true };
  } catch (error) {
    console.error("Error adding parent relationship:", error);
    return { success: false, error: "Failed to add parent relationship" };
  }
}


// Remove circular relationships (clean up invalid data)
export async function removeCircularRelationships(): Promise<{ success: boolean; error?: string; removedCount?: number }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    // Get all parent relationships
    const { data: relationships } = await supabase
      .from("family_relationships")
      .select("*")
      .eq("relationship_type", "parent");

    if (!relationships) {
      return { success: true, removedCount: 0 };
    }

    let removedCount = 0;
    const relationshipsToRemove: string[] = [];

    // Check each relationship for circularity
    for (const rel of relationships) {
      // Check if this relationship creates a cycle
      const isCircular = await wouldCreateCircularRelationship(rel.person_a_id, rel.person_b_id);
      
      if (isCircular) {
        console.log(`Removing circular relationship: ${rel.person_a_id} -> ${rel.person_b_id}`);
        relationshipsToRemove.push(rel.id);
        removedCount++;
      }
    }

    // Remove circular relationships
    if (relationshipsToRemove.length > 0) {
      const { error } = await supabase
        .from("family_relationships")
        .delete()
        .in("id", relationshipsToRemove);

      if (error) {
        console.error("Error removing circular relationships:", error);
        return { success: false, error: error.message };
      }
    }

    revalidatePath("/protected/family-tree");
    revalidatePath("/protected/family-members");
    revalidatePath("/protected/profile");
    
    return { success: true, removedCount };
  } catch (error) {
    console.error("Error removing circular relationships:", error);
    return { success: false, error: "Failed to remove circular relationships" };
  }
}

// Fix circular relationships between specific users
export async function fixCircularRelationships(): Promise<{ success: boolean; error?: string; fixedCount?: number }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    // Get all parent relationships
    const { data: relationships } = await supabase
      .from("family_relationships")
      .select("*")
      .eq("relationship_type", "parent");

    if (!relationships) {
      return { success: true, fixedCount: 0 };
    }

    let fixedCount = 0;
    const relationshipsToRemove: string[] = [];

    // Find circular relationships (A is parent of B AND B is parent of A)
    for (const rel1 of relationships) {
      for (const rel2 of relationships) {
        if (rel1.id !== rel2.id && 
            rel1.person_a_id === rel2.person_b_id && 
            rel1.person_b_id === rel2.person_a_id) {
          
          console.log(`Found circular relationship: ${rel1.person_a_id} <-> ${rel1.person_b_id}`);
          
          // Remove the newer relationship (keep the older one)
          const relationshipToRemove = rel1.created_at > rel2.created_at ? rel1 : rel2;
          relationshipsToRemove.push(relationshipToRemove.id);
          fixedCount++;
        }
      }
    }

    // Remove circular relationships
    if (relationshipsToRemove.length > 0) {
      const { error } = await supabase
        .from("family_relationships")
        .delete()
        .in("id", relationshipsToRemove);

      if (error) {
        console.error("Error removing circular relationships:", error);
        return { success: false, error: error.message };
      }
    }

    // Regenerate inferred relationships
    await inferAllRelationships();

    revalidatePath("/protected/family-tree");
    revalidatePath("/protected/family-members");
    revalidatePath("/protected/profile");
    
    return { success: true, fixedCount };
  } catch (error) {
    console.error("Error fixing circular relationships:", error);
    return { success: false, error: "Failed to fix circular relationships" };
  }
}

// Clear all existing relationships (for reset purposes)
// Clear all inferred relationships only
export async function clearInferredRelationships(): Promise<{ success: boolean; error?: string; removedCount?: number }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const { data: relationships, error } = await supabase
      .from("family_relationships")
      .select("id")
      .eq("is_inferred", true);

    if (error) {
      console.error("Error fetching inferred relationships:", error);
      return { success: false, error: error.message };
    }

    const relationshipIds = relationships?.map(rel => rel.id) || [];
    
    if (relationshipIds.length > 0) {
      const { error: deleteError } = await supabase
        .from("family_relationships")
        .delete()
        .in("id", relationshipIds);

      if (deleteError) {
        console.error("Error deleting inferred relationships:", deleteError);
        return { success: false, error: deleteError.message };
      }
    }

    revalidatePath("/protected/family-tree");
    revalidatePath("/protected/family-members");
    revalidatePath("/protected/profile");
    
    return { success: true, removedCount: relationshipIds.length };
  } catch (error) {
    console.error("Error clearing inferred relationships:", error);
    return { success: false, error: "Failed to clear inferred relationships" };
  }
}

export async function clearAllRelationships(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    // Delete all relationships
    const { error } = await supabase
      .from("family_relationships")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all rows

    if (error) {
      console.error("Error clearing relationships:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/protected/family-tree");
    revalidatePath("/protected/family-members");
    return { success: true };
  } catch (error) {
    console.error("Error clearing relationships:", error);
    return { success: false, error: "Failed to clear relationships" };
  }
}

// Get parent relationships for a family member
export async function getParentRelationships(familyMemberId: string): Promise<FamilyMember[]> {
  const supabase = await createClient();

  try {
    console.log("Getting parent relationships for family member ID:", familyMemberId);
    
    // Step 1: Get the family member data to find their user_id
    const { data: familyMember, error: familyError } = await supabase
      .from("family_members")
      .select("id, user_id, full_name")
      .eq("id", familyMemberId)
      .single();
    
    console.log("Family member data:", familyMember);
    console.log("Family member error:", familyError);
    
    if (!familyMember) {
      console.log("Family member not found");
      return [];
    }
    
    // Step 2: Get all parent relationships for this family member
    // With new structure: person_a_id = parent, person_b_id = child
    const { data: relationships, error: queryError } = await supabase
      .from("family_relationships")
      .select("*")
      .eq("person_b_id", familyMemberId)
      .eq("relationship_type", "parent");

    console.log("Parent relationships query result:", relationships);
    console.log("Parent relationships query error:", queryError);

    if (!relationships || relationships.length === 0) {
      console.log("No parent relationships found");
      return [];
    }

    // Step 3: Get the parent family member data for each relationship
    // With new structure: person_a_id = parent, person_b_id = child
    const parentIds = relationships.map(rel => rel.person_a_id);
    console.log("Parent family member IDs:", parentIds);
    
    const { data: parentFamilyMembers, error: parentError } = await supabase
      .from("family_members")
      .select("id, full_name, relationship, avatar_url, user_id")
      .in("id", parentIds);
    
    console.log("Parent family members data:", parentFamilyMembers);
    console.log("Parent family members error:", parentError);
    
    if (!parentFamilyMembers) {
      console.log("No parent family members found");
      return [];
    }
    
    // Step 4: Map the data to the expected format
    const parents = parentFamilyMembers.map(parent => ({
      id: parent.id,
      full_name: parent.full_name,
      relationship: "parent",
      avatar_url: parent.avatar_url,
      user_id: parent.user_id
    }));
    
    console.log("Final parents data:", parents);
    return parents;
    
  } catch (error) {
    console.error("Error getting parent relationships:", error);
    return [];
  }
}

// Delete a parent relationship
export async function deleteParentRelationship(
  childFamilyMemberId: string,
  parentFamilyMemberId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    // Delete the parent relationship (person_a_id = parent, person_b_id = child)
    const { error: parentError } = await supabase
      .from("family_relationships")
      .delete()
      .eq("person_a_id", parentFamilyMemberId)
      .eq("person_b_id", childFamilyMemberId)
      .eq("relationship_type", "parent");

    if (parentError) {
      console.error("Error deleting parent relationship:", parentError);
      return { success: false, error: parentError.message };
    }

    // Delete the reverse child relationship
    const { error: childError } = await supabase
      .from("family_relationships")
      .delete()
      .eq("person_a_id", parentFamilyMemberId)
      .eq("person_b_id", childFamilyMemberId)
      .eq("relationship_type", "child");

    if (childError) {
      console.error("Error deleting child relationship:", childError);
      return { success: false, error: childError.message };
    }

    // Trigger relationship inference for the entire family
    await inferAllRelationships();

    revalidatePath("/protected/family-tree");
    revalidatePath("/protected/family-members");
    revalidatePath(`/protected/profile/${childFamilyMemberId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting parent relationship:", error);
    return { success: false, error: "Failed to delete parent relationship" };
  }
}

// Check if adding a parent would create a circular relationship
export async function wouldCreateCircularRelationship(
  childFamilyMemberId: string,
  potentialParentFamilyMemberId: string
): Promise<boolean> {
  const supabase = await createClient();

  try {
    // Get all family members for traversal
    const { data: familyMembers } = await supabase
      .from("family_members")
      .select("*");

    if (!familyMembers) return false;

    // Create a map of parent-child relationships
    const { data: relationships } = await supabase
      .from("family_relationships")
      .select("*")
      .eq("relationship_type", "parent");

    if (!relationships) return false;

    const parentChildMap = new Map<string, string[]>();
    relationships.forEach(rel => {
      if (!parentChildMap.has(rel.person_b_id)) {
        parentChildMap.set(rel.person_b_id, []);
      }
      parentChildMap.get(rel.person_b_id)!.push(rel.person_a_id);
    });

    // First check: Is the potential parent already a parent of the child?
    const existingParentChild = relationships.find(rel => 
      rel.person_a_id === potentialParentFamilyMemberId && 
      rel.person_b_id === childFamilyMemberId &&
      rel.relationship_type === "parent"
    );
    
    if (existingParentChild) {
      console.log("Potential parent is already a parent of the child - would create duplicate");
      return true;
    }

    // Second check: Is the potential parent already a child of the child? (direct cycle)
    const existingChildParent = relationships.find(rel => 
      rel.person_a_id === childFamilyMemberId && 
      rel.person_b_id === potentialParentFamilyMemberId &&
      rel.relationship_type === "parent"
    );
    
    if (existingChildParent) {
      console.log("Potential parent is already a child of the child - would create direct cycle");
      return true;
    }

    // Third check: Is the potential parent a descendant of the child? (indirect cycle)
    const visited = new Set<string>();
    const queue = [potentialParentFamilyMemberId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      // If we find the child in the potential parent's descendants, it's a cycle
      if (currentId === childFamilyMemberId) {
        console.log("Potential parent is a descendant of the child - would create indirect cycle");
        return true;
      }

      // Add all children of current person to queue
      const children = parentChildMap.get(currentId) || [];
      queue.push(...children);
    }

    return false;
  } catch (error) {
    console.error("Error checking circular relationship:", error);
    return true; // Err on the side of caution
  }
}
