type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[]

interface ServiceClient {
  from: (table: string) => QueryBuilder
  schema: (schema: string) => ServiceClient
  rpc: (
    fn: string,
    args?: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: { message: string } | null }>
}

interface QueryBuilder {
  select: (query: string) => QueryFilter
  insert: (values: Record<string, unknown> | Array<Record<string, unknown>>) => QueryFilter
  update: (values: Record<string, unknown>) => QueryFilter
  delete: () => QueryFilter
}

interface QueryFilter {
  eq: (column: string, value: unknown) => QueryFilter
  order: (column: string, options?: { ascending?: boolean }) => QueryPromise
  single: () => QueryPromise
  maybeSingle: () => QueryPromise
  select: (query: string) => QueryPromise
}

interface QueryPromise extends PromiseLike<{ data: unknown; error: { message: string } | null }> {}

export interface StartExamRequestData {
  examId: string
  userName: string
  accessPassword: string
}

export interface SubmitExamRequestData {
  examId: string
  userName: string
  duration: number
  answers: Record<string, unknown>
}

export interface SaveExamDraftRequestData {
  examId: string
  examTitle: string
  isPublished: boolean
  questions: Array<{
    id: string
    type: 'radio' | 'checkbox' | 'text'
    stem: string
    options: Array<{ id: string; text: string }>
    correctAnswer: string[]
    explanation: string
  }>
}

export interface LoadExamDraftRequestData {
  examId: string
}

export interface CreateExamDraftRequestData {
  examTitle: string
}

export interface DeleteExamDraftRequestData {
  examId: string
}

interface ExamRow {
  id: string
  title: string
  is_active: boolean
}

interface QuestionRow {
  id: string
  exam_id?: string
  type: 'radio' | 'checkbox' | 'text'
  content: JsonValue
}

interface AnswerRow {
  question_id: string
  correct_answer: JsonValue
  explanation: string
}

function normalizeArrayAnswer(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim().toLowerCase())
      .filter(Boolean)
      .sort()
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized ? [normalized] : []
  }

  return []
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function normalizeSelectionIds(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean)
      .sort()
  }

  if (typeof value === 'string') {
    const normalized = value.trim()
    return normalized ? [normalized] : []
  }

  return []
}

function getTextKeywords(correctAnswer: JsonValue): string[] {
  if (typeof correctAnswer === 'string') {
    return [normalizeText(correctAnswer)]
  }

  if (Array.isArray(correctAnswer)) {
    return correctAnswer.map((item) => normalizeText(item)).filter(Boolean)
  }

  if (
    correctAnswer &&
    typeof correctAnswer === 'object' &&
    'keywords' in correctAnswer &&
    Array.isArray(correctAnswer.keywords)
  ) {
    return correctAnswer.keywords
      .map((item) => normalizeText(item))
      .filter(Boolean)
  }

  return []
}

