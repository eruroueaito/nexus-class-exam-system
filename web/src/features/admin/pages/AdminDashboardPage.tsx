/**
 * Module: admin dashboard page
 * Responsibility: Enforce the admin session requirement and render the first authenticated admin shell
 * Inputs/Outputs: No external props; redirects unauthenticated users and renders the dashboard placeholder for admins
 * Dependencies: Depends on React Router, the admin auth API, and the shared admin layout
 * Notes: Analytics and editing tools will be added inside this page in later phases
 */

import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { AdminLayout } from '../components/AdminLayout'
import { AiSyncPanel } from '../components/AiSyncPanel'
import { QuestionHeatTable } from '../components/QuestionHeatTable'
import { ScoreTrendChart } from '../components/ScoreTrendChart'
import { getExamAnalytics, type AdminAnalyticsSnapshot } from '../api/analyticsApi'
import {
  FALLBACK_EXAM_ID,
  createExamDraft,
  importExamFromJson,
  listAdminExams,
  type AdminExamListItem,
} from '../api/examAdminApi'
import { getAdminSession, signOutAdmin, type AdminSessionSummary } from '../../auth/api/adminLogin'
import '../styles.css'
import '../../shell/styles.css'

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const [session, setSession] = useState<AdminSessionSummary | null | undefined>(undefined)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<AdminAnalyticsSnapshot | null>(null)
  const [adminExams, setAdminExams] = useState<AdminExamListItem[]>([])
  const [isCreatingExam, setIsCreatingExam] = useState(false)

  useEffect(() => {
    let isActive = true

    void getAdminSession()
      .then((nextSession) => {
        if (isActive) {
          setSession(nextSession)
        }
      })
      .catch((error) => {
        if (isActive) {
          setErrorMessage(
            error instanceof Error ? error.message : 'Unable to load the admin session.',
          )
          setSession(null)
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

    void getExamAnalytics()
      .then((nextAnalytics) => {
        if (isActive) {
          setAnalytics(nextAnalytics)
        }
      })
      .catch((error) => {
        if (isActive) {
          setErrorMessage(
            error instanceof Error ? error.message : 'Unable to load dashboard analytics.',
          )
        }
      })

    return () => {
      isActive = false
    }
  }, [session])

  useEffect(() => {
    if (!session) {
      return
    }

    let isActive = true

    void listAdminExams()
      .then((nextExams) => {
        if (isActive) {
          setAdminExams(nextExams)
        }
      })
      .catch((error) => {
        if (isActive) {
          setErrorMessage(
            error instanceof Error ? error.message : 'Unable to load the exam workspace.',
          )
        }
      })

    return () => {
      isActive = false
    }
  }, [session])

  async function handleSignOut() {
    await signOutAdmin()
    navigate('/admin/login')
  }

  async function handleCreateExam() {
    if (isCreatingExam) {
      return
    }

    setErrorMessage(null)
    setIsCreatingExam(true)

    try {
      const createdExam = await createExamDraft()
      navigate(`/admin/exams/${createdExam.examId}`)
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to create a new exam draft.',
      )
    } finally {
      setIsCreatingExam(false)
    }
  }

  async function handleImportExam(rawJson: string) {
    const importedExam = await importExamFromJson(rawJson)
    navigate(`/admin/exams/${importedExam.examId}`)
  }

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
            <h1 className="admin-auth-card__title">Loading Admin Session</h1>
            <p className="admin-auth-card__copy">
              Verifying the current admin session before opening the protected tools.
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
      {analytics ? (
        <>
          <section className="stat-grid admin-stat-grid">
            <article className="stat-item">
              <div className="stat-value">{analytics.averageAccuracyLabel}</div>
              <div className="stat-label">Average Accuracy</div>
            </article>
            <article className="stat-item">
              <div className="stat-value">{analytics.activeStudents}</div>
              <div className="stat-label">Active Students</div>
            </article>
            <article className="stat-item">
              <div className="stat-value">{analytics.commonErrorLabel}</div>
              <div className="stat-label">Common Error</div>
            </article>
          </section>

          <section className="analytics-grid">
            <ScoreTrendChart points={analytics.scoreTrend} />
            <QuestionHeatTable rows={analytics.questionHeat} />
          </section>

          <section className="admin-panel">
            <h2 className="admin-panel__title">Content Workspace</h2>
            <p className="admin-panel__copy">
              Browse the current exam drafts and open any editor workspace directly.
            </p>
            <div className="button-row admin-auth-actions">
              <button className="btn btn-secondary" type="button" disabled={isCreatingExam} onClick={() => void handleCreateExam()}>
                {isCreatingExam ? 'Creating…' : 'Create New Exam'}
              </button>
              <Link className="btn" to={`/admin/exams/${FALLBACK_EXAM_ID}`}>
                Open Exam Editor
              </Link>
            </div>
            <div className="admin-exam-list">
              {adminExams.map((exam) => (
                <article key={exam.examId} className="admin-exam-list__item">
                  <div>
                    <div className="admin-exam-list__title">{exam.title}</div>
                    <div className="admin-exam-list__meta">{exam.statusLabel}</div>
                  </div>
                  <Link className="btn btn-secondary btn-small" to={`/admin/exams/${exam.examId}`}>
                    Open {exam.title}
                  </Link>
                </article>
              ))}
            </div>
          </section>

          <AiSyncPanel onImport={handleImportExam} />
        </>
      ) : (
        <section className="admin-panel">
          <h2 className="admin-panel__title">Loading Analytics</h2>
          <p className="admin-panel__copy">
            Preparing the first dashboard read model for the admin workspace.
          </p>
        </section>
      )}

      {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
    </AdminLayout>
  )
}
