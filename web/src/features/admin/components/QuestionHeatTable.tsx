/**
 * Module: question heat table
 * Responsibility: Render the highest-friction questions for the admin dashboard
 * Inputs/Outputs: Accepts normalized question heat rows and returns a compact table or empty state
 * Dependencies: Depends on the shared admin styles
 * Notes: The table uses labels and rates instead of raw booleans so the dashboard stays readable at a glance
 */

import type { QuestionHeatRow } from '../api/analyticsApi'

interface QuestionHeatTableProps {
  rows: QuestionHeatRow[]
}

export function QuestionHeatTable({ rows }: QuestionHeatTableProps) {
  return (
    <section className="admin-panel">
      <h2 className="admin-panel__title">Question Heat</h2>
      {rows.length === 0 ? (
        <p className="admin-panel__copy">Question-level analytics will appear after the first submissions.</p>
      ) : (
        <div className="analytics-table">
          <div className="analytics-table__head">
            <span>Question</span>
            <span>Incorrect Rate</span>
            <span>Attempts</span>
          </div>
          {rows.map((row) => (
            <div className="analytics-table__row" key={row.questionId}>
              <div>
                <div className="analytics-table__label">{row.questionLabel}</div>
                <div className="analytics-table__stem">{row.questionStem}</div>
              </div>
              <span>{row.incorrectRateLabel}</span>
              <span>{row.attempts}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
