import { useEffect, useRef, useState } from 'react'
import type { DragEvent, ReactNode } from 'react'
import { uploadFile, WavespeedError } from '../lib/wavespeed'
import { Button } from './ui/Button'
import { Spinner } from './ui/Spinner'

type MediaKind = 'video' | 'image' | 'audio'

interface MediaUploadProps {
  apiKey: string
  kind: MediaKind
  label: ReactNode
  value: string[]
  multiple?: boolean
  maxItems?: number
  hint?: string
  required?: boolean
  onChange: (next: string[]) => void
}

const fileLimitBytes: Record<MediaKind, number> = {
  image: 20 * 1024 * 1024,
  video: 100 * 1024 * 1024,
  audio: 50 * 1024 * 1024,
}

const acceptMap: Record<MediaKind, string> = {
  image: 'image/*',
  video: 'video/*',
  audio: 'audio/*',
}

const typePrefixMap: Record<MediaKind, string> = {
  image: 'image/',
  video: 'video/',
  audio: 'audio/',
}

const acceptedTypesLabelMap: Record<MediaKind, string> = {
  image: '.png, .jpg, .jpeg, .webp, .gif, .bmp, .svg',
  video: '.mp4, .mov, .webm, .avi, .mkv, .mpeg',
  audio: '.mp3, .wav, .ogg, .m4a, .aac, .flac',
}

const DESKTOP_POINTER_QUERY = '(hover: hover) and (pointer: fine)'

