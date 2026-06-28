import { useMemo, useState } from 'react'
import step1and2 from '../assets/step1and2.png'
import step3 from '../assets/step3.png'
import { AboutButton } from './ui/AboutButton'
import { ConfirmDialog } from './ui/ConfirmDialog'
import { useApiKey } from '../context/useApiKey'
import { WavespeedError, validateKey } from '../lib/wavespeed'

const API_KEY_PREFIX = 'wsk_live_'

export const ApiKeyGate = () => {
  const { apiKey, setApiKey, setValidated } = useApiKey()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRevealed, setIsRevealed] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showTestKeyConfirm, setShowTestKeyConfirm] = useState(false)
  const [isGuideOpen, setIsGuideOpen] = useState(false)

  const startsWithPrefix = useMemo(() => apiKey.startsWith(API_KEY_PREFIX), [apiKey])
  const canTest = apiKey.length > 0 && startsWithPrefix && !isSubmitting

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
        const statusSuffix = caughtError.status > 0 ? ` (HTTP ${caughtError.status})` : ''
        setError(`${caughtError.message}${statusSuffix}`)
      } else {
        setError('Could not validate this key right now.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-full items-start p-3 sm:max-w-4xl sm:items-center sm:p-6">
      <section className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl shadow-black/20 sm:p-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-slate-100">WaveSpeedAI API Tool</h1>
          <AboutButton />
        </div>
        <p className="mt-2 text-sm text-slate-300">
          Paste your WaveSpeed API key to begin. Keys are only stored in this browser if you enable{' '}
          <strong className="font-semibold text-slate-100">Save settings on this device</strong> after signing in.
        </p>

        <label className="mt-6 block text-sm font-medium text-slate-200" htmlFor="api-key-input">
          API key
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1">
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
            <p className="mt-2 text-sm text-slate-300">
              Need a key? Create one for your WaveSpeed account:{' '}
              <a
                className="text-sky-300 underline decoration-sky-500/40 underline-offset-2 hover:text-sky-200"
                href="https://wavespeed.ai/accesskey"
                target="_blank"
                rel="noreferrer"
              >
                wavespeed.ai/accesskey
              </a>
            </p>
            <p className="mt-2 text-sm text-slate-300">Stuck? Read the guide below.</p>
            {!startsWithPrefix && apiKey.length > 0 ? (
              <p className="mt-2 text-xs text-amber-300">
                API keys should start with <code>wsk_live_</code>.
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 sm:w-32">
            <button
              className="w-full rounded-lg bg-sky-500 px-3 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
              type="button"
              disabled={!canTest}
              onClick={() => setShowTestKeyConfirm(true)}
            >
              {isSubmitting ? 'Testing...' : 'Test key'}
            </button>
          </div>
        </div>

        {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
        {message ? <p className="mt-4 text-sm text-emerald-300">{message}</p> : null}

        <div className="mt-6 border-t border-slate-800 pt-4">
          <button
            type="button"
            className="flex w-full items-center gap-2.5 text-left text-sm font-medium text-slate-200 transition hover:text-slate-50"
            aria-expanded={isGuideOpen}
            aria-controls="api-key-guide-content"
            onClick={() => setIsGuideOpen((open) => !open)}
          >
            <span
              aria-hidden="true"
              className={`inline-block shrink-0 border-y-[5px] border-l-[8px] border-y-transparent border-l-white transition-transform duration-200 ${
                isGuideOpen ? 'translate-y-px rotate-90' : ''
              }`}
            />
            WaveSpeedAI API Key Guide
          </button>
          {isGuideOpen ? (
            <div
              id="api-key-guide-content"
              className="api-key-guide mt-4 space-y-6 text-sm leading-6 text-slate-300"
            >
              <p>
                To create a key, go to your{' '}
                <a
                  className="text-sky-300 underline decoration-sky-500/40 underline-offset-2 hover:text-sky-200"
                  href="https://wavespeed.ai/accesskey"
                  target="_blank"
                  rel="noreferrer"
                >
                  WaveSpeed API Keys
                </a>
                {' '}and follow the steps below.
              </p>

              <ol>
                <li>
                  <p className="font-medium text-slate-100">Name your key and create it</p>
                  <p className="mt-1">
                    Enter any label you will recognize later, such as <strong className="font-medium text-slate-200">"my key"</strong>,
                    then click <strong className="font-medium text-slate-200">Create Key</strong>.
                  </p>
                  <figure className="mt-3">
                    <img
                      src={step1and2}
                      alt="WaveSpeed API key form with a name entered and the Create Key button visible"
                    />
                    <figcaption>Type a name, then click Create Key.</figcaption>
                  </figure>
                </li>
                <li>
                  <p className="font-medium text-slate-100">Copy your new key</p>
                  <p className="mt-1">
                    After the key is generated, click the blue <strong className="font-medium text-slate-200">Copy key</strong> button.
                    Paste it into the field at the top of this page.
                  </p>
                  <figure className="mt-3">
                    <img
                      src={step3}
                      alt="Generated WaveSpeed API key with the Copy key button highlighted"
                    />
                    <figcaption>Copy the key, then paste it above and click Test key.</figcaption>
                  </figure>
                  <p className="mt-3 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2.5 text-amber-100">
                    <strong className="font-medium text-amber-50">Keep it private:</strong> Do not share your API key with
                    anyone. Anyone who has it can access your WaveSpeed account and spend your credits. It is best practice to routinely delete and remake keys.
                  </p>
                </li>
              </ol>
            </div>
          ) : null}
        </div>
      </section>

      <ConfirmDialog
        open={showTestKeyConfirm}
        title="Before you continue"
        dialogClassName="max-w-lg"
        confirmLabel="Proceed"
        confirmVariant="primary"
        requireAcknowledgment
        description={
          <div className="space-y-4">
            <p>
              <span className="font-semibold text-slate-100">Risk agreement:</span> By clicking &ldquo;I understand&rdquo;, you
              understand that using this tool may incur unexpected or additional costs and that using this tool involves doing so
              at your own risk. Using this tool means you understand that your use may or may not be in compliance with third
              party services involved; this is at your own risk of WaveSpeedAI's penalties
            </p>
            <p>
              <span className="font-semibold text-slate-100">Privacy disclosure:</span> The creator and host of this tool does
              NOT see your API key, balance, prompts, videos, images, inputs, outputs, or anything. It is entirely within your
              own browser. The creator does not gain or suffer from your use or misuse of the tool in any capacity. No financial
              cut is taken whatsoever. No personal data is collected. Anonymized visitor metrics (like monthly visitors) are
              counted via GoatCounter.
            </p>
          </div>
        }
        onCancel={() => setShowTestKeyConfirm(false)}
        onConfirm={() => {
          setShowTestKeyConfirm(false)
          void handleValidate()
        }}
      />
    </main>
  )
}
