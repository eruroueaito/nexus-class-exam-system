import { beforeEach, describe, expect, test, vi } from 'vitest'
import {
  createExamDraft,
  deleteExamDraft,
  getExamEditorData,
  importExamFromJson,
  listAdminExams,
  mapExamEditorData,
  mapExamEditorSavePayload,
  parseAiExamImportPayload,
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
    expect(result.isPublished).toBe(true)
    expect(result.accessPasswordDraft).toBe('')
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
      isPublished: true,
      accessPasswordDraft: '123',
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
      is_active: true,
      access_password: '123',
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
      isPublished: true,
      accessPasswordDraft: '123',
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
        is_active: true,
        access_password: '123',
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

  test('throws when the secure admin save function fails instead of reporting a fake success', async () => {
    const snapshot: ExamEditorSnapshot = {
      examId: 'exam-1',
      examTitle: 'Updated Exam Title',
      examStatusLabel: 'Active',
      isPublished: true,
      accessPasswordDraft: '',
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
      data: null,
      error: new Error('save failed'),
    })

    await expect(saveExamEditorData(snapshot)).rejects.toThrow('save failed')
  })

  test('preserves locally generated draft question ids in the save payload', () => {
    const snapshot: ExamEditorSnapshot = {
      examId: 'exam-1',
      examTitle: 'Updated Exam Title',
      examStatusLabel: 'Active',
      isPublished: true,
      accessPasswordDraft: '',
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
      isPublished: true,
      accessPasswordDraft: '',
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

  test('throws when creating a new draft exam fails', async () => {
    invokeMock.mockResolvedValue({
      data: null,
      error: new Error('create failed'),
    })

    await expect(createExamDraft()).rejects.toThrow('create failed')
  })

  test('parses a valid AI exam import payload', () => {
    expect(
      parseAiExamImportPayload(
        JSON.stringify({
          exam_title: 'Game Theory - Midterm Assessment',
          questions: [
            {
              type: 'radio',
              stem: 'What is a dominant strategy?',
              options: [
                { id: 'A', text: 'A weak response' },
                { id: 'B', text: 'A best response for every opponent action' },
              ],
              correct_answer: ['B'],
              explanation: 'A dominant strategy is optimal regardless of the opponent action.',
            },
          ],
        }),
      ),
    ).toMatchObject({
      exam_title: 'Game Theory - Midterm Assessment',
      questions: [
        {
          type: 'radio',
          correct_answer: ['B'],
        },
      ],
    })
  })

  test('imports an AI exam payload by creating and saving a draft exam', async () => {
    invokeMock
      .mockResolvedValueOnce({
        data: {
          exam: {
            id: 'exam-9',
            title: 'Game Theory - Midterm Assessment',
            is_active: false,
          },
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          exam: {
            id: 'exam-9',
            title: 'Game Theory - Midterm Assessment',
          },
          saved_question_count: 1,
        },
        error: null,
      })

    await expect(
      importExamFromJson(
        JSON.stringify({
          exam_title: 'Game Theory - Midterm Assessment',
          questions: [
            {
              id: 'question-1',
              type: 'radio',
              stem: 'What is a dominant strategy?',
              options: [
                { id: 'A', text: 'A weak response' },
                { id: 'B', text: 'A best response for every opponent action' },
              ],
              correct_answer: ['B'],
              explanation: 'A dominant strategy is optimal regardless of the opponent action.',
            },
          ],
        }),
      ),
    ).resolves.toEqual({
      examId: 'exam-9',
      examTitle: 'Game Theory - Midterm Assessment',
      savedQuestionCount: 1,
    })

    expect(invokeMock).toHaveBeenNthCalledWith(1, 'create-exam-draft', {
      body: {
        exam_title: 'Game Theory - Midterm Assessment',
      },
    })
    expect(invokeMock).toHaveBeenNthCalledWith(2, 'save-exam-draft', {
      body: expect.objectContaining({
        exam_id: 'exam-9',
        exam_title: 'Game Theory - Midterm Assessment',
      }),
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

  test('throws when deleting a draft exam fails', async () => {
    invokeMock.mockResolvedValue({
      data: null,
      error: new Error('delete failed'),
    })

    await expect(deleteExamDraft('exam-2')).rejects.toThrow('delete failed')
  })
})
