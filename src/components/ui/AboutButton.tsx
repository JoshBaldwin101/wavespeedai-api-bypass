import { useEffect, useState } from 'react'

export const AboutButton = ({ className = '' }: { className?: string }) => {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  return (
    <>
      <button
        type="button"
        aria-label="About this tool"
        title="About this tool"
        className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-600 text-slate-300 transition hover:border-sky-400 hover:bg-slate-800 hover:text-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${className}`}
        onClick={() => setIsOpen(true)}
      >
        <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path
            d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M12 17.25h.008v.008H12v-.008Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl shadow-black/40"
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id="about-dialog-title" className="text-lg font-semibold text-slate-50">
                About this tool
              </h2>
              <button
                type="button"
                aria-label="Close"
                className="-mr-1 -mt-1 shrink-0 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                onClick={() => setIsOpen(false)}
              >
                <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path d="M6 18 18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className="mt-3 space-y-4 text-sm leading-6 text-slate-300">
              <p>
                This tool exists primarily to circumvent the <b>safety checker</b> that is part of the WaveSpeedAI service.
              </p>
              <p>
                This tool cannot bypass safety checks enforced by the source AI providers (i.e. ByteDance, OpenAI, Google, etc.). so not everything is guaranteed to pass.
              </p>
              <h2 className="text-lg font-semibold text-slate-50">
                How does it work?
              </h2>
              <p>
                WaveSpeedAI uses a safety checker on their website to prevent certain kinds of content. The safety checker is visible at the bottom of the page as permenantly enabled.
                The information icon tells you that <i>"The safety checker cannot be disabled on the playground. This property is only available through the API."</i> This tool does exactly that, it uses the
                API to bypass the safety checker.
              </p>
              <h2 className="text-lg font-semibold text-slate-50">
                What about discounts on WaveSpeed?
              </h2>
              <p>
                Discounts are applied automatically by WaveSpeed. The pre-calculated price does NOT include discounts because their API doesn't calculate it either. It is expected
                that you will receive the discount when you are charged. But if you don't, this tool does not faciliate any billing, all billing is handled directly by WaveSpeed.
              </p>
              <h2 className="text-lg font-semibold text-slate-50">
                What is an API key? Is this safe?
              </h2>
              <p>
                An API key is your unique identifier for accessing the WaveSpeed API. It is not a password, and it is not stored in this tool. It is kept in memory only for your current session and is never written to
                browser storage. Do <b>NOT</b> share your API key with anyone. An API, or Application Programming Interface, is in this case a means to access the normal website functionality but through code. This tool utilizes that API for you.
              </p>
              <p>
                Regarding safety, generally yes this tool is safe to use. I have no idea the policies of WaveSpeed, but I have no reason to believe they would ban you for using this tool. Usage is of course at your own risk.
              </p>
              <h2 className="text-lg font-semibold text-slate-50">
                Why do they add a safety checker if you can just bypass it?
              </h2>
              <p>
                Typically, utilizing an API requires some technical knowledge. My personal theory is that WaveSpeed believes this requirement to be a filter strong enough to deter most low-effort abuse attempts 
                while gaining the benefit of being less technically obstructed with the safety checker disabled.
              </p>
              <h2 className="text-lg font-semibold text-slate-50">
                Do I need to behave?
              </h2>
              <p>
                Within reason and the law, yes. WaveSpeed can kill this tool fairly easily if they feel too much abuse comes from it. That's why I don't publicize this tool very much and hidden from search engines. Also anything you generate
                is tied to you still, it is <b>NOT</b> proxxied through me, and it is <b>NOT</b> anonymous.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
