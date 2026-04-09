/**
 * Module: admin login page
 * Responsibility: Render the credential form for admin portal access
 * Inputs/Outputs: No external props; submits credentials through the admin auth API and routes to the dashboard
 * Dependencies: Depends on React Router, the admin login API, and the shared admin styles
 * Notes: This page should stay small because session enforcement belongs in the protected admin route
 */

import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInAsAdmin } from '../api/adminLogin'
import '../../admin/styles.css'
import '../../shell/styles.css'

export function AdminLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Enter both admin email and password.')
      return
    }

    setPending(true)
    setErrorMessage(null)

    try {
      await signInAsAdmin({
        email: email.trim(),
        password,
      })
      navigate('/admin')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to sign in.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="admin-route-shell nexus-shell">
      <div className="background-blobs" aria-hidden="true">
        <div className="blob blob-primary" />
        <div className="blob blob-secondary" />
      </div>

      <main className="app-container">
        <section className="admin-auth-card">
          <span className="admin-auth-card__eyebrow">Restricted Workspace</span>
          <h1 className="admin-auth-card__title">Administrator Portal</h1>
          <p className="admin-auth-card__copy">
            Sign in with the protected instructor account to manage exams and analytics.
          </p>

          <form onSubmit={(event) => void handleSubmit(event)}>
            <label className="form-field">
              <span className="form-label">Admin Email</span>
              <input
                type="text"
                value={email}
                onChange={(event) => setEmail(event.currentTarget.value)}
              />
            </label>

            <label className="form-field">
              <span className="form-label">Admin Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.currentTarget.value)}
              />
            </label>

            {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

            <div className="button-row admin-auth-actions">
              <button className="btn" type="submit" disabled={pending}>
                {pending ? 'Signing In…' : 'Sign In'}
              </button>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => navigate('/')}
              >
                Return Home
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}
