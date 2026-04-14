import { describe, expect, it } from 'vitest'

import { parseExamBundle } from '../src/lib/schema'
import { renderBundlePreview } from '../src/lib/preview'

describe('bundle preview', () => {
  it('renders the exam title, counts, and publish target', () => {
    const bundle = parseExamBundle({
      version: 1,
      exam: {
        slug: 'game-theory-quiz-01',
        title: 'Game Theory - Quiz 01',
        language: 'en',
        topic: 'game theory',
        access_password: '123',
        publish: true,
        randomize_questions: true,
        randomize_options: false,
        time_limit_minutes: 15,
      },
      questions: [
        {
          id: 'q01',
          type: 'radio',
          stem: 'What is a dominant strategy?',
          options: [
            { id: 'A', text: 'A strategy that is never chosen' },
            { id: 'B', text: 'A strategy that yields a higher payoff regardless of the opponent action' },
          ],
          correct_answer: ['B'],
          explanation:
            'A dominant strategy yields a better payoff than alternatives regardless of what the other player does.',
          points: 1,
        },
        {
          id: 'q02',
          type: 'text',
          stem: 'Define Nash equilibrium.',
          correct_answer: ['no player can improve by deviating alone'],
          explanation:
            'A Nash equilibrium is a profile in which no player can gain from unilateral deviation.',
          points: 1,
        },
      ],
    })

    const preview = renderBundlePreview(bundle)

    expect(preview).toContain('Game Theory - Quiz 01')
    expect(preview).toContain('Question count: 2')
    expect(preview).toContain('Publish target: yes')
    expect(preview).toContain('radio: 1')
    expect(preview).toContain('text: 1')
  })
})
