import { describe, expect, it } from 'vitest'

import { parseExamBundle } from '../src/lib/schema'

describe('exam bundle schema', () => {
  it('accepts a valid radio-question bundle', () => {
    const parsed = parseExamBundle({
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

    expect(parsed.exam.slug).toBe('intro-macro-quiz-01')
    expect(parsed.questions).toHaveLength(1)
  })

  it('rejects questions without explanations', () => {
    expect(() =>
      parseExamBundle({
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
            explanation: '',
            points: 1,
          },
        ],
      }),
    ).toThrow(/explanation/i)
  })
})
