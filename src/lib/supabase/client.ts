"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

export function createClient() {
  const { supabaseUrl, supabaseKey } = getSupabaseEnv();

  return createBrowserClient<Database>(supabaseUrl, supabaseKey);
}
