/**
 * Module: publish command
 * Responsibility: Force the publish state of an imported exam bundle
 * Inputs/Outputs: Accepts a bundle path and the target publish state
 * Dependencies: Depends on validation, import helpers, and the trusted Supabase admin client
 * Notes: This command updates only the exam active-state flag
 */

import { buildPublishMutation } from '../lib/importer'
import { createSupabaseAdminClient } from '../lib/supabase-admin'

import { validateBundleFile } from './validate'

export async function setBundlePublishState(bundlePath: string, isPublished: boolean) {
  const bundle = validateBundleFile(bundlePath)
  const client = createSupabaseAdminClient()

  const response = await client
    .from('exams')
    .update(buildPublishMutation(isPublished))
    .eq('slug', bundle.exam.slug)

  if (response.error) {
    throw new Error(response.error.message)
  }

  return {
    slug: bundle.exam.slug,
    published: isPublished,
  }
}
