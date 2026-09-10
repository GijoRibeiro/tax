import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { PersonaColumn } from './PersonaColumn'
import { PERSONAS } from './personas'

const msg = (role: 'interviewer' | 'persona', text: string, id = text) => ({ id, role, text, at: '2026-09-05T10:00:00.000Z' })

test('typing a question and pressing Enter asks and clears the composer', () => {
  const onAsk = vi.fn()
  render(<PersonaColumn persona={PERSONAS.amara} messages={[]} pending={null} online onAsk={onAsk} onReset={() => {}} />)
  const input = screen.getByLabelText('Ask Betina') as HTMLInputElement
  fireEvent.change(input, { target: { value: 'How did you hear about us?' } })
  fireEvent.submit(input.closest('form')!)
  expect(onAsk).toHaveBeenCalledWith('How did you hear about us?')
  expect(input.value).toBe('')
})

test('a pending question shows the typing indicator naming the persona', () => {
  const pending = msg('interviewer', 'Why now?')
  render(<PersonaColumn persona={PERSONAS.anna} messages={[pending]} pending={pending} online onAsk={() => {}} onReset={() => {}} />)
  expect(screen.getByRole('status')).toHaveTextContent('Anna is typing…')
})

test('messages render on the right side for the interviewer and left for the persona', () => {
  render(
    <PersonaColumn
      persona={PERSONAS.anna}
      messages={[msg('interviewer', 'Busy?'), msg('persona', 'Always in July.')]}
      pending={null}
      online
      onAsk={() => {}}
      onReset={() => {}}
    />,
  )
  expect(screen.getByText('Busy?').closest('.sh-msg')).toHaveClass('sh-msg--interviewer')
  expect(screen.getByText('Always in July.').closest('.sh-msg')).toHaveClass('sh-msg--persona')
})

test('Reset calls onReset', () => {
  const onReset = vi.fn()
  render(<PersonaColumn persona={PERSONAS.amara} messages={[]} pending={null} online onAsk={() => {}} onReset={onReset} />)
  fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
  expect(onReset).toHaveBeenCalled()
})
