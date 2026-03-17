/**
 * src/lib/supabase-client.ts
 *
 * Browser-side Supabase client factory.
 *
 * Security fix vs original:
 *  ✅ Removed `export const supabase = createClient()` singleton
 *
 * Why the singleton was dangerous:
 *  In Next.js App Router with SSR, module-level singletons can be shared
 *  across different users' requests on the server, causing session bleed —
 *  one user accidentally seeing another user's data.
 *
 *  Always call createClient() inside a component, hook, or function.
 *  Never store the result at module level.
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Alias for services that prefer explicit naming
export const createBrowserSupabaseClient = createClient

// ⛔ DO NOT add: export const supabase = createClient()
//    Use createClient() directly inside your components/hooks.
//    See AuthContext.tsx for the correct pattern (useRef + createClient).