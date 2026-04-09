export type QuestionType = 'radio' | 'checkbox' | 'text'

export interface ExamCatalogItem {
  id: string
  title: string
  createdAt: string
  isActive: boolean
}

export interface ExamQuestionContent {
  stem?: string
  options?: Array<{ id: string; text: string }>
  media?: string[]
  hint?: string | null
  points?: number
}

export interface ExamQuestion {
  id: string
  type: QuestionType
  content: ExamQuestionContent
}
