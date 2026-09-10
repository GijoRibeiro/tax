import { render, screen, fireEvent } from '@testing-library/react'
import { Dialog } from './Dialog'

function setup(overrides: Partial<Parameters<typeof Dialog>[0]> = {}) {
  const onClose = vi.fn()
  const onConfirm = vi.fn()
  const utils = render(
    <Dialog
      open
      title="Delete template?"
      confirmLabel="Delete"
      onConfirm={onConfirm}
      onClose={onClose}
      {...overrides}
    >
      <p>This can't be undone.</p>
    </Dialog>,
  )
  return { ...utils, onClose, onConfirm }
}

test('renders nothing when closed', () => {
  render(
    <Dialog open={false} title="Delete template?" confirmLabel="Delete" onConfirm={vi.fn()} onClose={vi.fn()}>
      <p>Body</p>
    </Dialog>,
  )
  expect(screen.queryByText('Delete template?')).not.toBeInTheDocument()
})

test('renders title and children when open', () => {
  setup()
  expect(screen.getByText('Delete template?')).toBeInTheDocument()
  expect(screen.getByText("This can't be undone.")).toBeInTheDocument()
})

test('confirm button is focused on open', () => {
  setup()
  expect(screen.getByText('Delete')).toHaveFocus()
})

test('Escape key closes the dialog', () => {
  const { onClose } = setup()
  fireEvent.keyDown(window, { key: 'Escape' })
  expect(onClose).toHaveBeenCalledTimes(1)
})

test('clicking the backdrop closes the dialog', () => {
  const { onClose, container } = setup()
  const backdrop = container.querySelector('.tf-dialog-backdrop') as HTMLElement
  fireEvent.click(backdrop)
  expect(onClose).toHaveBeenCalledTimes(1)
})

test('clicking inside the panel does not close the dialog', () => {
  const { onClose } = setup()
  fireEvent.click(screen.getByText("This can't be undone."))
  expect(onClose).not.toHaveBeenCalled()
})

test('clicking confirm calls onConfirm', () => {
  const { onConfirm } = setup()
  fireEvent.click(screen.getByText('Delete'))
  expect(onConfirm).toHaveBeenCalledTimes(1)
})

test('danger tone applies the danger class to the confirm button', () => {
  setup({ tone: 'danger' })
  expect(screen.getByText('Delete')).toHaveClass('tf-button--danger')
})

test('default tone applies the primary class to the confirm button', () => {
  setup()
  expect(screen.getByText('Delete')).toHaveClass('tf-button--primary')
})
