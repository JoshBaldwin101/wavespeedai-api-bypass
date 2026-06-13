import { useState } from 'react'
import type { PredictionResult } from '../lib/types'

interface ResultViewProps {
  result: PredictionResult | null
  error: string | null
}

export const ResultView = ({ error, result }: ResultViewProps) => {
  const [showRawJson, setShowRawJson] = useState(false)

  if (!result && !error) {
    return null
  }

  const outputUrl = result?.outputs?.[0]

  return (
    <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <h3 className="text-sm font-semibold text-slate-100">Result</h3>

      {error ? (
        <p className="rounded-lg border border-rose-900/40 bg-rose-950/40 p-3 text-sm text-rose-200">{error}</p>
      ) : null}

      {result ? (
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-300">
            <span>
              Status: <strong className="text-slate-100">{result.status}</strong>
            </span>
            <span>
              Request ID: <code className="text-slate-200">{result.id}</code>
            </span>
          </div>
        </div>
      ) : null}

      {outputUrl ? (
        <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-950/50 p-3">
          <video
            className="aspect-video w-full rounded bg-black"
            controls
            src={outputUrl}
            preload="metadata"
          />
          <a
            className="inline-flex text-sm text-sky-300 underline decoration-sky-500/40 underline-offset-2 hover:text-sky-200"
            href={outputUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open / download output
          </a>
        </div>
      ) : null}

      {result ? (
        <div className="space-y-2">
          <button
            className="text-sm text-slate-300 underline decoration-slate-600 underline-offset-2 hover:text-slate-100"
            type="button"
            onClick={() => setShowRawJson((prev) => !prev)}
          >
            {showRawJson ? 'Hide raw JSON' : 'Show raw JSON'}
          </button>
          {showRawJson ? (
            <pre className="max-h-80 overflow-auto rounded border border-slate-800 bg-slate-950 p-3 text-xs text-slate-300">
              {JSON.stringify(result, null, 2)}
            </pre>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
