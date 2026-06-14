import { useRef, useState } from 'react'
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
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

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

  return (
    <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-100">
          {label}
          {required ? <span className="ml-1 text-rose-400">*</span> : null}
        </p>
        <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
          {multiple ? 'Upload files' : 'Upload file'}
        </Button>
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

      {hint ? <p className="text-xs text-slate-400">{hint}</p> : null}
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

      {value.length > 0 ? (
        <ul className="space-y-2 pt-1">
          {value.map((url) => (
            <li
              key={url}
              className="flex flex-col gap-2 rounded border border-slate-700 bg-slate-950/70 p-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <code className="max-w-full overflow-x-auto text-xs text-slate-300">{url}</code>
              <Button variant="ghost" className="justify-start sm:justify-center" onClick={() => handleRemove(url)}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
