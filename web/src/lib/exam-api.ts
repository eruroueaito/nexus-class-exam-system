/**
 * Module: exam API factory
 * Responsibility: Create the browser-facing exam API from runtime environment values
 * Inputs/Outputs: Returns an exam API instance or null when configuration is unavailable
 * Dependencies: Depends on environment helpers and the feature exam API module
 * Notes: Returning null allows local prototype work without forcing env setup
 */

import { createExamApi } from '../features/exams/api/examApi'
import { getOptionalSupabaseEnv } from './env'

export function createBrowserExamApi() {
  const env = getOptionalSupabaseEnv()

  if (!env) {
    return null
  }

  return createExamApi({
    baseUrl: env.supabaseUrl,
    anonKey: env.supabasePublishableKey,
  })
}
