import { describe, expect, it } from 'vitest'

import { parseExamBundle } from '../src/lib/schema'
import { buildImportPlan } from '../src/lib/importer'

describe('import plan builder', () => {
  it('normalizes the bundle into exam and question write payloads', () => {
    const bundle = parseExamBundle({
      version: 1,
      exam: {
        slug: 'intro-macro-quiz-01',
        title: 'Introductory Macroeconomics - Quiz 01',
        language: 'en',
        topic: 'introductory macroeconomics',
        access_password: '123',
        publish: true,
        randomize_questions: true,
        randomize_options: false,
        time_limit_minutes: null,
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

    const plan = buildImportPlan(bundle)

    expect(plan.exam.title).toBe('Introductory Macroeconomics - Quiz 01')
    expect(plan.exam.isActive).toBe(true)
    expect(plan.questions[0]?.content.stem).toBe('What does GDP measure?')
    expect(plan.answers[0]?.correctAnswer).toEqual(['B'])
    expect(plan.passwordRotation).toBe('123')
  })
})
