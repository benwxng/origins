// Display utility functions

export function getInitials(fullName: string): string {
  if (!fullName) return "?";

  return fullName
    .split(" ")
    .map((name) => name.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2); // Limit to 2 characters
}

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  );

  if (diffInHours < 1) return "Just now";
  if (diffInHours < 24)
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7)
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;

  return date.toLocaleDateString();
}

export function formatRelationshipForUser(
  relationship: string,
  personName: string
): string {
  // Format relationship from the user's perspective
  const relationshipMap: { [key: string]: string } = {
    parent: "Parent",
    child: "Child",
    sibling: "Sibling",
    spouse: "Spouse",
    grandparent: "Grandparent",
    grandchild: "Grandchild",
  };

  const formatted = relationshipMap[relationship] || relationship;
  return `${personName} (${formatted})`;
}
