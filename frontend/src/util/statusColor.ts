// Deterministic accent color for a status, by name. Known defaults map to theme
// tokens; anything else gets a stable hue derived from the name.

export function statusColor(name: string): string {
  const key = name.trim().toLowerCase();
  if (key === "todo") return "var(--color-status-todo)";
  if (key === "in progress") return "var(--color-status-progress)";
  if (key === "done") return "var(--color-status-done)";
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 50%)`;
}
