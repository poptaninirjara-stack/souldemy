import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppStateProvider } from '../state/AppState'
import type { QuizItem } from '../types/content'
import { Quiz } from './Quiz'

const items: QuizItem[] = [
  {
    id: 'q1',
    questionHtml: 'Which task word asks for a judgement?',
    optionsHtml: ['Describe', 'Evaluate', 'Outline'],
    correctIndex: 1,
    explanationHtml: 'Evaluate requires a verdict.',
  },
  { id: 'q2', questionHtml: 'Second?', optionsHtml: ['Yes', 'No'], correctIndex: 0, explanationHtml: '' },
]

const setup = () =>
  render(
    <AppStateProvider>
      <Quiz title="Quiz" items={items} />
    </AppStateProvider>,
  )

const firstItem = () => screen.getAllByRole('listitem')[0]

describe('Quiz', () => {
  it('needs a selection before checking', () => {
    setup()
    const check = within(firstItem()).getByRole('button', { name: 'Check answer' })
    expect(check).toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(check)
    expect(within(firstItem()).getByRole('status')).toBeEmptyDOMElement()
  })

  it('gives immediate feedback with words, allows retry, and then accepts the right answer', () => {
    setup()
    const item = firstItem()
    fireEvent.click(within(item).getByRole('radio', { name: /Describe/ }))
    fireEvent.click(within(item).getByRole('button', { name: 'Check answer' }))
    expect(within(item).getByRole('status')).toHaveTextContent('Incorrect.')
    expect(within(item).getByText('Your answer')).toBeInTheDocument()

    fireEvent.click(within(item).getByRole('button', { name: 'Try again' }))
    expect(within(item).getByRole('status')).toBeEmptyDOMElement()

    fireEvent.click(within(item).getByRole('radio', { name: /Evaluate/ }))
    fireEvent.click(within(item).getByRole('button', { name: 'Check answer' }))
    expect(within(item).getByRole('status')).toHaveTextContent('Correct.Evaluate requires a verdict.')
    expect(within(item).queryByRole('button', { name: 'Check answer' })).not.toBeInTheDocument()
    expect(screen.getByText('1 of 2 correct so far.')).toBeInTheDocument()
  })

  it('can show the answer after a wrong try, without counting it as correct', () => {
    setup()
    const item = firstItem()
    fireEvent.click(within(item).getByRole('radio', { name: /Outline/ }))
    fireEvent.click(within(item).getByRole('button', { name: 'Check answer' }))
    fireEvent.click(within(item).getByRole('button', { name: 'Show answer' }))
    expect(within(item).getByRole('status')).toHaveTextContent('Answer shown.The answer is B.')
    expect(screen.getByText('0 of 2 correct so far.')).toBeInTheDocument()
  })

  it('moves selection with arrow keys (radio group)', () => {
    setup()
    const item = firstItem()
    const [a, b] = within(item).getAllByRole('radio')
    a.focus()
    fireEvent.keyDown(a, { key: 'ArrowDown' })
    expect(b).toHaveAttribute('aria-checked', 'true')
    expect(b).toHaveFocus()
  })

  it('has no timer, score or ranking text', () => {
    setup()
    expect(document.body.textContent).not.toMatch(/points|rank|leaderboard|seconds|time left/i)
  })
})
