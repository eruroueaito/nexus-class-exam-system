import { describe, expect, it, vi } from 'vitest'

import { syncBundle } from '../src/commands/sync-bundles'
import { parseExamBundle } from '../src/lib/schema'

describe('sync bundle orchestration', () => {
  it('runs validate, review, apply, and publish for published bundles', async () => {
    const events: string[] = []
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

    await syncBundle('content/exams/intro-macro-quiz-01.yaml', {
      validateBundleFile: vi.fn(() => {
        events.push('validate')
        return bundle
      }),
      reviewBundleFile: vi.fn(() => {
        events.push('review')
        return 'review'
      }),
      applyBundleFile: vi.fn(async () => {
        events.push('apply')
        return { examId: 'exam-id', questionCount: 1 }
      }),
      setBundlePublishState: vi.fn(async () => {
        events.push('publish')
        return { slug: bundle.exam.slug, published: true }
      }),
    })

    expect(events).toEqual(['validate', 'review', 'apply', 'publish'])
  })

  it('runs validate, review, apply, and unpublish for draft bundles', async () => {
    const events: string[] = []
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

    await syncBundle('content/exams/intro-macro-quiz-01.yaml', {
      validateBundleFile: vi.fn(() => {
        events.push('validate')
        return bundle
      }),
      reviewBundleFile: vi.fn(() => {
        events.push('review')
        return 'review'
      }),
      applyBundleFile: vi.fn(async () => {
        events.push('apply')
        return { examId: 'exam-id', questionCount: 1 }
      }),
      setBundlePublishState: vi.fn(async () => {
        events.push('unpublish')
        return { slug: bundle.exam.slug, published: false }
      }),
    })

    expect(events).toEqual(['validate', 'review', 'apply', 'unpublish'])
  })
})
