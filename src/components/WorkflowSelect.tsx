import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { WorkflowDefinition, WorkflowGroupDefinition } from '../lib/workflows'

export interface WorkflowSelectGroup extends WorkflowGroupDefinition {
  workflows: WorkflowDefinition[]
}

interface WorkflowSelectProps {
  groups: WorkflowSelectGroup[]
  value: string
  onChange: (workflowId: string) => void
}

interface MenuPosition {
  left: number
  width: number
  maxHeight: number
  top: number | null
  bottom: number | null
}

const MENU_GAP = 8
const VIEWPORT_MARGIN = 8
// Search row plus a few options. Below this, open upward so the menu stays on screen.
const USABLE_MENU_HEIGHT = 160

const matchesQuery = (text: string, query: string): boolean => text.toLowerCase().includes(query)

const positionsMatch = (current: MenuPosition | null, next: MenuPosition): boolean =>
  current !== null &&
  current.left === next.left &&
  current.width === next.width &&
  current.maxHeight === next.maxHeight &&
  current.top === next.top &&
  current.bottom === next.bottom

const measureMenuPosition = (anchor: HTMLElement): MenuPosition => {
  const rect = anchor.getBoundingClientRect()
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  let width = Math.round(rect.width)
  const maxWidth = Math.max(0, viewportWidth - VIEWPORT_MARGIN * 2)
  if (width > maxWidth) width = maxWidth

  let left = Math.round(rect.left)
  if (left < VIEWPORT_MARGIN) left = VIEWPORT_MARGIN
  if (left + width > viewportWidth - VIEWPORT_MARGIN) {
    left = Math.max(VIEWPORT_MARGIN, viewportWidth - VIEWPORT_MARGIN - width)
  }

  const spaceBelow = Math.floor(viewportHeight - rect.bottom - MENU_GAP - VIEWPORT_MARGIN)
  const spaceAbove = Math.floor(rect.top - MENU_GAP - VIEWPORT_MARGIN)
  const openBelow = spaceBelow >= USABLE_MENU_HEIGHT || spaceBelow >= spaceAbove

  if (openBelow) {
    return {
      left,
      width,
      top: Math.round(rect.bottom + MENU_GAP),
      bottom: null,
      maxHeight: Math.max(spaceBelow, 0),
    }
  }

  return {
    left,
    width,
    top: null,
    bottom: Math.round(viewportHeight - rect.top + MENU_GAP),
    maxHeight: Math.max(spaceAbove, 0),
  }
}

export const WorkflowSelect = ({ groups, value, onChange }: WorkflowSelectProps) => {
  const listboxId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [position, setPosition] = useState<MenuPosition | null>(null)

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

  useLayoutEffect(() => {
    if (!isOpen) {
      setPosition(null)
      return
    }

    const anchor = rootRef.current
    if (!anchor) return

    const updatePosition = () => {
      const currentAnchor = rootRef.current
      if (!currentAnchor) return
      const next = measureMenuPosition(currentAnchor)
      setPosition((current) => (positionsMatch(current, next) ? current : next))
    }

    updatePosition()

    const handleScroll = (event: Event) => {
      const target = event.target
      if (target instanceof Node && menuRef.current?.contains(target)) return
      updatePosition()
    }

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', handleScroll, true)
    const observer = new ResizeObserver(updatePosition)
    observer.observe(anchor)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', handleScroll, true)
      observer.disconnect()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setIsOpen(false)
      setQuery('')
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

  const menuStyle = position
    ? {
        visibility: 'visible' as const,
        pointerEvents: 'auto' as const,
        left: position.left,
        width: position.width,
        maxHeight: position.maxHeight,
        ...(position.top === null ? { bottom: position.bottom ?? 0 } : { top: position.top }),
      }
    : {
        visibility: 'hidden' as const,
        pointerEvents: 'none' as const,
        top: 0,
        left: 0,
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

      {isOpen
        ? createPortal(
            <div
              ref={menuRef}
              className="fixed z-40 flex flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-2xl shadow-black/40"
              style={menuStyle}
            >
              <div className="shrink-0 border-b border-slate-800 p-2">
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

              <div
                id={listboxId}
                role="listbox"
                aria-label="Workflows"
                className="min-h-0 max-h-72 overflow-y-auto overscroll-contain py-1"
              >
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
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
