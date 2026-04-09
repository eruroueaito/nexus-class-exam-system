/**
 * Module: create exam draft function
 * Responsibility: Create a restricted draft exam for the admin workspace
 * Inputs/Outputs: Accepts an exam_title payload and returns the created exam summary
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
import { createExamDraft } from '../_shared/exam-service.ts'

interface CreateExamDraftPayload {
  exam_title?: string
}

function parsePayload(payload: CreateExamDraftPayload) {
  const examTitle = payload.exam_title?.trim()

  if (!examTitle) {
    return null
  }

  return {
    examTitle,
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

  let payload: CreateExamDraftPayload

  try {
    payload = await request.json()
  } catch {
    return errorResponse(400, 'invalid_json', 'Request body must be valid JSON.')
  }

  const parsed = parsePayload(payload)

  if (!parsed) {
    return errorResponse(400, 'invalid_payload', 'exam_title is required.')
  }

  try {
    await requireAdminUser(request)
    const client = createServiceClient()
    const result = await createExamDraft(client, parsed)
    return jsonResponse(result.body, { status: result.status })
  } catch (error) {
    if (error instanceof RequestError) {
      return errorResponse(error.status, error.code, error.message)
    }

    const message =
      error instanceof Error ? error.message : 'Unexpected server error.'
    return errorResponse(500, 'create_exam_draft_failed', message)
  }
})
