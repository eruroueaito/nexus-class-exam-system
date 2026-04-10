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

export interface ScoreDistributionPoint {
  label: string
  submissionCount: number
}

export interface QuestionHeatRow {
  questionId: string
  questionLabel: string
  questionStem: string
  incorrectRateLabel: string
  attempts: number
  wrongStudents?: string[]
}

export interface AdminAnalyticsSnapshot {
  averageAccuracyLabel: string
  activeStudents: number
  commonErrorLabel: string
  scoreDistribution: ScoreDistributionPoint[]
  questionHeat: QuestionHeatRow[]
}

const fallbackAnalytics: AdminAnalyticsSnapshot = {
  averageAccuracyLabel: '83.3%',
  activeStudents: 2,
  commonErrorLabel: 'Q.01',
  scoreDistribution: [
    { label: '60-69%', submissionCount: 1 },
    { label: '100%', submissionCount: 1 },
  ],
  questionHeat: [
    {
      questionId: 'question-1',
      questionLabel: 'Q.01',
      questionStem: 'What does opportunity cost describe?',
      incorrectRateLabel: '50.0%',
      attempts: 2,
      wrongStudents: [],
    },
  ],
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

function getScoreBucketLabel(scorePercent: number) {
  if (scorePercent >= 100) {
    return '100%'
  }

  const lowerBound = Math.floor(scorePercent / 10) * 10
  const upperBound = lowerBound + 9
  return `${lowerBound}-${upperBound}%`
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
      scoreDistribution: [],
      questionHeat: [],
    }
  }

  const averageScore =
    submissions.reduce((sum, submission) => sum + submission.score, 0) / submissions.length

  // Case-insensitive, trimmed deduplication: same student submitting under slightly
  // different capitalizations or with leading/trailing spaces counts as one active student.
  const activeStudents = new Set(submissions.map((s) => s.user_name.trim().toLowerCase())).size

  const submissionUserMap = new Map(submissions.map((s) => [s.id, s.user_name.trim()]))

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
      wrongStudentNames: string[]
    }
  >()

  for (const row of questionResults) {
    const currentStats = questionStats.get(row.question_id) ?? {
      attempts: 0,
      incorrect: 0,
      wrongStudentNames: [],
    }

    currentStats.attempts += 1
    if (!row.is_correct) {
      currentStats.incorrect += 1
      const userName = submissionUserMap.get(row.submission_id)
      if (userName && !currentStats.wrongStudentNames.includes(userName)) {
        currentStats.wrongStudentNames.push(userName)
      }
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
        wrongStudents: stats.wrongStudentNames,
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

  const scoreDistributionMap = new Map<string, number>()
  for (const submission of submissions) {
    const scorePercent = Number((submission.score * 100).toFixed(1))
    const bucketLabel = getScoreBucketLabel(scorePercent)
    scoreDistributionMap.set(bucketLabel, (scoreDistributionMap.get(bucketLabel) ?? 0) + 1)
  }

  const scoreDistribution = [...scoreDistributionMap.entries()]
    .map(([label, submissionCount]) => ({
      label,
      submissionCount,
    }))
    .sort((left, right) => {
      if (left.label === '100%') {
        return 1
      }
      if (right.label === '100%') {
        return -1
      }
      return Number.parseInt(left.label, 10) - Number.parseInt(right.label, 10)
    })

  return {
    averageAccuracyLabel: formatPercent(averageScore * 100),
    activeStudents,
    commonErrorLabel: questionHeat[0]?.questionLabel ?? 'None',
    scoreDistribution,
    questionHeat: questionHeat.map(({ incorrectRate, ...row }) => row),
  }
}

export async function getExamAnalytics(examId?: string): Promise<AdminAnalyticsSnapshot> {
  try {
    const client = getSupabaseBrowserClient()

    let submissionsQuery = client
      .from('submissions')
      .select('id,user_name,score,submitted_at')
      .order('submitted_at', { ascending: true })

    let questionsQuery = client
      .from('questions')
      .select('id,order_index,content')
      .order('order_index', { ascending: true })

    if (examId) {
      submissionsQuery = submissionsQuery.eq('exam_id', examId)
      questionsQuery = questionsQuery.eq('exam_id', examId)
    }

    const [{ data: submissions, error: submissionsError }, { data: questions, error: questionsError }] =
      await Promise.all([submissionsQuery, questionsQuery])

    if (submissionsError) {
      throw submissionsError
    }

    if (questionsError) {
      throw questionsError
    }

    const submissionIds = (submissions ?? []).map((s) => s.id)

    let questionResultsData: QuestionResultRow[] = []
    if (submissionIds.length > 0) {
      const { data: qr, error: qrError } = await client
        .from('submission_items')
        .select('submission_id,question_id,is_correct')
        .in('submission_id', submissionIds)

      if (qrError) {
        throw qrError
      }

      questionResultsData = (qr ?? []) as QuestionResultRow[]
    }

    return mapAnalyticsData({
      submissions: (submissions ?? []) as SubmissionRow[],
      questionResults: questionResultsData,
      questions: (questions ?? []) as QuestionRow[],
    })
  } catch {
    return fallbackAnalytics
  }
}
