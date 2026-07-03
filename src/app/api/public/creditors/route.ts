import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("creditor_organizations")
    .select("id, organization_name, short_name, logo_url, logo, website, organization_type")
    .eq("status", "approved")
    .eq("is_public", true)
    .order("display_order", { ascending: true });

  return NextResponse.json({ creditors: data ?? [] });
}
