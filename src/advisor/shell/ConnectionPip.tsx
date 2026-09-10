import { useWorkspace } from '../workspace/WorkspaceStore'

// Reflects the relay connection backing the one live-demo case (Betina).
// green "Live sync" once the socket is open, amber "retrying" copy while it
// isn't. Test env never opens a real socket (CaseStoreProvider url={null}),
// so `liveConnected` is always false there, tests rely on that.
export function ConnectionPip() {
  const { liveConnected } = useWorkspace()

  return (
    <span
      className={`tf-connection tf-connection--${liveConnected ? 'live' : 'offline'}`}
      role="status"
    >
      <span className="tf-connection__dot" aria-hidden="true" />
      {liveConnected ? 'Live sync' : 'Live sync offline, retrying'}
    </span>
  )
}
