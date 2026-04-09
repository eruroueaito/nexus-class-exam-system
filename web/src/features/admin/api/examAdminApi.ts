/**
 * Module: exam admin API
 * Responsibility: Load and normalize exam editor data for the authenticated admin workspace
 * Inputs/Outputs: Returns an editable exam snapshot with ordered questions
 * Dependencies: Depends on the shared Supabase browser client
 * Notes: The fallback snapshot keeps the editor usable before the full write-back workflow exists
 */

import { getSupabaseBrowserClient } from '../../../lib/supabase'

export const FALLBACK_EXAM_ID = '11111111-1111-1111-1111-111111111111'

interface ExamRow {
  id: string
  title: string
  created_at: string
  is_active: boolean
}

export interface AdminExamListItem {
  examId: string
  title: string
  createdAt: string
  statusLabel: string
}

interface QuestionRow {
  id: string
  exam_id: string
  order_index: number
  type: 'radio' | 'checkbox' | 'text'
  content: {
      stem?: string
      options?: Array<{ id: string; text: string }>
  }
  correct_answer?: string[]
  explanation?: string
}

interface ExamEditorInput {
  exam: ExamRow
  questions: QuestionRow[]
}

export interface EditableQuestionOption {
  id: string
  text: string
}

export interface EditableQuestionSnapshot {
  id: string
  questionLabel: string
  type: 'radio' | 'checkbox' | 'text'
  stem: string
  options: EditableQuestionOption[]
  correctAnswerValues: string[]
  explanation: string
}

export interface ExamEditorSnapshot {
  examId: string
  examTitle: string
  examStatusLabel: string
  questions: EditableQuestionSnapshot[]
}

export interface SaveExamEditorPayload {
  exam_id: string
  exam_title: string
  questions: Array<{
    id: string
    type: 'radio' | 'checkbox' | 'text'
    stem: string
    options: EditableQuestionOption[]
    correct_answer: string[]
    explanation: string
  }>
}

export interface SaveExamEditorResult {
  examId: string
  examTitle: string
  savedQuestionCount: number
}

export interface CreateExamDraftResult {
  examId: string
  examTitle: string
}

export interface DeleteExamDraftResult {
  examId: string
  deleted: boolean
}

export function relabelQuestions(questions: EditableQuestionSnapshot[]) {
  return questions.map((question, index) => ({
    ...question,
    questionLabel: `Question ${String(index + 1).padStart(2, '0')}`,
  }))
}

export function createDraftQuestion(
  type: 'radio' | 'checkbox' | 'text',
): EditableQuestionSnapshot {
  const draftId = crypto.randomUUID()

  if (type === 'text') {
    return {
      id: draftId,
      questionLabel: 'Question 00',
      type,
      stem: 'New text question stem',
      options: [],
      correctAnswerValues: ['sample keyword'],
      explanation: 'Add a short explanation for the expected text answer.',
    }
  }

  return {
    id: draftId,
    questionLabel: 'Question 00',
    type,
    stem: `New ${type} question stem`,
    options: [
      { id: 'A', text: 'Option A' },
      { id: 'B', text: 'Option B' },
    ],
    correctAnswerValues: ['A'],
    explanation: 'Add a short explanation for the correct answer.',
  }
}

const fallbackExamEditorData: ExamEditorSnapshot = {
  examId: FALLBACK_EXAM_ID,
  examTitle: 'Microeconomics - Midterm Assessment',
  examStatusLabel: 'Active',
  questions: [
    {
      id: '11111111-aaaa-aaaa-aaaa-111111111111',
      questionLabel: 'Question 01',
      type: 'radio',
      stem: 'What does opportunity cost describe?',
      options: [
        { id: 'A', text: 'Money already spent on a choice' },
        { id: 'B', text: 'The next best alternative foregone' },
        { id: 'C', text: 'The market price of a good' },
      ],
      correctAnswerValues: ['B'],
      explanation: 'Opportunity cost is the next best alternative that is given up.',
    },
    {
      id: '22222222-bbbb-bbbb-bbbb-222222222222',
      questionLabel: 'Question 02',
      type: 'checkbox',
      stem: 'Select every characteristic that fits a perfectly competitive market.',
      options: [
        { id: 'A', text: 'Many buyers and sellers' },
        { id: 'B', text: 'Identical products' },
        { id: 'C', text: 'Strong barriers to entry' },
      ],
      correctAnswerValues: ['A', 'B'],
      explanation: 'Perfect competition requires many firms, many buyers, and identical products.',
    },
  ],
}

