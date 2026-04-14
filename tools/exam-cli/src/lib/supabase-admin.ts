/**
 * Module: Supabase admin client factory
 * Responsibility: Create a trusted local Supabase client for exam CLI operations
 * Inputs/Outputs: Reads operator environment variables and returns a service-role client
 * Dependencies: Depends on Supabase JS
 * Notes: This module is only for local trusted tooling and must never be used in the browser
 */

import { createClient } from '@supabase/supabase-js'

export function createSupabaseAdminClient() {
  const url = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.')
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
