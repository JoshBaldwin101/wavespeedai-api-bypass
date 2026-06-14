import type { ReactNode } from 'react'

interface FieldProps {
  label: ReactNode
  className?: string
  htmlFor?: string
  hint?: ReactNode
  error?: ReactNode
  required?: boolean
  children: ReactNode
}

export const Field = ({ label, className = '', htmlFor, hint, error, required = false, children }: FieldProps) => (
  <div className={`space-y-1.5 sm:space-y-2 ${className}`}>
    <label className="block text-sm font-medium text-slate-200" htmlFor={htmlFor}>
      {label}
      {required ? <span className="ml-1 text-rose-400">*</span> : null}
    </label>
    {children}
    {error ? <p className="text-xs text-rose-300">{error}</p> : null}
    {!error && hint ? <p className="hidden text-xs text-slate-400 sm:block">{hint}</p> : null}
  </div>
)
