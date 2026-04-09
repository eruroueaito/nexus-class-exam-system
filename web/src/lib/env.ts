/**
 * Module: environment helpers
 * Responsibility: Read and validate required Vite environment variables
 * Inputs/Outputs: Returns normalized Supabase runtime configuration
 * Dependencies: Depends on Vite import.meta.env values
 * Notes: Validation is intentionally strict to avoid silent misconfiguration
 */

interface SupabaseEnv {
  supabaseUrl: string
  supabasePublishableKey: string
}

function requireEnv(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

export function getSupabaseEnv(): SupabaseEnv {
  return {
    supabaseUrl: requireEnv(
      import.meta.env.VITE_SUPABASE_URL,
      'VITE_SUPABASE_URL',
    ),
    supabasePublishableKey: requireEnv(
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      'VITE_SUPABASE_PUBLISHABLE_KEY',
    ),
  }
}

export function getOptionalSupabaseEnv(): SupabaseEnv | null {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabasePublishableKey) {
    return null
  }

  return {
    supabaseUrl,
    supabasePublishableKey,
  }
}
