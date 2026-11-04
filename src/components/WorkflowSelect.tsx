import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { WorkflowDefinition, WorkflowGroupDefinition } from '../lib/workflows'

export interface WorkflowSelectGroup extends WorkflowGroupDefinition {
  workflows: WorkflowDefinition[]
}

interface WorkflowSelectProps {
  groups: WorkflowSelectGroup[]
  value: string
  onChange: (workflowId: string) => void
}

const matchesQuery = (text: string, query: string): boolean => text.toLowerCase().includes(query)

export const WorkflowSelect = ({ groups, value, onChange }: WorkflowSelectProps) => {
  const listboxId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')

  const selectedLabel = useMemo(() => {
    for (const group of groups) {
      const match = group.workflows.find((workflow) => workflow.id === value)
      if (match) return match.label
    }
    return value
  }, [groups, value])

  const filteredGroups = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return groups

    return groups
      .map((group) => {
        const groupMatches = matchesQuery(group.label, normalized)
        const workflows = group.workflows.filter(
          (workflow) =>
            groupMatches || matchesQuery(workflow.label, normalized) || matchesQuery(workflow.id, normalized),
        )
        return { ...group, workflows }
      })
      .filter((group) => group.workflows.length > 0)
  }, [groups, query])

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
        setQuery('')
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        setQuery('')
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const frame = window.requestAnimationFrame(() => {
      searchRef.current?.focus()
      searchRef.current?.select()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [isOpen])

  const selectWorkflow = (workflowId: string) => {
    onChange(workflowId)
    setIsOpen(false)
    setQuery('')
  }

  return (
    <div ref={rootRef} className="relative mt-2 sm:mt-4">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-left text-sm font-medium text-slate-100 outline-none transition hover:border-slate-600 focus:ring-2 focus:ring-sky-500 sm:px-4 sm:py-3"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={() => {
          setIsOpen((previous) => !previous)
          if (isOpen) setQuery('')
        }}
      >
        <span className="min-w-0 truncate">{selectedLabel}</span>
        <svg
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 text-slate-400 transition ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen ? (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-2xl shadow-black/40">
          <div className="border-b border-slate-800 p-2">
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search workflows..."
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-sky-500"
              aria-label="Search workflows"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div id={listboxId} role="listbox" aria-label="Workflows" className="max-h-72 overflow-y-auto py-1">
            {filteredGroups.length === 0 ? (
              <p className="px-3 py-3 text-sm text-slate-400">No workflows match “{query.trim()}”.</p>
            ) : (
              filteredGroups.map((group) => (
                <div key={group.id} role="group" aria-label={group.label}>
                  <p className="sticky top-0 bg-slate-950/95 px-3 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase backdrop-blur">
                    {group.label}
                  </p>
                  {group.workflows.map((workflow) => {
                    const isSelected = workflow.id === value
                    return (
                      <button
                        key={workflow.id}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        className={`flex w-full px-3 py-2 text-left text-sm transition ${
                          isSelected
                            ? 'bg-sky-500/15 font-medium text-sky-100'
                            : 'text-slate-200 hover:bg-slate-900'
                        }`}
                        onClick={() => selectWorkflow(workflow.id)}
                      >
                        <span className="truncate">{workflow.label}</span>
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
