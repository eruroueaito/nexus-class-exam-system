/**
 * Module: full pipeline command
 * Responsibility: Execute validate, preview, apply, publish, commit, and push in one trusted flow
 * Inputs/Outputs: Accepts a bundle path and approval flag, then performs the end-to-end pipeline
 * Dependencies: Depends on validate, preview, apply, publish, and git helpers
 * Notes: The approval check is mandatory to preserve the human review gate
 */

import { commitAndPushBundle, assertPipelineApproved } from '../lib/git'

import { applyBundleFile } from './apply'
import { setBundlePublishState } from './publish'
import { previewBundleFile } from './preview'
import { reviewBundleFile } from './review'
import { validateBundleFile } from './validate'

export async function runFullPipeline(bundlePath: string, isApproved: boolean) {
  assertPipelineApproved(isApproved)

  const bundle = validateBundleFile(bundlePath)
  const preview = previewBundleFile(bundlePath)
  const review = reviewBundleFile(bundlePath, true)
  const applied = await applyBundleFile(bundlePath)

  if (bundle.exam.publish) {
    await setBundlePublishState(bundlePath, true)
  }

  commitAndPushBundle(bundlePath)

  return {
    preview,
    review,
    applied,
    published: bundle.exam.publish,
  }
}
