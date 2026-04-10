/**
 * Module: exam editor page
 * Responsibility: Enforce the admin session and render the first exam editor workspace
 * Inputs/Outputs: No external props; loads an exam snapshot based on the route parameter
 * Dependencies: Depends on React Router, admin auth helpers, the exam admin API, and the shared admin layout
 * Notes: This slice focuses on read and local draft editing only; persistence will follow in a later phase
 */

import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { getAdminSession, signOutAdmin, type AdminSessionSummary } from '../../auth/api/adminLogin'
import { AdminLayout } from '../components/AdminLayout'
import { QuestionEditor } from '../components/QuestionEditor'
import {
  deleteExamDraft,
  FALLBACK_EXAM_ID,
  createDraftQuestion,
  getExamEditorData,
  relabelQuestions,
  saveExamEditorData,
  type ExamEditorSnapshot,
} from '../api/examAdminApi'
import '../styles.css'
import '../../shell/styles.css'

export function ExamEditorPage() {
  const navigate = useNavigate()
  const { examId = FALLBACK_EXAM_ID } = useParams()
  const [session, setSession] = useState<AdminSessionSummary | null | undefined>(undefined)
  const [editorData, setEditorData] = useState<ExamEditorSnapshot | null>(null)
  const [savedEditorData, setSavedEditorData] = useState<ExamEditorSnapshot | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeletingExam, setIsDeletingExam] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    void getAdminSession().then((nextSession) => {
      if (isActive) {
        setSession(nextSession)
      }
    })

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    if (!session) {
      return
    }

    let isActive = true

    void getExamEditorData(examId).then((nextData) => {
      if (isActive) {
        setEditorData(nextData)
        setSavedEditorData(nextData)
      }
    })

    return () => {
      isActive = false
    }
  }, [examId, session])

  async function handleSignOut() {
    await signOutAdmin()
    navigate('/admin/login')
  }

  function handleStemChange(questionId: string, nextStem: string) {
    setSaveMessage(null)
    setErrorMessage(null)
    setEditorData((currentData) => {
      if (!currentData) {
        return currentData
      }

      return {
        ...currentData,
        questions: currentData.questions.map((question) =>
          question.id === questionId
            ? {
                ...question,
                stem: nextStem,
              }
            : question,
        ),
      }
    })
  }

  function handleExplanationChange(questionId: string, nextExplanation: string) {
    setSaveMessage(null)
    setErrorMessage(null)
    setEditorData((currentData) => {
      if (!currentData) {
        return currentData
      }

      return {
        ...currentData,
        questions: currentData.questions.map((question) =>
          question.id === questionId
            ? {
                ...question,
                explanation: nextExplanation,
              }
            : question,
        ),
      }
    })
  }

  function handleAccessPasswordChange(nextPassword: string) {
    setSaveMessage(null)
    setErrorMessage(null)
    setEditorData((currentData) => {
      if (!currentData) {
        return currentData
      }

      return {
        ...currentData,
        accessPasswordDraft: nextPassword,
      }
    })
  }

  function handleCorrectAnswerChange(questionId: string, nextValues: string[]) {
    setSaveMessage(null)
    setErrorMessage(null)
    setEditorData((currentData) => {
      if (!currentData) {
        return currentData
      }

      return {
        ...currentData,
        questions: currentData.questions.map((question) =>
          question.id === questionId
            ? {
                ...question,
                correctAnswerValues: nextValues,
              }
            : question,
        ),
      }
    })
  }

  function handleAddQuestion(type: 'radio' | 'checkbox' | 'text') {
    setSaveMessage(null)
    setErrorMessage(null)
    setEditorData((currentData) => {
      if (!currentData) {
        return currentData
      }

      return {
        ...currentData,
        questions: relabelQuestions([...currentData.questions, createDraftQuestion(type)]),
      }
    })
  }

  function handleOptionTextChange(
    questionId: string,
    optionId: string,
    nextText: string,
  ) {
    setSaveMessage(null)
    setErrorMessage(null)
    setEditorData((currentData) => {
      if (!currentData) {
        return currentData
      }

      return {
        ...currentData,
        questions: currentData.questions.map((question) =>
          question.id === questionId
            ? {
                ...question,
                options: question.options.map((option) =>
                  option.id === optionId
                    ? {
                        ...option,
                        text: nextText,
                      }
                    : option,
                ),
              }
            : question,
        ),
      }
    })
  }

  function handleAddOption(questionId: string) {
    setSaveMessage(null)
    setErrorMessage(null)
    setEditorData((currentData) => {
      if (!currentData) {
        return currentData
      }

      return {
        ...currentData,
        questions: currentData.questions.map((question) => {
          if (question.id !== questionId || question.type === 'text') {
            return question
          }

          const nextId = String.fromCharCode(65 + question.options.length)
          return {
            ...question,
            options: [
              ...question.options,
              {
                id: nextId,
                text: `Option ${nextId}`,
              },
            ],
          }
        }),
      }
    })
  }

  function handleRemoveOption(questionId: string, optionId: string) {
    setSaveMessage(null)
    setErrorMessage(null)
    setEditorData((currentData) => {
      if (!currentData) {
        return currentData
      }

      return {
        ...currentData,
        questions: currentData.questions.map((question) => {
          if (question.id !== questionId || question.type === 'text') {
            return question
          }

          return {
            ...question,
            options: question.options.filter((option) => option.id !== optionId),
            correctAnswerValues: question.correctAnswerValues.filter(
              (value) => value !== optionId,
            ),
          }
        }),
      }
    })
  }

  function handleDeleteQuestion(questionId: string) {
    setSaveMessage(null)
    setErrorMessage(null)
    setEditorData((currentData) => {
      if (!currentData) {
        return currentData
      }

      return {
        ...currentData,
        questions: relabelQuestions(
          currentData.questions.filter((question) => question.id !== questionId),
        ),
      }
    })
  }

  async function handleSaveDraft() {
    if (!editorData || isSaving) {
      return
    }

    setIsSaving(true)
    setSaveMessage(null)
    setErrorMessage(null)

    try {
      const result = await saveExamEditorData(editorData)
      const nextSnapshot = {
        ...editorData,
        examId: result.examId,
        examTitle: result.examTitle,
        examStatusLabel: editorData.isPublished ? 'Active' : 'Draft',
        hasAccessPasswordConfigured:
          editorData.hasAccessPasswordConfigured || Boolean(editorData.accessPasswordDraft.trim()),
        accessPasswordDraft: '',
      }

      setEditorData(nextSnapshot)
      setSavedEditorData(nextSnapshot)
      setSaveMessage('Changes saved.')
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to save the current draft.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleTogglePublish() {
    if (!editorData || isSaving) {
      return
    }

    setIsSaving(true)
    setSaveMessage(null)
    setErrorMessage(null)

    const nextPublishedState = !editorData.isPublished
    const nextSnapshot = {
      ...editorData,
      isPublished: nextPublishedState,
      examStatusLabel: nextPublishedState ? 'Active' : 'Draft',
    }

    try {
      const result = await saveExamEditorData(nextSnapshot)
      const savedSnapshot = {
        ...nextSnapshot,
        examId: result.examId,
        examTitle: result.examTitle,
        hasAccessPasswordConfigured:
          nextSnapshot.hasAccessPasswordConfigured ||
          Boolean(nextSnapshot.accessPasswordDraft.trim()),
        accessPasswordDraft: '',
      }

      setEditorData(savedSnapshot)
      setSavedEditorData(savedSnapshot)
      setSaveMessage(nextPublishedState ? 'Exam published.' : 'Exam moved back to draft.')
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to update the publish status.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteExam() {
    if (isDeletingExam) {
      return
    }

    setSaveMessage(null)
    setErrorMessage(null)
    setIsDeletingExam(true)

    try {
      await deleteExamDraft(examId)
      navigate('/admin')
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to delete the current exam draft.',
      )
      setIsDeletingExam(false)
    }
  }

  const isDirty =
    editorData !== null &&
    savedEditorData !== null &&
    JSON.stringify(editorData) !== JSON.stringify(savedEditorData)

  if (session === undefined) {
    return (
      <div className="admin-route-shell nexus-shell">
        <div className="background-blobs" aria-hidden="true">
          <div className="blob blob-primary" />
          <div className="blob blob-secondary" />
        </div>
        <main className="app-container">
          <section className="admin-auth-card">
            <span className="admin-auth-card__eyebrow">Restricted Workspace</span>
            <h1 className="admin-auth-card__title">Loading Editor</h1>
            <p className="admin-auth-card__copy">
              Verifying the admin session before loading the exam draft.
            </p>
          </section>
        </main>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/admin/login" replace />
  }

  return (
    <AdminLayout adminEmail={session.email} onSignOut={() => void handleSignOut()}>
      {editorData ? (
        <section className="editor-grid">
          <section className="admin-panel">
            <div className="editor-back-row">
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => navigate('/admin')}
              >
                ← Back to Dashboard
              </button>
            </div>
            <h2 className="admin-panel__title">Question Editor</h2>
              <label className="form-field">
                <span className="form-label">Exam Title</span>
                <input
                  type="text"
                value={editorData.examTitle}
                onChange={(event) => {
                  setSaveMessage(null)
                  setErrorMessage(null)
                  setEditorData({
                    ...editorData,
                    examTitle: event.currentTarget.value,
                  })
                }}
                />
              </label>
              <label className="form-field">
                <span className="form-label">Rotate Assignment Access Password</span>
                <input
                  aria-label="Rotate Assignment Access Password"
                  type="password"
                  value={editorData.accessPasswordDraft}
                  placeholder="Leave blank to keep the current password"
                  onChange={(event) => handleAccessPasswordChange(event.currentTarget.value)}
                />
              </label>
              <p className="admin-panel__copy">
                Password protection: {editorData.hasAccessPasswordConfigured ? 'Configured' : 'Missing'}.
                Enter a new password and save to rotate it. The current plaintext password is never shown again after hashing.
              </p>
              <p className="admin-panel__copy">
                Status: {editorData.examStatusLabel} • {editorData.questions.length} questions
              </p>
            <div className="button-row editor-creation-row">
              <button className="btn btn-secondary btn-small" type="button" onClick={() => handleAddQuestion('radio')}>
                Add Radio Question
              </button>
              <button className="btn btn-secondary btn-small" type="button" onClick={() => handleAddQuestion('checkbox')}>
                Add Checkbox Question
              </button>
              <button className="btn btn-secondary btn-small" type="button" onClick={() => handleAddQuestion('text')}>
                Add Text Question
              </button>
            </div>
            <div className="button-row editor-toolbar">
              <button
                className="btn"
                type="button"
                disabled={!isDirty || isSaving}
                onClick={() => void handleSaveDraft()}
              >
                {isSaving ? 'Saving…' : 'Save Draft'}
              </button>
              <button
                className="btn btn-secondary"
                type="button"
                disabled={isSaving}
                onClick={() => void handleTogglePublish()}
              >
                {editorData.isPublished ? 'Unpublish Exam' : 'Publish Exam'}
              </button>
              <button
                className="btn btn-secondary"
                type="button"
                disabled={isDeletingExam}
                onClick={() => void handleDeleteExam()}
              >
                {isDeletingExam ? 'Deleting…' : 'Delete Exam'}
              </button>
              <span className="editor-toolbar__status">
                {isDirty ? 'Unsaved changes' : 'Draft is synced'}
              </span>
            </div>
            {saveMessage ? <p className="form-success">{saveMessage}</p> : null}
            {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
          </section>

          <section className="editor-question-list">
            {editorData.questions.map((question) => (
              <QuestionEditor
                key={question.id}
                question={question}
                onStemChange={handleStemChange}
                onExplanationChange={handleExplanationChange}
                onCorrectAnswerChange={handleCorrectAnswerChange}
                onDeleteQuestion={handleDeleteQuestion}
                onOptionTextChange={handleOptionTextChange}
                onAddOption={handleAddOption}
                onRemoveOption={handleRemoveOption}
              />
            ))}
          </section>
        </section>
      ) : (
        <section className="admin-panel">
          <h2 className="admin-panel__title">Loading Exam Draft</h2>
          <p className="admin-panel__copy">
            Preparing the first exam editor workspace.
          </p>
        </section>
      )}
    </AdminLayout>
  )
}
