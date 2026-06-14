import { useEffect, useMemo, useRef, useState } from 'react'
import { ApiKeyGate } from './components/ApiKeyGate'
import { JobRunner } from './components/JobRunner'
import { ResultView } from './components/ResultView'
import { SeedanceVideoEditForm } from './components/SeedanceVideoEditForm'
import { Button } from './components/ui/Button'
import { ConfirmDialog } from './components/ui/ConfirmDialog'
import { ApiKeyProvider } from './context/ApiKeyContext'
import { useApiKey } from './context/useApiKey'
import type { BalanceResponseData, PredictionResult, SeedanceVideoEditInput } from './lib/types'
import { pollPrediction, submitVideoEdit, validateKey, WavespeedError } from './lib/wavespeed'

const maskApiKey = (key: string): string => {
  if (key.length <= 14) return '********'
  return `${key.slice(0, 8)}••••${key.slice(-4)}`
}

interface WorkflowDefinition {
  id: string
  label: string
  submitLabel: string
  submit: (apiKey: string, input: unknown) => Promise<PredictionResult>
  form: typeof SeedanceVideoEditForm
}

const workflows: WorkflowDefinition[] = [
  {
    id: 'bytedance-seedance-2-video-edit',
    label: 'Bytedance Seedance 2.0 Video Edit',
    submitLabel: 'Run Seedance video edit',
    submit: (apiKey, input) => submitVideoEdit(apiKey, input as SeedanceVideoEditInput),
    form: SeedanceVideoEditForm,
  },
]

