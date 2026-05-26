import { createClient } from "@supabase/supabase-js";

export const TEAM_USERS = ["Anna", "Alexandra", "Maddy", "Fra", "Ary", "Alby"];

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
export const SUPABASE_CONFIGURED = SUPABASE_URL.startsWith("https://");

export const supabase = SUPABASE_CONFIGURED
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export function getAvatarUrl(name) {
  if (!SUPABASE_CONFIGURED) return "";
  return `${SUPABASE_URL}/storage/v1/object/public/avatars/${name}.jpg`;
}
