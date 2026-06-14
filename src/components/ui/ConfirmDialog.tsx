import { useEffect, useState, type ReactNode } from 'react'
import { Button } from './Button'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: ReactNode
  confirmLabel: string
  cancelLabel?: string
  confirmVariant?: ButtonVariant
  dialogClassName?: string
  requireAcknowledgment?: boolean
  acknowledgmentLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  confirmVariant = 'danger',
  dialogClassName = 'max-w-md',
  requireAcknowledgment = false,
  acknowledgmentLabel = 'I understand',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  const [acknowledged, setAcknowledged] = useState(false)

  useEffect(() => {
    if (open) {
      setAcknowledged(false)
    }
  }, [open])

  if (!open) return null

  const confirmDisabled = requireAcknowledgment && !acknowledged

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onCancel}
    >
      <div
        className={`w-full rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl shadow-black/40 ${dialogClassName}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="text-lg font-semibold text-slate-50">
          {title}
        </h2>
        <div className="mt-3 text-sm leading-6 text-slate-300">{description}</div>
        {requireAcknowledgment ? (
          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-700 bg-slate-950/60 p-4">
            <input
              checked={acknowledged}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-600 bg-slate-950 text-sky-500 focus:ring-sky-500"
              type="checkbox"
              onChange={(event) => setAcknowledged(event.target.checked)}
            />
            <span className="text-sm leading-6 text-slate-200">{acknowledgmentLabel}</span>
          </label>
        ) : null}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button disabled={confirmDisabled} variant={confirmVariant} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