function jsonEqual(left: string[], right: string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function normalizeQuestionContent(content: JsonValue) {
  if (content && typeof content === 'object' && !Array.isArray(content)) {
    return { ...content }
  }

  return {}
}

function normalizeStoredCorrectAnswer(
  questionType: 'radio' | 'checkbox' | 'text',
  correctAnswer: JsonValue,
) {
  if (questionType === 'text') {
    return getTextKeywords(correctAnswer)
  }

  return normalizeSelectionIds(correctAnswer)
}

function normalizeCorrectAnswerForStorage(
  questionType: 'radio' | 'checkbox' | 'text',
  correctAnswer: string[],
) {
  const normalizedValues =
    questionType === 'text'
      ? normalizeArrayAnswer(correctAnswer)
      : normalizeSelectionIds(correctAnswer)

  if (questionType === 'text') {
    return {
      keywords: normalizedValues,
    }
  }

  return normalizedValues
}

export function evaluateAnswer(
  questionType: 'radio' | 'checkbox' | 'text',
  correctAnswer: JsonValue,
  userAnswer: unknown,
) {
  if (questionType === 'text') {
    const normalizedUserText = normalizeText(userAnswer)
    const keywords = getTextKeywords(correctAnswer)
    const isCorrect = keywords.some(
      (keyword) => normalizedUserText === keyword || normalizedUserText.includes(keyword),
    )

    return {
      isCorrect,
      normalizedUserAnswer: normalizedUserText,
      normalizedCorrectAnswer: keywords,
    }
  }

  const expected = normalizeArrayAnswer(correctAnswer)
  const received = normalizeArrayAnswer(userAnswer)

  return {
    isCorrect: jsonEqual(expected, received),
    normalizedUserAnswer: received,
    normalizedCorrectAnswer: expected,
  }
}

async function sha256Hex(value: string) {
  const encoded = new TextEncoder().encode(value)
  const buffer = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function getExamAccessPasswordHash(client: ServiceClient, examId: string) {
  const response = await client.rpc('get_exam_access_password_hash', {
    target_exam_id: examId,
  })

  if (response.error) {
    throw new Error(response.error.message)
  }

  return response.data as string | null
}

async function listExamAnswerRecords(client: ServiceClient, examId: string) {
  const response = await client.rpc('list_exam_answer_records', {
    target_exam_id: examId,
  })

  if (response.error) {
    throw new Error(response.error.message)
  }

  return (response.data as AnswerRow[]) ?? []
}

export async function loadExamCatalog(client: ServiceClient) {
  const response = await client
    .from('exam_catalog')
    .select('id,title,created_at,is_active')
    .order('created_at', { ascending: false })

  if (response.error) {
    throw new Error(response.error.message)
  }

  return response.data as ExamRow[]
}

export async function startExam(client: ServiceClient, request: StartExamRequestData) {
  const examResponse = await client
    .from('exams')
    .select('id,title,is_active')
    .eq('id', request.examId)
    .eq('is_active', true)
    .maybeSingle()

  if (examResponse.error) {
    throw new Error(examResponse.error.message)
  }

  const exam = examResponse.data as ExamRow | null

  if (!exam) {
    return {
      status: 404,
      body: {
        error: {
          code: 'exam_not_found',
          message: 'The requested exam is not available.',
        },
      },
    }
  }

  const passwordHash = await getExamAccessPasswordHash(client, request.examId)

  if (!passwordHash) {
    return {
      status: 500,
      body: {
        error: {
          code: 'exam_access_missing',
          message: 'The exam access record is missing.',
        },
      },
    }
  }

  const providedHash = await sha256Hex(request.accessPassword)

  if (providedHash !== passwordHash) {
    return {
      status: 403,
      body: {
        error: {
          code: 'invalid_access_password',
          message: 'The access password is invalid.',
        },
      },
    }
  }

  const questionResponse = await client
    .from('questions')
    .select('id,type,content')
    .eq('exam_id', request.examId)
    .order('order_index', { ascending: true })

  if (questionResponse.error) {
    throw new Error(questionResponse.error.message)
  }

  return {
    status: 200,
    body: {
      exam: {
        id: exam.id,
        title: exam.title,
      },
      user_name: request.userName,
      questions: (questionResponse.data as QuestionRow[]) ?? [],
    },
  }
}

export async function submitExam(client: ServiceClient, request: SubmitExamRequestData) {
  const examResponse = await client
    .from('exams')
    .select('id,title,is_active')
    .eq('id', request.examId)
    .eq('is_active', true)
    .maybeSingle()

  if (examResponse.error) {
    throw new Error(examResponse.error.message)
  }

  const exam = examResponse.data as ExamRow | null

  if (!exam) {
    return {
      status: 404,
      body: {
        error: {
          code: 'exam_not_found',
          message: 'The requested exam is not available.',
        },
      },
    }
  }

  const questionResponse = await client
    .from('questions')
    .select('id,type,content')
    .eq('exam_id', request.examId)
    .order('order_index', { ascending: true })

  if (questionResponse.error) {
    throw new Error(questionResponse.error.message)
  }

  const questions = (questionResponse.data as QuestionRow[]) ?? []

  const answerRows = await listExamAnswerRecords(client, request.examId)
  const answerMap = new Map(answerRows.map((row) => [row.question_id, row]))

  const submissionItems = questions.map((question) => {
    const answerRecord = answerMap.get(question.id)

    if (!answerRecord) {
      throw new Error(`Missing answer record for question ${question.id}`)
    }

    const userAnswer = request.answers[question.id] ?? null
    const evaluation = evaluateAnswer(
      question.type,
      answerRecord.correct_answer,
      userAnswer,
    )

    return {
      question_id: question.id,
      user_answer: userAnswer as JsonValue,
      is_correct: evaluation.isCorrect,
      correct_answer_snapshot: answerRecord.correct_answer,
      explanation_snapshot: answerRecord.explanation,
    }
  })

  const totalCount = submissionItems.length
  const correctCount = submissionItems.filter((item) => item.is_correct).length
  const score = totalCount === 0 ? 0 : correctCount / totalCount

  const submissionInsertResponse = await client
    .from('submissions')
    .insert({
      exam_id: request.examId,
      user_name: request.userName,
      score,
      duration: request.duration,
    })
    .select('id')
    .single()

  if (submissionInsertResponse.error) {
    throw new Error(submissionInsertResponse.error.message)
  }

  const submission = submissionInsertResponse.data as { id: string }

  const submissionItemPayload = submissionItems.map((item) => ({
    submission_id: submission.id,
    ...item,
  }))

  const submissionItemsInsertResponse = await client
    .from('submission_items')
    .insert(submissionItemPayload)

  if (submissionItemsInsertResponse.error) {
    throw new Error(submissionItemsInsertResponse.error.message)
  }

  return {
    status: 200,
    body: {
      submission_id: submission.id,
      exam: {
        id: exam.id,
        title: exam.title,
      },
      score,
      correct_count: correctCount,
      total_count: totalCount,
      items: submissionItems.map((item) => ({
        question_id: item.question_id,
        user_answer: item.user_answer,
        correct_answer: item.correct_answer_snapshot,
        is_correct: item.is_correct,
        explanation: item.explanation_snapshot,
      })),
    },
  }
}

export async function loadExamDraft(
  client: ServiceClient,
  request: LoadExamDraftRequestData,
) {
  const examResponse = await client
    .from('exams')
    .select('id,title,is_active')
    .eq('id', request.examId)
    .maybeSingle()

  if (examResponse.error) {
    throw new Error(examResponse.error.message)
  }

  const exam = examResponse.data as ExamRow | null

  if (!exam) {
    return {
      status: 404,
      body: {
        error: {
          code: 'exam_not_found',
          message: 'The requested exam does not exist.',
        },
      },
    }
  }

  const questionResponse = await client
    .from('questions')
    .select('id,exam_id,order_index,type,content')
    .eq('exam_id', request.examId)
    .order('order_index', { ascending: true })

  if (questionResponse.error) {
    throw new Error(questionResponse.error.message)
  }

  const questions = (questionResponse.data as Array<QuestionRow & { order_index?: number }>) ?? []
  const answerRows = await listExamAnswerRecords(client, request.examId)
  const answerMap = new Map(answerRows.map((row) => [row.question_id, row]))

  return {
    status: 200,
    body: {
      exam,
      questions: questions.map((question) => {
        const answerRecord = answerMap.get(question.id)

        return {
          ...question,
          correct_answer: answerRecord
            ? normalizeStoredCorrectAnswer(question.type, answerRecord.correct_answer)
            : [],
          explanation: answerRecord?.explanation ?? '',
        }
      }),
    },
  }
}

export async function createExamDraft(
  client: ServiceClient,
  request: CreateExamDraftRequestData,
) {
  const examInsertResponse = await client
    .from('exams')
    .insert({
      title: request.examTitle,
      is_active: false,
    })
    .select('id,title,is_active')
    .single()

  if (examInsertResponse.error) {
    throw new Error(examInsertResponse.error.message)
  }

  const exam = examInsertResponse.data as ExamRow
  const passwordHash = await sha256Hex('changeme123')
  const accessInsertResponse = await client.rpc('create_exam_access_record', {
    target_exam_id: exam.id,
    target_password_hash: passwordHash,
  })

  if (accessInsertResponse.error) {
    throw new Error(accessInsertResponse.error.message)
  }

  return {
    status: 201,
    body: {
      exam,
    },
  }
}

export async function deleteExamDraft(
  client: ServiceClient,
  request: DeleteExamDraftRequestData,
) {
  const examResponse = await client
    .from('exams')
    .select('id')
    .eq('id', request.examId)
    .maybeSingle()

  if (examResponse.error) {
    throw new Error(examResponse.error.message)
  }

  if (!examResponse.data) {
    return {
      status: 404,
      body: {
        error: {
          code: 'exam_not_found',
          message: 'The requested exam does not exist.',
        },
      },
    }
  }

  const deleteResponse = await client.from('exams').delete().eq('id', request.examId)

  if (deleteResponse.error) {
    throw new Error(deleteResponse.error.message)
  }

  return {
    status: 200,
    body: {
      exam: {
        id: request.examId,
      },
      deleted: true,
    },
  }
}

export async function saveExamDraft(
  client: ServiceClient,
  request: SaveExamDraftRequestData,
) {
  const examResponse = await client
    .from('exams')
    .select('id,title,is_active')
    .eq('id', request.examId)
    .maybeSingle()

  if (examResponse.error) {
    throw new Error(examResponse.error.message)
  }

  const exam = examResponse.data as ExamRow | null

  if (!exam) {
    return {
      status: 404,
      body: {
        error: {
          code: 'exam_not_found',
          message: 'The requested exam does not exist.',
        },
      },
    }
  }

  const questionResponse = await client
    .from('questions')
    .select('id,exam_id,type,content')
    .eq('exam_id', request.examId)

  if (questionResponse.error) {
    throw new Error(questionResponse.error.message)
  }

  const storedQuestions = (questionResponse.data as QuestionRow[]) ?? []
  const questionMap = new Map(storedQuestions.map((question) => [question.id, question]))
  const storedAnswers = await listExamAnswerRecords(client, request.examId)
  const answerMap = new Map(storedAnswers.map((answer) => [answer.question_id, answer]))

  for (const question of request.questions) {
    if (questionMap.has(question.id) && !answerMap.has(question.id)) {
      return {
        status: 404,
        body: {
          error: {
            code: 'answer_not_found',
            message: 'One or more answer records do not belong to this exam.',
          },
        },
      }
    }
  }

  const examUpdateResponse = await client
    .from('exams')
    .update({
      title: request.examTitle,
      is_active: request.isPublished,
    })
    .eq('id', request.examId)

  if (examUpdateResponse.error) {
    throw new Error(examUpdateResponse.error.message)
  }

  const incomingQuestionIds = new Set(request.questions.map((question) => question.id))
  const removedQuestions = storedQuestions.filter(
    (question) => !incomingQuestionIds.has(question.id),
  )

  for (const removedQuestion of removedQuestions) {
    const deleteResponse = await client
      .from('questions')
      .delete()
      .eq('id', removedQuestion.id)
      .eq('exam_id', request.examId)

    if (deleteResponse.error) {
      throw new Error(deleteResponse.error.message)
    }
  }

  for (const question of request.questions) {
    const storedQuestion = questionMap.get(question.id)

    if (!storedQuestion) {
      const insertQuestionResponse = await client
        .from('questions')
        .insert({
          id: question.id,
          exam_id: request.examId,
          type: question.type,
          order_index: request.questions.findIndex(
            (candidate) => candidate.id === question.id,
          ) + 1,
          content: {
            stem: question.stem,
            options: question.options,
          },
        })

      if (insertQuestionResponse.error) {
        throw new Error(insertQuestionResponse.error.message)
      }

      const insertAnswerResponse = await client.rpc('upsert_answer_record', {
        target_question_id: question.id,
        target_correct_answer: normalizeCorrectAnswerForStorage(
          question.type,
          question.correctAnswer,
        ),
        target_explanation: question.explanation,
      })

      if (insertAnswerResponse.error) {
        throw new Error(insertAnswerResponse.error.message)
      }

      continue
    }

    const content = normalizeQuestionContent(storedQuestion.content)
    const updateResponse = await client
      .from('questions')
      .update({
        type: question.type,
        order_index: request.questions.findIndex(
          (candidate) => candidate.id === question.id,
        ) + 1,
        content: {
          ...content,
          stem: question.stem,
          options: question.options,
        },
      })
      .eq('id', question.id)
      .eq('exam_id', request.examId)

    if (updateResponse.error) {
      throw new Error(updateResponse.error.message)
    }

    const answerUpdateResponse = await client.rpc('upsert_answer_record', {
      target_question_id: question.id,
      target_correct_answer: normalizeCorrectAnswerForStorage(
        question.type,
        question.correctAnswer,
      ),
      target_explanation: question.explanation,
    })

    if (answerUpdateResponse.error) {
      throw new Error(answerUpdateResponse.error.message)
    }
  }

  return {
    status: 200,
    body: {
      exam: {
        id: request.examId,
        title: request.examTitle,
        is_active: request.isPublished,
      },
      saved_question_count: request.questions.length,
    },
  }
}
