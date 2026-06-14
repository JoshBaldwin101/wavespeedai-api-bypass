import { useMemo, useRef, useState } from 'react'
import { ApiKeyGate } from './components/ApiKeyGate'
import { JobRunner } from './components/JobRunner'
import { ResultView } from './components/ResultView'
import { SeedanceVideoEditForm } from './components/SeedanceVideoEditForm'
import { Button } from './components/ui/Button'
import { ApiKeyProvider } from './context/ApiKeyContext'
import { useApiKey } from './context/useApiKey'
import type { PredictionResult } from './lib/types'
import { pollPrediction, submitVideoEdit, WavespeedError } from './lib/wavespeed'

const maskApiKey = (key: string): string => {
  if (key.length <= 14) return '********'
  return `${key.slice(0, 8)}••••${key.slice(-4)}`
}

const AppContent = () => {
  const { apiKey, isValidated, reset } = useApiKey()
  const abortRef = useRef<AbortController | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [jobVisible, setJobVisible] = useState(false)
  const [statusText, setStatusText] = useState('Idle')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PredictionResult | null>(null)

  const maskedKey = useMemo(() => maskApiKey(apiKey), [apiKey])

  if (!isValidated) {
    return <ApiKeyGate />
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
        <header className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <h1 className="text-2xl font-semibold">WaveSpeedAI API Tool</h1>
          <p className="mt-1 text-sm text-slate-300">Workflow: Bytedance Seedance 2.0 Video Edit</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="rounded bg-slate-950 px-2.5 py-1 text-xs text-slate-300">
              API key: <code>{maskedKey}</code>
            </span>
            <Button
              variant="secondary"
              onClick={() => {
                setResult(null)
                setError(null)
                setIsRunning(false)
                setJobVisible(false)
                setStatusText('Idle')
                setElapsedSeconds(0)
                abortRef.current?.abort()
                reset()
              }}
            >
              Change key
            </Button>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <SeedanceVideoEditForm
            apiKey={apiKey}
            isSubmitting={isRunning}
            onSubmit={async (input) => {
              const controller = new AbortController()
              abortRef.current?.abort()
              abortRef.current = controller

              setError(null)
              setResult(null)
              setJobVisible(true)
              setIsRunning(true)
              setStatusText('Submitting request...')
              setElapsedSeconds(0)

              const startTime = Date.now()
              const timer = window.setInterval(() => {
                setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000))
              }, 1000)

              try {
                const created = await submitVideoEdit(apiKey, input)
                const trackingTarget = created.urls?.get ?? created.id
                setStatusText(`Queued (${created.status})`)

                const final = await pollPrediction(apiKey, trackingTarget, controller.signal, (update) => {
                  setStatusText(`Status: ${update.status}`)
                })

                setStatusText(`Finished: ${final.status}`)
                setResult(final)
                if (final.status === 'failed') {
                  setError(final.error || 'Generation failed.')
                }
              } catch (caughtError) {
                if (caughtError instanceof DOMException && caughtError.name === 'AbortError') {
                  setStatusText('Cancelled')
                  setError('Request cancelled.')
                } else {
                  const message =
                    caughtError instanceof WavespeedError || caughtError instanceof Error
                      ? caughtError.message
                      : 'Request failed.'
                  setStatusText('Failed')
                  setError(message)
                }
              } finally {
                window.clearInterval(timer)
                setIsRunning(false)
              }
            }}
          />
        </section>

        <JobRunner
          visible={jobVisible}
          isRunning={isRunning}
          statusText={statusText}
          elapsedSeconds={elapsedSeconds}
          onCancel={() => {
            abortRef.current?.abort()
          }}
        />

        <ResultView error={error} result={result} />
      </div>
    </main>
  )
}

function App() {
  return (
    <ApiKeyProvider>
      <AppContent />
    </ApiKeyProvider>
  )
}

export default App
