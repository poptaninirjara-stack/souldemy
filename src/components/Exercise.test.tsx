import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppStateProvider } from '../state/AppState'
import { Exercise } from './Exercise'

const props = {
  id: 'test-ex',
  title: 'Exercise 1',
  promptHtml: '<p>Label each text.</p>',
  answerHtml: '<p><strong>Answer key</strong> (a) Journalistic.</p>',
  labelsHtml: ['<em>(Invented for practice.)</em>'],
}

const setup = () =>
  render(
    <AppStateProvider>
      <Exercise {...props} />
    </AppStateProvider>,
  )

describe('Exercise', () => {
  it('keeps the model answer hidden and the reveal disabled until there is an attempt', () => {
    setup()
    const reveal = screen.getByRole('button', { name: 'Show model answer' })
    expect(reveal).toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(reveal)
    expect(screen.queryByText(/Journalistic/)).not.toBeInTheDocument()
  })

  it('does not unlock for whitespace only', () => {
    setup()
    fireEvent.change(screen.getByLabelText('Your answer'), { target: { value: '   ' } })
    expect(screen.getByRole('button', { name: 'Show model answer' })).toHaveAttribute('aria-disabled', 'true')
  })

  it('reveals the answer in place after an attempt and moves focus to it', () => {
    setup()
    fireEvent.change(screen.getByLabelText('Your answer'), { target: { value: 'my attempt' } })
    const reveal = screen.getByRole('button', { name: 'Show model answer' })
    expect(reveal).toHaveAttribute('aria-disabled', 'false')
    fireEvent.click(reveal)
    const answer = screen.getByRole('region', { name: /Model answer/ })
    expect(answer).toHaveTextContent('Journalistic')
    expect(answer).toHaveFocus()
  })

  it('always shows practice labels next to the exercise', () => {
    setup()
    expect(screen.getByText('(Invented for practice.)')).toBeVisible()
  })

  it('stores the attempt on the device', () => {
    setup()
    fireEvent.change(screen.getByLabelText('Your answer'), { target: { value: 'saved text' } })
    expect(localStorage.getItem('english-app:v1:attempts')).toContain('saved text')
  })
})
