interface SpinnerProps {
  className?: string
  label?: string
}

export const Spinner = ({ className = '', label = 'Loading' }: SpinnerProps) => (
  <span className={`inline-flex items-center gap-2 text-sm text-slate-300 ${className}`} role="status">
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-500 border-t-sky-400" />
    <span>{label}</span>
  </span>
)
