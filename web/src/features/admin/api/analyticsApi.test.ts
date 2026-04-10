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
          user_answer: ['B'],
        },
        {
          submission_id: 'submission-1',
          question_id: 'question-2',
          is_correct: true,
          user_answer: ['A', 'B'],
        },
        {
          submission_id: 'submission-2',
          question_id: 'question-1',
          is_correct: false,
          user_answer: ['A'],
        },
        {
          submission_id: 'submission-2',
          question_id: 'question-2',
          is_correct: true,
          user_answer: ['A', 'B'],
        },
      ],
      questions: [
        {
          id: 'question-1',
          order_index: 1,
          type: 'radio',
          content: {
            stem: 'What does opportunity cost describe?',
            options: [
              { id: 'A', text: 'Money already spent' },
              { id: 'B', text: 'The next best alternative foregone' },
            ],
          },
        },
        {
          id: 'question-2',
          order_index: 2,
          type: 'checkbox',
          content: {
            stem: 'Select every characteristic that fits a perfectly competitive market.',
            options: [
              { id: 'A', text: 'Many buyers and sellers' },
              { id: 'B', text: 'Identical products' },
              { id: 'C', text: 'Strong barriers to entry' },
            ],
          },
        },
      ],
    })

    expect(result.averageAccuracyLabel).toBe('83.3%')
    expect(result.activeStudents).toBe(2)
    expect(result.commonErrorLabel).toBe('Q.01')
    expect(result.scoreDistribution).toEqual([
      { label: '60-69%', submissionCount: 1 },
      { label: '100%', submissionCount: 1 },
    ])
    expect(result.questionHeat[0]).toMatchObject({
      questionLabel: 'Q.01',
      incorrectRateLabel: '50.0%',
      attempts: 2,
      wrongStudents: [
        {
          submissionId: 'submission-2',
          name: 'David',
          answerLabel: 'A',
        },
      ],
      optionBreakdown: [
        {
          optionId: 'A',
          optionText: 'Money already spent',
          selectedCount: 1,
          selectedRateLabel: '50.0%',
        },
        {
          optionId: 'B',
          optionText: 'The next best alternative foregone',
          selectedCount: 1,
          selectedRateLabel: '50.0%',
        },
      ],
    })
  })
})
