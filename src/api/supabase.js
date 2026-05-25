import { createClient } from "@supabase/supabase-js";

export function cleanEnvValue(value) {
  return String(value || "")
    .split(/\s+/)
    .map((part) => part.trim())
    .find(Boolean) || "";
}

export const supabaseUrl = cleanEnvValue(import.meta.env.VITE_SUPABASE_URL);
export const supabaseAnonKey = cleanEnvValue(import.meta.env.VITE_SUPABASE_ANON_KEY);

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/** Login emails: `{username}@optica.app` — matches seed.sql profile mapping */
export const AUTH_EMAIL_DOMAIN = "optica.app";

export function usernameToAuthEmail(username) {
  const normalized = String(username || "").trim().toLowerCase();
  if (!normalized) return "";
  if (normalized.includes("@")) return normalized;
  return `${normalized}@${AUTH_EMAIL_DOMAIN}`;
}

let client = null;

export function getSupabaseClient() {
  if (!supabaseConfigured) return null;
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}
