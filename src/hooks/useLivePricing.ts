import { useEffect, useState } from 'react'
import type { ModelPricing } from '../lib/types'
import { getModelPricing, WavespeedError } from '../lib/wavespeed'

const formatLivePrice = (value: number, currency: string): string => {
  const formatted = value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  })
  return currency === 'USD' ? `$${formatted}` : `${formatted} ${currency}`
}

interface UseLivePricingParams {
  apiKey: string
  pricingModelId: string
  pricingInput: Record<string, unknown> | null
}

interface UseLivePricingResult {
  livePricing: ModelPricing | null
  isPricingLoading: boolean
}

export const useLivePricing = ({
  apiKey,
  pricingModelId,
  pricingInput,
}: UseLivePricingParams): UseLivePricingResult => {
  const [livePricing, setLivePricing] = useState<ModelPricing | null>(null)
  const [isPricingLoading, setIsPricingLoading] = useState(false)

  useEffect(() => {
    if (!pricingInput) return

    let cancelled = false

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          if (!cancelled) {
            setIsPricingLoading(true)
          }
          const pricing = await getModelPricing(apiKey, pricingModelId, pricingInput)
          if (!cancelled) {
            setLivePricing(pricing)
          }
        } catch (caughtError) {
          if (cancelled) return
          if (!(caughtError instanceof WavespeedError || caughtError instanceof Error)) {
            setLivePricing(null)
            return
          }
          setLivePricing(null)
        } finally {
          if (!cancelled) {
            setIsPricingLoading(false)
          }
        }
      })()
    }, 500)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [apiKey, pricingModelId, pricingInput])

  return {
    livePricing: pricingInput ? livePricing : null,
    isPricingLoading: pricingInput ? isPricingLoading : false,
  }
}

interface BuildSubmitLabelArgs {
  isSubmitting: boolean
  isPricingLoading: boolean
  livePricing: ModelPricing | null
  submitLabel: string
}

export const buildSubmitLabel = ({
  isSubmitting,
  isPricingLoading,
  livePricing,
  submitLabel,
}: BuildSubmitLabelArgs): string => {
  if (isSubmitting) return 'Submitting...'
  if (isPricingLoading) return 'Calculating price...'
  if (livePricing) return `Generate ${formatLivePrice(livePricing.unit_price, livePricing.currency)}`
  return submitLabel
}
