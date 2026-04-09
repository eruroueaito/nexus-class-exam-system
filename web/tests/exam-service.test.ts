/**
 * Module: exam service tests
 * Responsibility: Verify the shared Supabase exam service logic with a deterministic in-memory client
 * Inputs/Outputs: Runs Vitest assertions against startExam and submitExam
 * Dependencies: Depends on Vitest and the shared exam service module
 * Notes: These tests lock the backend grading contract without requiring a running Supabase stack
 */

import { describe, expect, test } from 'vitest'
import {
  createExamDraft,
  deleteExamDraft,
  evaluateAnswer,
  loadExamDraft,
  saveExamDraft,
  startExam,
  submitExam,
} from '../../supabase/functions/_shared/exam-service'

type TableStore = Record<string, Array<Record<string, unknown>>>

class FakeClient {
  private readonly tables: TableStore
  private readonly schemaName: string

  constructor(tables: TableStore, schemaName = 'public') {
    this.tables = tables
    this.schemaName = schemaName
  }

  schema(schemaName: string) {
    return new FakeClient(this.tables, schemaName)
  }

  async rpc(functionName: string, args?: Record<string, unknown>) {
    switch (functionName) {
      case 'get_exam_access_password_hash': {
        const examId = args?.target_exam_id
        const examAccessRows = this.tables['app_private.exam_access'] ?? []
        const record = examAccessRows.find((row) => row.exam_id === examId) ?? null
        return {
          data: record ? record.password_hash ?? null : null,
          error: null,
        }
      }
      case 'list_exam_answer_records': {
        const examId = args?.target_exam_id
        const questions = this.tables.questions ?? []
        const questionIds = new Set(
          questions
            .filter((question) => question.exam_id === examId)
            .map((question) => String(question.id)),
        )
        const answers = this.tables['app_private.answers_library'] ?? []

        return {
          data: answers.filter((answer) => questionIds.has(String(answer.question_id))),
          error: null,
        }
      }
      case 'create_exam_access_record': {
        const examAccessRows = this.tables['app_private.exam_access'] ?? []
        examAccessRows.push({
          exam_id: args?.target_exam_id,
          password_hash: args?.target_password_hash,
        })
        return { data: null, error: null }
      }
      case 'upsert_answer_record': {
        const answers = this.tables['app_private.answers_library'] ?? []
        const existing = answers.find(
          (answer) => answer.question_id === args?.target_question_id,
        )

        if (existing) {
          existing.correct_answer = args?.target_correct_answer
          existing.explanation = args?.target_explanation
        } else {
          answers.push({
            id: `answer-${answers.length + 1}`,
            question_id: args?.target_question_id,
            correct_answer: args?.target_correct_answer,
            explanation: args?.target_explanation,
          })
        }

        return { data: null, error: null }
      }
      default:
        return {
          data: null,
          error: { message: `Unsupported RPC: ${functionName}` },
        }
    }
  }

  from(table: string) {
    return new FakeQuery(this.tables, this.schemaName, table)
  }
}

class FakeQuery {
  private readonly tables: TableStore
  private readonly schemaName: string
  private readonly table: string
  private readonly filters: Array<{ column: string; value: unknown }> = []
  private selectedColumns = '*'
  private insertedRows: Array<Record<string, unknown>> | null = null
  private updatedValues: Record<string, unknown> | null = null
  private shouldDelete = false

  constructor(tables: TableStore, schemaName: string, table: string) {
    this.tables = tables
    this.schemaName = schemaName
    this.table = table
  }

  select(columns: string) {
    this.selectedColumns = columns
    return this
  }

  insert(values: Record<string, unknown> | Array<Record<string, unknown>>) {
    const payload = Array.isArray(values) ? values : [values]
    const tableRows = this.resolveTable()

    this.insertedRows = payload.map((row, index) => ({
      id:
        row.id ??
        (this.table === 'submissions'
          ? `submission-${tableRows.length + index + 1}`
          : `row-${tableRows.length + index + 1}`),
      ...row,
    }))

    tableRows.push(...this.insertedRows)

    return this
  }

