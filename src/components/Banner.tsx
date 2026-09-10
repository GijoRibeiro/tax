import type { ReactNode } from 'react'

export interface BannerProps {
  tone: 'info' | 'success' | 'issue'
  children: ReactNode
}

export function Banner({ tone, children }: BannerProps) {
  return (
    <div className={`tf-banner tf-banner--${tone}`} role="status">
      {children}
    </div>
  )
}
