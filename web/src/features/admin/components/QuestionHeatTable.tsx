/**
 * Module: question heat table
 * Responsibility: Render the highest-friction questions for the admin dashboard
 * Inputs/Outputs: Accepts normalized question heat rows and returns an expandable analytics surface
 * Dependencies: Depends on React state and shared admin styles
 * Notes: Drill-down cards reveal the original prompt, wrong-student answers, and option-level selection distribution
 */

import { Fragment, useMemo, useState } from 'react'
import type { QuestionHeatRow } from '../api/analyticsApi'

interface QuestionHeatTableProps {
  rows: QuestionHeatRow[]
}

export function QuestionHeatTable({ rows }: QuestionHeatTableProps) {
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null)
  const [selectedStudentByQuestion, setSelectedStudentByQuestion] = useState<Record<string, string>>(
    {},
  )

  function toggleDrillDown(questionId: string) {
    setExpandedQuestionId((prev) => (prev === questionId ? null : questionId))
  }

  const selectedStudents = useMemo(() => selectedStudentByQuestion, [selectedStudentByQuestion])

  return (
    <section className="admin-panel admin-panel--emphasis">
      <h2 className="admin-panel__title">Question Heat</h2>
      {rows.length === 0 ? (
        <p className="admin-panel__copy">Question-level analytics will appear after the first submissions.</p>
      ) : (
        <div className="analytics-table analytics-table--rich">
          <div className="analytics-table__head">
            <span>Question</span>
            <span>Incorrect Rate</span>
            <span>Attempts</span>
          </div>
          {rows.map((row) => {
            const hasWrongStudents = (row.wrongStudents?.length ?? 0) > 0
            const hasOptionBreakdown = (row.optionBreakdown?.length ?? 0) > 0
            const canExpand = hasWrongStudents || hasOptionBreakdown
            const isExpanded = expandedQuestionId === row.questionId
            const selectedStudent =
              row.wrongStudents?.find(
                (student) =>
                  student.submissionId ===
                  (selectedStudents[row.questionId] ?? row.wrongStudents?.[0]?.submissionId),
              ) ?? row.wrongStudents?.[0]

            return (
              <Fragment key={row.questionId}>
                <div
                  className={`analytics-table__row analytics-table__row--card ${
                    canExpand ? 'analytics-table__row--clickable' : ''
                  }`}
                  onClick={canExpand ? () => toggleDrillDown(row.questionId) : undefined}
                  title={canExpand ? 'Click to inspect the response breakdown' : undefined}
                >
                  <div>
                    <div className="analytics-table__label">{row.questionLabel}</div>
                    <div className="analytics-table__stem">{row.questionStem}</div>
                  </div>
                  <span>{row.incorrectRateLabel}</span>
                  <span>{row.attempts}{canExpand ? (isExpanded ? ' ▲' : ' ▼') : ''}</span>
                </div>
                {isExpanded ? (
                  <section className="analytics-drill-down analytics-drill-down--rich">
                    <div className="analytics-drill-down__grid">
                      <article className="analytics-drill-card">
                        <span className="analytics-drill-down__label">Original Prompt</span>
                        <p className="analytics-drill-card__copy">{row.questionStem}</p>
                      </article>

                      <article className="analytics-drill-card">
                        <span className="analytics-drill-down__label">Incorrect Responses</span>
                        {row.wrongStudents && row.wrongStudents.length > 0 ? (
                          <>
                            <div className="analytics-student-pills">
                              {row.wrongStudents.map((student) => (
                                <button
                                  key={`${row.questionId}-${student.submissionId}`}
                                  className={`analytics-student-pill ${
                                    selectedStudent?.submissionId === student.submissionId
                                      ? 'analytics-student-pill--active'
                                      : ''
                                  }`}
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    setSelectedStudentByQuestion((prev) => ({
                                      ...prev,
                                      [row.questionId]: student.submissionId,
                                    }))
                                  }}
                                >
                                  {student.name}
                                </button>
                              ))}
                            </div>
                            {selectedStudent ? (
                              <div className="analytics-student-answer">
                                <span className="analytics-drill-down__label">
                                  Student: {selectedStudent.name}
                                </span>
                                <p className="analytics-drill-card__copy analytics-drill-card__copy--strong">
                                  Selected Answer
                                </p>
                                <p className="analytics-drill-card__copy">
                                  {selectedStudent.answerDisplay || selectedStudent.answerLabel}
                                </p>
                              </div>
                            ) : null}
                          </>
                        ) : (
                          <p className="admin-panel__copy">No incorrect responses were recorded.</p>
                        )}
                      </article>
                    </div>

                    {row.questionType !== 'text' && row.optionBreakdown && row.optionBreakdown.length > 0 ? (
                      <article className="analytics-drill-card analytics-drill-card--wide">
                        <span className="analytics-drill-down__label">Option Distribution</span>
                        <div className="analytics-option-list">
                          {row.optionBreakdown.map((option) => (
                            <div className="analytics-option-row" key={`${row.questionId}-${option.optionId}`}>
                              <div className="analytics-option-row__copy">
                                <div className="analytics-option-row__label">
                                  {option.optionId}
                                </div>
                                <div className="analytics-option-row__text">
                                  {option.optionText}
                                </div>
                              </div>
                              <div className="analytics-option-row__stats">
                                <span>{option.selectedCount} students</span>
                                <span>{option.selectedRateLabel}</span>
                              </div>
                              <div className="analytics-option-row__bar">
                                <div
                                  className="analytics-option-row__fill"
                                  style={{ width: option.selectedRateLabel }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </article>
                    ) : null}
                  </section>
                ) : null}
              </Fragment>
            )
          })}
        </div>
      )}
    </section>
  )
}
