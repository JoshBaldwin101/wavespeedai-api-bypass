import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
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

export const MediaUpload = ({
  apiKey,
  hint,
  kind,
  label,
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

  useEffect(() => {
    if (isAddingUrl) {
      urlInputRef.current?.focus()
    }
  }, [isAddingUrl])

  const validateLocalFile = (file: File): string | null => {
    if (!file.type.startsWith(typePrefixMap[kind])) {
      return `Please upload a ${kind} file.`
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

  const handleAddUrl = () => {
    const trimmed = directUrl.trim()
    if (!trimmed) {
      setError('Please enter a file URL first.')
      urlInputRef.current?.focus()
      return
    }

    const urlError = validateRemoteUrl(trimmed)
    if (urlError) {
      setError(urlError)
      return
    }

    setError(null)
    onChange(multiple ? [...value, trimmed] : [trimmed])
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

  return (
    <div className="space-y-1.5 rounded-lg border border-slate-800 bg-slate-900/50 p-3 sm:space-y-2 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-100">
          {label}
          {required ? <span className="ml-1 text-rose-400">*</span> : null}
        </p>
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
          <Button className="px-3 py-1.5 text-xs sm:px-3.5 sm:py-2.5 sm:text-sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
            {multiple ? 'Upload files' : 'Upload file'}
          </Button>
          <Button className="px-2.5 py-1 text-xs sm:px-3 sm:py-2" variant="ghost" onClick={handleStartAddingUrl}>
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

      {hint ? <p className="hidden text-xs text-slate-400 sm:block">{hint}</p> : null}
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
    </div>
  )
}
