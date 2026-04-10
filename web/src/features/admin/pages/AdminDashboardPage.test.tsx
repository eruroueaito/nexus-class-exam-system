import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { AdminDashboardPage } from './AdminDashboardPage'

const { getAdminSessionMock, signOutAdminMock } = vi.hoisted(() => ({
  getAdminSessionMock: vi.fn(),
  signOutAdminMock: vi.fn(),
}))

const { getExamAnalyticsMock } = vi.hoisted(() => ({
  getExamAnalyticsMock: vi.fn(),
}))

const { createExamDraftMock } = vi.hoisted(() => ({
  createExamDraftMock: vi.fn(),
}))

const { listAdminExamsMock } = vi.hoisted(() => ({
  listAdminExamsMock: vi.fn(),
}))

const { importExamFromJsonMock } = vi.hoisted(() => ({
  importExamFromJsonMock: vi.fn(),
}))

vi.mock('../../auth/api/adminLogin', () => ({
  getAdminSession: getAdminSessionMock,
  signOutAdmin: signOutAdminMock,
}))

vi.mock('../api/analyticsApi', () => ({
  getExamAnalytics: getExamAnalyticsMock,
}))

vi.mock('../api/examAdminApi', () => ({
  FALLBACK_EXAM_ID: '11111111-1111-1111-1111-111111111111',
  createExamDraft: createExamDraftMock,
  importExamFromJson: importExamFromJsonMock,
  listAdminExams: listAdminExamsMock,
}))

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    getAdminSessionMock.mockReset()
    signOutAdminMock.mockReset()
    getExamAnalyticsMock.mockReset()
    createExamDraftMock.mockReset()
    listAdminExamsMock.mockReset()
    importExamFromJsonMock.mockReset()
  })

  test('redirects unauthenticated visitors to the admin login page', async () => {
    getAdminSessionMock.mockResolvedValue(null)

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/login" element={<div>Admin Login Route</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Admin Login Route')).toBeInTheDocument()
  })

  test('renders the admin shell when an admin session exists', async () => {
    getAdminSessionMock.mockResolvedValue({
      email: 'admin@example.com',
    })
    getExamAnalyticsMock.mockResolvedValue({
      averageAccuracyLabel: '83.3%',
      activeStudents: 2,
      commonErrorLabel: 'Q.01',
      scoreTrend: [
        { label: 'Apr 8', scorePercent: 100 },
        { label: 'Apr 9', scorePercent: 66.7 },
      ],
      questionHeat: [
        {
          questionId: 'question-1',
          questionLabel: 'Q.01',
          questionStem: 'What does opportunity cost describe?',
          incorrectRateLabel: '50.0%',
          attempts: 2,
        },
      ],
    })
    listAdminExamsMock.mockResolvedValue([
      {
        examId: 'exam-1',
        title: 'Microeconomics - Midterm Assessment',
        createdAt: '2026-04-08T18:00:00Z',
        statusLabel: 'Active',
      },
    ])

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<AdminDashboardPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Admin Console' })).toBeInTheDocument()
    })

    expect(screen.getByText('admin@example.com')).toBeInTheDocument()
    expect(await screen.findByText('83.3%')).toBeInTheDocument()
    expect(screen.getByText('Active Students')).toBeInTheDocument()
    expect(screen.getByText('Score Trend')).toBeInTheDocument()
    expect(screen.getByText('Question Heat')).toBeInTheDocument()
    expect(screen.getByText('What does opportunity cost describe?')).toBeInTheDocument()
    expect(screen.getAllByText('Microeconomics - Midterm Assessment').length).toBeGreaterThan(0)
  })

  test('renders score trend above a full-width question heat section', async () => {
    getAdminSessionMock.mockResolvedValue({
      email: 'admin@example.com',
    })
    getExamAnalyticsMock.mockResolvedValue({
      averageAccuracyLabel: '83.3%',
      activeStudents: 2,
      commonErrorLabel: 'Q.01',
      scoreTrend: [{ label: 'Apr 9', scorePercent: 75 }],
      questionHeat: [
        {
          questionId: 'question-10',
          questionLabel: 'Q.10',
          questionStem: 'Which factors can help sustain collusion?',
          incorrectRateLabel: '100.0%',
          attempts: 3,
        },
      ],
    })
    listAdminExamsMock.mockResolvedValue([])

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<AdminDashboardPage />} />
        </Routes>
      </MemoryRouter>,
    )

    const scoreTrend = await screen.findByRole('heading', { name: 'Score Trend' })
    const questionHeat = screen.getByRole('heading', { name: 'Question Heat' })

    expect(
      scoreTrend.compareDocumentPosition(questionHeat) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(scoreTrend.closest('.analytics-stack')).toBe(questionHeat.closest('.analytics-stack'))
    expect(questionHeat.closest('.admin-panel')?.className).toContain('admin-panel--emphasis')
  })

  test('creates a new exam draft and opens its editor route', async () => {
    getAdminSessionMock.mockResolvedValue({
      email: 'admin@example.com',
    })
    getExamAnalyticsMock.mockResolvedValue({
      averageAccuracyLabel: '83.3%',
      activeStudents: 2,
      commonErrorLabel: 'Q.01',
      scoreTrend: [],
      questionHeat: [],
    })
    listAdminExamsMock.mockResolvedValue([])
    createExamDraftMock.mockResolvedValue({
      examId: 'exam-2',
      examTitle: 'Untitled Exam',
    })

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/exams/:examId" element={<div>Exam Editor Route</div>} />
        </Routes>
      </MemoryRouter>,
    )

    await screen.findByRole('button', { name: 'Create New Exam' })
    screen.getByRole('button', { name: 'Create New Exam' }).click()

    await waitFor(() => {
      expect(createExamDraftMock).toHaveBeenCalledTimes(1)
    })

    expect(await screen.findByText('Exam Editor Route')).toBeInTheDocument()
  })

  test('renders a browsable exam list in the content workspace', async () => {
    getAdminSessionMock.mockResolvedValue({
      email: 'admin@example.com',
    })
    getExamAnalyticsMock.mockResolvedValue({
      averageAccuracyLabel: '83.3%',
      activeStudents: 2,
      commonErrorLabel: 'Q.01',
      scoreTrend: [],
      questionHeat: [],
    })
    listAdminExamsMock.mockResolvedValue([
      {
        examId: 'exam-1',
        title: 'Microeconomics - Midterm Assessment',
        createdAt: '2026-04-08T18:00:00Z',
        statusLabel: 'Active',
      },
      {
        examId: 'exam-2',
        title: 'Game Theory - Problem Set 01',
        createdAt: '2026-04-09T18:00:00Z',
        statusLabel: 'Draft',
      },
    ])

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<AdminDashboardPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect((await screen.findAllByText('Game Theory - Problem Set 01'))[0]).toBeInTheDocument()
    expect(screen.getByText('Draft')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open Game Theory - Problem Set 01' })).toHaveAttribute(
      'href',
      '/admin/exams/exam-2',
    )
  })

  test('imports a JSON draft and opens the created exam editor route', async () => {
    getAdminSessionMock.mockResolvedValue({
      email: 'admin@example.com',
    })
    getExamAnalyticsMock.mockResolvedValue({
      averageAccuracyLabel: '83.3%',
      activeStudents: 2,
      commonErrorLabel: 'Q.01',
      scoreTrend: [],
      questionHeat: [],
    })
    listAdminExamsMock.mockResolvedValue([])
    importExamFromJsonMock.mockResolvedValue({
      examId: 'exam-imported',
      examTitle: 'Game Theory - Midterm Assessment',
      savedQuestionCount: 1,
    })

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/exams/:examId" element={<div>Imported Exam Route</div>} />
        </Routes>
      </MemoryRouter>,
    )

    const textarea = await screen.findByLabelText('JSON Payload')
    fireEvent.change(textarea, {
      target: {
        value:
          '{"exam_title":"Game Theory - Midterm Assessment","questions":[{"type":"text","stem":"Define Nash equilibrium.","correct_answer":["best response"],"explanation":"A Nash equilibrium is a profile of mutual best responses."}]}',
      },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Import JSON Draft' }))

    await waitFor(() => {
      expect(importExamFromJsonMock).toHaveBeenCalled()
    })

    expect(await screen.findByText('Imported Exam Route')).toBeInTheDocument()
  })
})
