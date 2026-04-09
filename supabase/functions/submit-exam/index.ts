import {
  createServiceClient,
  errorResponse,
  handleCors,
  jsonResponse,
} from '../_shared/http.ts'
import { submitExam } from '../_shared/exam-service.ts'

interface SubmitExamPayload {
  exam_id?: string
  user_name?: string
  duration?: number
  answers?: Record<string, unknown>
}

function parsePayload(payload: SubmitExamPayload) {
  if (
    !payload.exam_id ||
    !payload.user_name ||
    typeof payload.duration !== 'number' ||
    payload.duration < 0 ||
    !payload.answers ||
    typeof payload.answers !== 'object'
  ) {
    return null
  }

  return {
    examId: payload.exam_id,
    userName: payload.user_name.trim(),
    duration: payload.duration,
    answers: payload.answers,
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

  let payload: SubmitExamPayload

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
      'exam_id, user_name, duration, and answers are required.',
    )
  }

  try {
    const client = createServiceClient()
    const result = await submitExam(client, parsed)
    return jsonResponse(result.body, { status: result.status })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unexpected server error.'
    return errorResponse(500, 'submit_exam_failed', message)
  }
})
