import { createClient } from "@supabase/supabase-js";

// Sostituisci questi valori con quelli del tuo progetto Supabase
// Li trovi su: Supabase Dashboard → Settings → API
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Nomi utenti del team
export const TEAM_USERS = [
  "Anna",
  "Alexandra",
  "Maddy",
  "Fra",
  "Ary",
  "Alby",
];

// Genera un ID dispositivo univoco e persistente
export function getDeviceId() {
  let id = localStorage.getItem("labscan_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("labscan_device_id", id);
  }
  return id;
}

// Leggi l'utente salvato su questo dispositivo
export function getSavedUser() {
  return localStorage.getItem("labscan_user");
}

// Salva l'utente scelto su questo dispositivo
export function saveUser(name) {
  localStorage.setItem("labscan_user", name);
}

// URL foto profilo da Supabase Storage
// Le foto devono chiamarsi esattamente come il nome utente: Anna.jpg o Anna.png
export function getAvatarUrl(name) {
  const base = `${SUPABASE_URL}/storage/v1/object/public/avatars`;
  // Prova prima jpg poi png — il browser caricherà quella che esiste
  return `${base}/${name}.jpg`;
}
