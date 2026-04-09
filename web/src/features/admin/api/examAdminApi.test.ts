import { beforeEach, describe, expect, test, vi } from 'vitest'
import {
  createExamDraft,
  deleteExamDraft,
  getExamEditorData,
  listAdminExams,
  mapExamEditorData,
  mapExamEditorSavePayload,
  saveExamEditorData,
  type ExamEditorSnapshot,
} from './examAdminApi'

const { invokeMock, fromMock, selectMock, orderMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
  fromMock: vi.fn(),
  selectMock: vi.fn(),
  orderMock: vi.fn(),
}))

vi.mock('../../../lib/supabase', () => ({
  getSupabaseBrowserClient: () => ({
    functions: {
      invoke: invokeMock,
    },
    from: fromMock,
  }),
}))

describe('examAdminApi', () => {
  beforeEach(() => {
    invokeMock.mockReset()
    fromMock.mockReset()
    selectMock.mockReset()
    orderMock.mockReset()
    fromMock.mockReturnValue({
      select: selectMock,
    })
    selectMock.mockReturnValue({
      order: orderMock,
    })
  })

  test('maps exam and question rows into an editor snapshot', () => {
    const result = mapExamEditorData({
      exam: {
        id: 'exam-1',
        title: 'Microeconomics - Midterm Assessment',
        created_at: '2026-04-09T18:00:00Z',
        is_active: true,
      },
      questions: [
        {
          id: 'question-1',
          exam_id: 'exam-1',
          order_index: 1,
          type: 'radio',
          content: {
            stem: 'What does opportunity cost describe?',
            options: [
              { id: 'A', text: 'Money already spent' },
              { id: 'B', text: 'The next best alternative foregone' },
            ],
          },
          correct_answer: ['B'],
          explanation: 'Opportunity cost is the next best alternative that is given up.',
        },
      ],
    })

    expect(result.examTitle).toBe('Microeconomics - Midterm Assessment')
    expect(result.questions).toHaveLength(1)
    expect(result.questions[0]).toMatchObject({
      questionLabel: 'Question 01',
      stem: 'What does opportunity cost describe?',
      type: 'radio',
      correctAnswerValues: ['B'],
      explanation: 'Opportunity cost is the next best alternative that is given up.',
    })
  })

  test('loads the secure editor snapshot through the restricted edge function', async () => {
    invokeMock.mockResolvedValue({
      data: {
        exam: {
          id: 'exam-1',
          title: 'Microeconomics - Midterm Assessment',
          created_at: '2026-04-09T18:00:00Z',
          is_active: true,
        },
        questions: [
          {
            id: 'question-1',
            exam_id: 'exam-1',
            order_index: 1,
            type: 'radio',
            content: {
              stem: 'What does opportunity cost describe?',
              options: [
                { id: 'A', text: 'Money already spent' },
                { id: 'B', text: 'The next best alternative foregone' },
              ],
            },
            correct_answer: ['B'],
            explanation: 'Opportunity cost is the next best alternative that is given up.',
          },
        ],
      },
      error: null,
    })

    await expect(getExamEditorData('exam-1')).resolves.toMatchObject({
      examId: 'exam-1',
      questions: [
        {
          correctAnswerValues: ['B'],
          explanation: 'Opportunity cost is the next best alternative that is given up.',
        },
      ],
    })

    expect(invokeMock).toHaveBeenCalledWith('load-exam-draft', {
      body: {
        exam_id: 'exam-1',
      },
    })
  })

  test('lists admin exams through the direct exams query with a normalized fallback shape', async () => {
    orderMock.mockResolvedValue({
      data: [
        {
          id: 'exam-2',
          title: 'Game Theory - Problem Set 01',
          created_at: '2026-04-09T18:00:00Z',
          is_active: false,
        },
        {
          id: 'exam-1',
          title: 'Microeconomics - Midterm Assessment',
          created_at: '2026-04-08T18:00:00Z',
          is_active: true,
        },
      ],
      error: null,
    })

    await expect(listAdminExams()).resolves.toEqual([
      {
        examId: 'exam-2',
        title: 'Game Theory - Problem Set 01',
        createdAt: '2026-04-09T18:00:00Z',
        statusLabel: 'Draft',
      },
      {
        examId: 'exam-1',
        title: 'Microeconomics - Midterm Assessment',
        createdAt: '2026-04-08T18:00:00Z',
        statusLabel: 'Active',
      },
    ])

    expect(fromMock).toHaveBeenCalledWith('exams')
    expect(selectMock).toHaveBeenCalledWith('id,title,created_at,is_active')
  })

  test('maps the editor snapshot into the save payload contract', () => {
    const snapshot: ExamEditorSnapshot = {
      examId: 'exam-1',
      examTitle: 'Updated Exam Title',
      examStatusLabel: 'Active',
      questions: [
        {
          id: 'question-1',
          questionLabel: 'Question 01',
          type: 'radio',
          stem: 'Updated question stem',
          options: [
            { id: 'A', text: 'Option A' },
            { id: 'B', text: 'Option B' },
          ],
          correctAnswerValues: ['B'],
          explanation: 'Updated explanation',
        },
      ],
    }

    expect(mapExamEditorSavePayload(snapshot)).toEqual({
      exam_id: 'exam-1',
      exam_title: 'Updated Exam Title',
      questions: [
        {
          id: 'question-1',
          type: 'radio',
          stem: 'Updated question stem',
          options: [
            { id: 'A', text: 'Option A' },
            { id: 'B', text: 'Option B' },
          ],
          correct_answer: ['B'],
          explanation: 'Updated explanation',
        },
      ],
    })
  })

  test('invokes the secure admin save function with the normalized payload', async () => {
    const snapshot: ExamEditorSnapshot = {
      examId: 'exam-1',
      examTitle: 'Updated Exam Title',
      examStatusLabel: 'Active',
      questions: [
        {
          id: 'question-1',
          questionLabel: 'Question 01',
          type: 'radio',
          stem: 'Updated question stem',
          options: [{ id: 'A', text: 'Option A' }],
          correctAnswerValues: ['A'],
          explanation: 'Updated explanation',
        },
      ],
    }

    invokeMock.mockResolvedValue({
      data: {
        exam: {
          id: 'exam-1',
          title: 'Updated Exam Title',
        },
        saved_question_count: 1,
      },
      error: null,
    })

    await expect(saveExamEditorData(snapshot)).resolves.toEqual({
      examId: 'exam-1',
      examTitle: 'Updated Exam Title',
      savedQuestionCount: 1,
    })

    expect(invokeMock).toHaveBeenCalledWith('save-exam-draft', {
      body: {
        exam_id: 'exam-1',
        exam_title: 'Updated Exam Title',
        questions: [
          {
            id: 'question-1',
            type: 'radio',
            stem: 'Updated question stem',
            options: [{ id: 'A', text: 'Option A' }],
            correct_answer: ['A'],
            explanation: 'Updated explanation',
          },
        ],
      },
    })
  })

  test('preserves locally generated draft question ids in the save payload', () => {
    const snapshot: ExamEditorSnapshot = {
      examId: 'exam-1',
      examTitle: 'Updated Exam Title',
      examStatusLabel: 'Active',
      questions: [
        {
          id: 'draft-question-3',
          questionLabel: 'Question 03',
          type: 'text',
          stem: 'State the definition of marginal utility.',
          options: [],
          correctAnswerValues: ['additional satisfaction'],
          explanation: 'Marginal utility is the extra satisfaction gained from one more unit.',
        },
      ],
    }

    expect(mapExamEditorSavePayload(snapshot).questions[0]?.id).toBe('draft-question-3')
  })

  test('preserves edited options in the save payload', () => {
    const snapshot: ExamEditorSnapshot = {
      examId: 'exam-1',
      examTitle: 'Updated Exam Title',
      examStatusLabel: 'Active',
      questions: [
        {
          id: 'question-1',
          questionLabel: 'Question 01',
          type: 'checkbox',
          stem: 'Select the valid market characteristics.',
          options: [
            { id: 'A', text: 'Many buyers and sellers' },
            { id: 'B', text: 'Updated option text' },
            { id: 'C', text: 'Strong barriers to entry' },
          ],
          correctAnswerValues: ['A', 'B'],
          explanation: 'A competitive market needs many participants and low barriers.',
        },
      ],
    }

    expect(mapExamEditorSavePayload(snapshot).questions[0]?.options).toEqual([
      { id: 'A', text: 'Many buyers and sellers' },
      { id: 'B', text: 'Updated option text' },
      { id: 'C', text: 'Strong barriers to entry' },
    ])
  })

  test('creates a new draft exam through the restricted edge function', async () => {
    invokeMock.mockResolvedValue({
      data: {
        exam: {
          id: 'exam-2',
          title: 'Untitled Exam',
          is_active: false,
        },
      },
      error: null,
    })

    await expect(createExamDraft()).resolves.toEqual({
      examId: 'exam-2',
      examTitle: 'Untitled Exam',
    })

    expect(invokeMock).toHaveBeenCalledWith('create-exam-draft', {
      body: {
        exam_title: 'Untitled Exam',
      },
    })
  })

  test('deletes a draft exam through the restricted edge function', async () => {
    invokeMock.mockResolvedValue({
      data: {
        exam: {
          id: 'exam-2',
        },
        deleted: true,
      },
      error: null,
    })

    await expect(deleteExamDraft('exam-2')).resolves.toEqual({
      examId: 'exam-2',
      deleted: true,
    })

    expect(invokeMock).toHaveBeenCalledWith('delete-exam-draft', {
      body: {
        exam_id: 'exam-2',
      },
    })
  })
})
