/**
 * Module: admin login API
 * Responsibility: Wrap Supabase Auth calls used by the admin portal
 * Inputs/Outputs: Accepts admin credentials and returns normalized session summaries
 * Dependencies: Depends on the shared Supabase browser client
 * Notes: Admin access is determined from app_metadata.role and not from user-editable metadata
 */

import { getSupabaseBrowserClient } from '../../../lib/supabase'

export interface AdminCredentials {
  email: string
  password: string
}

export interface AdminSessionSummary {
  email: string
}

function ensureAdminRole(user: {
  email?: string | null
  app_metadata?: Record<string, unknown>
}) {
  if (user.app_metadata?.role !== 'admin') {
    throw new Error('This account is not authorized for the admin portal.')
  }

  return {
    email: user.email ?? 'admin',
  }
}

export async function signInAsAdmin(credentials: AdminCredentials) {
  const client = getSupabaseBrowserClient()
  const { data, error } = await client.auth.signInWithPassword(credentials)

  if (error) {
    throw error
  }

  try {
    return ensureAdminRole(data.user ?? {})
  } catch (error) {
    await client.auth.signOut()
    throw error
  }
}

export async function getAdminSession(): Promise<AdminSessionSummary | null> {
  const client = getSupabaseBrowserClient()
  const { data, error } = await client.auth.getSession()

  if (error) {
    throw error
  }

  const session = data.session

  if (!session) {
    return null
  }

  try {
    return ensureAdminRole(session.user)
  } catch {
    return null
  }
}

export async function signOutAdmin() {
  const client = getSupabaseBrowserClient()
  const { error } = await client.auth.signOut()

  if (error) {
    throw error
  }
}
