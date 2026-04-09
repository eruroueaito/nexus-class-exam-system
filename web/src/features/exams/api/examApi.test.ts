import { describe, expect, test, vi } from 'vitest'
import {
  createExamApi,
  type StartExamRequest,
  type SubmitExamRequest,
} from './examApi'

describe('examApi', () => {
  test('lists the public exam catalog from the catalog endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 'exam-1',
          title: 'Microeconomics',
          created_at: '2026-04-09T18:00:00Z',
          is_active: true,
        },
      ],
    })

    const api = createExamApi({
      baseUrl: 'https://example.supabase.co',
      fetchImpl: fetchMock,
    })

    const result = await api.listExamCatalog()

    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.supabase.co/rest/v1/exam_catalog?select=id,title,created_at,is_active&order=created_at.desc',
      expect.objectContaining({
        method: 'GET',
      }),
    )
    expect(result).toHaveLength(1)
    expect(result[0]?.title).toBe('Microeconomics')
  })

  test('posts the start exam payload to the function endpoint', async () => {
    const payload: StartExamRequest = {
      examId: 'exam-1',
      userName: 'Alice',
      accessPassword: '123456',
    }
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        exam: { id: 'exam-1', title: 'Microeconomics' },
        questions: [],
      }),
    })

    const api = createExamApi({
      baseUrl: 'https://example.supabase.co',
      fetchImpl: fetchMock,
    })

    await api.startExam(payload)

    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.supabase.co/functions/v1/start-exam',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          exam_id: 'exam-1',
          user_name: 'Alice',
          access_password: '123456',
        }),
      }),
    )
  })

  test('posts the submit exam payload to the function endpoint', async () => {
    const payload: SubmitExamRequest = {
      examId: 'exam-1',
      userName: 'Alice',
      duration: 120,
      answers: {
        'question-1': ['A'],
      },
    }
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        submission_id: 'submission-1',
        score: 1,
        correct_count: 1,
        total_count: 1,
        items: [],
      }),
    })

    const api = createExamApi({
      baseUrl: 'https://example.supabase.co',
      fetchImpl: fetchMock,
    })

    await api.submitExam(payload)

    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.supabase.co/functions/v1/submit-exam',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          exam_id: 'exam-1',
          user_name: 'Alice',
          duration: 120,
          answers: {
            'question-1': ['A'],
          },
        }),
      }),
    )
  })
})
