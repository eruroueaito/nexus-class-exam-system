/**
 * Module: Supabase browser client
 * Responsibility: Lazily create the shared browser client for frontend APIs
 * Inputs/Outputs: Exports a function that returns a Supabase client instance
 * Dependencies: Depends on @supabase/supabase-js and runtime environment values
 * Notes: The client is created lazily so tests that do not need env vars can still run
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseEnv } from './env'

let browserClient: SupabaseClient | null = null

export function getSupabaseBrowserClient() {
  if (browserClient) {
    return browserClient
  }

  const { supabaseUrl, supabasePublishableKey } = getSupabaseEnv()

  browserClient = createClient(supabaseUrl, supabasePublishableKey)

  return browserClient
}
