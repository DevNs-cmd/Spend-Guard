// Typed fetch wrapper for apps/api. Owner: Anuj.
// Use types from packages/shared-types — do not redefine DTOs here.
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { credentials: "include" });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
