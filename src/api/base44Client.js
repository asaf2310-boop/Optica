import { createDemoDataClient, demoModeEnabled } from "./demoClient";
import { createSupabaseDataClient, useSupabaseBackend } from "./dataClient";

function resolveClient() {
  if (demoModeEnabled) return createDemoDataClient();
  if (useSupabaseBackend()) return createSupabaseDataClient();
  console.warn(
    "[optica] VITE_DEMO_MODE=false but Supabase env vars missing — falling back to demo storage."
  );
  return createDemoDataClient();
}

export const base44 = resolveClient();

export const backendMode = demoModeEnabled
  ? "demo"
  : useSupabaseBackend()
    ? "supabase"
    : "demo-fallback";
