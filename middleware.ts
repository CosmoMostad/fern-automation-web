import { NextResponse, type NextRequest } from "next/server";
import {
  isProtectedConsoleRoute,
  updateSession,
} from "@/lib/supabase/middleware";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function middleware(request: NextRequest) {
  // If Supabase isn't wired up yet, skip auth entirely so the prototype
  // remains accessible during development.
  if (!isSupabaseConfigured()) {
    return NextResponse.next();
  }

  // Allow demo routes (?demo=wsc / ?demo=empty) without auth — useful for
  // showing the console to prospects without making them sign up.
  const url = new URL(request.url);
  const hasDemoParam = url.searchParams.has("demo");

  if (hasDemoParam && url.pathname === "/console") {
    return NextResponse.next();
  }

  const { response, user } = await updateSession(request);

  if (isProtectedConsoleRoute(url.pathname) && !user) {
    const loginUrl = new URL("/console/login", request.url);
    loginUrl.searchParams.set("next", url.pathname + url.search);
    return NextResponse.redirect(loginUrl);
  }

  // If a signed-in user hits /console/login, send them straight to /console.
  if (url.pathname === "/console/login" && user) {
    return NextResponse.redirect(new URL("/console", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    // Bare /console — `:path*` alone doesn't reliably match the index
    // route depending on the Next.js version, so list it explicitly.
    "/console",
    // Everything under /console.
    "/console/:path*",
  ],
};
