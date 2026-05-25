import { demoModeEnabled } from "./demoClient";
import {
  getAppointmentByReassignmentTokenDemo,
  respondToReassignmentDemo,
} from "./demoClient";
import { getSupabaseClient, supabaseConfigured } from "./supabase";

export async function getAppointmentByReassignmentToken(token) {
  if (!token) return null;

  if (demoModeEnabled || !supabaseConfigured) {
    return getAppointmentByReassignmentTokenDemo(token);
  }

  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client.rpc("get_appointment_by_reassignment_token", {
    p_token: token,
  });

  if (error) throw error;
  if (Array.isArray(data)) return data[0] ?? null;
  return data ?? null;
}

/**
 * @param {'confirm'|'cancel'} action
 */
export async function respondToReassignment(token, action) {
  if (!token) throw new Error("missing_token");

  if (demoModeEnabled || !supabaseConfigured) {
    return respondToReassignmentDemo(token, action);
  }

  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  const { data, error } = await client.rpc("respond_to_reassignment", {
    p_token: token,
    p_action: action,
  });

  if (error) throw error;
  return data;
}
