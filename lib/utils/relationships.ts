export interface FamilyMember {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  relation?: string;
}

export interface RelationshipOption {
  value: string;
  label: string;
  description: string;
}

export const RELATIONSHIP_OPTIONS: RelationshipOption[] = [
  { value: 'child', label: 'Child', description: 'I am their child' },
  { value: 'parent', label: 'Parent', description: 'I am their parent' },
  { value: 'sibling', label: 'Sibling', description: 'I am their sibling' },
  { value: 'spouse', label: 'Spouse/Partner', description: 'I am their spouse or partner' },
  { value: 'grandchild', label: 'Grandchild', description: 'I am their grandchild' },
  { value: 'grandparent', label: 'Grandparent', description: 'I am their grandparent' },
];

export function getReverseRelationship(relationshipType: string): string {
  const reverseMap: { [key: string]: string } = {
    'parent': 'child',
    'child': 'parent',
    'sibling': 'sibling',
    'spouse': 'spouse',
    'grandparent': 'grandchild',
    'grandchild': 'grandparent',
  };
  
  return reverseMap[relationshipType] || relationshipType;
}

export function formatRelationshipType(relationshipType: string): string {
  const formatMap: { [key: string]: string } = {
    'parent': 'Parent',
    'child': 'Child',
    'sibling': 'Sibling',
    'spouse': 'Spouse/Partner',
    'grandparent': 'Grandparent',
    'grandchild': 'Grandchild',
    'aunt_uncle': 'Aunt/Uncle',
    'niece_nephew': 'Niece/Nephew',
    'cousin': 'Cousin',
    'parent_in_law': 'Parent-in-law',
    'child_in_law': 'Child-in-law',
    'sibling_in_law': 'Sibling-in-law',
    'great_aunt_uncle': 'Great Aunt/Uncle',
    'great_niece_nephew': 'Great Niece/Nephew',
  };
  
  return formatMap[relationshipType] || relationshipType;
}
