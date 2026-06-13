import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  isLoading?: boolean
  leadingIcon?: ReactNode
}

const variantClassMap: Record<ButtonVariant, string> = {
  primary:
    'bg-sky-500 text-slate-950 hover:bg-sky-400 disabled:bg-slate-700 disabled:text-slate-300',
  secondary:
    'border border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700 disabled:bg-slate-800/60 disabled:text-slate-400',
  ghost:
    'text-slate-200 hover:bg-slate-800 disabled:text-slate-500',
  danger:
    'bg-rose-600 text-white hover:bg-rose-500 disabled:bg-slate-700 disabled:text-slate-300',
}

export const Button = ({
  children,
  className = '',
  disabled,
  isLoading = false,
  leadingIcon,
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) => (
  <button
    className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-not-allowed ${variantClassMap[variant]} ${className}`}
    disabled={disabled || isLoading}
    type={type}
    {...props}
  >
    {leadingIcon}
    {isLoading ? 'Loading...' : children}
  </button>
)
