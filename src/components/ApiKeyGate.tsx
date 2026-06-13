import { useMemo, useState } from 'react'
import { useApiKey } from '../context/useApiKey'
import { WavespeedError, validateKey } from '../lib/wavespeed'

const API_KEY_PREFIX = 'wsk_live_'

export const ApiKeyGate = () => {
  const { apiKey, setApiKey, setValidated } = useApiKey()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRevealed, setIsRevealed] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const startsWithPrefix = useMemo(() => apiKey.startsWith(API_KEY_PREFIX), [apiKey])
  const canTest = apiKey.length > 0 && startsWithPrefix && !isSubmitting

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (!text) return
      setApiKey(text.trim())
      setMessage(null)
      setError(null)
    } catch {
      setError('Clipboard access was blocked. Paste manually with Ctrl+V.')
    }
  }

  const handleValidate = async () => {
    if (!canTest) return
    setIsSubmitting(true)
    setMessage(null)
    setError(null)

    try {
      await validateKey(apiKey)
      setValidated(true)
      setMessage('API key is valid. You can continue.')
    } catch (caughtError) {
      setValidated(false)
      if (caughtError instanceof WavespeedError) {
        setError(caughtError.message)
      } else {
        setError('Could not validate this key right now.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center p-6">
      <section className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-black/20">
        <h1 className="text-2xl font-semibold text-slate-100">WaveSpeedAI API Bypass</h1>
        <p className="mt-2 text-sm text-slate-300">
          Paste your WaveSpeed API key to begin. This app never stores keys in browser storage.
        </p>

        <label className="mt-6 block text-sm font-medium text-slate-200" htmlFor="api-key-input">
          API key
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <input
              id="api-key-input"
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-slate-100 outline-none ring-sky-500 transition focus:ring-2"
              placeholder="wsk_live_..."
              type={isRevealed ? 'text' : 'password'}
              value={apiKey}
              onChange={(event) => {
                setApiKey(event.target.value.trim())
                setMessage(null)
                setError(null)
              }}
            />
            {!startsWithPrefix && apiKey.length > 0 ? (
              <p className="mt-2 text-xs text-amber-300">
                API keys should start with <code>wsk_live_</code>.
              </p>
            ) : null}
          </div>
          <div className="grid grid-cols-3 gap-2 sm:w-64 sm:grid-cols-1">
            <button
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 transition hover:bg-slate-700"
              type="button"
              onClick={handlePaste}
            >
              Paste
            </button>
            <button
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 transition hover:bg-slate-700"
              type="button"
              onMouseDown={() => setIsRevealed(true)}
              onMouseUp={() => setIsRevealed(false)}
              onMouseLeave={() => setIsRevealed(false)}
              onTouchStart={() => setIsRevealed(true)}
              onTouchEnd={() => setIsRevealed(false)}
              onTouchCancel={() => setIsRevealed(false)}
            >
              Hold to view
            </button>
            <button
              className="rounded-lg bg-sky-500 px-3 py-2 text-sm font-medium text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
              type="button"
              disabled={!canTest}
              onClick={handleValidate}
            >
              {isSubmitting ? 'Testing...' : 'Test key'}
            </button>
          </div>
        </div>

        {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
        {message ? <p className="mt-4 text-sm text-emerald-300">{message}</p> : null}

        <p className="mt-5 text-sm text-slate-300">
          Need a key? Create one in your WaveSpeed dashboard:{' '}
          <a
            className="text-sky-300 underline decoration-sky-500/40 underline-offset-2 hover:text-sky-200"
            href="https://wavespeed.ai/accesskey"
            target="_blank"
            rel="noreferrer"
          >
            wavespeed.ai/accesskey
          </a>
        </p>
      </section>
    </main>
  )
}
