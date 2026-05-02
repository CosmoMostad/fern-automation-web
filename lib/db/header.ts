/**
 * Header data — the minimum each page needs to render the shared chrome
 * (org name + display name). Kept light so even placeholder routes can
 * load it without spinning up the bigger payload-specific loaders.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type HeaderData = {
  business: string;
  user: string;
};

export async function getHeaderData(): Promise<HeaderData> {
  if (!isSupabaseConfigured()) {
    return { business: "Fern", user: "demo" };
  }
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { business: "Fern", user: "demo" };

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, display_name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  let business = "Fern";
  if (membership?.org_id) {
    const { data: org } = await supabase
      .from("orgs")
      .select("name")
      .eq("id", membership.org_id)
      .maybeSingle();
    business = (org?.name as string | undefined) ?? "Fern";
  }

  return {
    business,
    user:
      (membership?.display_name as string | null) ?? user.email ?? "you",
  };
}
