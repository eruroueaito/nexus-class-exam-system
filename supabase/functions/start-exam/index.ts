import {
  createServiceClient,
  errorResponse,
  handleCors,
  jsonResponse,
} from '../_shared/http.ts'
import { startExam } from '../_shared/exam-service.ts'

interface StartExamPayload {
  exam_id?: string
  user_name?: string
  access_password?: string
}

function parsePayload(payload: StartExamPayload) {
  if (!payload.exam_id || !payload.access_password) {
    return null
  }

  return {
    examId: payload.exam_id,
    userName: payload.user_name?.trim() || 'Guest Student',
    accessPassword: payload.access_password,
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

  let payload: StartExamPayload

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
      'exam_id and access_password are required.',
    )
  }

  try {
    const client = createServiceClient()
    const result = await startExam(client, parsed)
    return jsonResponse(result.body, { status: result.status })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unexpected server error.'
    return errorResponse(500, 'start_exam_failed', message)
  }
})
