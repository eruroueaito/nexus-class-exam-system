/**
 * Module: sync bundles command
 * Responsibility: Execute the CI-oriented bundle sync flow for one or more reviewed exam bundles
 * Inputs/Outputs: Accepts bundle paths and applies validate, review, import, and publish-state updates
 * Dependencies: Depends on validate, review, apply, and publish commands
 * Notes: This command is restricted to GitHub Actions so remote writes cannot be triggered from an arbitrary local shell
 */

import { applyBundleFile } from './apply'
import { setBundlePublishState } from './publish'
import { reviewBundleFile } from './review'
import { validateBundleFile } from './validate'

interface SyncBundleDependencies {
  validateBundleFile: typeof validateBundleFile
  reviewBundleFile: typeof reviewBundleFile
  applyBundleFile: typeof applyBundleFile
  setBundlePublishState: typeof setBundlePublishState
}

const defaultDependencies: SyncBundleDependencies = {
  validateBundleFile,
  reviewBundleFile,
  applyBundleFile,
  setBundlePublishState,
}

function toActionableSyncError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)

  if (
    message.includes('column exams.slug does not exist')
    || message.includes('column exams.metadata does not exist')
  ) {
    return new Error(
      'Remote Supabase schema is missing public.exams.slug and/or public.exams.metadata. Apply migration 20260414012000_add_exam_slug_and_metadata.sql before running sync-bundles.',
    )
  }

  if (
    message.includes('public.upsert_answer_record')
    || message.includes('public.upsert_exam_access_password_hash')
  ) {
    return new Error(
      'Remote Supabase schema is missing required helper RPCs for exam sync. Ensure migrations 20260409193000_private_helper_functions.sql and 20260409221000_upsert_exam_access_password_hash.sql are applied before running sync-bundles.',
    )
  }

  return error instanceof Error ? error : new Error(message)
}

export async function syncBundle(
  bundlePath: string,
  dependencies: SyncBundleDependencies = defaultDependencies,
) {
  try {
    const bundle = dependencies.validateBundleFile(bundlePath)
    dependencies.reviewBundleFile(bundlePath, true)
    const applied = await dependencies.applyBundleFile(bundlePath)
    const publishState = await dependencies.setBundlePublishState(
      bundlePath,
      bundle.exam.publish,
    )

    return {
      bundlePath,
      examSlug: bundle.exam.slug,
      applied,
      publishState,
    }
  } catch (error) {
    throw toActionableSyncError(error)
  }
}

export async function syncBundles(bundlePaths: string[]) {
  if (process.env.GITHUB_ACTIONS !== 'true') {
    throw new Error('sync-bundles is restricted to GitHub Actions.')
  }

  const results = []

  for (const bundlePath of bundlePaths) {
    results.push(await syncBundle(bundlePath))
  }

  return results
}
