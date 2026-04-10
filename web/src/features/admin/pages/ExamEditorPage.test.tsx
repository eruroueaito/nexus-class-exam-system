import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { ExamEditorPage } from './ExamEditorPage'

const { getAdminSessionMock } = vi.hoisted(() => ({
  getAdminSessionMock: vi.fn(),
}))

const { getExamEditorDataMock } = vi.hoisted(() => ({
  getExamEditorDataMock: vi.fn(),
}))

const { saveExamEditorDataMock } = vi.hoisted(() => ({
  saveExamEditorDataMock: vi.fn(),
}))

const { deleteExamDraftMock } = vi.hoisted(() => ({
  deleteExamDraftMock: vi.fn(),
}))

const { randomUuidMock } = vi.hoisted(() => ({
  randomUuidMock: vi.fn(),
}))

vi.mock('../../auth/api/adminLogin', () => ({
  getAdminSession: getAdminSessionMock,
  signOutAdmin: vi.fn(),
}))

vi.mock('../api/examAdminApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/examAdminApi')>()

  return {
    ...actual,
    FALLBACK_EXAM_ID: '11111111-1111-1111-1111-111111111111',
    getExamEditorData: getExamEditorDataMock,
    saveExamEditorData: saveExamEditorDataMock,
    deleteExamDraft: deleteExamDraftMock,
  }
})

