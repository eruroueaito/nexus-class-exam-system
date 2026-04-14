import { afterEach, describe, expect, it, vi } from 'vitest'

import { syncBundle, syncBundles } from '../src/commands/sync-bundles'
import { parseExamBundle } from '../src/lib/schema'

afterEach(() => {
  vi.unstubAllEnvs()
})

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

  it('rejects local sync-bundles execution outside GitHub Actions', async () => {
    vi.stubEnv('GITHUB_ACTIONS', 'false')

    await expect(syncBundles(['content/exams/intro-macro-quiz-01.yaml'])).rejects.toThrow(
      'sync-bundles is restricted to GitHub Actions.',
    )
  })

  it('surfaces an actionable migration error when exams.slug is missing remotely', async () => {
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

    await expect(
      syncBundle('content/exams/intro-macro-quiz-01.yaml', {
        validateBundleFile: vi.fn(() => bundle),
        reviewBundleFile: vi.fn(() => 'review'),
        applyBundleFile: vi.fn(async () => {
          throw new Error('column exams.slug does not exist')
        }),
        setBundlePublishState: vi.fn(async () => ({ slug: bundle.exam.slug, published: true })),
      }),
    ).rejects.toThrow(
      'Remote Supabase schema is missing public.exams.slug and/or public.exams.metadata. Apply migration 20260414012000_add_exam_slug_and_metadata.sql before running sync-bundles.',
    )
  })

  it('surfaces an actionable migration error when helper RPCs are missing remotely', async () => {
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

    await expect(
      syncBundle('content/exams/intro-macro-quiz-01.yaml', {
        validateBundleFile: vi.fn(() => bundle),
        reviewBundleFile: vi.fn(() => 'review'),
        applyBundleFile: vi.fn(async () => {
          throw new Error("Could not find the function public.upsert_answer_record(target_question_id, target_correct_answer, target_explanation) in the schema cache")
        }),
        setBundlePublishState: vi.fn(async () => ({ slug: bundle.exam.slug, published: true })),
      }),
    ).rejects.toThrow(
      'Remote Supabase schema is missing required helper RPCs for exam sync. Ensure migrations 20260409193000_private_helper_functions.sql and 20260409221000_upsert_exam_access_password_hash.sql are applied before running sync-bundles.',
    )
  })
})
