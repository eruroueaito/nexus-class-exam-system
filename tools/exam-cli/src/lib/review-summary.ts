/**
 * Module: exam bundle review summary renderer
 * Responsibility: Produce a Markdown review summary for a validated exam bundle
 * Inputs/Outputs: Accepts a parsed bundle and returns Markdown text
 * Dependencies: Depends on the exam bundle schema types
 * Notes: Review summaries are designed for human approval before import or publish
 */

import type { ExamBundle } from './schema'

function summarizeStem(stem: string) {
  const trimmedStem = stem.trim().replace(/[?:]\s*$/, '')
  const lowerFirst = trimmedStem.charAt(0).toLowerCase() + trimmedStem.slice(1)
  const measureMatch = trimmedStem.match(/^What does (.+) measure$/i)

  if (measureMatch) {
    return `what ${measureMatch[1]} measures`
  }

  return lowerFirst
}

export function renderReviewSummary(bundle: ExamBundle) {
  const typeCounts = bundle.questions.reduce<Record<string, number>>((counts, question) => {
    counts[question.type] = (counts[question.type] ?? 0) + 1
    return counts
  }, {})

  const questionLines = bundle.questions.map((question, index) => {
    const stemSummary = summarizeStem(question.stem)
    return `${index + 1}. \`${question.id}\` asks ${stemSummary}`
  })

  return [
    `# ${bundle.exam.title} Review Summary`,
    '',
    `- Slug: \`${bundle.exam.slug}\``,
    `- Topic: ${bundle.exam.topic}`,
    `- Language: English`,
    `- Question count: \`${bundle.questions.length}\``,
    '- Question types:',
    ...Object.entries(typeCounts).map(([type, count]) => `  - \`${type}\`: \`${count}\``),
    `- Publish target: \`${bundle.exam.publish ? 'yes' : 'no'}\``,
    `- Access password configured: \`${bundle.exam.access_password ? 'yes' : 'no'}\``,
    '',
    '## Question Summaries',
    '',
    ...questionLines,
  ].join('\n')
}
