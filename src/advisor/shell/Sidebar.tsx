import { NavLink } from 'react-router-dom'
import { useWorkspace } from '../workspace/WorkspaceStore'
import { needsAttention, inboxItems } from '../workspace/selectors'
import { Icon } from '../kit/icons'
import type { IconProps } from '../kit/icons'

interface NavItem {
  to: string
  label: string
  icon: IconProps['name']
  end?: boolean
  badge?: number
}

function navClassName({ isActive }: { isActive: boolean }) {
  return `tf-sidebar__link${isActive ? ' tf-sidebar__link--active' : ''}`
}

export function Sidebar() {
  const { ws } = useWorkspace()

  const inboxCount = inboxItems(ws).filter(i => i.group === 'needs-reply').length
  const casesCount = new Set(needsAttention(ws).map(i => i.caseId)).size
  const accepting = ws.settings.acceptingNewCases

  // Absolute paths: the Sidebar renders as a sibling of AdvisorApp's inner <Routes>,
  // so a bare "cases" would resolve against whatever the current URL happens to be.
  const items: NavItem[] = [
    { to: '/advisor', label: 'Today', icon: 'today', end: true },
    { to: '/advisor/inbox', label: 'Inbox', icon: 'inbox', badge: inboxCount },
    { to: '/advisor/cases', label: 'Cases', icon: 'cases', badge: casesCount },
    { to: '/advisor/clients', label: 'Clients', icon: 'clients' },
    { to: '/advisor/settings', label: 'Settings', icon: 'settings' },
  ]

  return (
    <aside className="tf-sidebar">
      <div className="tf-sidebar__brand">
        <img className="tf-sidebar__mark" src="/taxfix-logo.svg" alt="" aria-hidden="true" />
        <span className="tf-sidebar__brand-text">
          <span className="tf-sidebar__brand-name">Taxfix</span>
          <span className="tf-sidebar__brand-sub">Expert desk</span>
        </span>
      </div>
      <nav className="tf-sidebar__nav">
        {items.map(item => (
          <NavLink key={item.to} to={item.to} end={item.end} className={navClassName}>
            <Icon name={item.icon} />
            <span className="tf-sidebar__label">{item.label}</span>
            {!!item.badge && <span className="tf-sidebar__badge">{item.badge}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="tf-sidebar__anna">
        <img className="tf-sidebar__anna-photo" src="/personas/anna.jpg" alt="" aria-hidden="true" />
        <span className="tf-sidebar__anna-text">
          <span className="tf-sidebar__anna-name">Anna Weber</span>
          <span className="tf-sidebar__anna-state">
            <span
              className={`tf-sidebar__dot tf-sidebar__dot--${accepting ? 'accepting' : 'closed'}`}
              title={accepting ? 'Accepting new cases' : 'Not accepting new cases'}
              aria-hidden="true"
            />
            {accepting ? 'Taking new cases' : 'Not taking new cases'}
          </span>
        </span>
      </div>
    </aside>
  )
}
