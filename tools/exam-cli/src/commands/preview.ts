/**
 * Module: preview command
 * Responsibility: Render a review preview for an exam bundle file
 * Inputs/Outputs: Accepts a bundle path and returns a formatted preview string
 * Dependencies: Depends on bundle validation and preview rendering
 * Notes: Preview never mutates remote data
 */

import { renderBundlePreview } from '../lib/preview'

import { validateBundleFile } from './validate'

export function previewBundleFile(bundlePath: string) {
  return renderBundlePreview(validateBundleFile(bundlePath))
}
