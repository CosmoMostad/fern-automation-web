import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client. Use in:
 *   - Server Components
 *   - Route Handlers (app/.../route.ts)
 *   - Server Actions
 * Reads cookies for auth, so the queries it runs are RLS-scoped to the
 * signed-in user.
 */
export async function createSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll fails in Server Components; OK because middleware refreshes cookies.
          }
        },
      },
    }
  );
}

/**
 * Service-role client. Bypasses RLS. Use ONLY in trusted server contexts
 * (cron jobs, webhooks, agent runtime endpoints). NEVER expose to the browser.
 */
export function createSupabaseServiceRoleClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local for local dev or the Vercel env vars for prod."
    );
  }
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // service-role client doesn't manage user cookies
        },
      },
    }
  );
}
