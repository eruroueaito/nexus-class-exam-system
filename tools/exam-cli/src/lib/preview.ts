/**
 * Module: exam bundle preview renderer
 * Responsibility: Produce human-readable terminal previews for validated exam bundles
 * Inputs/Outputs: Accepts a parsed exam bundle and returns a formatted string
 * Dependencies: Depends on the typed exam bundle schema
 * Notes: Preview output is deterministic so operators can compare review summaries over time
 */

import type { ExamBundle } from './schema'

export function renderBundlePreview(bundle: ExamBundle) {
  const typeCounts = bundle.questions.reduce<Record<string, number>>((counts, question) => {
    counts[question.type] = (counts[question.type] ?? 0) + 1
    return counts
  }, {})

  const lines = [
    `Title: ${bundle.exam.title}`,
    `Slug: ${bundle.exam.slug}`,
    `Topic: ${bundle.exam.topic}`,
    `Language: ${bundle.exam.language}`,
    `Question count: ${bundle.questions.length}`,
    `Publish target: ${bundle.exam.publish ? 'yes' : 'no'}`,
    `Password configured: ${bundle.exam.access_password ? 'yes' : 'no'}`,
    'Question types:',
    ...Object.entries(typeCounts).map(([type, count]) => `- ${type}: ${count}`),
  ]

  return lines.join('\n')
}
