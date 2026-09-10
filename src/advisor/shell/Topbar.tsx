import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { NotificationMenu } from './NotificationMenu'
import { ConnectionPip } from './ConnectionPip'
import { Icon } from '../kit/icons'

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable
}

export function Topbar() {
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  // The one search box. On Cases and Clients it filters the list as you type (the query
  // lives in the URL, so a reload keeps it); anywhere else, Enter jumps to Cases with it.
  const filtersHere = /^\/advisor\/(cases|clients)\/?$/.test(location.pathname)
  const urlQuery = searchParams.get('q') ?? ''
  const [draft, setDraft] = useState(urlQuery)
  useEffect(() => { setDraft(urlQuery) }, [urlQuery, location.pathname])
  const value = filtersHere ? urlQuery : draft
  function setValue(next: string) {
    if (filtersHere) {
      const params = new URLSearchParams(searchParams)
      if (next) params.set('q', next); else params.delete('q')
      setSearchParams(params, { replace: true })
    } else {
      setDraft(next)
    }
  }

  // Global "/" shortcut jumps straight to search, unless the advisor is
  // already typing somewhere else (another input/textarea/contentEditable).
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== '/') return
      if (isTypingTarget(e.target)) return
      e.preventDefault()
      inputRef.current?.focus()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  function onSearchKeyDown(e: ReactKeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter' || filtersHere) return
    // Absolute path. Topbar is a sibling of AdvisorApp's inner <Routes>
    // (same reasoning as Sidebar's links), so a bare "cases?q=…" would
    // route-relative-resolve against whatever page search was triggered from.
    navigate(`/advisor/cases?q=${encodeURIComponent(value)}`)
  }

  return (
    <header className="tf-topbar">
      <div className="tf-topbar__search-wrap">
        <Icon name="search" className="tf-topbar__search-icon" size={15} />
        <input
          ref={inputRef}
          type="search"
          className="tf-topbar__search"
          placeholder={filtersHere ? 'Filter by client name… ( / )' : 'Search clients… ( / )'}
          aria-label="Search clients"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={onSearchKeyDown}
        />
      </div>
      <div className="tf-topbar__right">
        <NotificationMenu />
        <ConnectionPip />
      </div>
    </header>
  )
}
