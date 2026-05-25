const DEMO_STORE_KEY = "optica-demo-store-v1";
const SESSION_KEY = "optica-session";

/** True when VITE_DEMO_MODE is not explicitly "false" (default: demo on). */
export const demoModeEnabled = import.meta.env.VITE_DEMO_MODE !== "false";

export const SEED_USERS = [
  { id: "user_admin", username: "admin", password: "admin123", role: "admin", full_name: "מנהל מערכת", optometrist_id: null },
  { id: "user_yossi", username: "yossi", password: "staff123", role: "staff", full_name: "יוסי כהן", optometrist_id: "opto_1" },
  { id: "user_michal", username: "michal", password: "staff123", role: "staff", full_name: "מיכל לוי", optometrist_id: "opto_2" },
  { id: "user_dana", username: "dana", password: "staff123", role: "staff", full_name: "דנה אברהם", optometrist_id: "opto_3" },
];

const ENTITY_KEYS = {
  Optometrist: "optometrists",
  Availability: "availability",
  Appointment: "appointments",
};

function pad(value) {
  return String(value).padStart(2, "0");
}

function formatDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function createSeedStore() {
  const today = new Date();
  const futureDates = [1, 2, 3, 5, 7, 9, 12, 15, 18, 21].map((days) => formatDate(addDays(today, days)));
  const defaultSlots = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];

  const optometrists = [
    { id: "opto_1", name: 'ד"ר יוסי כהן', title: "אופטומטריסט בכיר", is_active: true },
    { id: "opto_2", name: 'ד"ר מיכל לוי', title: "אופטומטריסטית", is_active: true },
    { id: "opto_3", name: 'ד"ר דנה אברהם', title: "אופטומטריסטית", is_active: true },
  ];

  const availability = [];
  for (const opto of optometrists) {
    futureDates.forEach((date, index) => {
      availability.push({
        id: `avail_${opto.id}_${index}`,
        optometrist_id: opto.id,
        date,
        slots: [...defaultSlots],
        is_active: true,
      });
    });
  }

  const appointments = [
    {
      id: "apt_demo_1",
      patient_name: "נועה כהן",
      patient_phone: "050-1234567",
      patient_email: "noa@example.com",
      optometrist_id: "opto_1",
      optometrist_name: 'ד"ר יוסי כהן',
      date: futureDates[0],
      time: "10:00",
      status: "confirmed",
      marketing_consent: true,
      notes: "בדיקת ראייה שנתית",
      created_at: new Date().toISOString(),
    },
    {
      id: "apt_demo_2",
      patient_name: "דנה לוי",
      patient_phone: "052-7654321",
      patient_email: "dana@example.com",
      optometrist_id: "opto_2",
      optometrist_name: 'ד"ר מיכל לוי',
      date: futureDates[1],
      time: "14:00",
      status: "pending",
      marketing_consent: false,
      notes: "",
      created_at: new Date().toISOString(),
    },
    {
      id: "apt_demo_3",
      patient_name: "יעל מזרחי",
      patient_phone: "053-9988776",
      patient_email: "yael@example.com",
      optometrist_id: "opto_3",
      optometrist_name: 'ד"ר דנה אברהם',
      date: futureDates[2],
      time: "11:00",
      status: "completed",
      marketing_consent: true,
      notes: "התאמת עדשות",
      created_at: new Date().toISOString(),
    },
  ];

  return { optometrists, availability, appointments };
}

function readStore() {
  const raw = localStorage.getItem(DEMO_STORE_KEY);
  if (raw) {
    try {
      const store = JSON.parse(raw);
      if (store?.optometrists?.length && store?.availability?.length) {
        return store;
      }
    } catch {
      localStorage.removeItem(DEMO_STORE_KEY);
    }
  }

  const seed = createSeedStore();
  localStorage.setItem(DEMO_STORE_KEY, JSON.stringify(seed));
  return seed;
}

function writeStore(store) {
  localStorage.setItem(DEMO_STORE_KEY, JSON.stringify(store));
}

function matchesFilters(row, filters) {
  return Object.entries(filters).every(([key, value]) => row[key] === value);
}

function sortRows(rows, order) {
  const orderColumn = String(order || "-created_at");
  const desc = orderColumn.startsWith("-");
  const column = desc ? orderColumn.slice(1) : orderColumn;

  rows.sort((a, b) => String(a[column] || "").localeCompare(String(b[column] || "")));
  if (desc) rows.reverse();
  return rows;
}

function createEntity(entityName) {
  const storeKey = ENTITY_KEYS[entityName];

  return {
    async filter(filters = {}) {
      const rows = readStore()[storeKey] || [];
      return rows.filter((row) => matchesFilters(row, filters));
    },

    async list(order = "-created_at", limit = 100) {
      const rows = sortRows([...(readStore()[storeKey] || [])], order);
      return rows.slice(0, limit);
    },

    async create(row) {
      const store = readStore();
      const saved = {
        id: row.id || makeId(storeKey),
        created_at: row.created_at || new Date().toISOString(),
        ...row,
      };
      store[storeKey] = [...(store[storeKey] || []), saved];
      writeStore(store);
      return saved;
    },

    async bulkCreate(rows) {
      const store = readStore();
      const saved = rows.map((row) => ({
        id: row.id || makeId(storeKey),
        created_at: row.created_at || new Date().toISOString(),
        ...row,
      }));
      store[storeKey] = [...(store[storeKey] || []), ...saved];
      writeStore(store);
      return saved;
    },

    async update(id, row) {
      const store = readStore();
      let updated = null;
      store[storeKey] = (store[storeKey] || []).map((existing) => {
        if (existing.id !== id) return existing;
        updated = { ...existing, ...row };
        return updated;
      });
      writeStore(store);
      return updated;
    },

    async delete(id) {
      const store = readStore();
      store[storeKey] = (store[storeKey] || []).filter((row) => row.id !== id);
      writeStore(store);
    },
  };
}

function getSessionUser() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { userId } = JSON.parse(raw);
    const user = SEED_USERS.find((u) => u.id === userId);
    if (!user) return null;
    const { password, ...safe } = user;
    return safe;
  } catch {
    return null;
  }
}

export function createDemoDataClient() {
  const entities = {};
  for (const entityName of Object.keys(ENTITY_KEYS)) {
    entities[entityName] = createEntity(entityName);
  }

  return {
    entities,
    auth: {
      me: async () => getSessionUser(),
      login: async (username, password) => {
        const user = SEED_USERS.find(
          (u) => u.username === username && u.password === password
        );
        if (!user) throw new Error("invalid_credentials");
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id }));
        const { password: _, ...safe } = user;
        return safe;
      },
      logout: () => {
        sessionStorage.removeItem(SESSION_KEY);
      },
      redirectToLogin: () => {},
    },
  };
}