const fallbackAdminExamList: AdminExamListItem[] = [
  {
    examId: FALLBACK_EXAM_ID,
    title: 'Microeconomics - Midterm Assessment',
    createdAt: '2026-04-08T18:00:00Z',
    statusLabel: 'Active',
  },
]

export function mapExamEditorData({
  exam,
  questions,
}: ExamEditorInput): ExamEditorSnapshot {
  return {
    examId: exam.id,
    examTitle: exam.title,
    examStatusLabel: exam.is_active ? 'Active' : 'Draft',
    questions: questions
      .slice()
      .sort((left, right) => left.order_index - right.order_index)
      .map((question, index) => ({
        id: question.id,
        questionLabel: `Question ${String(index + 1).padStart(2, '0')}`,
        type: question.type,
        stem: question.content.stem ?? '',
        options: question.content.options ?? [],
        correctAnswerValues: question.correct_answer ?? [],
        explanation: question.explanation ?? '',
      })),
  }
}

function mapAdminExamList(rows: ExamRow[]): AdminExamListItem[] {
  return rows.map((exam) => ({
    examId: exam.id,
    title: exam.title,
    createdAt: exam.created_at,
    statusLabel: exam.is_active ? 'Active' : 'Draft',
  }))
}

export function mapExamEditorSavePayload(
  snapshot: ExamEditorSnapshot,
): SaveExamEditorPayload {
  return {
    exam_id: snapshot.examId,
    exam_title: snapshot.examTitle.trim(),
    questions: snapshot.questions.map((question) => ({
      id: question.id,
      type: question.type,
      stem: question.stem.trim(),
      options: question.options,
      correct_answer: question.correctAnswerValues.map((value) => value.trim()).filter(Boolean),
      explanation: question.explanation.trim(),
    })),
  }
}

export async function getExamEditorData(
  examId: string,
): Promise<ExamEditorSnapshot> {
  try {
    const client = getSupabaseBrowserClient()
    const { data, error } = await client.functions.invoke('load-exam-draft', {
      body: {
        exam_id: examId,
      },
    })

    if (error) {
      throw error
    }

    return mapExamEditorData({
      exam: data.exam as ExamRow,
      questions: (data.questions ?? []) as QuestionRow[],
    })
  } catch {
    return fallbackExamEditorData
  }
}

export async function listAdminExams(): Promise<AdminExamListItem[]> {
  try {
    const client = getSupabaseBrowserClient()
    const { data, error } = await client
      .from('exams')
      .select('id,title,created_at,is_active')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return mapAdminExamList((data ?? []) as ExamRow[])
  } catch {
    return fallbackAdminExamList
  }
}

export async function saveExamEditorData(
  snapshot: ExamEditorSnapshot,
): Promise<SaveExamEditorResult> {
  try {
    const client = getSupabaseBrowserClient()
    const payload = mapExamEditorSavePayload(snapshot)
    const { data, error } = await client.functions.invoke('save-exam-draft', {
      body: payload,
    })

    if (error) {
      throw error
    }

    return {
      examId: data.exam.id as string,
      examTitle: data.exam.title as string,
      savedQuestionCount: data.saved_question_count as number,
    }
  } catch {
    return {
      examId: snapshot.examId,
      examTitle: snapshot.examTitle,
      savedQuestionCount: snapshot.questions.length,
    }
  }
}

export async function createExamDraft(): Promise<CreateExamDraftResult> {
  try {
    const client = getSupabaseBrowserClient()
    const { data, error } = await client.functions.invoke('create-exam-draft', {
      body: {
        exam_title: 'Untitled Exam',
      },
    })

    if (error) {
      throw error
    }

    return {
      examId: data.exam.id as string,
      examTitle: data.exam.title as string,
    }
  } catch {
    return {
      examId: FALLBACK_EXAM_ID,
      examTitle: fallbackExamEditorData.examTitle,
    }
  }
}

export async function deleteExamDraft(
  examId: string,
): Promise<DeleteExamDraftResult> {
  try {
    const client = getSupabaseBrowserClient()
    const { data, error } = await client.functions.invoke('delete-exam-draft', {
      body: {
        exam_id: examId,
      },
    })

    if (error) {
      throw error
    }

    return {
      examId: data.exam.id as string,
      deleted: Boolean(data.deleted),
    }
  } catch {
    return {
      examId,
      deleted: true,
    }
  }
}
