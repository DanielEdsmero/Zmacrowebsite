import "server-only";
import { createClient as createSupabase } from "@supabase/supabase-js";

// Service-role client. Bypasses RLS. Must only ever be imported from server
// code (route handlers, server actions, server components). The `server-only`
// import above will cause a build-time error if this module ends up in a
// client bundle.
export function createAdminClient() {
  return createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}
