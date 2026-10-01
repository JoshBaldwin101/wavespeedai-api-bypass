import { KLING_ELEMENT_LIST_LIMIT } from '../../lib/attachmentLimits'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'

const controlClassName =
  'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500'

interface KlingElementIdsFieldProps {
  idPrefix: string
  value: string[]
  onChange: (value: string[]) => void
}

export const KlingElementIdsField = ({ idPrefix, value, onChange }: KlingElementIdsFieldProps) => {
  const ids = value.length > 0 ? value : ['']
  const atLimit = ids.length >= KLING_ELEMENT_LIST_LIMIT

  return (
    <div className="space-y-3">
      <Field
        label="Element IDs"
        hint="Create an element in the Kling Elements workflow, write its name in the prompt, and paste its ID here. Up to 3."
      >
        <div className="space-y-2">
          {ids.map((id, index) => (
            <div key={`${idPrefix}-element-${index}`} className="flex items-center gap-2">
              <input
                id={`${idPrefix}-element-${index}`}
                className={controlClassName}
                placeholder="Element ID"
                value={id}
                onChange={(event) => onChange(ids.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)))}
              />
              <Button
                variant="ghost"
                className="shrink-0 px-2 py-2 text-xs"
                disabled={ids.length <= 1}
                onClick={() => onChange(ids.filter((_, itemIndex) => itemIndex !== index))}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </Field>
      <Button variant="secondary" disabled={atLimit} onClick={() => onChange([...ids, ''])}>
        Add element ID
      </Button>
    </div>
  )
}
