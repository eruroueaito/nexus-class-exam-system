/**
 * Module: exam bundle importer
 * Responsibility: Normalize validated bundles into database write plans and execute trusted Supabase mutations
 * Inputs/Outputs: Accepts parsed bundles and returns normalized import plans or performs remote writes
 * Dependencies: Depends on the bundle schema and Supabase admin helper functions
 * Notes: This module only uses public tables and helper RPCs, never direct custom-schema writes
 */

import type { SupabaseClient } from '@supabase/supabase-js'

import type { ExamBundle } from './schema'

export interface ImportPlan {
  exam: {
    title: string
    isActive: boolean
    slug: string
    topic: string
    language: string
    timeLimitMinutes: number | null
    randomizeQuestions: boolean
    randomizeOptions: boolean
  }
  questions: Array<{
    id: string
    type: 'radio' | 'checkbox' | 'text'
    orderIndex: number
    content: {
      stem: string
      options?: Array<{ id: string; text: string }>
      points: number
    }
  }>
  answers: Array<{
    questionId: string
    correctAnswer: string[] | { keywords: string[] }
    explanation: string
  }>
  passwordRotation: string
}

interface ExamRow {
  id: string
}

function toStoredCorrectAnswer(question: ExamBundle['questions'][number]) {
  if (question.type === 'text') {
    return {
      keywords: question.correct_answer.map((item) => item.trim().toLowerCase()),
    }
  }

  return question.correct_answer.map((item) => item.trim())
}

export function buildImportPlan(bundle: ExamBundle): ImportPlan {
  return {
    exam: {
      title: bundle.exam.title,
      isActive: bundle.exam.publish,
      slug: bundle.exam.slug,
      topic: bundle.exam.topic,
      language: bundle.exam.language,
      timeLimitMinutes: bundle.exam.time_limit_minutes,
      randomizeQuestions: bundle.exam.randomize_questions,
      randomizeOptions: bundle.exam.randomize_options,
    },
    questions: bundle.questions.map((question, index) => ({
      id: question.id,
      type: question.type,
      orderIndex: index + 1,
      content: {
        stem: question.stem,
        ...(question.type === 'text' ? {} : { options: question.options }),
        points: question.points,
      },
    })),
    answers: bundle.questions.map((question) => ({
      questionId: question.id,
      correctAnswer: toStoredCorrectAnswer(question),
      explanation: question.explanation,
    })),
    passwordRotation: bundle.exam.access_password,
  }
}

export function buildPublishMutation(isPublished: boolean) {
  return {
    is_active: isPublished,
  }
}

async function getExamBySlug(client: SupabaseClient, slug: string) {
  const response = await client.from('exams').select('id').eq('slug', slug).maybeSingle()

  if (response.error) {
    throw new Error(response.error.message)
  }

  return (response.data as ExamRow | null) ?? null
}

async function createExam(client: SupabaseClient, plan: ImportPlan) {
  const response = await client
    .from('exams')
    .insert({
      slug: plan.exam.slug,
      title: plan.exam.title,
      is_active: plan.exam.isActive,
      metadata: {
        topic: plan.exam.topic,
        language: plan.exam.language,
        time_limit_minutes: plan.exam.timeLimitMinutes,
        randomize_questions: plan.exam.randomizeQuestions,
        randomize_options: plan.exam.randomizeOptions,
      },
    })
    .select('id')
    .single()

  if (response.error) {
    throw new Error(response.error.message)
  }

  return response.data as ExamRow
}

async function ensureExam(client: SupabaseClient, plan: ImportPlan) {
  const existing = await getExamBySlug(client, plan.exam.slug)

  if (existing) {
    const updateResponse = await client
      .from('exams')
      .update({
        title: plan.exam.title,
        is_active: plan.exam.isActive,
        metadata: {
          topic: plan.exam.topic,
          language: plan.exam.language,
          time_limit_minutes: plan.exam.timeLimitMinutes,
          randomize_questions: plan.exam.randomizeQuestions,
          randomize_options: plan.exam.randomizeOptions,
        },
      })
      .eq('id', existing.id)

    if (updateResponse.error) {
      throw new Error(updateResponse.error.message)
    }

    return existing
  }

  return createExam(client, plan)
}

export async function applyImportPlan(client: SupabaseClient, plan: ImportPlan) {
  const exam = await ensureExam(client, plan)

  const storedQuestionsResponse = await client
    .from('questions')
    .select('id')
    .eq('exam_id', exam.id)

  if (storedQuestionsResponse.error) {
    throw new Error(storedQuestionsResponse.error.message)
  }

  const storedQuestionIds = new Set(
    ((storedQuestionsResponse.data as Array<{ id: string }> | null) ?? []).map((row) => row.id),
  )
  const incomingQuestionIds = new Set(plan.questions.map((question) => question.id))

  for (const storedQuestionId of storedQuestionIds) {
    if (!incomingQuestionIds.has(storedQuestionId)) {
      const deleteResponse = await client
        .from('questions')
        .delete()
        .eq('id', storedQuestionId)
        .eq('exam_id', exam.id)

      if (deleteResponse.error) {
        throw new Error(deleteResponse.error.message)
      }
    }
  }

  for (const question of plan.questions) {
    const upsertResponse = await client.from('questions').upsert({
      id: question.id,
      exam_id: exam.id,
      type: question.type,
      order_index: question.orderIndex,
      content: question.content,
    })

    if (upsertResponse.error) {
      throw new Error(upsertResponse.error.message)
    }
  }

  for (const answer of plan.answers) {
    const rpcResponse = await client.rpc('upsert_answer_record', {
      target_question_id: answer.questionId,
      target_correct_answer: answer.correctAnswer,
      target_explanation: answer.explanation,
    })

    if (rpcResponse.error) {
      throw new Error(rpcResponse.error.message)
    }
  }

  const passwordResponse = await client.rpc('upsert_exam_access_password_hash', {
    target_exam_id: exam.id,
    target_password_hash: await sha256Hex(plan.passwordRotation),
  })

  if (passwordResponse.error) {
    throw new Error(passwordResponse.error.message)
  }

  return {
    examId: exam.id,
    questionCount: plan.questions.length,
  }
}

async function sha256Hex(value: string) {
  const encoded = new TextEncoder().encode(value)
  const buffer = await crypto.subtle.digest('SHA-256', encoded)

  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}
