export interface FamilyMember {
  id: string;
  full_name: string;
  relationship: string;
  user_id?: string;
  profile_image_url?: string;
}

export interface RelationshipOption {
  value: string;
  label: string;
  description: string;
}

export const RELATIONSHIP_OPTIONS: RelationshipOption[] = [
  { value: "child", label: "Child", description: "I am their child" },
  { value: "parent", label: "Parent", description: "I am their parent" },
  { value: "sibling", label: "Sibling", description: "I am their sibling" },
  {
    value: "spouse",
    label: "Spouse/Partner",
    description: "I am their spouse or partner",
  },
  {
    value: "grandchild",
    label: "Grandchild",
    description: "I am their grandchild",
  },
  {
    value: "grandparent",
    label: "Grandparent",
    description: "I am their grandparent",
  },
];

export function getReverseRelationship(relationshipType: string): string {
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

export function formatRelationshipType(relationshipType: string): string {
  const formatMap: { [key: string]: string } = {
    parent: "Parent",
    child: "Child",
    sibling: "Sibling",
    spouse: "Spouse/Partner",
    grandparent: "Grandparent",
    grandchild: "Grandchild",
    aunt_uncle: "Aunt/Uncle",
    niece_nephew: "Niece/Nephew",
    cousin: "Cousin",
    parent_in_law: "Parent-in-law",
    child_in_law: "Child-in-law",
    sibling_in_law: "Sibling-in-law",
    great_aunt_uncle: "Great Aunt/Uncle",
    great_niece_nephew: "Great Niece/Nephew",
  };

  return formatMap[relationshipType] || relationshipType;
}

export function getGenderSpecificRelationship(
  relationshipType: string, 
  personPronouns: string | null | undefined
): string {
  if (!personPronouns) {
    return formatRelationshipType(relationshipType);
  }

  const pronouns = personPronouns.toLowerCase();
  const isMale = pronouns.includes('he/him') || pronouns.includes('he/they');
  const isFemale = pronouns.includes('she/her') || pronouns.includes('she/they');

  // Gender-specific relationship mappings
  const genderSpecificMap: { [key: string]: { male: string; female: string; neutral: string } } = {
    parent: { male: "Father", female: "Mother", neutral: "Parent" },
    child: { male: "Son", female: "Daughter", neutral: "Child" },
    sibling: { male: "Brother", female: "Sister", neutral: "Sibling" },
    spouse: { male: "Husband", female: "Wife", neutral: "Spouse/Partner" },
    grandparent: { male: "Grandfather", female: "Grandmother", neutral: "Grandparent" },
    grandchild: { male: "Grandson", female: "Granddaughter", neutral: "Grandchild" },
    aunt_uncle: { male: "Uncle", female: "Aunt", neutral: "Aunt/Uncle" },
    niece_nephew: { male: "Nephew", female: "Niece", neutral: "Niece/Nephew" },
    cousin: { male: "Cousin", female: "Cousin", neutral: "Cousin" },
    parent_in_law: { male: "Father-in-law", female: "Mother-in-law", neutral: "Parent-in-law" },
    child_in_law: { male: "Son-in-law", female: "Daughter-in-law", neutral: "Child-in-law" },
    sibling_in_law: { male: "Brother-in-law", female: "Sister-in-law", neutral: "Sibling-in-law" },
    great_aunt_uncle: { male: "Great Uncle", female: "Great Aunt", neutral: "Great Aunt/Uncle" },
    great_niece_nephew: { male: "Great Nephew", female: "Great Niece", neutral: "Great Niece/Nephew" },
  };

  const relationship = genderSpecificMap[relationshipType];
  if (!relationship) {
    return formatRelationshipType(relationshipType);
  }

  if (isMale) {
    return relationship.male;
  } else if (isFemale) {
    return relationship.female;
  } else {
    return relationship.neutral;
  }
}
