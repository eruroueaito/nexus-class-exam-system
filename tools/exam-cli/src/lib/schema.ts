/**
 * Module: exam bundle schema
 * Responsibility: Validate and normalize exam bundle input files
 * Inputs/Outputs: Accepts unknown bundle data and returns a typed normalized bundle
 * Dependencies: Depends on Zod for structural validation
 * Notes: First version enforces an English-only authoring workflow but does not perform language detection
 */

import { z } from 'zod'

const examQuestionTypeSchema = z.enum(['radio', 'checkbox', 'text'])

const optionSchema = z.object({
  id: z.string().trim().min(1),
  text: z.string().trim().min(1),
})

const baseQuestionSchema = z.object({
  id: z.string().trim().min(1),
  type: examQuestionTypeSchema,
  stem: z.string().trim().min(1),
  correct_answer: z.array(z.string().trim().min(1)).min(1),
  explanation: z.string().trim().min(1),
  points: z.number().int().positive().default(1),
})

const radioQuestionSchema = baseQuestionSchema.extend({
  type: z.literal('radio'),
  options: z.array(optionSchema).min(2),
}).superRefine((value, context) => {
  if (value.correct_answer.length !== 1) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Radio questions must contain exactly one correct answer.',
      path: ['correct_answer'],
    })
  }
})

const checkboxQuestionSchema = baseQuestionSchema.extend({
  type: z.literal('checkbox'),
  options: z.array(optionSchema).min(2),
})

const textQuestionSchema = baseQuestionSchema.extend({
  type: z.literal('text'),
})

const questionSchema = z.discriminatedUnion('type', [
  radioQuestionSchema,
  checkboxQuestionSchema,
  textQuestionSchema,
])

const examSchema = z.object({
  slug: z.string().trim().min(1),
  title: z.string().trim().min(1),
  language: z.literal('en'),
  topic: z.string().trim().min(1),
  access_password: z.string().trim().min(1),
  publish: z.boolean(),
  randomize_questions: z.boolean(),
  randomize_options: z.boolean(),
  time_limit_minutes: z.number().int().positive().nullable(),
})

export const examBundleSchema = z.object({
  version: z.literal(1),
  exam: examSchema,
  questions: z.array(questionSchema).min(1),
})

export type ExamBundle = z.infer<typeof examBundleSchema>

export function parseExamBundle(input: unknown) {
  return examBundleSchema.parse(input)
}
