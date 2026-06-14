import { useEffect, useMemo, useState } from 'react'
import type { PredictionResult } from '../lib/types'
import { Button } from './ui/Button'
import { Spinner } from './ui/Spinner'

interface JobsPanelProps {
  jobsById: Record<string, PredictionResult>
  recentIds: string[]
  selectedJobId: string | null
  pollingJobId: string | null
  elapsedSeconds: number
  isLoadingRecents: boolean
  recentsError: string | null
  lastRefreshedAt: number | null
  onRefresh: () => Promise<void> | void
  onSelect: (jobId: string) => void
  onCancel: () => void
}

const statusColorMap: Record<string, string> = {
  completed: 'bg-emerald-400',
  failed: 'bg-rose-400',
  processing: 'bg-amber-300',
  pending: 'bg-sky-400',
  queued: 'bg-indigo-400',
  created: 'bg-slate-400',
}

const shortId = (id: string): string => (id.length <= 16 ? id : `${id.slice(0, 8)}...${id.slice(-6)}`)

const formatRelativeSeconds = (timestamp: number | null, now: number): string => {
  if (!timestamp) return 'Never'
  const seconds = Math.max(0, Math.floor((now - timestamp) / 1000))
  return `${seconds}s ago`
}

const formatRelativeDate = (iso: string | undefined, now: number): string => {
  if (!iso) return 'Unknown time'
  const timestamp = Date.parse(iso)
  if (!Number.isFinite(timestamp)) return iso

  const seconds = Math.max(0, Math.floor((now - timestamp) / 1000))
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export const JobsPanel = ({
  jobsById,
  recentIds,
  selectedJobId,
  pollingJobId,
  elapsedSeconds,
  isLoadingRecents,
  recentsError,
  lastRefreshedAt,
  onRefresh,
  onSelect,
  onCancel,
}: JobsPanelProps) => {
  const [showRawJson, setShowRawJson] = useState(false)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    setShowRawJson(false)
  }, [selectedJobId])

  const selectedJob = selectedJobId ? jobsById[selectedJobId] ?? null : null
  const isPollingSelected = selectedJobId !== null && pollingJobId === selectedJobId
  const outputUrl = selectedJob?.outputs?.[0]
  const detailTimestamp = selectedJob?.created_at
    ? formatRelativeDate(selectedJob.created_at, now)
    : selectedJob?.executionTime
      ? `${Math.round(selectedJob.executionTime / 1000)}s run`
      : 'Pending'

  const recentJobs = useMemo(
    () =>
      recentIds
        .map((id) => jobsById[id])
        .filter((job): job is PredictionResult => Boolean(job))
        .slice(0, 30),
    [jobsById, recentIds],
  )

  return (
    <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-3.5 sm:space-y-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Generation jobs</h3>
          <p className="mt-1 text-xs text-slate-400">Updated {formatRelativeSeconds(lastRefreshedAt, now)}</p>
        </div>
        <Button variant="secondary" disabled={isLoadingRecents} onClick={() => void onRefresh()}>
          {isLoadingRecents ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <div className="grid items-stretch gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(16rem,0.7fr)] lg:gap-4">
        <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
          {selectedJob ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${statusColorMap[selectedJob.status] ?? 'bg-slate-500'}`} />
                  <span className="text-sm font-medium text-slate-200">Status: {selectedJob.status}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{detailTimestamp}</span>
                  {isPollingSelected ? (
                    <Button variant="secondary" className="px-2.5 py-1.5 text-xs" onClick={onCancel}>
                      Cancel
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="border-y border-slate-800 py-3">
                <p className="text-xs text-slate-400">Request ID</p>
                <code className="mt-1 block overflow-x-auto text-sm text-slate-200">{selectedJob.id}</code>
                {isPollingSelected ? <p className="mt-2 text-xs text-slate-400">Elapsed: {elapsedSeconds}s</p> : null}
              </div>

              {selectedJob.error ? (
                <p className="rounded-lg border border-rose-900/40 bg-rose-950/40 p-3 text-sm text-rose-200">{selectedJob.error}</p>
              ) : null}

              {outputUrl ? (
                <div className="space-y-3">
                  <video className="aspect-video w-full rounded bg-black" controls src={outputUrl} preload="metadata" />
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

              <div className="space-y-2">
                <button
                  className="text-sm text-slate-300 underline decoration-slate-600 underline-offset-2 hover:text-slate-100"
                  type="button"
                  onClick={() => setShowRawJson((previous) => !previous)}
                >
                  {showRawJson ? 'Hide raw JSON' : 'Show raw JSON'}
                </button>
                {showRawJson ? (
                  <pre className="max-h-80 overflow-auto rounded border border-slate-800 bg-slate-950 p-3 text-xs text-slate-300">
                    {JSON.stringify(selectedJob, null, 2)}
                  </pre>
                ) : null}
              </div>
            </>
          ) : (
            <div className="py-2">
              <p className="text-sm text-slate-300">No job selected yet.</p>
              <p className="mt-1 text-xs text-slate-400">Submit a generation or select a recent job to inspect details.</p>
            </div>
          )}
        </div>

        <div className="flex min-h-0 max-h-[24rem] flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-950/35 p-2.5 sm:max-h-[30rem] sm:p-3 lg:h-full lg:max-h-[36rem]">
          <p className="px-1 pb-2 text-xs font-semibold tracking-[0.15em] text-slate-400 uppercase">Recents</p>
          {isLoadingRecents && recentJobs.length === 0 ? <Spinner label="Loading recent jobs..." /> : null}
          {recentsError ? <p className="mb-2 px-1 text-sm text-rose-300">{recentsError}</p> : null}
          {recentJobs.length === 0 && !isLoadingRecents && !recentsError ? (
            <p className="px-1 text-sm text-slate-400">No recent jobs in the last 7 days.</p>
          ) : null}
          {recentJobs.length > 0 ? (
            <ul className="min-h-0 flex-1 divide-y divide-slate-800/80 overflow-y-auto pr-1">
              {recentJobs.map((job) => {
                const isSelected = job.id === selectedJobId
                const isProcessing = !isTerminalStatus(job.status)
                return (
                  <li key={job.id}>
                    <button
                      type="button"
                      className={`w-full px-2 py-2 text-left transition sm:px-2.5 ${
                        isSelected
                          ? 'rounded-lg bg-sky-500/10 ring-1 ring-sky-500/60'
                          : 'rounded-lg hover:bg-slate-900/60'
                      }`}
                      onClick={() => onSelect(job.id)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${statusColorMap[job.status] ?? 'bg-slate-500'}`} />
                          <span className="truncate text-xs font-medium text-slate-200">{shortId(job.id)}</span>
                        </div>
                        {isProcessing ? <span className="h-3 w-3 animate-spin rounded-full border border-slate-500 border-t-sky-400" /> : null}
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2 text-xs text-slate-400">
                        <span>{job.status}</span>
                        <span>{formatRelativeDate(job.created_at, now)}</span>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  )
}

const isTerminalStatus = (status: string): boolean => status === 'completed' || status === 'failed'
