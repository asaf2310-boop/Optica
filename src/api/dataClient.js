import {
  getSupabaseClient,
  supabaseConfigured,
  usernameToAuthEmail,
} from "./supabase";

function assertSupabaseConfigured() {
  if (!supabaseConfigured) {
    throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  }
}

function getClient() {
  assertSupabaseConfigured();
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase client failed to initialize.");
  return client;
}

function mapProfileRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    full_name: row.full_name,
    optometrist_id: row.optometrist_id ?? null,
  };
}

async function fetchCurrentProfile() {
  const client = getClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return null;

  const { data, error } = await client
    .from("profiles")
    .select("id, username, role, full_name, optometrist_id")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  return mapProfileRow(data);
}

function createEntity(tableName) {
  return {
    async filter(filters = {}) {
      const client = getClient();
      let query = client.from(tableName).select("*");

      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },

    async list(order = "-created_at", limit = 100) {
      const client = getClient();
      const orderColumn = String(order || "-created_at");
      const desc = orderColumn.startsWith("-");
      const column = desc ? orderColumn.slice(1) : orderColumn;

      const { data, error } = await client
        .from(tableName)
        .select("*")
        .order(column, { ascending: !desc })
        .limit(limit);

      if (error) throw error;
      return data ?? [];
    },

    async create(row) {
      const client = getClient();
      const { data, error } = await client
        .from(tableName)
        .insert(row)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async bulkCreate(rows) {
      if (!rows?.length) return [];
      const client = getClient();
      const { data, error } = await client.from(tableName).insert(rows).select();
      if (error) throw error;
      return data ?? [];
    },

    async update(id, row) {
      const client = getClient();
      const { data, error } = await client
        .from(tableName)
        .update(row)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async delete(id) {
      const client = getClient();
      const { error } = await client.from(tableName).delete().eq("id", id);
      if (error) throw error;
    },
  };
}

const ENTITY_TABLES = {
  Optometrist: "optometrists",
  Appointment: "appointments",
  Availability: "availability",
};

export function createSupabaseDataClient() {
  const entities = {};

  for (const [name, tableName] of Object.entries(ENTITY_TABLES)) {
    entities[name] = createEntity(tableName);
  }

  return {
    entities,
    auth: {
      me: async () => fetchCurrentProfile(),

      login: async (username, password) => {
        const client = getClient();
        const email = usernameToAuthEmail(username);

        const { error: signInError } = await client.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          if (signInError.message?.toLowerCase().includes("invalid")) {
            throw new Error("invalid_credentials");
          }
          throw signInError;
        }

        const profile = await fetchCurrentProfile();
        if (!profile) {
          await client.auth.signOut();
          throw new Error("profile_missing");
        }
        return profile;
      },

      logout: async () => {
        const client = getClient();
        await client.auth.signOut();
      },

      redirectToLogin: () => {},
    },
  };
}

export function useSupabaseBackend() {
  return supabaseConfigured;
}
