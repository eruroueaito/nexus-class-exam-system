/**
 * Module: admin analytics API
 * Responsibility: Load and normalize dashboard analytics for the authenticated admin workspace
 * Inputs/Outputs: Returns dashboard statistics, score trend points, and question heat rows
 * Dependencies: Depends on the shared Supabase browser client
 * Notes: A local fallback keeps the admin dashboard demonstrable before real Supabase credentials are configured
 */

import { getSupabaseBrowserClient } from '../../../lib/supabase'

interface SubmissionRow {
  id: string
  user_name: string
  score: number
  submitted_at: string
}

interface QuestionResultRow {
  submission_id: string
  question_id: string
  is_correct: boolean
}

interface QuestionRow {
  id: string
  order_index: number
  content: {
    stem?: string
  }
}

interface AnalyticsInput {
  submissions: SubmissionRow[]
  questionResults: QuestionResultRow[]
  questions: QuestionRow[]
}

export interface ScoreTrendPoint {
  label: string
  scorePercent: number
}

export interface QuestionHeatRow {
  questionId: string
  questionLabel: string
  questionStem: string
  incorrectRateLabel: string
  attempts: number
}

export interface AdminAnalyticsSnapshot {
  averageAccuracyLabel: string
  activeStudents: number
  commonErrorLabel: string
  scoreTrend: ScoreTrendPoint[]
  questionHeat: QuestionHeatRow[]
}

const fallbackAnalytics: AdminAnalyticsSnapshot = {
  averageAccuracyLabel: '83.3%',
  activeStudents: 2,
  commonErrorLabel: 'Q.01',
  scoreTrend: [
    { label: 'Apr 8', scorePercent: 100 },
    { label: 'Apr 9', scorePercent: 66.7 },
  ],
  questionHeat: [
    {
      questionId: 'question-1',
      questionLabel: 'Q.01',
      questionStem: 'What does opportunity cost describe?',
      incorrectRateLabel: '50.0%',
      attempts: 2,
    },
  ],
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

function formatTrendLabel(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

export function mapAnalyticsData({
  submissions,
  questionResults,
  questions,
}: AnalyticsInput): AdminAnalyticsSnapshot {
  if (submissions.length === 0) {
    return {
      averageAccuracyLabel: '0.0%',
      activeStudents: 0,
      commonErrorLabel: 'None',
      scoreTrend: [],
      questionHeat: [],
    }
  }

  const averageScore =
    submissions.reduce((sum, submission) => sum + submission.score, 0) / submissions.length

  const activeStudents = new Set(submissions.map((submission) => submission.user_name)).size

  const questionIndex = new Map(
    questions.map((question) => [
      question.id,
      {
        orderIndex: question.order_index,
        stem: question.content.stem ?? 'Untitled question',
      },
    ]),
  )

  const questionStats = new Map<
    string,
    {
      attempts: number
      incorrect: number
    }
  >()

  for (const row of questionResults) {
    const currentStats = questionStats.get(row.question_id) ?? {
      attempts: 0,
      incorrect: 0,
    }

    currentStats.attempts += 1
    if (!row.is_correct) {
      currentStats.incorrect += 1
    }

    questionStats.set(row.question_id, currentStats)
  }

  const questionHeat = [...questionStats.entries()]
    .map(([questionId, stats]) => {
      const question = questionIndex.get(questionId)
      const orderIndex = question?.orderIndex ?? 999
      const incorrectRate = stats.attempts === 0 ? 0 : (stats.incorrect / stats.attempts) * 100

      return {
        questionId,
        questionLabel: `Q.${String(orderIndex).padStart(2, '0')}`,
        questionStem: question?.stem ?? 'Untitled question',
        incorrectRate,
        incorrectRateLabel: formatPercent(incorrectRate),
        attempts: stats.attempts,
      }
    })
    .sort((left, right) => {
      if (right.incorrectRate !== left.incorrectRate) {
        return right.incorrectRate - left.incorrectRate
      }

      if (right.attempts !== left.attempts) {
        return right.attempts - left.attempts
      }

      return left.questionLabel.localeCompare(right.questionLabel)
    })

  return {
    averageAccuracyLabel: formatPercent(averageScore * 100),
    activeStudents,
    commonErrorLabel: questionHeat[0]?.questionLabel ?? 'None',
    scoreTrend: submissions
      .slice(-7)
      .map((submission) => ({
        label: formatTrendLabel(submission.submitted_at),
        scorePercent: Number((submission.score * 100).toFixed(1)),
      })),
    questionHeat: questionHeat.map(({ incorrectRate, ...row }) => row),
  }
}

export async function getExamAnalytics(): Promise<AdminAnalyticsSnapshot> {
  try {
    const client = getSupabaseBrowserClient()

    const [{ data: submissions, error: submissionsError }, { data: questionResults, error: questionResultsError }, { data: questions, error: questionsError }] =
      await Promise.all([
        client
          .from('submissions')
          .select('id,user_name,score,submitted_at')
          .order('submitted_at', { ascending: true }),
        client
          .from('submission_items')
          .select('submission_id,question_id,is_correct'),
        client
          .from('questions')
          .select('id,order_index,content')
          .order('order_index', { ascending: true }),
      ])

    if (submissionsError) {
      throw submissionsError
    }

    if (questionResultsError) {
      throw questionResultsError
    }

    if (questionsError) {
      throw questionsError
    }

    return mapAnalyticsData({
      submissions: (submissions ?? []) as SubmissionRow[],
      questionResults: (questionResults ?? []) as QuestionResultRow[],
      questions: (questions ?? []) as QuestionRow[],
    })
  } catch {
    return fallbackAnalytics
  }
}