  update(values: Record<string, unknown>) {
    this.updatedValues = values
    return this
  }

  delete() {
    this.shouldDelete = true
    return this
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, value })
    return this
  }

  async order(column: string, options?: { ascending?: boolean }) {
    const rows = [...this.filteredRows()].sort((left, right) => {
      const leftValue = left[column]
      const rightValue = right[column]

      if (leftValue === rightValue) {
        return 0
      }

      const result =
        String(leftValue ?? '') > String(rightValue ?? '') ? 1 : -1
      return options?.ascending === false ? result * -1 : result
    })

    return { data: rows, error: null }
  }

  async maybeSingle() {
    return {
      data: this.filteredRows()[0] ?? null,
      error: null,
    }
  }

  async single() {
    const rows = this.insertedRows ?? this.filteredRows()

    return {
      data: this.projectRow(rows[0] ?? null),
      error: null,
    }
  }

  then<TResult1 = { data: unknown; error: null }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: unknown; error: null }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    const response = {
      data: this.insertedRows
        ? this.insertedRows.map((row) => this.projectRow(row))
        : this.materializedRows().map((row) => this.projectRow(row)),
      error: null,
    }

    return Promise.resolve(response).then(onfulfilled, onrejected)
  }

  private filteredRows() {
    return this.resolveTable().filter((row) =>
      this.filters.every((filter) => row[filter.column] === filter.value),
    )
  }

  private updatedRows() {
    const rows = this.filteredRows()

    if (!this.updatedValues) {
      return rows
    }

    for (const row of rows) {
      Object.assign(row, this.updatedValues)
    }

    return rows
  }

  private deletedRows() {
    const rows = this.filteredRows()

    if (!this.shouldDelete) {
      return rows
    }

    const tableRows = this.resolveTable()
    const deletedIds = new Set(rows.map((row) => row.id ?? row.question_id))

    for (let index = tableRows.length - 1; index >= 0; index -= 1) {
      const row = tableRows[index]
      const rowKey = row.id ?? row.question_id
      if (deletedIds.has(rowKey)) {
        tableRows.splice(index, 1)
      }
    }

    if (this.table === 'questions') {
      const answers = this.tables['app_private.answers_library'] ?? []
      for (let index = answers.length - 1; index >= 0; index -= 1) {
        const answer = answers[index]
        if (deletedIds.has(answer.question_id)) {
          answers.splice(index, 1)
        }
      }
    }

    if (this.table === 'exams') {
      const examAccessRows = this.tables['app_private.exam_access'] ?? []
      const questions = this.tables.questions ?? []
      const answers = this.tables['app_private.answers_library'] ?? []

      for (let index = examAccessRows.length - 1; index >= 0; index -= 1) {
        const row = examAccessRows[index]
        if (deletedIds.has(row.exam_id)) {
          examAccessRows.splice(index, 1)
        }
      }

      const deletedQuestionIds = new Set<string>()
      for (let index = questions.length - 1; index >= 0; index -= 1) {
        const row = questions[index]
        if (deletedIds.has(row.exam_id)) {
          deletedQuestionIds.add(String(row.id))
          questions.splice(index, 1)
        }
      }

      for (let index = answers.length - 1; index >= 0; index -= 1) {
        const row = answers[index]
        if (deletedQuestionIds.has(String(row.question_id))) {
          answers.splice(index, 1)
        }
      }
    }

    return rows
  }

  private materializedRows() {
    if (this.shouldDelete) {
      return this.deletedRows()
    }

    return this.updatedRows()
  }

  private resolveTable() {
    const tableKey =
      this.schemaName === 'public' ? this.table : `${this.schemaName}.${this.table}`

    return this.tables[tableKey] ?? []
  }

  private projectRow(row: Record<string, unknown> | null) {
    if (!row || this.selectedColumns === '*') {
      return row
    }

    const projected = this.selectedColumns
      .split(',')
      .map((column) => column.trim())
      .filter(Boolean)

    return Object.fromEntries(projected.map((column) => [column, row[column]]))
  }
}

