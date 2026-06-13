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
        <h1 className="text-2xl font-semibold text-slate-100">WaveSpeedAI API Tool</h1>
        <p className="mt-2 text-sm text-slate-300">
          Paste your WaveSpeed API key to begin. This app <strong className="font-semibold text-slate-100">never</strong> stores keys in browser storage.
        </p>

        <label className="mt-6 block text-sm font-medium text-slate-200" htmlFor="api-key-input">
          API key
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <div className="relative">
              <input
                id="api-key-input"
                autoComplete="off"
                spellCheck={false}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2.5 pr-11 pl-4 text-slate-100 outline-none ring-sky-500 transition focus:ring-2"
                placeholder="wsk_live_..."
                type={isRevealed ? 'text' : 'password'}
                value={apiKey}
                onChange={(event) => {
                  setApiKey(event.target.value.trim())
                  setMessage(null)
                  setError(null)
                }}
              />
              <button
                aria-label="Hold to view API key"
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
                title="Hold to view"
                type="button"
                onMouseDown={() => setIsRevealed(true)}
                onMouseUp={() => setIsRevealed(false)}
                onMouseLeave={() => setIsRevealed(false)}
                onTouchStart={() => setIsRevealed(true)}
                onTouchEnd={() => setIsRevealed(false)}
                onTouchCancel={() => setIsRevealed(false)}
              >
                {isRevealed ? (
                  <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path
                      d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path
                      d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            </div>
            {!startsWithPrefix && apiKey.length > 0 ? (
              <p className="mt-2 text-xs text-amber-300">
                API keys should start with <code>wsk_live_</code>.
              </p>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:w-48 sm:grid-cols-1">
            <button
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 transition hover:bg-slate-700"
              type="button"
              onClick={handlePaste}
            >
              Paste
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
