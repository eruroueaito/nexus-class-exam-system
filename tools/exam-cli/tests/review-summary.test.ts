import { describe, expect, it } from 'vitest'

import { parseExamBundle } from '../src/lib/schema'
import { renderReviewSummary } from '../src/lib/review-summary'

describe('review summary renderer', () => {
  it('renders a markdown summary with question bullets', () => {
    const bundle = parseExamBundle({
      version: 1,
      exam: {
        slug: 'intro-macro-quiz-01',
        title: 'Introductory Macroeconomics - Quiz 01',
        language: 'en',
        topic: 'introductory macroeconomics',
        access_password: '123',
        publish: false,
        randomize_questions: true,
        randomize_options: false,
        time_limit_minutes: 15,
      },
      questions: [
        {
          id: 'q01',
          type: 'radio',
          stem: 'What does GDP measure?',
          options: [
            { id: 'A', text: 'Total exports only' },
            { id: 'B', text: 'The market value of final goods and services produced domestically' },
          ],
          correct_answer: ['B'],
          explanation:
            'GDP measures the market value of final goods and services produced within a country over a period.',
          points: 1,
        },
      ],
    })

    const summary = renderReviewSummary(bundle)

    expect(summary).toContain('# Introductory Macroeconomics - Quiz 01 Review Summary')
    expect(summary).toContain('Question count: `1`')
    expect(summary).toContain('1. `q01` asks what GDP measures')
  })
})
