// Utility functions that can be used in both server and client components

export function getInitials(fullName: string): string {
  return fullName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

