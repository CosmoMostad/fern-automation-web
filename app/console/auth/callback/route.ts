import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * OAuth / magic-link callback.
 * Supabase redirects here with ?code=...; we exchange it for a session
 * and then redirect to the console.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/console";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    return NextResponse.redirect(
      `${origin}/console/login?error=${encodeURIComponent(error.message)}`
    );
  }

  return NextResponse.redirect(
    `${origin}/console/login?error=Missing+auth+code`
  );
}
