const fallbackSupabaseUrl = "https://mrojfiejpiaxvggiqxsd.supabase.co";
const fallbackSupabasePublishableKey = "sb_publishable_xH-7XJ7_ad-lfqt1b9Axhw_dNYUMQRs";

export function getSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || fallbackSupabaseUrl;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    fallbackSupabasePublishableKey;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  }

  return { supabaseUrl, supabaseKey };
}
