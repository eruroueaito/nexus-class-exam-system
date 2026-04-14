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

export async function syncBundle(
  bundlePath: string,
  dependencies: SyncBundleDependencies = defaultDependencies,
) {
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
