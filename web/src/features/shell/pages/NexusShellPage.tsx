/**
 * Module: Nexus shell page
 * Responsibility: Render the prototype-aligned student and admin shell, including the live student exam flow
 * Inputs/Outputs: No external props; returns the routed shell page
 * Dependencies: Depends on React state, the exam catalog hook, and the browser exam API factory
 * Notes: The student flow keeps a local prototype fallback so the UI remains usable before runtime env values are configured
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createBrowserExamApi } from '../../../lib/exam-api'
import type { ExamQuestionContent, QuestionType } from '../../exams/types'
import { useExamCatalog } from '../../exams/hooks/useExamCatalog'
import '../../shell/styles.css'

type ViewId = 'exam-list' | 'quiz' | 'result' | 'admin'
type AnswerValue = string | string[]

interface StartedExam {
  exam: {
    id: string
    title: string
  }
  userName: string
  questions: ExamQuestionRecord[]
  startedAt: number
}

interface ExamQuestionRecord {
  id: string
  type: QuestionType
  content: ExamQuestionContent
}

interface ResultItem {
  question_id: string
  user_answer: AnswerValue | null
  correct_answer: AnswerValue | string | null
  is_correct: boolean
  explanation: string
}

interface ExamResult {
  exam: {
    id: string
    title: string
  }
  score: number
  correct_count: number
  total_count: number
  items: ResultItem[]
}

interface ResultMetric {
  label: string
  value: string
}

const progressByView: Record<ViewId, number> = {
  'exam-list': 35,
  quiz: 70,
  result: 92,
  admin: 100,
}

function getProgressPercent(
  view: ViewId,
  activeExam: StartedExam | null,
  currentQuestionIndex: number,
) {
  if (view !== 'quiz' || !activeExam || activeExam.questions.length === 0) {
    return progressByView[view]
  }

  return ((currentQuestionIndex + 1) / activeExam.questions.length) * 100
}

const prototypeExamSession: StartedExam = {
  exam: {
    id: 'prototype-microeconomics-midterm',
    title: 'Microeconomics - Midterm Assessment',
  },
  userName: 'Prototype Student',
  startedAt: 0,
  questions: [
    {
      id: 'prototype-question-1',
      type: 'radio',
      content: {
        stem: 'Which of the following best describes the concept of "Opportunity Cost"?',
        options: [
          {
            id: 'A',
            text: 'The actual out-of-pocket monetary expenses.',
          },
          {
            id: 'B',
            text: 'The value of the next best alternative foregone.',
          },
        ],
      },
    },
  ],
}

const prototypeResult: ExamResult = {
  exam: prototypeExamSession.exam,
  score: 0.92,
  correct_count: 11,
  total_count: 12,
  items: [
    {
      question_id: 'prototype-question-1',
      user_answer: ['B'],
      correct_answer: ['B'],
      is_correct: true,
      explanation:
        'Opportunity cost is the value of the next best alternative that is given up.',
    },
  ],
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function normalizeQuestion(question: {
  id: string
  type: QuestionType
  content: unknown
}): ExamQuestionRecord {
  return {
    id: question.id,
    type: question.type,
    content: question.content as ExamQuestionContent,
  }
}

function formatAnswerValue(value: AnswerValue | string | null) {
  if (value === null || value === undefined) {
    return 'No response'
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : 'No response'
  }

  return String(value).trim() || 'No response'
}

function buildPrototypeResult(answers: Record<string, AnswerValue>): ExamResult {
  const selectedAnswer = answers['prototype-question-1'] ?? []
  const isCorrect =
    Array.isArray(selectedAnswer) &&
    selectedAnswer.length === 1 &&
    selectedAnswer[0] === 'B'

  return {
    ...prototypeResult,
    score: isCorrect ? 1 : 0,
    correct_count: isCorrect ? 1 : 0,
    total_count: 1,
    items: [
      {
        question_id: 'prototype-question-1',
        user_answer: selectedAnswer,
        correct_answer: ['B'],
        is_correct: isCorrect,
        explanation:
          'Opportunity cost is the value of the next best alternative that is given up.',
      },
    ],
  }
}


export function NexusShellPage() {
  const navigate = useNavigate()
  const examApi = createBrowserExamApi()
  const examCatalogQuery = useExamCatalog()
  const [view, setView] = useState<ViewId>('exam-list')
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null)
  const [userName, setUserName] = useState('')
  const [accessPassword, setAccessPassword] = useState('')
  const [accessError, setAccessError] = useState<string | null>(null)
  const [accessPending, setAccessPending] = useState(false)
  const [activeExam, setActiveExam] = useState<StartedExam | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({})
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [submitPending, setSubmitPending] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [result, setResult] = useState<ExamResult | null>(null)
  const questionDisplayedAt = useRef<number | null>(null)
  const [questionTimings, setQuestionTimings] = useState<Record<string, number>>({})

  const availableExams = examCatalogQuery.data ?? []
  const selectedExam = availableExams.find((exam) => exam.id === selectedExamId) ?? null
  const activeCatalogExams = availableExams.filter((exam) => exam.isActive)
  const inactiveCatalogExams = availableExams.filter((exam) => !exam.isActive)

  const activeQuestion = activeExam?.questions[currentQuestionIndex] ?? null
  const progressLabel = activeExam
    ? `Question ${String(currentQuestionIndex + 1).padStart(2, '0')} / ${String(
        activeExam.questions.length,
      ).padStart(2, '0')}`
    : 'Question 00 / 00'
  const progressPercent = getProgressPercent(view, activeExam, currentQuestionIndex)

  const scorePercent = result ? `${Math.round(result.score * 100)}%` : null

  const resultSummary = useMemo(() => {
    if (!result) {
      return null
    }

    return `${result.correct_count} of ${result.total_count} answers were correct.`
  }, [result])

  const resultMetrics = useMemo<ResultMetric[]>(() => {
    if (!result) {
      return []
    }

    return [
      {
        label: 'Accuracy',
        value: `${Math.round(result.score * 100)}%`,
      },
      {
        label: 'Correct Answers',
        value: `${result.correct_count} / ${result.total_count}`,
      },
      {
        label: 'Duration',
        value: formatDuration(elapsedSeconds),
      },
    ]
  }, [elapsedSeconds, result])

  const shouldShowProgressBar = view !== 'exam-list'

  useEffect(() => {
    if (!activeExam || view !== 'quiz') {
      return
    }

    const tick = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - activeExam.startedAt) / 1000)))
    }

    tick()
    const intervalId = window.setInterval(tick, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [activeExam, view])

  function flushCurrentQuestionTiming(exam: StartedExam, questionIndex: number) {
    if (questionDisplayedAt.current === null) {
      return
    }
    const question = exam.questions[questionIndex]
    if (!question) {
      return
    }
    const elapsed = Math.max(0, Math.floor((Date.now() - questionDisplayedAt.current) / 1000))
    setQuestionTimings((prev) => ({
      ...prev,
      [question.id]: (prev[question.id] ?? 0) + elapsed,
    }))
    questionDisplayedAt.current = Date.now()
  }

  function resetStudentFlow(nextView: ViewId = 'exam-list') {
    setView(nextView)
    setSelectedExamId(null)
    setUserName('')
    setAccessPassword('')
    setAccessError(null)
    setAccessPending(false)
    setActiveExam(null)
    setCurrentQuestionIndex(0)
    setAnswers({})
    setElapsedSeconds(0)
    setSubmitPending(false)
    setSubmitError(null)
    setResult(null)
    setQuestionTimings({})
    questionDisplayedAt.current = null
  }

  function openAccessForm(examId: string) {
    setSelectedExamId(examId)
    setUserName('')
    setAccessPassword('')
    setAccessError(null)
  }

  function updateAnswer(questionId: string, questionType: QuestionType, value: string) {
    setAnswers((currentAnswers) => {
      if (questionType === 'checkbox') {
        const existing = Array.isArray(currentAnswers[questionId])
          ? [...currentAnswers[questionId]]
          : []
        const nextValue = existing.includes(value)
          ? existing.filter((item) => item !== value)
          : [...existing, value]

        return {
          ...currentAnswers,
          [questionId]: nextValue,
        }
      }

      if (questionType === 'text') {
        return {
          ...currentAnswers,
          [questionId]: value,
        }
      }

      return {
        ...currentAnswers,
        [questionId]: [value],
      }
    })
  }

  async function handleStartExam() {
    if (!selectedExam) {
      setAccessError('Select an assignment before continuing.')
      return
    }

    if (!accessPassword.trim()) {
      setAccessError('Enter the access password to continue.')
      return
    }

    setAccessPending(true)
    setAccessError(null)
    setSubmitError(null)

    try {
      const response = examApi
        ? await examApi.startExam({
            examId: selectedExam.id,
            userName: userName.trim(),
            accessPassword: accessPassword.trim(),
          })
        : {
            exam: prototypeExamSession.exam,
            user_name: userName.trim() || 'Guest Student',
            questions: prototypeExamSession.questions,
          }

      const nextExam: StartedExam = {
        exam: response.exam,
        userName: response.user_name ?? 'Guest Student',
        questions: response.questions.map(normalizeQuestion),
        startedAt: Date.now(),
      }

      setActiveExam(nextExam)
      setAnswers({})
      setCurrentQuestionIndex(0)
      setElapsedSeconds(0)
      setResult(null)
      setQuestionTimings({})
      questionDisplayedAt.current = Date.now()
      setView('quiz')
    } catch (error) {
      setAccessError(
        error instanceof Error ? error.message : 'Unable to start the selected assignment.',
      )
    } finally {
      setAccessPending(false)
    }
  }

  async function handleSubmitExam() {
    if (!activeExam) {
      return
    }

    flushCurrentQuestionTiming(activeExam, currentQuestionIndex)
    setSubmitPending(true)
    setSubmitError(null)

    try {
      const response = examApi
        ? await examApi.submitExam({
            examId: activeExam.exam.id,
            userName: activeExam.userName,
            duration: elapsedSeconds,
            answers,
          })
        : buildPrototypeResult(answers)

      setResult({
        exam: response.exam,
        score: response.score,
        correct_count: response.correct_count,
        total_count: response.total_count,
        items: response.items as ResultItem[],
      })
      setView('result')
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Unable to submit the current assignment.',
      )
    } finally {
      setSubmitPending(false)
    }
  }

  function renderQuestionOptions(question: ExamQuestionRecord) {
    const options = question.content.options ?? []

    if (question.type === 'text') {
      return (
        <label className="text-answer-field">
          <span className="form-label">Your Response</span>
          <textarea
            className="text-area"
            value={typeof answers[question.id] === 'string' ? answers[question.id] : ''}
            onChange={(event) =>
              updateAnswer(question.id, question.type, event.currentTarget.value)
            }
          />
        </label>
      )
    }

    return (
      <div className="option-list">
        {options.map((option) => {
          const selectedValues = Array.isArray(answers[question.id]) ? answers[question.id] : []
          const isChecked = selectedValues.includes(option.id)
          const inputType = question.type === 'checkbox' ? 'checkbox' : 'radio'

          return (
            <label
              key={option.id}
              className={`option-card ${isChecked ? 'option-card--selected' : ''}`}
            >
              <input
                checked={isChecked}
                name={question.id}
                type={inputType}
                onChange={() => updateAnswer(question.id, question.type, option.id)}
              />
              <span>{option.text}</span>
            </label>
          )
        })}
      </div>
    )
  }

  return (
    <div className="nexus-shell">
      <div className="background-blobs" aria-hidden="true">
        <div className="blob blob-primary" />
        <div className="blob blob-secondary" />
      </div>

      <main className="app-container">
        <div className="glass-panel">
          {shouldShowProgressBar ? (
            <div className="progress-bar" aria-hidden="true">
              <div
                className="progress-inner"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          ) : null}

          <section
            className={`view-section ${view === 'exam-list' ? 'active' : ''}`}
            aria-hidden={view !== 'exam-list'}
          >
            <button
              className="btn btn-ghost admin-entry"
              type="button"
              onClick={() => navigate('/admin/login')}
            >
              Administrator Portal
            </button>
            <h2 className="section-title">Available Assignments</h2>
            <div className="scroll-area">
              {examCatalogQuery.isFetching ? (
                <div className="quiz-card quiz-card--disabled">
                  <span className="quiz-card__title">Loading assignments…</span>
                  <span className="quiz-card__meta">
                    Fetching the public exam catalog.
                  </span>
                </div>
              ) : null}

              {activeCatalogExams.map((exam) => (
                <button
                  key={exam.id}
                  className={`quiz-card ${selectedExamId === exam.id ? 'quiz-card--active' : ''}`}
                  type="button"
                  onClick={() => openAccessForm(exam.id)}
                >
                  <span className="quiz-card__title">{exam.title}</span>
                  <span className="quiz-card__meta">
                    Live catalog entry • Password Protected
                  </span>
                </button>
              ))}

              {inactiveCatalogExams.map((exam) => (
                <div key={exam.id} className="quiz-card quiz-card--disabled">
                  <span className="quiz-card__title">{exam.title}</span>
                  <span className="quiz-card__meta">
                    Not yet released by instructor
                  </span>
                </div>
              ))}

              {examCatalogQuery.isError ? (
                <div className="quiz-card quiz-card--disabled">
                  <span className="quiz-card__title">
                    Unable to refresh assignments
                  </span>
                  <span className="quiz-card__meta">
                    Showing the local prototype catalog instead.
                  </span>
                </div>
              ) : null}
            </div>
          </section>
          {view === 'exam-list' && selectedExam ? (
            <div className="access-modal-overlay" role="presentation">
              <section
                className="access-panel access-modal"
                role="dialog"
                aria-modal="true"
                aria-label="Assignment Access"
              >
                <div className="access-panel__header">
                  <span className="quiz-label">Assignment Access</span>
                  <span className="quiz-card__meta">{selectedExam.title}</span>
                </div>
                <label className="form-field">
                  <span className="form-label">Your Name</span>
                  <input
                    type="text"
                    value={userName}
                    onChange={(event) => setUserName(event.currentTarget.value)}
                  />
                </label>
                <label className="form-field">
                  <span className="form-label">Access Password</span>
                  <input
                    type="password"
                    value={accessPassword}
                    onChange={(event) => setAccessPassword(event.currentTarget.value)}
                  />
                </label>
                {accessError ? <p className="form-error">{accessError}</p> : null}
                <div className="button-row access-actions">
                  <button
                    className="btn"
                    type="button"
                    disabled={accessPending}
                    onClick={() => void handleStartExam()}
                  >
                    {accessPending ? 'Starting…' : 'Start Assignment'}
                  </button>
                  <button
                    className="btn btn-ghost"
                    type="button"
                    onClick={() => setSelectedExamId(null)}
                  >
                    Cancel
                  </button>
                </div>
              </section>
            </div>
          ) : null}

          <section
            className={`view-section ${view === 'quiz' ? 'active' : ''}`}
            aria-hidden={view !== 'quiz'}
          >
            <header className="quiz-header">
              <span className="quiz-label">{progressLabel}</span>
              <span className="quiz-timer">{formatDuration(elapsedSeconds)}</span>
            </header>
            <div className="quiz-body">
              <div className="question-header">
                <p className="question-copy">
                  {activeQuestion?.content.stem ?? 'The current question is unavailable.'}
                </p>
                {activeQuestion?.content.points !== undefined ? (
                  <span className="question-points">{activeQuestion.content.points} pts</span>
                ) : null}
              </div>
              {activeQuestion ? renderQuestionOptions(activeQuestion) : null}
            </div>
            <div className="quiz-actions quiz-actions--between">
              <button
                className="btn btn-ghost"
                type="button"
                disabled={currentQuestionIndex === 0}
                onClick={() => {
                  if (activeExam) flushCurrentQuestionTiming(activeExam, currentQuestionIndex)
                  setCurrentQuestionIndex((currentIndex) => Math.max(0, currentIndex - 1))
                }}
              >
                Previous Question
              </button>
              <div className="button-row">
                {activeExam && currentQuestionIndex < activeExam.questions.length - 1 ? (
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => {
                      if (activeExam) flushCurrentQuestionTiming(activeExam, currentQuestionIndex)
                      setCurrentQuestionIndex((currentIndex) =>
                        Math.min(activeExam.questions.length - 1, currentIndex + 1),
                      )
                    }}
                  >
                    Next Question
                  </button>
                ) : null}
                <button
                  className="btn"
                  type="button"
                  disabled={submitPending}
                  onClick={() => void handleSubmitExam()}
                >
                  {submitPending ? 'Submitting…' : 'Submit Assignment'}
                </button>
              </div>
            </div>
            {submitError ? <p className="form-error quiz-submit-error">{submitError}</p> : null}
          </section>

          <section
            className={`view-section view-section--result ${view === 'result' ? 'active' : ''}`}
            aria-hidden={view !== 'result'}
          >
            <header className="result-header">
              <div>
                <span className="quiz-label">Submission Complete</span>
                <h2 className="section-title result-title">Score Summary</h2>
              </div>
              <div className="result-score">{scorePercent}</div>
            </header>
            <p className="hero-copy result-summary">
              {resultSummary ?? 'The latest submission summary is unavailable.'}
            </p>
            <div className="result-body">
              <section className="stat-grid result-stat-grid">
                {resultMetrics.map((metric) => (
                  <article className="stat-item" key={metric.label}>
                    <div className="stat-value">{metric.value}</div>
                    <div className="stat-label">{metric.label}</div>
                  </article>
                ))}
              </section>
              <section className="result-overview-card">
                <div className="result-overview-card__header">
                  <div>
                    <span className="quiz-label">Performance Overview</span>
                    <h3 className="result-overview-card__title">{result?.exam.title}</h3>
                  </div>
                  <div className="result-overview-card__score">{scorePercent}</div>
                </div>
                <p className="result-overview-card__copy">
                  Review each response below. Incorrect answers include the expected answer and explanation so students can use the page as a post-assignment study sheet.
                </p>
              </section>
              <div className="result-scroll-shell" data-testid="result-scroll-shell">
                <div className="scroll-area result-list">
                  {result?.items.map((item, index) => {
                    const question = activeExam?.questions.find((q) => q.id === item.question_id)
                    const timingSeconds = questionTimings[item.question_id] ?? 0
                    return (
                      <article className="result-card" key={item.question_id}>
                        <div className="result-card__header">
                          <span className="quiz-label">
                            Question {String(index + 1).padStart(2, '0')}
                          </span>
                          <div className="result-card__meta">
                            {question?.content.points !== undefined ? (
                              <span className="result-card__points">
                                {item.is_correct ? question.content.points : 0} / {question.content.points} pts
                              </span>
                            ) : null}
                            <span
                              className={`result-badge ${
                                item.is_correct ? 'result-badge--correct' : 'result-badge--incorrect'
                              }`}
                            >
                              {item.is_correct ? 'Correct' : 'Review'}
                            </span>
                          </div>
                        </div>
                        <div className="result-card__timing">
                          Time: {formatDuration(timingSeconds)}
                        </div>
                        <p className="result-card__prompt">
                          {question?.content.stem ?? 'Question prompt unavailable.'}
                        </p>
                        <dl className="result-card__details">
                          <div className="result-card__detail">
                            <dt>Your Answer</dt>
                            <dd>{formatAnswerValue(item.user_answer)}</dd>
                          </div>
                          <div className="result-card__detail">
                            <dt>Correct Answer</dt>
                            <dd>{formatAnswerValue(item.correct_answer)}</dd>
                          </div>
                        </dl>
                        <p className="result-explanation">{item.explanation}</p>
                      </article>
                    )
                  })}
                </div>
              </div>
              <div className="quiz-actions">
                <button
                  className="btn"
                  type="button"
                  onClick={() => resetStudentFlow('exam-list')}
                >
                  Return to Assignments
                </button>
              </div>
            </div>
          </section>

          <section
            className={`view-section ${view === 'admin' ? 'active' : ''}`}
            aria-hidden={view !== 'admin'}
          >
            <header className="admin-header">
              <h2 className="section-title">Admin Console</h2>
              <div className="button-row admin-actions">
                <button className="btn btn-secondary btn-small" type="button">
                  Export HTML Report
                </button>
                <button
                  className="btn btn-small"
                  type="button"
                  onClick={() => resetStudentFlow('exam-list')}
                >
                  Sign Out
                </button>
              </div>
            </header>

            <div className="stat-grid">
              <article className="stat-item">
                <div className="stat-value">88.4%</div>
                <div className="stat-label">Avg. Accuracy</div>
              </article>
              <article className="stat-item">
                <div className="stat-value">24</div>
                <div className="stat-label">Active Students</div>
              </article>
              <article className="stat-item">
                <div className="stat-value">Q.07</div>
                <div className="stat-label">Common Error</div>
              </article>
            </div>

            <section className="ai-interface">
              <div className="ai-interface__label">
                AI SYNC AGENT INTERFACE (RESTRICTED)
              </div>
              <div className="ai-interface__code">
                <span className="ai-interface__method">GET</span>{' '}
                /api/v1/exam/id_001/sync
                <br />
                <span className="ai-interface__status">
                  {`{ "status": "ready", "rules": "strict_decoupling" }`}
                </span>
              </div>
              <p className="ai-interface__note">
                AI Instructions: Generate questions in JSONB format with explicit
                explanation strings for each answer key.
              </p>
            </section>
          </section>
        </div>
      </main>
    </div>
  )
}
