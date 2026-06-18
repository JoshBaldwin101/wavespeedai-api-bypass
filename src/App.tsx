import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ApiKeyGate } from './components/ApiKeyGate'
import { JobsPanel } from './components/JobsPanel'
import { AboutButton } from './components/ui/AboutButton'
import { Button } from './components/ui/Button'
import { ConfirmDialog } from './components/ui/ConfirmDialog'
import { ApiKeyProvider } from './context/ApiKeyContext'
import { useApiKey } from './context/useApiKey'
import type { BalanceResponseData, ModelPricing } from './lib/types'
import { defaultWorkflow, defaultWorkflowId, workflowGroups, workflows } from './lib/workflows'
import { useJobs } from './hooks/useJobs'
import { getModelPricing, submitPrediction, validateKey, WavespeedError } from './lib/wavespeed'

const maskApiKey = (key: string): string => {
  if (key.length <= 14) return '********'
  return `${key.slice(0, 8)}••••${key.slice(-4)}`
}

const formatCurrency = (value: number): string =>
  `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const formatEstimatedPrice = (value: number, currency: string): string => {
  if (currency === 'USD') return formatCurrency(value)
  return `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`
}

const BALANCE_PREFERRED_KEYS = [
  'balance',
  'credits',
  'credit',
  'remaining',
  'available',
  'available_balance',
  'total_balance',
] as const

const TOP_UP_URL = 'https://wavespeed.ai/top-up'
const BALANCE_REFRESH_MS = 30_000
const SUBMIT_COOLDOWN_MS = 5_000

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })

const parseBalanceValue = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseFloat(value.replace(/[$,]/g, ''))
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

const parseBalanceAmount = (data: BalanceResponseData | null): number | null => {
  if (!data || typeof data !== 'object') return null

  const readPreferred = (payload: Record<string, unknown>): number | null => {
    for (const key of BALANCE_PREFERRED_KEYS) {
      if (!(key in payload)) continue
      const parsed = parseBalanceValue(payload[key])
      if (parsed !== null) return parsed
    }
    return null
  }

  const topLevelValue = readPreferred(data as Record<string, unknown>)
  if (topLevelValue !== null) return topLevelValue

  for (const nested of Object.values(data as Record<string, unknown>)) {
    if (!nested || typeof nested !== 'object') continue
    const nestedValue = readPreferred(nested as Record<string, unknown>)
    if (nestedValue !== null) return nestedValue
  }

  return null
}

const formatBalanceValue = (value: unknown): string | null => {
  const parsed = parseBalanceValue(value)
  if (parsed !== null) return formatCurrency(parsed)
  if (typeof value === 'string' && value.trim()) {
    return value.startsWith('$') ? value : `$${value}`
  }
  return null
}

const formatBalance = (data: BalanceResponseData | null): string => {
  if (!data || typeof data !== 'object') return 'Unavailable'

  const readPreferred = (payload: Record<string, unknown>): string | null => {
    for (const key of BALANCE_PREFERRED_KEYS) {
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
  const balanceRefreshInFlightRef = useRef(false)
  const balanceRefreshQueuedRef = useRef(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(defaultWorkflowId)
  const [isBalanceLoading, setIsBalanceLoading] = useState(false)
  const [balanceError, setBalanceError] = useState<string | null>(null)
  const [balanceData, setBalanceData] = useState<BalanceResponseData | null>(null)
  const [showChangeKeyConfirm, setShowChangeKeyConfirm] = useState(false)
  const [showPriceConfirm, setShowPriceConfirm] = useState(false)
  const [showWorkflowJobsOnly, setShowWorkflowJobsOnly] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingInput, setPendingInput] = useState<unknown | null>(null)
  const [pricePreview, setPricePreview] = useState<ModelPricing | null>(null)
  const [isPricingLoading, setIsPricingLoading] = useState(false)
  const [pricingError, setPricingError] = useState<string | null>(null)
  const [isConfirmValidating, setIsConfirmValidating] = useState(false)
  const [confirmValidationError, setConfirmValidationError] = useState<string | null>(null)
  const [hasInsufficientFunds, setHasInsufficientFunds] = useState(false)

  const maskedKey = useMemo(() => maskApiKey(apiKey), [apiKey])
  const activeWorkflow = useMemo(
    () => workflows.find((workflow) => workflow.id === selectedWorkflowId) ?? defaultWorkflow,
    [selectedWorkflowId],
  )
  const groupedWorkflows = useMemo(
    () =>
      workflowGroups.map((group) => ({
        ...group,
        workflows: workflows.filter((workflow) => workflow.group === group.id),
      })),
    [],
  )
  const jobModelNeedles = useMemo(() => [activeWorkflow.model], [activeWorkflow.model])
  const jobs = useJobs({ apiKey, modelNeedles: jobModelNeedles, showWorkflowJobsOnly })
  const FormComponent = activeWorkflow.form
  const balanceDisplay = useMemo(() => formatBalance(balanceData), [balanceData])
  const priceDisplay = useMemo(() => {
    if (!pricePreview) return null
    return formatEstimatedPrice(pricePreview.unit_price, pricePreview.currency)
  }, [pricePreview])
  const priceConfirmLabel = useMemo(() => {
    if (isConfirmValidating) return 'Checking balance...'
    if (isPricingLoading) return 'Calculating price...'
    if (hasInsufficientFunds) return 'Check again'
    if (priceDisplay) return `Generate ${priceDisplay}`
    return 'Generate anyway'
  }, [isConfirmValidating, isPricingLoading, hasInsufficientFunds, priceDisplay])

  const refreshBalance = useCallback(async () => {
    if (balanceRefreshInFlightRef.current) {
      balanceRefreshQueuedRef.current = true
      return
    }

    balanceRefreshInFlightRef.current = true
    try {
      do {
        balanceRefreshQueuedRef.current = false
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
        }
      } while (balanceRefreshQueuedRef.current)
    } finally {
      balanceRefreshInFlightRef.current = false
      setIsBalanceLoading(false)
    }
  }, [apiKey])

  useEffect(() => {
    const initialTimer = window.setTimeout(() => {
      void refreshBalance()
    }, 0)

    const interval = window.setInterval(() => {
      void refreshBalance()
    }, BALANCE_REFRESH_MS)

    return () => {
      window.clearTimeout(initialTimer)
      window.clearInterval(interval)
    }
  }, [refreshBalance])

  const runJob = async (input: unknown) => {
    setSubmitError(null)
    setIsSubmitting(true)
    let didQueueJob = false

    try {
      const created = await submitPrediction(apiKey, activeWorkflow.model, input)
      didQueueJob = true
      const trackingTarget = created.urls?.get ?? created.id
      void jobs.track(trackingTarget)
      void refreshBalance()
    } catch (caughtError) {
      if (caughtError instanceof DOMException && caughtError.name === 'AbortError') return
      const message =
        caughtError instanceof WavespeedError || caughtError instanceof Error
          ? caughtError.message
          : 'Request failed.'
      setSubmitError(message)
    } finally {
      if (didQueueJob) {
        await sleep(SUBMIT_COOLDOWN_MS)
      }
      setIsSubmitting(false)
    }
  }

  const resetPriceConfirmState = () => {
    setShowPriceConfirm(false)
    setPendingInput(null)
    setPricePreview(null)
    setIsPricingLoading(false)
    setPricingError(null)
    setIsConfirmValidating(false)
    setConfirmValidationError(null)
    setHasInsufficientFunds(false)
  }

  const prepareRun = async (input: unknown) => {
    setPendingInput(input)
    setShowPriceConfirm(true)
    setPricePreview(null)
    setPricingError(null)
    setConfirmValidationError(null)
    setHasInsufficientFunds(false)
    setIsConfirmValidating(false)
    setIsPricingLoading(true)

    try {
      const pricing = await getModelPricing(apiKey, activeWorkflow.model, input as Record<string, unknown>)
      setPricePreview(pricing)
    } catch (caughtError) {
      const message =
        caughtError instanceof WavespeedError || caughtError instanceof Error
          ? caughtError.message
          : 'Could not estimate pricing.'
      setPricingError(message)
    } finally {
      setIsPricingLoading(false)
    }
  }

  const confirmRun = async () => {
    if (!pendingInput || isConfirmValidating) return

    setIsConfirmValidating(true)
    setConfirmValidationError(null)
    setHasInsufficientFunds(false)

    try {
      const [pricing, freshBalance] = await Promise.all([
        getModelPricing(apiKey, activeWorkflow.model, pendingInput as Record<string, unknown>),
        validateKey(apiKey),
      ])

      setPricePreview(pricing)
      setBalanceData(freshBalance)
      setPricingError(null)
      setBalanceError(null)

      const balanceAmount = parseBalanceAmount(freshBalance)
      if (balanceAmount === null) {
        setConfirmValidationError('Could not read your wallet balance. Refresh your balance and try again.')
        return
      }

      if (pricing.unit_price > balanceAmount) {
        const costDisplay = formatEstimatedPrice(pricing.unit_price, pricing.currency)
        const balanceDisplayValue = formatCurrency(balanceAmount)
        setHasInsufficientFunds(true)
        setConfirmValidationError(
          `This run costs ${costDisplay}, but your wallet only has ${balanceDisplayValue}. Add credits before continuing.`,
        )
        return
      }

      const input = pendingInput
      resetPriceConfirmState()
      void runJob(input)
    } catch (caughtError) {
      const message =
        caughtError instanceof WavespeedError || caughtError instanceof Error
          ? caughtError.message
          : 'Could not verify price and balance.'
      setConfirmValidationError(message)
    } finally {
      setIsConfirmValidating(false)
    }
  }

  const forceConfirmRun = () => {
    if (!pendingInput || isConfirmValidating) return
    const input = pendingInput
    resetPriceConfirmState()
    void runJob(input)
  }

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
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold tracking-tight text-slate-50 sm:text-2xl">WaveSpeedAI API Tool</h1>
                  <AboutButton />
                </div>
                <p className="mt-2 hidden max-w-2xl text-sm leading-6 text-slate-300 sm:block">
                  Choose a workflow, fill in inputs, then send generation jobs.
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
                  setSubmitError(null)
                  resetPriceConfirmState()
                  if (showWorkflowJobsOnly) {
                    jobs.reset()
                  }
                }}
              >
                {groupedWorkflows.map((group) => (
                  <optgroup key={group.id} label={group.label}>
                    {group.workflows.map((workflow) => (
                      <option key={workflow.id} value={workflow.id}>
                        {workflow.label}
                      </option>
                    ))}
                  </optgroup>
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
                    disabled={isBalanceLoading}
                    aria-label="Refresh balance"
                    title="Refresh balance"
                    onClick={() => {
                      void refreshBalance()
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
            key={activeWorkflow.id}
            apiKey={apiKey}
            pricingModelId={activeWorkflow.model}
            isSubmitting={isSubmitting || showPriceConfirm}
            submitLabel={activeWorkflow.submitLabel}
            workflowCapabilities={activeWorkflow.capabilities}
            onSubmit={prepareRun}
          />
          {submitError ? <p className="mt-3 text-sm text-rose-300">{submitError}</p> : null}
        </section>

        <JobsPanel
          jobsById={jobs.jobsById}
          recentIds={jobs.recentIds}
          selectedJobId={jobs.selectedJobId}
          pollingJobId={jobs.pollingJobId}
          elapsedSeconds={jobs.elapsedSeconds}
          isLoadingRecents={jobs.isLoadingRecents}
          recentsError={jobs.recentsError}
          lastRefreshedAt={jobs.lastRefreshedAt}
          onRefresh={jobs.refreshRecents}
          onSelect={jobs.select}
          onCancel={jobs.cancelActive}
          showWorkflowJobsOnly={showWorkflowJobsOnly}
          onShowWorkflowJobsOnlyChange={setShowWorkflowJobsOnly}
        />
      </div>

      <ConfirmDialog
        open={showPriceConfirm}
        title="Confirm run"
        description={
          <div className="space-y-2">
            {isPricingLoading ? (
              <p>Calculating price based on your current settings...</p>
            ) : isConfirmValidating ? (
              <p>Recalculating price and checking your wallet balance before starting...</p>
            ) : (
              <>
                {priceDisplay ? (
                  <>
                    <p className="text-base font-semibold text-slate-100">Estimated cost: {priceDisplay}</p>
                    <p>
                      Wallet balance: <span className="font-medium text-slate-100">{balanceDisplay}</span>
                    </p>
                    <p>One generation runs when you confirm. Price and balance are checked again right before submission.</p>
                  </>
                ) : (
                  <>
                    <p className="text-rose-300">{pricingError ?? 'Could not estimate pricing.'}</p>
                    <p>You need a valid price estimate and enough wallet balance before generation can start.</p>
                  </>
                )}
                {confirmValidationError ? (
                  <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-rose-200">
                    <p>{confirmValidationError}</p>
                    {hasInsufficientFunds ? (
                      <p className="mt-2">
                        <a
                          className="font-medium text-sky-300 underline decoration-sky-400/60 underline-offset-2 hover:text-sky-200"
                          href={TOP_UP_URL}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Top up your WaveSpeed wallet
                        </a>{' '}
                        to add credits, then try again.{' '}
                        <button
                          className="text-slate-300 underline decoration-slate-500/60 underline-offset-2 hover:text-slate-100"
                          type="button"
                          onClick={forceConfirmRun}
                        >
                          Force anyways.
                        </button>
                      </p>
                    ) : null}
                  </div>
                ) : null}
                <p className="text-slate-400">
                  This estimate may not reflect active discounts on your account, but eligible discounts are applied
                  automatically when you are charged.
                </p>
              </>
            )}
          </div>
        }
        confirmLabel={priceConfirmLabel}
        confirmVariant="primary"
        confirmDisabled={isPricingLoading || isConfirmValidating || !pendingInput || !pricePreview}
        onCancel={resetPriceConfirmState}
        onConfirm={() => {
          void confirmRun()
        }}
      />

      <ConfirmDialog
        open={showChangeKeyConfirm}
        title="Change API key?"
        description="This will clear everything you've entered so far, including your prompt and uploaded files. You'll need to enter a new key to continue."
        confirmLabel="Change key"
        onCancel={() => setShowChangeKeyConfirm(false)}
        onConfirm={() => {
          setShowChangeKeyConfirm(false)
          jobs.reset()
          setSubmitError(null)
          resetPriceConfirmState()
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
