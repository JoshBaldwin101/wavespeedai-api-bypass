import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PredictionListItem, PredictionResult } from '../lib/types'
import { listPredictions, pollPrediction } from '../lib/wavespeed'

const RECENTS_POLL_MS = 5000
const POLLING_STATUSES = new Set(['created', 'queued', 'pending', 'processing'])

const isTerminalStatus = (status: string): boolean => status === 'completed' || status === 'failed'

const extractPredictionId = (predictionUrlOrId: string): string => {
  if (!predictionUrlOrId.startsWith('http')) {
    return predictionUrlOrId
  }

  const match = predictionUrlOrId.match(/\/predictions\/([^/]+)/)
  return match?.[1] ?? predictionUrlOrId
}

const toPredictionResult = (item: PredictionListItem): PredictionResult => ({
  id: item.id,
  status: item.status,
  model: item.model,
  outputs: item.outputs,
  urls: item.urls,
  created_at: item.created_at,
  error: item.error,
  executionTime: item.executionTime,
  timings: item.timings,
})

interface UseJobsParams {
  apiKey: string
  modelNeedles: string[]
  showWorkflowJobsOnly: boolean
}

export const useJobs = ({ apiKey, modelNeedles, showWorkflowJobsOnly }: UseJobsParams) => {
  const [jobsById, setJobsById] = useState<Record<string, PredictionResult>>({})
  const [recentIds, setRecentIds] = useState<string[]>([])
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [pollingJobId, setPollingJobId] = useState<string | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isLoadingRecents, setIsLoadingRecents] = useState(false)
  const [recentsError, setRecentsError] = useState<string | null>(null)
  const [lastRefreshedAt, setLastRefreshedAt] = useState<number | null>(null)

  const activeControllerRef = useRef<AbortController | null>(null)
  const elapsedTimerRef = useRef<number | null>(null)
  const refreshInFlightRef = useRef(false)
  const lastRefreshAttemptRef = useRef(0)

  const modelNeedlesKey = modelNeedles.join('|').toLowerCase()
  const normalizedNeedles = useMemo(() => modelNeedles.map((item) => item.toLowerCase()), [modelNeedlesKey])

  const mergeJob = useCallback((job: PredictionResult) => {
    setJobsById((previous) => ({
      ...previous,
      [job.id]: {
        ...previous[job.id],
        ...job,
      },
    }))
  }, [])

  const stopElapsedTimer = useCallback(() => {
    if (!elapsedTimerRef.current) return
    window.clearInterval(elapsedTimerRef.current)
    elapsedTimerRef.current = null
  }, [])

  const cancelActive = useCallback(() => {
    activeControllerRef.current?.abort()
    activeControllerRef.current = null
    setPollingJobId(null)
    stopElapsedTimer()
  }, [stopElapsedTimer])

  const refreshRecents = useCallback(async () => {
    if (refreshInFlightRef.current) {
      return
    }

    const now = Date.now()
    if (now - lastRefreshAttemptRef.current < 500) {
      return
    }

    refreshInFlightRef.current = true
    lastRefreshAttemptRef.current = now
    setIsLoadingRecents(true)
    setRecentsError(null)
    try {
      const response = await listPredictions(apiKey, { page: 1, page_size: 100 })
      const filtered = response.items.filter((item) => {
        if (!showWorkflowJobsOnly) return true
        if (!item.model) return false
        const model = item.model.toLowerCase()
        return normalizedNeedles.some((needle) => model.includes(needle))
      })

      const nextById: Record<string, PredictionResult> = {}
      for (const item of filtered) {
        nextById[item.id] = toPredictionResult(item)
      }

      setJobsById((previous) => {
        const merged = { ...previous }
        for (const [id, job] of Object.entries(nextById)) {
          merged[id] = {
            ...merged[id],
            ...job,
          }
        }
        return merged
      })

      setRecentIds(filtered.map((item) => item.id))
      setLastRefreshedAt(Date.now())
      setSelectedJobId((previous) => {
        if (!previous) return filtered[0]?.id ?? null
        return filtered.some((item) => item.id === previous) ? previous : filtered[0]?.id ?? null
      })
    } catch (error) {
      if (error instanceof Error) {
        setRecentsError(error.message)
      } else {
        setRecentsError('Could not load recent jobs.')
      }
    } finally {
      refreshInFlightRef.current = false
      setIsLoadingRecents(false)
    }
  }, [apiKey, normalizedNeedles, showWorkflowJobsOnly])

  const track = useCallback(
    async (predictionUrlOrId: string) => {
      const predictionId = extractPredictionId(predictionUrlOrId)
      setSelectedJobId(predictionId)
      setPollingJobId(predictionId)
      mergeJob({ id: predictionId, status: 'pending' })

      const controller = new AbortController()
      activeControllerRef.current?.abort()
      activeControllerRef.current = controller

      const startTime = Date.now()
      stopElapsedTimer()
      setElapsedSeconds(0)
      elapsedTimerRef.current = window.setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)

      try {
        const final = await pollPrediction(apiKey, predictionUrlOrId, controller.signal, (update) => {
          mergeJob(update)
          setSelectedJobId((previous) => previous ?? update.id)
        })
        mergeJob(final)
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          mergeJob({
            id: predictionId,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Polling failed.',
          })
        }
      } finally {
        if (activeControllerRef.current === controller) {
          activeControllerRef.current = null
          setPollingJobId(null)
          stopElapsedTimer()
          void refreshRecents()
        }
      }
    },
    [apiKey, mergeJob, refreshRecents, stopElapsedTimer],
  )

  const select = useCallback(
    (jobId: string) => {
      setSelectedJobId(jobId)
      const job = jobsById[jobId]
      if (!job || isTerminalStatus(job.status) || pollingJobId === jobId) return
      const target = job.urls?.get ?? job.id
      void track(target)
    },
    [jobsById, pollingJobId, track],
  )

  const reset = useCallback(() => {
    cancelActive()
    setJobsById({})
    setRecentIds([])
    setSelectedJobId(null)
    setElapsedSeconds(0)
    setRecentsError(null)
    setLastRefreshedAt(null)
  }, [cancelActive])

  useEffect(() => {
    reset()
  }, [apiKey, reset])

  const hasInFlightJobs = useMemo(
    () =>
      pollingJobId !== null ||
      Object.values(jobsById).some((job) => POLLING_STATUSES.has(job.status) && !isTerminalStatus(job.status)),
    [jobsById, pollingJobId],
  )

  useEffect(() => {
    void refreshRecents()
  }, [refreshRecents])

  useEffect(() => {
    if (!hasInFlightJobs) return
    const interval = window.setInterval(() => {
      void refreshRecents()
    }, RECENTS_POLL_MS)

    return () => {
      window.clearInterval(interval)
    }
  }, [hasInFlightJobs, refreshRecents])

  useEffect(() => {
    return () => {
      cancelActive()
      stopElapsedTimer()
    }
  }, [cancelActive, stopElapsedTimer])

  const selectedJob = selectedJobId ? jobsById[selectedJobId] ?? null : null

  return {
    jobsById,
    recentIds,
    selectedJobId,
    selectedJob,
    pollingJobId,
    elapsedSeconds,
    isLoadingRecents,
    recentsError,
    lastRefreshedAt,
    refreshRecents,
    track,
    select,
    cancelActive,
    reset,
  }
}
