interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
  id?: string
}

export const Toggle = ({ checked, onChange, label, description, id }: ToggleProps) => (
  <label
    className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3"
    htmlFor={id}
  >
    <span className="space-y-0.5">
      <span className="block text-sm font-medium text-slate-100">{label}</span>
      {description ? <span className="block text-xs text-slate-400">{description}</span> : null}
    </span>
    <span className="relative inline-flex h-6 w-11 items-center">
      <input
        id={id}
        checked={checked}
        className="peer sr-only"
        type="checkbox"
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="absolute h-6 w-11 rounded-full bg-slate-700 transition peer-checked:bg-sky-500" />
      <span className="absolute left-1 h-4 w-4 rounded-full bg-white transition peer-checked:left-6" />
    </span>
  </label>
)
