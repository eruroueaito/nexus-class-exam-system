import {
  RequestError,
  createServiceClient,
  errorResponse,
  handleCors,
  jsonResponse,
  requireAdminUser,
} from '../_shared/http.ts'
import { saveExamDraft } from '../_shared/exam-service.ts'

interface SaveExamQuestionPayload {
  id?: string
  type?: 'radio' | 'checkbox' | 'text'
  stem?: string
  options?: Array<{ id?: string; text?: string }>
  correct_answer?: string[]
  explanation?: string
}

interface SaveExamDraftPayload {
  exam_id?: string
  exam_title?: string
  is_active?: boolean
  access_password?: string
  questions?: SaveExamQuestionPayload[]
}

function parsePayload(payload: SaveExamDraftPayload) {
  if (
    !payload.exam_id ||
    !payload.exam_title ||
    typeof payload.is_active !== 'boolean' ||
    !Array.isArray(payload.questions)
  ) {
    return null
  }

  const questions = payload.questions.map((question) => ({
    id: question.id ?? '',
    type: question.type ?? 'text',
    stem: question.stem?.trim() ?? '',
    options: Array.isArray(question.options)
      ? question.options.map((option) => ({
          id: option.id ?? '',
          text: option.text ?? '',
        }))
      : [],
    correctAnswer: Array.isArray(question.correct_answer)
      ? question.correct_answer.map((value) => String(value))
      : [],
    explanation: question.explanation?.trim() ?? '',
  }))

  if (
    questions.some(
      (question) =>
        !question.id ||
        !question.stem ||
        question.correctAnswer.length === 0 ||
        !question.explanation,
    )
  ) {
    return null
  }

  return {
    examId: payload.exam_id,
    examTitle: payload.exam_title.trim(),
    isPublished: payload.is_active,
    accessPassword: payload.access_password?.trim() || undefined,
    questions,
  }
}

Deno.serve(async (request) => {
  const corsResponse = handleCors(request)
  if (corsResponse) {
    return corsResponse
  }

  if (request.method !== 'POST') {
    return errorResponse(405, 'method_not_allowed', 'Only POST is supported.')
  }

  let payload: SaveExamDraftPayload

  try {
    payload = await request.json()
  } catch {
    return errorResponse(400, 'invalid_json', 'Request body must be valid JSON.')
  }

  const parsed = parsePayload(payload)

  if (!parsed) {
    return errorResponse(
      400,
      'invalid_payload',
      'exam_id, exam_title, is_active, and fully normalized questions are required.',
    )
  }

  try {
    await requireAdminUser(request)
    const client = createServiceClient()
    const result = await saveExamDraft(client, parsed)
    return jsonResponse(result.body, { status: result.status })
  } catch (error) {
    if (error instanceof RequestError) {
      return errorResponse(error.status, error.code, error.message)
    }

    const message =
      error instanceof Error ? error.message : 'Unexpected server error.'
    return errorResponse(500, 'save_exam_draft_failed', message)
  }
})
