/**
 * Module: question editor
 * Responsibility: Render the editable shell for a single question inside the admin exam editor
 * Inputs/Outputs: Accepts a normalized question snapshot and emits local draft updates
 * Dependencies: Depends on the shared admin styles
 * Notes: This component currently edits only local draft state; persistence will be added in a later slice
 */

import type { ChangeEvent } from 'react'
import type { EditableQuestionSnapshot } from '../api/examAdminApi'

interface QuestionEditorProps {
  question: EditableQuestionSnapshot
  onStemChange: (questionId: string, nextStem: string) => void
  onExplanationChange: (questionId: string, nextExplanation: string) => void
  onCorrectAnswerChange: (questionId: string, nextValues: string[]) => void
  onDeleteQuestion: (questionId: string) => void
  onOptionTextChange: (
    questionId: string,
    optionId: string,
    nextText: string,
  ) => void
  onAddOption: (questionId: string) => void
  onRemoveOption: (questionId: string, optionId: string) => void
}

export function QuestionEditor({
  question,
  onStemChange,
  onExplanationChange,
  onCorrectAnswerChange,
  onDeleteQuestion,
  onOptionTextChange,
  onAddOption,
  onRemoveOption,
}: QuestionEditorProps) {
  function handleStemChange(event: ChangeEvent<HTMLTextAreaElement>) {
    onStemChange(question.id, event.currentTarget.value)
  }

  function handleExplanationChange(event: ChangeEvent<HTMLTextAreaElement>) {
    onExplanationChange(question.id, event.currentTarget.value)
  }

  function handleTextAnswerChange(event: ChangeEvent<HTMLInputElement>) {
    const nextValues = event.currentTarget.value
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)

    onCorrectAnswerChange(question.id, nextValues)
  }

  function handleOptionSelection(optionId: string, checked: boolean) {
    if (question.type === 'radio') {
      onCorrectAnswerChange(question.id, checked ? [optionId] : [])
      return
    }

    const nextValues = checked
      ? [...question.correctAnswerValues, optionId]
      : question.correctAnswerValues.filter((value) => value !== optionId)

    onCorrectAnswerChange(question.id, nextValues)
  }

  return (
    <article className="admin-panel question-editor">
      <div className="question-editor__header">
        <div>
          <div className="analytics-table__label">{question.questionLabel}</div>
          <div className="question-editor__type">{question.type}</div>
        </div>
        <button
          className="btn btn-secondary btn-small"
          type="button"
          onClick={() => onDeleteQuestion(question.id)}
        >
          Delete {question.questionLabel}
        </button>
      </div>

      <label className="form-field">
        <span className="form-label">Question Stem</span>
        <textarea
          className="text-area"
          value={question.stem}
          onChange={handleStemChange}
        />
      </label>

      <label className="form-field">
        <span className="form-label">Explanation</span>
        <textarea
          className="text-area question-editor__explanation"
          value={question.explanation}
          onChange={handleExplanationChange}
        />
      </label>

      {question.options.length > 0 ? (
        <div className="question-editor__options">
          {question.options.map((option) => (
            <div className="question-editor__option" key={option.id}>
              <input
                aria-label={`Correct option ${option.id}`}
                checked={question.correctAnswerValues.includes(option.id)}
                name={`correct-answer-${question.id}`}
                type={question.type === 'radio' ? 'radio' : 'checkbox'}
                onChange={(event) =>
                  handleOptionSelection(option.id, event.currentTarget.checked)
                }
              />
              <span className="question-editor__option-id">{option.id}</span>
              <input
                aria-label={`Option text ${option.id}`}
                className="question-editor__option-input"
                type="text"
                value={option.text}
                onChange={(event) =>
                  onOptionTextChange(question.id, option.id, event.currentTarget.value)
                }
              />
              <button
                className="btn btn-secondary btn-small"
                type="button"
                onClick={() => onRemoveOption(question.id, option.id)}
              >
                Remove Option {option.id}
              </button>
            </div>
          ))}
          <div className="button-row">
            <button
              className="btn btn-secondary btn-small"
              type="button"
              onClick={() => onAddOption(question.id)}
            >
              Add Option {question.questionLabel}
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="admin-panel__copy">
            Text questions do not use fixed answer options.
          </p>
          <label className="form-field">
            <span className="form-label">Accepted Answers</span>
            <input
              type="text"
              value={question.correctAnswerValues.join(', ')}
              onChange={handleTextAnswerChange}
            />
          </label>
        </>
      )}
    </article>
  )
}
