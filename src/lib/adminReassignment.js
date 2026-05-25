import { generateReassignmentToken } from "@/lib/reassignmentUtils";

const BLOCKED_STATUSES = new Set(["cancelled", "completed"]);

/**
 * Builds update payload when admin reassigns optometrist (does not send email).
 */
export function buildOptometristReassignmentUpdate(appointment, newOptometrist) {
  if (!appointment || !newOptometrist) {
    throw new Error("invalid_input");
  }

  if (appointment.optometrist_id === newOptometrist.id) {
    return null;
  }

  if (BLOCKED_STATUSES.has(appointment.status)) {
    throw new Error("status_not_reassignable");
  }

  if (!appointment.patient_email?.trim()) {
    throw new Error("missing_patient_email");
  }

  const token = generateReassignmentToken();

  return {
    optometrist_id: newOptometrist.id,
    optometrist_name: newOptometrist.name,
    previous_optometrist_id: appointment.optometrist_id,
    previous_optometrist_name: appointment.optometrist_name,
    status: "pending_reassignment",
    reassignment_token: token,
  };
}
