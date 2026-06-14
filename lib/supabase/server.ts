import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database";

let serviceClient: SupabaseClient<Database> | undefined;

function requireServerEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env.local and configure it before running server-side scripts.`,
    );
  }

  return value;
}

export function createSupabaseServiceClient(): SupabaseClient<Database> {
  if (typeof window !== "undefined") {
    throw new Error("The Supabase service client is server-only.");
  }

  if (!serviceClient) {
    serviceClient = createClient<Database>(
      requireServerEnv("NEXT_PUBLIC_SUPABASE_URL"),
      requireServerEnv("SUPABASE_SERVICE_ROLE_KEY"),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }

  return serviceClient;
}
