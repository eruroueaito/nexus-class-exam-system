import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { NexusShellPage } from './NexusShellPage'

const startExamMock = vi.fn()
const submitExamMock = vi.fn()

vi.mock('../../exams/hooks/useExamCatalog', () => ({
  useExamCatalog: () => ({
    data: [
      {
        id: 'exam-1',
        title: 'Microeconomics - Midterm Assessment',
        createdAt: '2026-04-09T18:00:00Z',
        isActive: true,
      },
      {
        id: 'exam-2',
        title: 'Introductory Macroeconomics - Quiz 01',
        createdAt: '2026-04-08T18:00:00Z',
        isActive: true,
      },
      {
        id: 'exam-3',
        title: 'Game Theory - Midterm Assessment',
        createdAt: '2026-04-07T18:00:00Z',
        isActive: true,
      },
    ],
    isFetching: false,
    isError: false,
  }),
}))

vi.mock('../../../lib/exam-api', () => ({
  createBrowserExamApi: () => ({
    startExam: startExamMock,
    submitExam: submitExamMock,
  }),
}))

describe('NexusShellPage', () => {
  beforeEach(() => {
    startExamMock.mockReset()
    submitExamMock.mockReset()
  })

  test('starts an exam after the student provides a name and access password', async () => {
    startExamMock.mockResolvedValue({
      exam: {
        id: 'exam-1',
        title: 'Microeconomics - Midterm Assessment',
      },
      user_name: 'Alice',
      questions: [
        {
          id: 'question-1',
          type: 'radio',
          content: {
            stem: 'What does opportunity cost describe?',
            options: [
              { id: 'A', text: 'Money already spent' },
              { id: 'B', text: 'The next best alternative foregone' },
            ],
          },
        },
      ],
    })

    render(
      <MemoryRouter>
        <NexusShellPage />
      </MemoryRouter>,
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: /Microeconomics - Midterm Assessment/,
      }),
    )
    expect(screen.getByRole('dialog', { name: 'Assignment Access' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Your Name'), {
      target: { value: 'Alice' },
    })
    fireEvent.change(screen.getByLabelText('Access Password'), {
      target: { value: '123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Start Assignment' }))

    await waitFor(() => {
      expect(startExamMock).toHaveBeenCalledWith({
        examId: 'exam-1',
        userName: 'Alice',
        accessPassword: '123',
      })
    })

    expect(
      await screen.findByText('What does opportunity cost describe?'),
    ).toBeInTheDocument()
  })

  test('renders every active assignment from the catalog instead of only the first one', async () => {
    render(
      <MemoryRouter>
        <NexusShellPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('button', { name: /Microeconomics - Midterm Assessment/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Introductory Macroeconomics - Quiz 01/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Game Theory - Midterm Assessment/ })).toBeInTheDocument()
  })

  test('starts an exam even when the student leaves the name field blank', async () => {
    startExamMock.mockResolvedValue({
      exam: {
        id: 'exam-2',
        title: 'Introductory Macroeconomics - Quiz 01',
      },
      user_name: 'Guest Student',
      questions: [
        {
          id: 'question-1',
          type: 'radio',
          content: {
            stem: 'What does GDP measure in macroeconomics?',
            options: [
              { id: 'A', text: 'The value of total financial assets held by households' },
              { id: 'B', text: 'The market value of final goods and services produced within a country' },
            ],
          },
        },
      ],
    })

    render(
      <MemoryRouter>
        <NexusShellPage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: /Introductory Macroeconomics - Quiz 01/ }))
    fireEvent.change(screen.getByLabelText('Access Password'), {
      target: { value: '123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Start Assignment' }))

    await waitFor(() => {
      expect(startExamMock).toHaveBeenCalledWith({
        examId: 'exam-2',
        userName: '',
        accessPassword: '123',
      })
    })

    expect(await screen.findByText('What does GDP measure in macroeconomics?')).toBeInTheDocument()
  })

  test('submits the active exam and renders the result summary', async () => {
    startExamMock.mockResolvedValue({
      exam: {
        id: 'exam-1',
        title: 'Microeconomics - Midterm Assessment',
      },
      user_name: 'Alice',
      questions: [
        {
          id: 'question-1',
          type: 'radio',
          content: {
            stem: 'What does opportunity cost describe?',
            options: [
              { id: 'A', text: 'Money already spent' },
              { id: 'B', text: 'The next best alternative foregone' },
            ],
          },
        },
      ],
    })

    submitExamMock.mockResolvedValue({
      submission_id: 'submission-1',
      exam: {
        id: 'exam-1',
        title: 'Microeconomics - Midterm Assessment',
      },
      score: 1,
      correct_count: 1,
      total_count: 1,
      items: [
        {
          question_id: 'question-1',
          user_answer: ['B'],
          correct_answer: ['B'],
          is_correct: true,
          explanation: 'Opportunity cost is the value of the next best option.',
        },
      ],
    })

    render(
      <MemoryRouter>
        <NexusShellPage />
      </MemoryRouter>,
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: /Microeconomics - Midterm Assessment/,
      }),
    )
    fireEvent.change(screen.getByLabelText('Your Name'), {
      target: { value: 'Alice' },
    })
    fireEvent.change(screen.getByLabelText('Access Password'), {
      target: { value: '123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Start Assignment' }))

    fireEvent.click(
      await screen.findByRole('radio', {
        name: 'The next best alternative foregone',
      }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Submit Assignment' }))

    await waitFor(() => {
      expect(submitExamMock).toHaveBeenCalledWith(
        expect.objectContaining({
          examId: 'exam-1',
          userName: 'Alice',
          answers: {
            'question-1': ['B'],
          },
        }),
      )
    })

    expect(await screen.findByText('Score Summary')).toBeInTheDocument()
    expect(screen.getAllByText('100%').length).toBeGreaterThan(0)
    expect(screen.getByText('Performance Overview')).toBeInTheDocument()
    expect(screen.getByText('Your Answer')).toBeInTheDocument()
    expect(screen.getByText('Correct Answer')).toBeInTheDocument()
    expect(screen.getByTestId('result-scroll-shell')).toBeInTheDocument()
    expect(
      screen.getByText('Opportunity cost is the value of the next best option.'),
    ).toBeInTheDocument()
  })

  test('keeps the student in the quiz when submission fails instead of reopening access validation', async () => {
    startExamMock.mockResolvedValue({
      exam: {
        id: 'exam-1',
        title: 'Microeconomics - Midterm Assessment',
      },
      user_name: 'Alice',
      questions: [
        {
          id: 'question-1',
          type: 'radio',
          content: {
            stem: 'What does opportunity cost describe?',
            options: [
              { id: 'A', text: 'Money already spent' },
              { id: 'B', text: 'The next best alternative foregone' },
            ],
          },
        },
      ],
    })

    submitExamMock.mockRejectedValue(new Error('Request failed with status 500'))

    render(
      <MemoryRouter>
        <NexusShellPage />
      </MemoryRouter>,
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: /Microeconomics - Midterm Assessment/,
      }),
    )
    fireEvent.change(screen.getByLabelText('Your Name'), {
      target: { value: 'Alice' },
    })
    fireEvent.change(screen.getByLabelText('Access Password'), {
      target: { value: '123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Start Assignment' }))

    fireEvent.click(
      await screen.findByRole('radio', {
        name: 'The next best alternative foregone',
      }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Submit Assignment' }))

    expect(await screen.findByText('Request failed with status 500')).toBeInTheDocument()
    expect(screen.getByText('What does opportunity cost describe?')).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Assignment Access' })).not.toBeInTheDocument()
  })

  test('shows the assignment access form as a floating modal and closes it on cancel', async () => {
    render(
      <MemoryRouter>
        <NexusShellPage />
      </MemoryRouter>,
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: /Microeconomics - Midterm Assessment/,
      }),
    )

    const dialog = screen.getByRole('dialog', { name: 'Assignment Access' })
    expect(dialog).toBeInTheDocument()
    expect(document.querySelector('.access-modal-overlay')).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Assignment Access' })).not.toBeInTheDocument()
    })
  })

  test.skip('prints the result summary on demand — removed: print button no longer shown to students', async () => {
    const printMock = vi.fn()
    vi.stubGlobal('print', printMock)

    startExamMock.mockResolvedValue({
      exam: {
        id: 'exam-1',
        title: 'Microeconomics - Midterm Assessment',
      },
      user_name: 'Alice',
      questions: [
        {
          id: 'question-1',
          type: 'radio',
          content: {
            stem: 'What does opportunity cost describe?',
            options: [
              { id: 'A', text: 'Money already spent' },
              { id: 'B', text: 'The next best alternative foregone' },
            ],
          },
        },
      ],
    })

    submitExamMock.mockResolvedValue({
      submission_id: 'submission-1',
      exam: {
        id: 'exam-1',
        title: 'Microeconomics - Midterm Assessment',
      },
      score: 1,
      correct_count: 1,
      total_count: 1,
      items: [
        {
          question_id: 'question-1',
          user_answer: ['B'],
          correct_answer: ['B'],
          is_correct: true,
          explanation: 'Opportunity cost is the value of the next best option.',
        },
      ],
    })

    render(
      <MemoryRouter>
        <NexusShellPage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Student Access' }))
    fireEvent.click(screen.getByRole('button', { name: /Microeconomics - Midterm Assessment/ }))
    fireEvent.change(screen.getByLabelText('Your Name'), {
      target: { value: 'Alice' },
    })
    fireEvent.change(screen.getByLabelText('Access Password'), {
      target: { value: '123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Start Assignment' }))
    fireEvent.click(await screen.findByRole('radio', { name: 'The next best alternative foregone' }))
    fireEvent.click(screen.getByRole('button', { name: 'Submit Assignment' }))

    expect(await screen.findByRole('button', { name: 'Print Results' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Print Results' }))
    expect(printMock).toHaveBeenCalledTimes(1)
  })
})
