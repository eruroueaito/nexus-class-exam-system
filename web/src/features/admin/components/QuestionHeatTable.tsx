/**
 * Module: question heat table
 * Responsibility: Render the highest-friction questions for the admin dashboard
 * Inputs/Outputs: Accepts normalized question heat rows and returns a compact table or empty state
 * Dependencies: Depends on React state and shared admin styles
 * Notes: Rows with wrong student data can be clicked to reveal a drill-down of which students answered incorrectly
 */

import { Fragment, useState } from 'react'
import type { QuestionHeatRow } from '../api/analyticsApi'

interface QuestionHeatTableProps {
  rows: QuestionHeatRow[]
}

export function QuestionHeatTable({ rows }: QuestionHeatTableProps) {
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null)

  function toggleDrillDown(questionId: string) {
    setExpandedQuestionId((prev) => (prev === questionId ? null : questionId))
  }

  return (
    <section className="admin-panel admin-panel--emphasis">
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
          {rows.map((row) => {
            const hasWrongStudents = (row.wrongStudents?.length ?? 0) > 0
            const isExpanded = expandedQuestionId === row.questionId

            return (
              <Fragment key={row.questionId}>
                <div
                  className={`analytics-table__row ${hasWrongStudents ? 'analytics-table__row--clickable' : ''}`}
                  onClick={hasWrongStudents ? () => toggleDrillDown(row.questionId) : undefined}
                  title={hasWrongStudents ? 'Click to see which students answered incorrectly' : undefined}
                >
                  <div>
                    <div className="analytics-table__label">{row.questionLabel}</div>
                    <div className="analytics-table__stem">{row.questionStem}</div>
                  </div>
                  <span>{row.incorrectRateLabel}</span>
                  <span>{row.attempts}{hasWrongStudents ? (isExpanded ? ' ▲' : ' ▼') : ''}</span>
                </div>
                {isExpanded && hasWrongStudents ? (
                  <div className="analytics-drill-down">
                    <span className="analytics-drill-down__label">Incorrect answers from:</span>
                    <ul className="analytics-drill-down__list">
                      {row.wrongStudents!.map((name) => (
                        <li key={name}>{name}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </Fragment>
            )
          })}
        </div>
      )}
    </section>
  )
}
