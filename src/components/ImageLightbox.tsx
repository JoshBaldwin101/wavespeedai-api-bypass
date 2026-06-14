interface ImageLightboxProps {
  open: boolean
  src: string | null
  alt: string
  onClose: () => void
}

export const ImageLightbox = ({ open, src, alt, onClose }: ImageLightboxProps) => {
  if (!open || !src) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-3 backdrop-blur-sm sm:p-5"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl overflow-auto rounded-xl border border-slate-700 bg-slate-900/90 p-2 sm:p-3"
        role="dialog"
        aria-modal="true"
        aria-label="Expanded image preview"
        onClick={(event) => event.stopPropagation()}
      >
        <img className="mx-auto block h-auto min-w-full rounded-lg" src={src} alt={alt} />
      </div>
    </div>
  )
}
