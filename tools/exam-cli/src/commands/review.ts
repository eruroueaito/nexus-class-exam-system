/**
 * Module: review command
 * Responsibility: Generate and optionally persist a Markdown review summary for an exam bundle
 * Inputs/Outputs: Accepts a bundle path and returns the rendered review summary
 * Dependencies: Depends on bundle validation and the review summary renderer
 * Notes: Review output is intended for explicit human approval before remote mutation
 */

import fs from 'node:fs'

import { renderReviewSummary } from '../lib/review-summary'

import { validateBundleFile } from './validate'

export function buildReviewFilePath(bundlePath: string) {
  return bundlePath.replace(/\.ya?ml$/i, '.review.md')
}

export function reviewBundleFile(bundlePath: string, writeToDisk = false) {
  const bundle = validateBundleFile(bundlePath)
  const reviewSummary = renderReviewSummary(bundle)

  if (writeToDisk) {
    fs.writeFileSync(buildReviewFilePath(bundlePath), `${reviewSummary}\n`)
  }

  return reviewSummary
}
