export type AnswerValue = string | string[]

export interface ExamCatalogItem {
  id: string
  title: string
  created_at: string
  is_active: boolean
}

export interface ExamQuestion {
  id: string
  type: 'radio' | 'checkbox' | 'text'
  content: Record<string, unknown>
}

export interface StartExamRequest {
  examId: string
  userName: string
  accessPassword: string
}

export interface StartExamResponse {
  exam: {
    id: string
    title: string
  }
  user_name?: string
  questions: ExamQuestion[]
}

export interface SubmitExamRequest {
  examId: string
  userName: string
  duration: number
  answers: Record<string, AnswerValue>
}

export interface SubmitExamResponse {
  submission_id: string
  exam: {
    id: string
    title: string
  }
  score: number
  correct_count: number
  total_count: number
  items: Array<Record<string, unknown>>
}

interface ExamApiOptions {
  baseUrl: string
  anonKey?: string
  fetchImpl?: typeof fetch
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return (await response.json()) as T
}

export function createExamApi({
  baseUrl,
  anonKey,
  fetchImpl = fetch,
}: ExamApiOptions) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (anonKey) {
    headers.apikey = anonKey
    headers.Authorization = `Bearer ${anonKey}`
  }

  return {
    async listExamCatalog() {
      const response = await fetchImpl(
        `${baseUrl}/rest/v1/exam_catalog?select=id,title,created_at,is_active&order=created_at.desc`,
        {
          method: 'GET',
          headers,
        },
      )

      return parseJsonResponse<ExamCatalogItem[]>(response)
    },

    async startExam(payload: StartExamRequest) {
      const response = await fetchImpl(`${baseUrl}/functions/v1/start-exam`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          exam_id: payload.examId,
          user_name: payload.userName,
          access_password: payload.accessPassword,
        }),
      })

      return parseJsonResponse<StartExamResponse>(response)
    },

    async submitExam(payload: SubmitExamRequest) {
      const response = await fetchImpl(`${baseUrl}/functions/v1/submit-exam`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          exam_id: payload.examId,
          user_name: payload.userName,
          duration: payload.duration,
          answers: payload.answers,
        }),
      })

      return parseJsonResponse<SubmitExamResponse>(response)
    },
  }
}
