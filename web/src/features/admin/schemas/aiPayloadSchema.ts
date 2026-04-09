/**
 * Module: AI payload schema
 * Responsibility: Validate the pasted JSON used for admin exam import
 * Inputs/Outputs: Accepts unknown JSON and returns a normalized exam import payload
 * Dependencies: Depends on zod
 * Notes: The schema is intentionally strict so malformed imports fail early in the browser
 */

import { z } from 'zod'

const optionSchema = z.object({
  id: z.string().trim().min(1),
  text: z.string().trim().min(1),
})

const questionSchema = z.object({
  id: z.string().trim().min(1).optional(),
  type: z.enum(['radio', 'checkbox', 'text']),
  stem: z.string().trim().min(1),
  options: z.array(optionSchema).optional().default([]),
  correct_answer: z.array(z.string().trim().min(1)).min(1),
  explanation: z.string().trim().min(1),
})

export const aiExamImportSchema = z.object({
  exam_title: z.string().trim().min(1),
  questions: z.array(questionSchema).min(1),
})

export type AiExamImportPayload = z.infer<typeof aiExamImportSchema>
