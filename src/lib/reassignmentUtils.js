export function generateReassignmentToken() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `tok_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function getAppBaseUrl() {
  const fromEnv = import.meta.env.VITE_APP_URL;
  if (fromEnv) return String(fromEnv).replace(/\/$/, "");
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "http://localhost:5173";
}

export function buildReassignmentLinks(token) {
  const base = getAppBaseUrl();
  const q = encodeURIComponent(token);
  return {
    confirm: `${base}/appointment/respond?token=${q}&action=confirm`,
    cancel: `${base}/appointment/cancel?token=${q}`,
    reschedule: `${base}/book`,
  };
}

export function formatAppointmentDateTime(date, time) {
  if (!date) return "";
  try {
    const d = new Date(`${date}T00:00:00`);
    const datePart = d.toLocaleDateString("he-IL", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return time ? `${datePart} בשעה ${time}` : datePart;
  } catch {
    return time ? `${date} ${time}` : date;
  }
}
