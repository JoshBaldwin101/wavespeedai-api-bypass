import { Button } from './ui/Button'
import { Spinner } from './ui/Spinner'

interface JobRunnerProps {
  visible: boolean
  isRunning: boolean
  statusText: string
  elapsedSeconds: number
  onCancel: () => void
}

export const JobRunner = ({ elapsedSeconds, isRunning, onCancel, statusText, visible }: JobRunnerProps) => {
  if (!visible) {
    return null
  }

  return (
    <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-100">Generation job</h3>
        {isRunning ? (
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
        <p className="text-sm text-slate-200">{statusText}</p>
        <p className="mt-1 text-xs text-slate-400">Elapsed: {elapsedSeconds}s</p>
      </div>
      {isRunning ? <Spinner label="Waiting for WaveSpeed..." /> : null}
    </section>
  )
}
