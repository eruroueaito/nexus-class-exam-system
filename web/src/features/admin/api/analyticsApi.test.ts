import { describe, expect, test } from 'vitest'
import { mapAnalyticsData } from './analyticsApi'

describe('analyticsApi', () => {
  test('maps submissions and question results into dashboard analytics', () => {
    const result = mapAnalyticsData({
      submissions: [
        {
          id: 'submission-1',
          user_name: 'Alice',
          score: 1,
          submitted_at: '2026-04-08T15:00:00Z',
        },
        {
          id: 'submission-2',
          user_name: 'David',
          score: 0.6666666667,
          submitted_at: '2026-04-09T15:00:00Z',
        },
      ],
      questionResults: [
        {
          submission_id: 'submission-1',
          question_id: 'question-1',
          is_correct: true,
        },
        {
          submission_id: 'submission-1',
          question_id: 'question-2',
          is_correct: true,
        },
        {
          submission_id: 'submission-2',
          question_id: 'question-1',
          is_correct: false,
        },
        {
          submission_id: 'submission-2',
          question_id: 'question-2',
          is_correct: true,
        },
      ],
      questions: [
        {
          id: 'question-1',
          order_index: 1,
          content: {
            stem: 'What does opportunity cost describe?',
          },
        },
        {
          id: 'question-2',
          order_index: 2,
          content: {
            stem: 'Select every characteristic that fits a perfectly competitive market.',
          },
        },
      ],
    })

    expect(result.averageAccuracyLabel).toBe('83.3%')
    expect(result.activeStudents).toBe(2)
    expect(result.commonErrorLabel).toBe('Q.01')
    expect(result.scoreTrend).toHaveLength(2)
    expect(result.questionHeat[0]).toMatchObject({
      questionLabel: 'Q.01',
      incorrectRateLabel: '50.0%',
      attempts: 2,
    })
  })
})
