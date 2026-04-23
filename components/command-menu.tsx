'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import { Search } from 'lucide-react'

// Dynamic import keeps cmdk + the command palette UI out of the initial JS
// bundle on every authenticated page. The chunk only loads the first time
// the user opens the menu (⌘K or trigger click).
const CommandMenu = dynamic(() => import('./command-menu-dialog'), {
  ssr: false,
})

/**
 * Provider mount point: listens for ⌘K / Ctrl+K and renders the palette.
 * The palette component is only mounted once `open` flips to true, so its
 * JS chunk isn't downloaded until the user actually needs it.
 */
export function CommandMenuProvider() {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (!open) return null
  return <CommandMenu open={open} onOpenChange={setOpen} />
}

/**
 * Header trigger button — displays the ⌘K hint and opens the palette.
 */
const subscribeNoop = () => () => {}
const getIsMac = () =>
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
const getIsMacServer = () => false

export function CommandMenuTrigger() {
  const [open, setOpen] = React.useState(false)
  // Hydration-safe platform detection without setState-in-effect.
  const isMac = React.useSyncExternalStore(subscribeNoop, getIsMac, getIsMacServer)

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Pre-warm the dynamic chunk on hover/focus so the first open feels instant.
  const prefetch = React.useCallback(() => {
    void import('./command-menu-dialog')
  }, [])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        onMouseEnter={prefetch}
        onFocus={prefetch}
        aria-label="Open command menu"
        className="hidden h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm text-muted-foreground shadow-card transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 sm:inline-flex"
      >
        <Search className="h-4 w-4" />
        <span className="text-xs font-medium -mb-1">Search…</span>
        <kbd className="ml-2 hidden items-center gap-0.5 rounded-md border border-border/80 bg-background px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground md:inline-flex">
          <span className="text-[11px] -mb-1">{isMac ? '⌘' : 'Ctrl'} K</span>
        </kbd>
      </button>
      {open && <CommandMenu open={open} onOpenChange={setOpen} />}
    </>
  )
}
