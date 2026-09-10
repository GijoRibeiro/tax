import { useEffect } from 'react'

// Each surface names its own browser tab, so the deck, the hub, the dashboard and the
// interviews can be told apart when they are open side by side.
export function PageTitle({ title }: { title: string }) {
  useEffect(() => {
    const previous = document.title
    document.title = title
    return () => { document.title = previous }
  }, [title])
  return null
}
