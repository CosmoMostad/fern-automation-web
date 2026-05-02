import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Supabase auth callback. Handles both magic-link flows:
 *
 *   1. PKCE / code flow      → ?code=...
 *      (older signInWithOtp default; we exchange the code for a session)
 *
 *   2. Token-hash flow       → ?token_hash=...&type=email
 *      (newer Supabase default; we verify the token directly)
 *
 * Either path: success → redirect to /console (or ?next=). Failure → back to
 * /console/login with the error in a query string.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") ?? "/console";

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createSupabaseServerClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    return NextResponse.redirect(
      `${origin}/console/login?error=${encodeURIComponent(error.message)}`
    );
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    return NextResponse.redirect(
      `${origin}/console/login?error=${encodeURIComponent(error.message)}`
    );
  }

  return NextResponse.redirect(
    `${origin}/console/login?error=Missing+auth+code`
  );
}
