import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { QuestionHeatTable } from './QuestionHeatTable'

describe('QuestionHeatTable', () => {
  test('expands a heated question into the original prompt, option breakdown, and wrong-student answers', () => {
    render(
      <QuestionHeatTable
        rows={[
          {
            questionId: 'question-1',
            questionLabel: 'Q.01',
            questionStem: 'In a normal-form game, what is a dominant strategy?',
            questionType: 'radio',
            incorrectRateLabel: '100.0%',
            attempts: 4,
            wrongStudents: [
              {
                submissionId: 'submission-1',
                name: 'Alice',
                answerLabel: 'A',
              },
              {
                submissionId: 'submission-2',
                name: 'David',
                answerLabel: 'C',
              },
            ],
            optionBreakdown: [
              {
                optionId: 'A',
                optionText: 'A strategy that yields the highest payoff regardless of the opponent.',
                selectedCount: 2,
                selectedRateLabel: '50.0%',
              },
              {
                optionId: 'B',
                optionText: 'A strategy chosen only in mixed equilibrium.',
                selectedCount: 1,
                selectedRateLabel: '25.0%',
              },
            ],
          },
        ]}
      />,
    )

    fireEvent.click(screen.getByText('In a normal-form game, what is a dominant strategy?'))

    expect(screen.getByText('Original Prompt')).toBeInTheDocument()
    expect(screen.getByText('Incorrect Responses')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Alice' })).toBeInTheDocument()
    expect(screen.getByText('Selected Answer')).toBeInTheDocument()
    expect(screen.getByText('A strategy that yields the highest payoff regardless of the opponent.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'David' }))

    expect(screen.getByText('Student: David')).toBeInTheDocument()
    expect(screen.getByText('C')).toBeInTheDocument()
    expect(screen.getByText('50.0%')).toBeInTheDocument()
  })
})
