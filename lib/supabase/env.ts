/**
 * Detect whether Supabase env vars are wired up.
 * Until the project is created and creds are added to .env.local, the
 * dashboard falls back to the demo state defined in lib/db/demo.ts.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function isServiceRoleConfigured(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}
