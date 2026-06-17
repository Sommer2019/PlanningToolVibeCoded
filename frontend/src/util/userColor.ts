/**
 * Consistently hashes a user ID/name to one of the predefined theme colors.
 */
export function userColor(userRef?: string | null): string {
  if (!userRef) return "var(--color-surface)"; // Default for unassigned
  
  let hash = 0;
  for (let i = 0; i < userRef.length; i++) {
    hash = userRef.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % 8;
  return `var(--user-color-${index})`;
}
