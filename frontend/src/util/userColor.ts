/**
 * List of light background colors for user task cards.
 */
const COLORS = [
  "#e6f7ff", // light blue
  "#f6ffed", // light green
  "#fffb8f", // light yellow
  "#ffe7ba", // light orange
  "#ffd6e7", // light pink
  "#f0f5ff", // geek blue
  "#efdbff", // purple
  "#d9f7be", // lime
];

/**
 * Consistently hashes a user ID/name to one of the predefined colors.
 */
export function userColor(userRef?: string | null): string {
  if (!userRef) return "#ffffff"; // Default white for unassigned
  
  let hash = 0;
  for (let i = 0; i < userRef.length; i++) {
    hash = userRef.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % COLORS.length;
  return COLORS[index];
}
