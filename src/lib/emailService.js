import { demoModeEnabled } from "@/api/demoClient";
import { getSupabaseClient, supabaseConfigured } from "@/api/supabase";
import { buildReassignmentLinks, formatAppointmentDateTime } from "@/lib/reassignmentUtils";

export const DEMO_SENT_EMAILS_KEY = "optica_sent_emails";

export function buildReassignmentEmailContent(appointment) {
  const links = buildReassignmentLinks(appointment.reassignment_token);
  const when = formatAppointmentDateTime(appointment.date, appointment.time);
  const previousName =
    appointment.previous_optometrist_name || "האופטומטריסט שבחרתם";
  const newName = appointment.optometrist_name || "אופטומטריסט אחר";

  const subject = "שינוי אופטומטריסט לתור שלך";

  const textBody = [
    `שלום ${appointment.patient_name || ""},`,
    "",
    `${previousName} אינו/אינה זמין/ה למועד שקבעתם (${when}).`,
    `המנהל/ת שיבץ/ה תור עם ${newName} באותו מועד.`,
    "",
    "בחרו אחת מהאפשרויות:",
    `אישור השינוי: ${links.confirm}`,
    `ביטול התור: ${links.cancel}`,
    `קביעת תור חדש: ${links.reschedule}`,
  ].join("\n");

  const htmlBody = `
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 20px; margin-bottom: 16px;">שינוי אופטומטריסט לתור שלך</h1>
  <p>שלום <strong>${escapeHtml(appointment.patient_name || "")}</strong>,</p>
  <p>
    <strong>${escapeHtml(previousName)}</strong> אינו/אינה זמין/ה למועד שקבעתם:
    <strong>${escapeHtml(when)}</strong>.
  </p>
  <p>
    המנהל/ת שיבץ/ה את התור עם <strong>${escapeHtml(newName)}</strong> באותו מועד.
    נא לאשרו את השינוי, לבטל את התור, או לקבוע תור חדש.
  </p>
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0; width: 100%;">
    <tr><td style="padding: 8px 0;">
      <a href="${links.confirm}" style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold;">אישור השינוי</a>
    </td></tr>
    <tr><td style="padding: 8px 0;">
      <a href="${links.cancel}" style="display: inline-block; background: #dc2626; color: #fff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold;">ביטול התור</a>
    </td></tr>
    <tr><td style="padding: 8px 0;">
      <a href="${links.reschedule}" style="display: inline-block; background: #64748b; color: #fff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold;">קביעת תור חדש</a>
    </td></tr>
  </table>
  <p style="font-size: 13px; color: #64748b;">אם לא ביקשתם שינוי, צרו קשר עם המרפאה.</p>
</body>
</html>`;

  return { subject, textBody, htmlBody, links };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function storeDemoEmail(payload) {
  try {
    const raw = localStorage.getItem(DEMO_SENT_EMAILS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.unshift({ ...payload, sent_at: new Date().toISOString() });
    localStorage.setItem(DEMO_SENT_EMAILS_KEY, JSON.stringify(list.slice(0, 50)));
  } catch {
    /* ignore */
  }
}

/**
 * Sends reassignment email. Demo: console + localStorage. Production: Supabase Edge Function.
 * @returns {{ mode: 'demo' | 'edge', links: object, preview?: object }}
 */
export async function sendReassignmentEmail(appointment) {
  const { subject, textBody, htmlBody, links } = buildReassignmentEmailContent(appointment);
  const to = appointment.patient_email;

  if (!to) {
    throw new Error("missing_patient_email");
  }

  const payload = {
    to,
    subject,
    textBody,
    htmlBody,
    appointment_id: appointment.id,
    links,
  };

  if (demoModeEnabled) {
    console.info("[optica demo] reassignment email", payload);
    storeDemoEmail(payload);
    return { mode: "demo", links, preview: { subject, to, links } };
  }

  if (!supabaseConfigured) {
    console.warn("[optica] Supabase not configured — logging email only");
    console.info("[optica] reassignment email", payload);
    return { mode: "demo", links, preview: { subject, to, links } };
  }

  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client unavailable");

  const { data, error } = await client.functions.invoke("send-reassignment-email", {
    body: {
      to,
      subject,
      html: htmlBody,
      text: textBody,
      appointment_id: appointment.id,
    },
  });

  if (error) {
    console.error("[optica] edge function send-reassignment-email failed", error);
    throw error;
  }

  return { mode: "edge", links, result: data };
}
