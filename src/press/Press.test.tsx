import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { Press } from './Press'
import { SLIDES } from './slides'
import { RUN_ORDER } from './Press'

test('renders slide 1 title', () => {
  render(<Press />)
  expect(screen.getByText(SLIDES[0].title)).toBeInTheDocument()
})

test('ArrowRight advances to slide 2', () => {
  render(<Press />)
  fireEvent.keyDown(window, { key: 'ArrowRight' })
  expect(screen.getByText(SLIDES[1].title)).toBeInTheDocument()
})

test('Escape shows overview grid with every slide, parked ones tagged', () => {
  render(<Press />)
  fireEvent.keyDown(window, { key: 'Escape' })
  // Local-only slides (a gitignored file on the presenter's machine) are not counted.
  expect(SLIDES.filter(s => !s.localOnly)).toHaveLength(17)
  expect(RUN_ORDER.filter(s => !s.localOnly)).toHaveLength(13)
  for (const slide of SLIDES) {
    expect(screen.getByText(slide.title)).toBeInTheDocument()
  }
  expect(screen.getAllByText('parked')).toHaveLength(4)
})

test('parked slide is not in the arrow/dots running order but opens from the overview', () => {
  render(<Press />)
  const parked = SLIDES.find(s => s.id === 'stakeholders-live')!
  fireEvent.keyDown(window, { key: 'ArrowRight', repeat: true })
  for (let i = 0; i < SLIDES.length + 2; i++) fireEvent.keyDown(window, { key: 'ArrowRight' })
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(RUN_ORDER.at(-1)!.title)
  expect(screen.queryByText(parked.title)).not.toBeInTheDocument()
  fireEvent.keyDown(window, { key: 'Escape' })
  fireEvent.click(screen.getByText(parked.title))
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(parked.title)
  expect(screen.getByTitle('Stakeholder interviews')).toHaveAttribute('src', '/stakeholders?embed=1')
})

test('S opens the stakeholder interviews in a new tab', () => {
  const open = vi.spyOn(window, 'open').mockImplementation(() => null)
  render(<Press />)
  fireEvent.keyDown(window, { key: 's' })
  fireEvent.keyDown(window, { key: 's', repeat: true })
  fireEvent.keyDown(window, { key: 's', repeat: true })
  expect(open).toHaveBeenCalledTimes(1)
  expect(open).toHaveBeenCalledWith('/stakeholders', 'taxfix-stakeholders')
  open.mockRestore()
})

test('stakeholders slide shows both personas with portraits and a quote', () => {
  render(<Press />)
  fireEvent.keyDown(window, { key: 'ArrowRight' })
  fireEvent.keyDown(window, { key: 'ArrowRight' })
  fireEvent.keyDown(window, { key: 'ArrowRight' })
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Talking to both sides')
  expect(screen.getByText('Betina Bugnotto')).toBeInTheDocument()
  expect(screen.getByText('Anna Weber')).toBeInTheDocument()
  expect(screen.getByText(/chasing page two/)).toBeInTheDocument()
})

test('page dots: one per slide, the current one marked, and they follow the keyboard', () => {
  render(<Press />)
  const total = RUN_ORDER.length
  const dots = screen.getAllByRole('button', { name: new RegExp(`^Slide \\d+ of ${total}:`) })
  expect(dots).toHaveLength(total)
  expect(dots[0]).toHaveAttribute('aria-current', 'step')
  fireEvent.keyDown(window, { key: 'ArrowRight' })
  expect(dots[0]).not.toHaveAttribute('aria-current')
  expect(dots[1]).toHaveAttribute('aria-current', 'step')
})

test('presenter notes and cues are not rendered on the slide itself', () => {
  const { container } = render(<Press />)
  const slide = () => container.querySelector('.press-slide')!
  expect(slide()).not.toHaveTextContent(SLIDES[0].talk![0])
  expect(container.querySelector('.press-presenter')).toHaveAttribute('aria-hidden', 'true')
  fireEvent.keyDown(window, { key: 'ArrowRight' })
  expect(slide()).not.toHaveTextContent(SLIDES[1].talk![0])
})

test('title slide lists the three moments from the brief with the hand-off marked as chosen', () => {
  render(<Press />)
  const items = screen.getAllByRole('listitem')
  expect(items.map(li => li.querySelector('.press-moment__label')!.textContent)).toEqual([
    'The "do I even need to file?" moment',
    'The commitment moment',
    'The hand-off moment',
  ])
  expect(items[2]).toHaveAttribute('aria-current', 'true')
  expect(items[2]).toHaveTextContent(/The user has signed up/)
  expect(items[0]).not.toHaveTextContent(/The user has signed up/)
  expect(items[0]).not.toHaveAttribute('aria-current')
})

test('N toggles presenter notes, which show the talk for the current slide and the next title', () => {
  const { container } = render(<Press />)
  const panel = () => container.querySelector('.press-presenter')!
  expect(panel()).toHaveAttribute('aria-hidden', 'true')
  expect(panel()).not.toHaveClass('press-presenter--open')
  fireEvent.keyDown(window, { key: 'n' })
  expect(panel()).toHaveClass('press-presenter--open')
  expect(panel()).toHaveAttribute('aria-hidden', 'false')
  expect(panel()).toHaveTextContent(SLIDES[0].talk![0])
  expect(panel()).toHaveTextContent(`Next: ${SLIDES[1].title}`)
  fireEvent.keyDown(window, { key: 'ArrowRight' })
  expect(panel()).toHaveTextContent(SLIDES[1].talk![0])
  fireEvent.keyDown(window, { key: 'N' })
  expect(panel()).not.toHaveClass('press-presenter--open')
})

test('slide 2 is Betina\'s profile', () => {
  render(<Press />)
  fireEvent.keyDown(window, { key: 'ArrowRight' })
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Meet Betina')
  expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Betina Bugnotto')
  expect(screen.getByText('33 · Berlin · English UI')).toBeInTheDocument()
  expect(screen.getByText(/Doesn't even know if she needs to file/)).toBeInTheDocument()
})

test('title slide carries a small continue hint', () => {
  const { container } = render(<Press />)
  expect(container.querySelector('.press-continue')).toHaveTextContent('to continue')
})

test('slide 3 is Anna\'s profile', () => {
  render(<Press />)
  fireEvent.keyDown(window, { key: 'ArrowRight' })
  fireEvent.keyDown(window, { key: 'ArrowRight' })
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Meet the Expert')
  expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Anna Weber')
  expect(screen.getByText('41 · Leipzig · Steuerberaterin')).toBeInTheDocument()
  expect(screen.getByText(/two exchanges is the limit/)).toBeInTheDocument()
})
