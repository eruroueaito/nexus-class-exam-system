/**
 * Module: apply command
 * Responsibility: Import a validated exam bundle into Supabase
 * Inputs/Outputs: Accepts a bundle path and returns a persisted exam summary
 * Dependencies: Depends on validation, import planning, and the trusted Supabase admin client
 * Notes: This command should only run after human review
 */

import { applyImportPlan, buildImportPlan } from '../lib/importer'
import { createSupabaseAdminClient } from '../lib/supabase-admin'

import { validateBundleFile } from './validate'

export async function applyBundleFile(bundlePath: string) {
  const bundle = validateBundleFile(bundlePath)
  const client = createSupabaseAdminClient()
  return applyImportPlan(client, buildImportPlan(bundle))
}