describe('ExamEditorPage', () => {
  beforeEach(() => {
    getAdminSessionMock.mockReset()
    getExamEditorDataMock.mockReset()
    saveExamEditorDataMock.mockReset()
    deleteExamDraftMock.mockReset()
    randomUuidMock.mockReset()
    randomUuidMock.mockReturnValue('draft-question-3')
    vi.stubGlobal('crypto', { randomUUID: randomUuidMock })
  })

  test('renders the editor shell with the exam draft and question blocks', async () => {
    getAdminSessionMock.mockResolvedValue({
      email: 'admin@example.com',
    })
    getExamEditorDataMock.mockResolvedValue({
      examId: 'exam-1',
      examTitle: 'Microeconomics - Midterm Assessment',
      examStatusLabel: 'Active',
      isPublished: true,
      accessPasswordDraft: '',
      questions: [
        {
          id: 'question-1',
          questionLabel: 'Question 01',
          type: 'radio',
          stem: 'What does opportunity cost describe?',
          options: [
            { id: 'A', text: 'Money already spent' },
            { id: 'B', text: 'The next best alternative foregone' },
          ],
          correctAnswerValues: ['B'],
          explanation: 'Opportunity cost is the next best alternative that is given up.',
        },
      ],
    })

    render(
      <MemoryRouter initialEntries={['/admin/exams/exam-1']}>
        <Routes>
          <Route path="/admin/exams/:examId" element={<ExamEditorPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('Microeconomics - Midterm Assessment')).toBeInTheDocument()
    })

    expect(screen.getByText('Question Editor')).toBeInTheDocument()
    expect(screen.getByText('Question 01')).toBeInTheDocument()
    expect(screen.getByDisplayValue('What does opportunity cost describe?')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Opportunity cost is the next best alternative that is given up.')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Correct option B' })).toBeChecked()
  })

  test('saves the edited exam draft through the admin save API', async () => {
    getAdminSessionMock.mockResolvedValue({
      email: 'admin@example.com',
    })
    getExamEditorDataMock.mockResolvedValue({
      examId: 'exam-1',
      examTitle: 'Microeconomics - Midterm Assessment',
      examStatusLabel: 'Active',
      isPublished: true,
      accessPasswordDraft: '',
      questions: [
        {
          id: 'question-1',
          questionLabel: 'Question 01',
          type: 'radio',
          stem: 'What does opportunity cost describe?',
          options: [
            { id: 'A', text: 'Option A' },
            { id: 'B', text: 'Option B' },
          ],
          correctAnswerValues: ['A'],
          explanation: 'Original explanation',
        },
      ],
    })
    saveExamEditorDataMock.mockResolvedValue({
      examId: 'exam-1',
      examTitle: 'Updated Exam Title',
      savedQuestionCount: 1,
    })

    render(
      <MemoryRouter initialEntries={['/admin/exams/exam-1']}>
        <Routes>
          <Route path="/admin/exams/:examId" element={<ExamEditorPage />} />
        </Routes>
      </MemoryRouter>,
    )

    const titleInput = await screen.findByDisplayValue('Microeconomics - Midterm Assessment')
    const stemInput = screen.getByDisplayValue('What does opportunity cost describe?')
    const explanationInput = screen.getByDisplayValue('Original explanation')
    const passwordInput = screen.getByLabelText('Assignment Access Password')

    fireEvent.change(titleInput, { target: { value: 'Updated Exam Title' } })
    fireEvent.change(stemInput, { target: { value: 'Updated question stem' } })
    fireEvent.change(explanationInput, { target: { value: 'Updated explanation' } })
    fireEvent.change(passwordInput, { target: { value: '456789' } })
    fireEvent.click(screen.getByRole('radio', { name: 'Correct option B' }))

    fireEvent.click(screen.getByRole('button', { name: 'Save Draft' }))

    await waitFor(() => {
      expect(saveExamEditorDataMock).toHaveBeenCalledWith({
        examId: 'exam-1',
        examTitle: 'Updated Exam Title',
        examStatusLabel: 'Active',
        isPublished: true,
        accessPasswordDraft: '456789',
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
      })
    })

    expect(await screen.findByText('Changes saved.')).toBeInTheDocument()
  })

  test('adds a new radio question draft to the editor workspace', async () => {
    getAdminSessionMock.mockResolvedValue({
      email: 'admin@example.com',
    })
    getExamEditorDataMock.mockResolvedValue({
      examId: 'exam-1',
      examTitle: 'Microeconomics - Midterm Assessment',
      examStatusLabel: 'Active',
      isPublished: true,
      accessPasswordDraft: '',
      questions: [
        {
          id: 'question-1',
          questionLabel: 'Question 01',
          type: 'radio',
          stem: 'What does opportunity cost describe?',
          options: [{ id: 'A', text: 'Option A' }],
          correctAnswerValues: ['A'],
          explanation: 'Original explanation',
        },
      ],
    })

    render(
      <MemoryRouter initialEntries={['/admin/exams/exam-1']}>
        <Routes>
          <Route path="/admin/exams/:examId" element={<ExamEditorPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await screen.findByDisplayValue('Microeconomics - Midterm Assessment')

    fireEvent.click(screen.getByRole('button', { name: 'Add Radio Question' }))

    expect(screen.getByText('Question 02')).toBeInTheDocument()
    expect(screen.getByDisplayValue('New radio question stem')).toBeInTheDocument()
  })

  test('removes a draft question from the editor workspace', async () => {
    getAdminSessionMock.mockResolvedValue({
      email: 'admin@example.com',
    })
    getExamEditorDataMock.mockResolvedValue({
      examId: 'exam-1',
      examTitle: 'Microeconomics - Midterm Assessment',
      examStatusLabel: 'Active',
      isPublished: true,
      accessPasswordDraft: '',
      questions: [
        {
          id: 'question-1',
          questionLabel: 'Question 01',
          type: 'radio',
          stem: 'What does opportunity cost describe?',
          options: [{ id: 'A', text: 'Option A' }],
          correctAnswerValues: ['A'],
          explanation: 'Original explanation',
        },
        {
          id: 'question-2',
          questionLabel: 'Question 02',
          type: 'text',
          stem: 'State the definition of marginal utility.',
          options: [],
          correctAnswerValues: ['additional satisfaction'],
          explanation: 'Marginal utility is the extra satisfaction gained from one more unit.',
        },
      ],
    })

    render(
      <MemoryRouter initialEntries={['/admin/exams/exam-1']}>
        <Routes>
          <Route path="/admin/exams/:examId" element={<ExamEditorPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await screen.findByDisplayValue('Microeconomics - Midterm Assessment')

    fireEvent.click(screen.getByRole('button', { name: 'Delete Question 02' }))

    expect(screen.queryByText('Question 02')).not.toBeInTheDocument()
  })

  test('edits option text and saves it through the admin save API', async () => {
    getAdminSessionMock.mockResolvedValue({
      email: 'admin@example.com',
    })
    getExamEditorDataMock.mockResolvedValue({
      examId: 'exam-1',
      examTitle: 'Microeconomics - Midterm Assessment',
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
            { id: 'B', text: 'Identical products' },
          ],
          correctAnswerValues: ['A', 'B'],
          explanation: 'A competitive market needs many participants and low barriers.',
        },
      ],
    })
    saveExamEditorDataMock.mockResolvedValue({
      examId: 'exam-1',
      examTitle: 'Microeconomics - Midterm Assessment',
      savedQuestionCount: 1,
    })

    render(
      <MemoryRouter initialEntries={['/admin/exams/exam-1']}>
        <Routes>
          <Route path="/admin/exams/:examId" element={<ExamEditorPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await screen.findByDisplayValue('Microeconomics - Midterm Assessment')

    fireEvent.change(screen.getByDisplayValue('Identical products'), {
      target: { value: 'Updated option text' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save Draft' }))

    await waitFor(() => {
      expect(saveExamEditorDataMock).toHaveBeenCalledWith(
        expect.objectContaining({
          questions: [
            expect.objectContaining({
              options: [
                { id: 'A', text: 'Many buyers and sellers' },
                { id: 'B', text: 'Updated option text' },
              ],
            }),
          ],
        }),
      )
    })
  })

  test('adds and removes option rows in the editor workspace', async () => {
    getAdminSessionMock.mockResolvedValue({
      email: 'admin@example.com',
    })
    getExamEditorDataMock.mockResolvedValue({
      examId: 'exam-1',
      examTitle: 'Microeconomics - Midterm Assessment',
      examStatusLabel: 'Active',
      isPublished: true,
      accessPasswordDraft: '',
      questions: [
        {
          id: 'question-1',
          questionLabel: 'Question 01',
          type: 'radio',
          stem: 'What does opportunity cost describe?',
          options: [
            { id: 'A', text: 'Money already spent' },
            { id: 'B', text: 'The next best alternative foregone' },
          ],
          correctAnswerValues: ['B'],
          explanation: 'Opportunity cost is the next best alternative that is given up.',
        },
      ],
    })

    render(
      <MemoryRouter initialEntries={['/admin/exams/exam-1']}>
        <Routes>
          <Route path="/admin/exams/:examId" element={<ExamEditorPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await screen.findByDisplayValue('Microeconomics - Midterm Assessment')

    fireEvent.click(screen.getByRole('button', { name: 'Add Option Question 01' }))
    expect(screen.getByDisplayValue('Option C')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Remove Option A' }))
    expect(screen.queryByDisplayValue('Money already spent')).not.toBeInTheDocument()
  })

  test('deletes the current exam draft and returns to the dashboard', async () => {
    getAdminSessionMock.mockResolvedValue({
      email: 'admin@example.com',
    })
    getExamEditorDataMock.mockResolvedValue({
      examId: 'exam-1',
      examTitle: 'Microeconomics - Midterm Assessment',
      examStatusLabel: 'Active',
      isPublished: true,
      accessPasswordDraft: '',
      questions: [
        {
          id: 'question-1',
          questionLabel: 'Question 01',
          type: 'radio',
          stem: 'What does opportunity cost describe?',
          options: [{ id: 'A', text: 'Option A' }],
          correctAnswerValues: ['A'],
          explanation: 'Original explanation',
        },
      ],
    })
    deleteExamDraftMock.mockResolvedValue({
      examId: 'exam-1',
      deleted: true,
    })

    render(
      <MemoryRouter initialEntries={['/admin/exams/exam-1']}>
        <Routes>
          <Route path="/admin/exams/:examId" element={<ExamEditorPage />} />
          <Route path="/admin" element={<div>Admin Dashboard Route</div>} />
        </Routes>
      </MemoryRouter>,
    )

    await screen.findByDisplayValue('Microeconomics - Midterm Assessment')

    fireEvent.click(screen.getByRole('button', { name: 'Delete Exam' }))

    await waitFor(() => {
      expect(deleteExamDraftMock).toHaveBeenCalledWith('exam-1')
    })

    expect(await screen.findByText('Admin Dashboard Route')).toBeInTheDocument()
  })

  test('renders a back button that returns to the admin dashboard', async () => {
    getAdminSessionMock.mockResolvedValue({
      email: 'admin@example.com',
    })
    getExamEditorDataMock.mockResolvedValue({
      examId: 'exam-1',
      examTitle: 'Introductory Macroeconomics - Quiz 01',
      examStatusLabel: 'Active',
      isPublished: true,
      accessPasswordDraft: '',
      questions: [],
    })

    render(
      <MemoryRouter initialEntries={['/admin/exams/exam-1']}>
        <Routes>
          <Route path="/admin/exams/:examId" element={<ExamEditorPage />} />
          <Route path="/admin" element={<div>Admin Dashboard Route</div>} />
        </Routes>
      </MemoryRouter>,
    )

    await screen.findByDisplayValue('Introductory Macroeconomics - Quiz 01')
    fireEvent.click(screen.getByRole('button', { name: '← Back to Dashboard' }))
    expect(await screen.findByText('Admin Dashboard Route')).toBeInTheDocument()
  })

  test('publishes a draft exam through the admin save API', async () => {
    getAdminSessionMock.mockResolvedValue({
      email: 'admin@example.com',
    })
    getExamEditorDataMock.mockResolvedValue({
      examId: 'exam-1',
      examTitle: 'Game Theory - Midterm Assessment',
      examStatusLabel: 'Draft',
      isPublished: false,
      accessPasswordDraft: '',
      questions: [
        {
          id: 'question-1',
          questionLabel: 'Question 01',
          type: 'radio',
          stem: 'What is a Nash equilibrium?',
          options: [
            { id: 'A', text: 'A dominated outcome' },
            { id: 'B', text: 'A profile of mutual best responses' },
          ],
          correctAnswerValues: ['B'],
          explanation: 'A Nash equilibrium is a profile of mutual best responses.',
        },
      ],
    })
    saveExamEditorDataMock.mockResolvedValue({
      examId: 'exam-1',
      examTitle: 'Game Theory - Midterm Assessment',
      savedQuestionCount: 1,
    })

    render(
      <MemoryRouter initialEntries={['/admin/exams/exam-1']}>
        <Routes>
          <Route path="/admin/exams/:examId" element={<ExamEditorPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await screen.findByDisplayValue('Game Theory - Midterm Assessment')

    fireEvent.click(screen.getByRole('button', { name: 'Publish Exam' }))

    await waitFor(() => {
      expect(saveExamEditorDataMock).toHaveBeenCalledWith(
        expect.objectContaining({
          examStatusLabel: 'Active',
          isPublished: true,
        }),
      )
    })
  })
})
