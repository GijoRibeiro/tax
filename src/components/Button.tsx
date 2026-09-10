import type { ReactNode } from 'react'

export interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  full?: boolean
  disabled?: boolean
  'aria-label'?: string
}

export function Button({ children, onClick, variant = 'primary', full, disabled, ...rest }: ButtonProps) {
  const classes = ['tf-button', `tf-button--${variant}`, full ? 'tf-button--full' : '']
    .filter(Boolean)
    .join(' ')

  return (
    <button type="button" className={classes} onClick={onClick} disabled={disabled} {...rest}>
      {children}
    </button>
  )
}