async function sha256Hex(value: string) {
  const encoded = new TextEncoder().encode(value)
  const buffer = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function createFixtureTables(passwordHash: string): TableStore {
  return {
    exams: [
      {
        id: 'exam-1',
        title: 'Microeconomics - Midterm Assessment',
        is_active: true,
      },
    ],
    'app_private.exam_access': [
      {
        exam_id: 'exam-1',
        password_hash: passwordHash,
      },
    ],
    questions: [
      {
        id: 'question-1',
        exam_id: 'exam-1',
        type: 'radio',
        order_index: 1,
        content: {
          stem: 'What does opportunity cost describe?',
          options: [
            { id: 'A', text: 'Money already spent' },
            { id: 'B', text: 'The next best alternative foregone' },
          ],
        },
      },
      {
        id: 'question-2',
        exam_id: 'exam-1',
        type: 'text',
        order_index: 2,
        content: {
          stem: 'Name the market structure with many sellers and differentiated products.',
        },
      },
    ],
    'app_private.answers_library': [
      {
        question_id: 'question-1',
        correct_answer: ['B'],
        explanation: 'Opportunity cost is the next best alternative that is given up.',
      },
      {
        question_id: 'question-2',
        correct_answer: {
          keywords: ['monopolistic competition'],
        },
        explanation: 'Monopolistic competition combines many firms with product differentiation.',
      },
    ],
    submissions: [],
    submission_items: [],
  }
}

describe('exam-service', () => {
  test('returns 403 when the access password is invalid', async () => {
    const client = new FakeClient(createFixtureTables(await sha256Hex('123456')))

    const result = await startExam(client, {
      examId: 'exam-1',
      userName: 'Alice',
      accessPassword: 'wrong-password',
    })

    expect(result.status).toBe(403)
    expect(result.body).toEqual({
      error: {
        code: 'invalid_access_password',
        message: 'The access password is invalid.',
      },
    })
  })

  test('returns the exam payload when the access password is valid', async () => {
    const client = new FakeClient(createFixtureTables(await sha256Hex('123456')))

    const result = await startExam(client, {
      examId: 'exam-1',
      userName: 'Alice',
      accessPassword: '123456',
    })

    if (!('exam' in result.body)) {
      throw new Error('Expected a successful start exam response.')
    }

    expect(result.status).toBe(200)
    expect(result.body.exam.title).toBe('Microeconomics - Midterm Assessment')
    expect(result.body.user_name).toBe('Alice')
    expect(result.body.questions).toHaveLength(2)
  })

  test('scores the submission and writes submission snapshots', async () => {
    const tables = createFixtureTables(await sha256Hex('123456'))
    const client = new FakeClient(tables)

    const result = await submitExam(client, {
      examId: 'exam-1',
      userName: 'Alice',
      duration: 320,
      answers: {
        'question-1': ['B'],
        'question-2': 'Monopolistic competition',
      },
    })

    if (!('score' in result.body)) {
      throw new Error('Expected a successful submit exam response.')
    }

    expect(result.status).toBe(200)
    expect(result.body.score).toBe(1)
    expect(result.body.correct_count).toBe(2)
    expect(result.body.total_count).toBe(2)
    expect(tables.submissions).toHaveLength(1)
    expect(tables.submission_items).toHaveLength(2)
    expect(tables.submission_items[0]?.submission_id).toBe('submission-1')
  })

  test('matches text answers against keyword arrays', () => {
    const result = evaluateAnswer(
      'text',
      { keywords: ['monopolistic competition'] },
      'This market is monopolistic competition.',
    )

    expect(result.isCorrect).toBe(true)
  })

  test('loads the admin exam draft with private answers and explanations', async () => {
    const tables = createFixtureTables(await sha256Hex('123456'))
    const client = new FakeClient(tables)

    const result = await loadExamDraft(client, {
      examId: 'exam-1',
    })

    expect(result.status).toBe(200)

    if (!('questions' in result.body)) {
      throw new Error('Expected a successful load exam draft response.')
    }

    expect(result.body.questions).toHaveLength(2)
    expect(result.body.questions[0]).toMatchObject({
      id: 'question-1',
      correct_answer: ['B'],
      explanation: 'Opportunity cost is the next best alternative that is given up.',
    })
    expect(result.body.questions[1]).toMatchObject({
      id: 'question-2',
      correct_answer: ['monopolistic competition'],
    })
  })

  test('creates a new draft exam with a private access record', async () => {
    const tables = createFixtureTables(await sha256Hex('123456'))
    const client = new FakeClient(tables)

    const result = await createExamDraft(client, {
      examTitle: 'Untitled Exam',
    })

    expect(result.status).toBe(201)

    if (!('exam' in result.body)) {
      throw new Error('Expected a successful create exam draft response.')
    }

    expect(tables.exams).toHaveLength(2)
    expect(tables.exams[1]).toMatchObject({
      title: 'Untitled Exam',
      is_active: false,
    })
    expect(tables['app_private.exam_access']).toHaveLength(2)
    expect(tables['app_private.exam_access'][1]).toMatchObject({
      exam_id: result.body.exam.id,
    })
  })

  test('deletes an exam draft and cascades related question and access records', async () => {
    const tables = createFixtureTables(await sha256Hex('123456'))
    const client = new FakeClient(tables)

    const result = await deleteExamDraft(client, {
      examId: 'exam-1',
    })

    expect(result.status).toBe(200)
    expect(tables.exams).toHaveLength(0)
    expect(tables.questions).toHaveLength(0)
    expect(tables['app_private.answers_library']).toHaveLength(0)
    expect(tables['app_private.exam_access']).toHaveLength(0)
    expect(result.body).toEqual({
      exam: {
        id: 'exam-1',
      },
      deleted: true,
    })
  })

  test('updates the exam title and question stems for the admin draft save flow', async () => {
    const tables = createFixtureTables(await sha256Hex('123456'))
    const client = new FakeClient(tables)

    const result = await saveExamDraft(client, {
      examId: 'exam-1',
      examTitle: 'Updated Exam Title',
      questions: [
        {
          id: 'question-1',
          type: 'radio',
          stem: 'Updated opportunity cost question',
          options: [
            { id: 'A', text: 'Money already spent' },
            { id: 'B', text: 'The next best alternative foregone' },
          ],
          correctAnswer: ['A'],
          explanation: 'The updated explanation highlights the trade-off.',
        },
      ],
    })

    expect(result.status).toBe(200)
    expect(tables.exams[0]?.title).toBe('Updated Exam Title')
    expect(tables.questions[0]?.content).toMatchObject({
      stem: 'Updated opportunity cost question',
    })
    expect(tables['app_private.answers_library'][0]).toMatchObject({
      question_id: 'question-1',
      correct_answer: ['A'],
      explanation: 'The updated explanation highlights the trade-off.',
    })
  })

  test('creates a new question and matching private answer record during draft save', async () => {
    const tables = createFixtureTables(await sha256Hex('123456'))
    const client = new FakeClient(tables)

    const result = await saveExamDraft(client, {
      examId: 'exam-1',
      examTitle: 'Microeconomics - Midterm Assessment',
      questions: [
        {
          id: 'question-1',
          type: 'radio',
          stem: 'What does opportunity cost describe?',
          options: [
            { id: 'A', text: 'Money already spent' },
            { id: 'B', text: 'The next best alternative foregone' },
          ],
          correctAnswer: ['B'],
          explanation: 'Opportunity cost is the next best alternative that is given up.',
        },
        {
          id: 'question-2',
          type: 'text',
          stem: 'Name the market structure with many sellers and differentiated products.',
          options: [],
          correctAnswer: ['monopolistic competition'],
          explanation: 'Monopolistic competition combines many firms with product differentiation.',
        },
        {
          id: 'draft-question-3',
          type: 'text',
          stem: 'State the definition of marginal utility.',
          options: [],
          correctAnswer: ['additional satisfaction'],
          explanation: 'Marginal utility is the extra satisfaction gained from one more unit.',
        },
      ],
    })

    expect(result.status).toBe(200)
    expect(tables.questions).toHaveLength(3)
    expect(tables.questions[2]).toMatchObject({
      id: 'draft-question-3',
      exam_id: 'exam-1',
      type: 'text',
    })
    expect(tables['app_private.answers_library']).toHaveLength(3)
    expect(tables['app_private.answers_library'][2]).toMatchObject({
      question_id: 'draft-question-3',
      explanation: 'Marginal utility is the extra satisfaction gained from one more unit.',
    })
  })

  test('deletes removed questions and cascades their answer records during draft save', async () => {
    const tables = createFixtureTables(await sha256Hex('123456'))
    const client = new FakeClient(tables)

    const result = await saveExamDraft(client, {
      examId: 'exam-1',
      examTitle: 'Microeconomics - Midterm Assessment',
      questions: [
        {
          id: 'question-1',
          type: 'radio',
          stem: 'What does opportunity cost describe?',
          options: [
            { id: 'A', text: 'Money already spent' },
            { id: 'B', text: 'The next best alternative foregone' },
          ],
          correctAnswer: ['B'],
          explanation: 'Opportunity cost is the next best alternative that is given up.',
        },
      ],
    })

    expect(result.status).toBe(200)
    expect(tables.questions).toHaveLength(1)
    expect(tables.questions[0]?.id).toBe('question-1')
    expect(tables['app_private.answers_library']).toHaveLength(1)
    expect(tables['app_private.answers_library'][0]?.question_id).toBe('question-1')
  })

  test('persists updated option text during draft save', async () => {
    const tables = createFixtureTables(await sha256Hex('123456'))
    const client = new FakeClient(tables)

    const result = await saveExamDraft(client, {
      examId: 'exam-1',
      examTitle: 'Microeconomics - Midterm Assessment',
      questions: [
        {
          id: 'question-1',
          type: 'radio',
          stem: 'What does opportunity cost describe?',
          options: [
            { id: 'A', text: 'Money already spent in the past' },
            { id: 'B', text: 'The next best alternative foregone' },
          ],
          correctAnswer: ['B'],
          explanation: 'Opportunity cost is the next best alternative that is given up.',
        },
        {
          id: 'question-2',
          type: 'text',
          stem: 'Name the market structure with many sellers and differentiated products.',
          options: [],
          correctAnswer: ['monopolistic competition'],
          explanation: 'Monopolistic competition combines many firms with product differentiation.',
        },
      ],
    })

    expect(result.status).toBe(200)
    expect(tables.questions[0]?.content).toMatchObject({
      options: [
        { id: 'A', text: 'Money already spent in the past' },
        { id: 'B', text: 'The next best alternative foregone' },
      ],
    })
  })

  test('persists removed options during draft save', async () => {
    const tables = createFixtureTables(await sha256Hex('123456'))
    const client = new FakeClient(tables)

    const result = await saveExamDraft(client, {
      examId: 'exam-1',
      examTitle: 'Microeconomics - Midterm Assessment',
      questions: [
        {
          id: 'question-1',
          type: 'radio',
          stem: 'What does opportunity cost describe?',
          options: [{ id: 'B', text: 'The next best alternative foregone' }],
          correctAnswer: ['B'],
          explanation: 'Opportunity cost is the next best alternative that is given up.',
        },
        {
          id: 'question-2',
          type: 'text',
          stem: 'Name the market structure with many sellers and differentiated products.',
          options: [],
          correctAnswer: ['monopolistic competition'],
          explanation: 'Monopolistic competition combines many firms with product differentiation.',
        },
      ],
    })

    expect(result.status).toBe(200)
    expect(tables.questions[0]?.content).toMatchObject({
      options: [{ id: 'B', text: 'The next best alternative foregone' }],
    })
  })
})
