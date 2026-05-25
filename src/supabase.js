import { createClient } from "@supabase/supabase-js";

// Nomi utenti del team
export const TEAM_USERS = ["Anna", "Alexandra", "Maddy", "Fra", "Ary", "Alby"];

// Supabase configurato?
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
export const SUPABASE_CONFIGURED = SUPABASE_URL.startsWith("https://");

// Client — solo se configurato
export const supabase = SUPABASE_CONFIGURED
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export function getDeviceId() {
  let id = localStorage.getItem("labscan_device_id");
  if (!id) { id = crypto.randomUUID(); localStorage.setItem("labscan_device_id", id); }
  return id;
}

export function getSavedUser() { return localStorage.getItem("labscan_user"); }
export function saveUser(name) { localStorage.setItem("labscan_user", name); }

export function getAvatarUrl(name) {
  if (!SUPABASE_CONFIGURED) return "";
  return `${SUPABASE_URL}/storage/v1/object/public/avatars/${name}.jpg`;
}