const formatCurrency = (value: number): string =>
  `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const formatBalanceValue = (value: unknown): string | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return formatCurrency(value)
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseFloat(value.replace(/[$,]/g, ''))
    if (Number.isFinite(parsed)) return formatCurrency(parsed)
    return value.startsWith('$') ? value : `$${value}`
  }
  return null
}

const formatBalance = (data: BalanceResponseData | null): string => {
  if (!data || typeof data !== 'object') return 'Unavailable'

  const preferredKeys = [
    'balance',
    'credits',
    'credit',
    'remaining',
    'available',
    'available_balance',
    'total_balance',
  ]

  const readPreferred = (payload: Record<string, unknown>): string | null => {
    for (const key of preferredKeys) {
      if (!(key in payload)) continue
      const formatted = formatBalanceValue(payload[key])
      if (formatted) return formatted
    }
    return null
  }

  const topLevelValue = readPreferred(data as Record<string, unknown>)
  if (topLevelValue) return topLevelValue

  for (const nested of Object.values(data as Record<string, unknown>)) {
    if (!nested || typeof nested !== 'object') continue
    const nestedValue = readPreferred(nested as Record<string, unknown>)
    if (nestedValue) return nestedValue
  }

  return JSON.stringify(data)
}

const AppContent = () => {
  const { apiKey, isValidated, reset } = useApiKey()
  const abortRef = useRef<AbortController | null>(null)
  const balanceCooldownTimerRef = useRef<number | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [jobVisible, setJobVisible] = useState(false)
  const [statusText, setStatusText] = useState('Idle')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(workflows[0].id)
  const [isBalanceLoading, setIsBalanceLoading] = useState(false)
  const [balanceError, setBalanceError] = useState<string | null>(null)
  const [balanceData, setBalanceData] = useState<BalanceResponseData | null>(null)
  const [isBalanceRefreshCooldown, setIsBalanceRefreshCooldown] = useState(false)
  const [showChangeKeyConfirm, setShowChangeKeyConfirm] = useState(false)

  const maskedKey = useMemo(() => maskApiKey(apiKey), [apiKey])
  const activeWorkflow = useMemo(
    () => workflows.find((workflow) => workflow.id === selectedWorkflowId) ?? workflows[0],
    [selectedWorkflowId],
  )
  const FormComponent = activeWorkflow.form
  const balanceDisplay = useMemo(() => formatBalance(balanceData), [balanceData])

  const refreshBalance = async (startCooldown: boolean) => {
    if (isBalanceLoading || (startCooldown && isBalanceRefreshCooldown)) return

    setIsBalanceLoading(true)
    setBalanceError(null)
    try {
      const response = await validateKey(apiKey)
      setBalanceData(response)
    } catch (caughtError) {
      const message =
        caughtError instanceof WavespeedError || caughtError instanceof Error
          ? caughtError.message
          : 'Could not refresh balance.'
      setBalanceError(message)
    } finally {
      setIsBalanceLoading(false)
      if (startCooldown) {
        setIsBalanceRefreshCooldown(true)
        if (balanceCooldownTimerRef.current) {
          window.clearTimeout(balanceCooldownTimerRef.current)
        }
        balanceCooldownTimerRef.current = window.setTimeout(() => {
          setIsBalanceRefreshCooldown(false)
        }, 5000)
      }
    }
  }

  useEffect(() => {
    let cancelled = false

    const loadInitialBalance = async () => {
      setIsBalanceLoading(true)
      setBalanceError(null)
      try {
        const response = await validateKey(apiKey)
        if (!cancelled) {
          setBalanceData(response)
        }
      } catch (caughtError) {
        if (cancelled) return
        const message =
          caughtError instanceof WavespeedError || caughtError instanceof Error
            ? caughtError.message
            : 'Could not refresh balance.'
        setBalanceError(message)
      } finally {
        if (!cancelled) {
          setIsBalanceLoading(false)
        }
      }
    }

    window.setTimeout(() => {
      void loadInitialBalance()
    }, 0)

    return () => {
      cancelled = true
    }
  }, [apiKey])

  useEffect(() => {
    return () => {
      if (balanceCooldownTimerRef.current) {
        window.clearTimeout(balanceCooldownTimerRef.current)
      }
    }
  }, [])

  if (!isValidated) {
    return <ApiKeyGate />
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 p-3 sm:gap-6 sm:p-6">
        <header className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-2xl shadow-black/20 sm:rounded-3xl">
          <div className="border-b border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/40 p-3.5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-slate-50 sm:text-2xl">WaveSpeedAI API Tool</h1>
                <p className="mt-2 hidden max-w-2xl text-sm leading-6 text-slate-300 sm:block">
                  Choose a workflow, review your account status, then send generation jobs with the validated key.
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-200 sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.8)]" />
                API key verified
              </span>
            </div>
          </div>

          <div className="grid gap-3 p-3 sm:gap-4 sm:p-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
            <label className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 sm:rounded-2xl sm:p-4">
              <span className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">Workflow</span>
              <span className="mt-2 hidden text-sm text-slate-300 sm:block">Select the model endpoint this run should use.</span>
              <select
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm font-medium text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500 sm:mt-4 sm:px-4 sm:py-3"
                value={activeWorkflow.id}
                onChange={(event) => {
                  const nextWorkflowId = event.target.value
                  setSelectedWorkflowId(nextWorkflowId)
                  setResult(null)
                  setError(null)
                  setStatusText('Idle')
                  setElapsedSeconds(0)
                  setIsRunning(false)
                  setJobVisible(false)
                  abortRef.current?.abort()
                }}
              >
                {workflows.map((workflow) => (
                  <option key={workflow.id} value={workflow.id}>
                    {workflow.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-1">
              <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 sm:rounded-2xl sm:p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">Balance</p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-50 sm:mt-2 sm:text-3xl">
                      {isBalanceLoading && !balanceData ? 'Checking...' : balanceDisplay}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    className="rounded-full px-2.5 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm"
                    disabled={isBalanceLoading || isBalanceRefreshCooldown}
                    aria-label="Refresh balance"
                    title={isBalanceRefreshCooldown ? 'Balance refresh is cooling down' : 'Refresh balance'}
                    onClick={() => {
                      void refreshBalance(true)
                    }}
                  >
                    {isBalanceLoading ? 'Refreshing' : 'Refresh'}
                  </Button>
                </div>
                <p className="mt-2 text-xs text-slate-400 sm:mt-3">
                  {balanceError ? <span className="text-rose-300">{balanceError}</span> : 'Pulled from your WaveSpeed account.'}
                </p>
              </section>

              <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 sm:rounded-2xl sm:p-4">
                <p className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">API Key</p>
                <div className="mt-2 flex flex-row items-center justify-between gap-3 sm:mt-3 lg:flex-col lg:items-start xl:flex-row xl:items-center">
                  <code className="min-w-0 overflow-x-auto rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 sm:px-3 sm:py-2 sm:text-sm">
                    {maskedKey}
                  </code>
                  <Button
                    variant="ghost"
                    className="shrink-0 px-0 py-1 text-xs text-rose-400 hover:bg-transparent hover:text-rose-300 sm:py-2.5 sm:text-sm"
                    onClick={() => setShowChangeKeyConfirm(true)}
                  >
                    Change key
                  </Button>
                </div>
              </section>
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3.5 sm:p-5">
          <FormComponent
            apiKey={apiKey}
            isSubmitting={isRunning}
            submitLabel={activeWorkflow.submitLabel}
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
                const created = await activeWorkflow.submit(apiKey, input)
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

      <ConfirmDialog
        open={showChangeKeyConfirm}
        title="Change API key?"
        description="This will clear everything you've entered so far, including your prompt and uploaded files. You'll need to enter a new key to continue."
        confirmLabel="Change key"
        onCancel={() => setShowChangeKeyConfirm(false)}
        onConfirm={() => {
          setShowChangeKeyConfirm(false)
          setResult(null)
          setError(null)
          setIsRunning(false)
          setJobVisible(false)
          setStatusText('Idle')
          setElapsedSeconds(0)
          abortRef.current?.abort()
          reset()
        }}
      />
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
