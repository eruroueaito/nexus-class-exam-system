/**
 * Module: AI sync panel
 * Responsibility: Capture a pasted JSON payload and submit it into the admin import flow
 * Inputs/Outputs: Accepts a submit callback and reports local pending/error state through the UI
 * Dependencies: Depends on React state and shared admin styles
 * Notes: The payload format is validated upstream by the admin import API helpers
 */

import { useState } from 'react'

interface AiSyncPanelProps {
  onImport: (rawJson: string) => Promise<void>
}

const defaultPayload = `{
  "exam_title": "Game Theory - Midterm Assessment",
  "questions": [
    {
      "type": "radio",
      "stem": "What is a dominant strategy?",
      "points": 10,
      "options": [
        { "id": "A", "text": "A weak response" },
        { "id": "B", "text": "A best response for every opponent action" }
      ],
      "correct_answer": ["B"],
      "explanation": "A dominant strategy is optimal regardless of the opponent action."
    }
  ]
}`

export function AiSyncPanel({ onImport }: AiSyncPanelProps) {
  const [payload, setPayload] = useState(defaultPayload)
  const [isImporting, setIsImporting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleImport() {
    if (isImporting) {
      return
    }

    setIsImporting(true)
    setMessage(null)
    setErrorMessage(null)

    try {
      await onImport(payload)
      setMessage('Import complete.')
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to import the JSON payload.',
      )
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <section className="admin-panel ai-sync-panel">
      <h2 className="admin-panel__title">AI JSON Import</h2>
      <p className="admin-panel__copy">
        Paste a normalized exam JSON payload to create a new draft exam automatically.
        Each question supports <code style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.06)', borderRadius: '0.25rem', padding: '0.1em 0.35em' }}>points</code> for weighted scoring.
        Supported types: <code style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.06)', borderRadius: '0.25rem', padding: '0.1em 0.35em' }}>radio</code>, <code style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.06)', borderRadius: '0.25rem', padding: '0.1em 0.35em' }}>checkbox</code>, <code style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.06)', borderRadius: '0.25rem', padding: '0.1em 0.35em' }}>text</code>.
      </p>
      <label className="form-field">
        <span className="form-label">JSON Payload</span>
        <textarea
          className="text-area ai-sync-panel__textarea"
          value={payload}
          onChange={(event) => setPayload(event.currentTarget.value)}
        />
      </label>
      <div className="button-row">
        <button className="btn" type="button" disabled={isImporting} onClick={() => void handleImport()}>
          {isImporting ? 'Importing…' : 'Import JSON Draft'}
        </button>
      </div>
      {message ? <p className="form-success">{message}</p> : null}
      {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
    </section>
  )
}
