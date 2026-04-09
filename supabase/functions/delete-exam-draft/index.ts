/**
 * Module: delete exam draft function
 * Responsibility: Delete a restricted draft exam from the admin workspace
 * Inputs/Outputs: Accepts an exam_id payload and returns the deleted exam identifier
 * Dependencies: Depends on the shared HTTP helpers and exam service module
 * Notes: The function always requires an authenticated admin session
 */

import {
  RequestError,
  createServiceClient,
  errorResponse,
  handleCors,
  jsonResponse,
  requireAdminUser,
} from '../_shared/http.ts'
import { deleteExamDraft } from '../_shared/exam-service.ts'

interface DeleteExamDraftPayload {
  exam_id?: string
}

function parsePayload(payload: DeleteExamDraftPayload) {
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

  let payload: DeleteExamDraftPayload

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
    const result = await deleteExamDraft(client, parsed)
    return jsonResponse(result.body, { status: result.status })
  } catch (error) {
    if (error instanceof RequestError) {
      return errorResponse(error.status, error.code, error.message)
    }

    const message =
      error instanceof Error ? error.message : 'Unexpected server error.'
    return errorResponse(500, 'delete_exam_draft_failed', message)
  }
})
