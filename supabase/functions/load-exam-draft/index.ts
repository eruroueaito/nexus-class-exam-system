import {
  RequestError,
  createServiceClient,
  errorResponse,
  handleCors,
  jsonResponse,
  requireAdminUser,
} from '../_shared/http.ts'
import { loadExamDraft } from '../_shared/exam-service.ts'

interface LoadExamDraftPayload {
  exam_id?: string
}

function parsePayload(payload: LoadExamDraftPayload) {
  if (!payload.exam_id) {
    return null
  }

  return {
    examId: payload.exam_id,
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

  let payload: LoadExamDraftPayload

  try {
    payload = await request.json()
  } catch {
    return errorResponse(400, 'invalid_json', 'Request body must be valid JSON.')
  }

  const parsed = parsePayload(payload)

  if (!parsed) {
    return errorResponse(400, 'invalid_payload', 'exam_id is required.')
  }

  try {
    await requireAdminUser(request)
    const client = createServiceClient()
    const result = await loadExamDraft(client, parsed)
    return jsonResponse(result.body, { status: result.status })
  } catch (error) {
    if (error instanceof RequestError) {
      return errorResponse(error.status, error.code, error.message)
    }

    const message =
      error instanceof Error ? error.message : 'Unexpected server error.'
    return errorResponse(500, 'load_exam_draft_failed', message)
  }
})