export const MediaUpload = ({
  apiKey,
  hint,
  kind,
  label,
  maxItems,
  multiple = false,
  required = false,
  onChange,
  value,
}: MediaUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const urlInputRef = useRef<HTMLInputElement | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [directUrl, setDirectUrl] = useState('')
  const [isAddingUrl, setIsAddingUrl] = useState(false)
  const [showPreviews, setShowPreviews] = useState(true)
  const [isDesktop, setIsDesktop] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const dragDepthRef = useRef(0)

  useEffect(() => {
    if (isAddingUrl) {
      urlInputRef.current?.focus()
    }
  }, [isAddingUrl])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mediaQuery = window.matchMedia(DESKTOP_POINTER_QUERY)
    const syncDesktopState = () => {
      setIsDesktop(mediaQuery.matches)
    }

    syncDesktopState()
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', syncDesktopState)
      return () => mediaQuery.removeEventListener('change', syncDesktopState)
    }

    mediaQuery.addListener(syncDesktopState)
    return () => mediaQuery.removeListener(syncDesktopState)
  }, [])

  const isAtLimit = typeof maxItems === 'number' && value.length >= maxItems

  const buildMaxItemsError = (incomingCount: number): string => {
    const maxLabel = maxItems === 1 ? '1 file' : `${maxItems} files`
    const nextCount = value.length + incomingCount
    return `This field accepts at most ${maxLabel}. You currently have ${value.length} and tried to add ${incomingCount} more (total ${nextCount}).`
  }

  const validateLocalFile = (file: File): string | null => {
    if (!file.type.startsWith(typePrefixMap[kind])) {
      return `Please upload a ${kind} file: ${acceptedTypesLabelMap[kind]}`
    }

    if (file.size > fileLimitBytes[kind]) {
      const maxMb = Math.round(fileLimitBytes[kind] / (1024 * 1024))
      return `${kind} files must be under ${maxMb}MB.`
    }

    return null
  }

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    if (!apiKey) {
      setError('Please validate your API key first.')
      return
    }

    setError(null)
    setIsUploading(true)

    try {
      const selected = Array.from(files)
      if (typeof maxItems === 'number' && value.length + selected.length > maxItems) {
        throw new Error(buildMaxItemsError(selected.length))
      }

      const nextUrls: string[] = []

      for (const selectedFile of selected) {
        const localError = validateLocalFile(selectedFile)
        if (localError) {
          throw new Error(localError)
        }

        // Keep upload and payload ordering deterministic: each file is uploaded
        // and appended in the same sequence the user selected it.
        const uploaded = await uploadFile(apiKey, selectedFile, setProgress)
        nextUrls.push(uploaded.download_url)
      }

      onChange(multiple ? [...value, ...nextUrls] : nextUrls.slice(0, 1))
      setProgress(100)
    } catch (caughtError) {
      if (caughtError instanceof WavespeedError || caughtError instanceof Error) {
        setError(caughtError.message)
      } else {
        setError('Upload failed.')
      }
    } finally {
      setIsUploading(false)
      window.setTimeout(() => setProgress(0), 450)
    }
  }

  const handleRemove = (urlToRemove: string) => {
    onChange(value.filter((url) => url !== urlToRemove))
  }

  const validateRemoteUrl = (candidate: string): string | null => {
    try {
      const parsed = new URL(candidate)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return 'URL must start with http:// or https://.'
      }
      return null
    } catch {
      return 'Please enter a valid URL.'
    }
  }

  const commitUrl = (candidate: string): boolean => {
    const trimmed = candidate.trim()
    if (!trimmed) {
      setError('Please enter a file URL first.')
      return false
    }

    const urlError = validateRemoteUrl(trimmed)
    if (urlError) {
      setError(urlError)
      return false
    }

    if (typeof maxItems === 'number' && value.length + 1 > maxItems) {
      setError(buildMaxItemsError(1))
      return false
    }

    setError(null)
    onChange(multiple ? [...value, trimmed] : [trimmed])
    return true
  }

  const handleAddUrl = () => {
    if (!commitUrl(directUrl)) {
      urlInputRef.current?.focus()
      return
    }

    setDirectUrl('')
    setIsAddingUrl(false)
  }

  const handleStartAddingUrl = () => {
    setIsAddingUrl(true)
    setError(null)
  }

  const handleCancelAddUrl = () => {
    setIsAddingUrl(false)
    setDirectUrl('')
    setError(null)
  }

  const renderPreview = (url: string) => {
    if (!showPreviews) return null

    if (kind === 'video') {
      return <video className="aspect-video w-full rounded bg-black" controls preload="metadata" src={url} />
    }

    if (kind === 'audio') {
      return <audio className="w-full" controls preload="metadata" src={url} />
    }

    return <img className="max-h-52 w-full rounded object-contain sm:max-h-64" src={url} alt="Uploaded reference preview" />
  }

  const hasDropPayload = (dataTransfer: DataTransfer) => {
    const types = Array.from(dataTransfer.types)
    return types.includes('Files') || types.includes('text/uri-list') || types.includes('text/plain')
  }

  const extractDroppedUrl = (dataTransfer: DataTransfer): string | null => {
    const uriList = dataTransfer.getData('text/uri-list')
    const plainText = dataTransfer.getData('text/plain')
    const firstSource = uriList || plainText

    if (!firstSource) return null

    const candidates = firstSource
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))

    return candidates[0] ?? null
  }

  const resetDragState = () => {
    dragDepthRef.current = 0
    setIsDragging(false)
  }

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    if (!isDesktop || !hasDropPayload(event.dataTransfer)) return
    event.preventDefault()
    dragDepthRef.current += 1
    setIsDragging(true)
  }

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (!isDesktop || !hasDropPayload(event.dataTransfer)) return
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
    if (dragDepthRef.current === 0) {
      setIsDragging(false)
    }
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!isDesktop || !hasDropPayload(event.dataTransfer)) return
    event.preventDefault()
    event.dataTransfer.dropEffect = !isUploading && !isAtLimit ? 'copy' : 'none'
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    if (!isDesktop || !hasDropPayload(event.dataTransfer)) return
    event.preventDefault()
    resetDragState()

    if (isUploading) return

    const droppedFiles = event.dataTransfer.files
    if (droppedFiles.length > 0) {
      if (typeof maxItems === 'number' && value.length + droppedFiles.length > maxItems) {
        setError(buildMaxItemsError(droppedFiles.length))
        return
      }

      void handleFileSelect(droppedFiles)
      return
    }

    const droppedUrl = extractDroppedUrl(event.dataTransfer)
    if (!droppedUrl) {
      setError('Drop a local file or a valid media URL.')
      return
    }

    commitUrl(droppedUrl)
  }

  return (
    <div
      className={`relative space-y-1.5 rounded-lg border bg-slate-900/50 p-3 sm:space-y-2 sm:p-4 ${
        isDesktop && isDragging ? 'border-sky-500/70' : 'border-slate-800'
      }`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="min-w-0 space-y-0.5">
          <p className="text-sm font-medium text-slate-100">
            {label}
            {required ? <span className="ml-1 text-rose-400">*</span> : null}
          </p>
          {hint || typeof maxItems === 'number' ? (
            <p className="text-xs text-slate-400">
              {hint ? <span>{hint}</span> : null}
              {hint && typeof maxItems === 'number' ? <span className="px-1.5 text-slate-600">&middot;</span> : null}
              {typeof maxItems === 'number' ? (
                <span className="text-slate-500">Up to {maxItems === 1 ? '1 file' : `${maxItems} files`}</span>
              ) : null}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {value.length > 1 ? (
            <Button
              className="px-2.5 py-1 text-xs sm:px-3 sm:py-2"
              variant="ghost"
              onClick={() => setShowPreviews((prev) => !prev)}
            >
              {showPreviews ? 'Hide previews' : 'Show previews'}
            </Button>
          ) : null}
          <Button
            className="px-3 py-1.5 text-xs sm:px-3.5 sm:py-2.5 sm:text-sm"
            variant="secondary"
            disabled={isAtLimit}
            onClick={() => fileInputRef.current?.click()}
          >
            {multiple ? 'Upload files' : 'Upload file'}
          </Button>
          <Button className="px-2.5 py-1 text-xs sm:px-3 sm:py-2" variant="ghost" disabled={isAtLimit} onClick={handleStartAddingUrl}>
            Add URL
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        className="hidden"
        type="file"
        accept={acceptMap[kind]}
        multiple={multiple}
        onChange={(event) => {
          void handleFileSelect(event.target.files)
          event.currentTarget.value = ''
        }}
      />

      {error ? <p className="text-xs text-rose-300">{error}</p> : null}

      {isUploading ? (
        <div className="space-y-2">
          <Spinner label="Uploading to WaveSpeed..." />
          <div className="h-2 rounded-full bg-slate-800">
            <div
              className="h-2 rounded-full bg-sky-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : null}

      {value.length > 0 || isAddingUrl ? (
        <ul className="space-y-1.5 pt-1 sm:space-y-2">
          {isAddingUrl ? (
            <li className="space-y-2 rounded border border-sky-500/40 bg-slate-950/70 p-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  ref={urlInputRef}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-500 sm:text-sm"
                  placeholder="Paste file URL (https://...)"
                  value={directUrl}
                  onChange={(event) => {
                    setDirectUrl(event.target.value)
                    if (error) setError(null)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      handleAddUrl()
                    }
                    if (event.key === 'Escape') {
                      handleCancelAddUrl()
                    }
                  }}
                />
                <div className="flex shrink-0 gap-2">
                  <Button className="px-3 py-2 text-xs sm:text-sm" variant="secondary" onClick={handleAddUrl}>
                    Use URL
                  </Button>
                  <Button className="px-3 py-2 text-xs sm:text-sm" variant="ghost" onClick={handleCancelAddUrl}>
                    Cancel
                  </Button>
                </div>
              </div>
            </li>
          ) : null}
          {value.map((url) => (
            <li
              key={url}
              className="space-y-2 rounded border border-slate-700 bg-slate-950/70 p-2"
            >
              {renderPreview(url)}
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                <code className="max-w-full overflow-x-auto text-xs text-slate-300">{url}</code>
                <Button variant="ghost" className="justify-start sm:justify-center" onClick={() => handleRemove(url)}>
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {isDesktop && isDragging ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-sky-400/80 bg-sky-500/10 p-4 text-center text-xs font-medium text-sky-100 sm:text-sm">
          {isAtLimit ? 'Attachment limit reached' : `Drop ${multiple ? kind + ' files' : kind + ' file'} here`}
        </div>
      ) : null}
    </div>
  )
}
