import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the user's session cookie on each request and returns a
 * NextResponse that we can either pass through or redirect.
 * Called from the root middleware.ts.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Touch getUser() to refresh the session if needed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}

/** Routes under /console (except /console/login and /console/auth) require auth. */
export function isProtectedConsoleRoute(pathname: string) {
  if (!pathname.startsWith("/console")) return false;
  if (pathname.startsWith("/console/login")) return false;
  if (pathname.startsWith("/console/auth")) return false;
  return true;
}
