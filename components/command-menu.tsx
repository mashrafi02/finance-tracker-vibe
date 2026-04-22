'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import { navItems } from '@/components/layout/nav-items'
import { Plus, Search, Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '@/components/theme/theme-provider'

interface CommandMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
  const router = useRouter()
  const { setTheme } = useTheme()

  const run = React.useCallback(
    (fn: () => void) => {
      onOpenChange(false)
      // Defer to let the dialog close animation start.
      requestAnimationFrame(fn)
    },
    [onOpenChange],
  )

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search or run a command…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <CommandItem
                key={item.href}
                onSelect={() => run(() => router.push(item.href))}
                value={`navigate ${item.title}`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.title}</span>
              </CommandItem>
            )
          })}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => run(() => router.push('/transactions?new=1'))}
            value="new transaction add create"
          >
            <Plus className="h-4 w-4" />
            <span>New transaction</span>
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => run(() => router.push('/transactions'))}
            value="search filter transactions"
          >
            <Search className="h-4 w-4" />
            <span>Search transactions</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Theme">
          <CommandItem onSelect={() => run(() => setTheme('light'))} value="theme light">
            <Sun className="h-4 w-4" />
            <span>Light</span>
          </CommandItem>
          <CommandItem onSelect={() => run(() => setTheme('dark'))} value="theme dark">
            <Moon className="h-4 w-4" />
            <span>Dark</span>
          </CommandItem>
          <CommandItem onSelect={() => run(() => setTheme('system'))} value="theme system">
            <Monitor className="h-4 w-4" />
            <span>System</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

/**
 * Provider mount point: listens for ⌘K / Ctrl+K and renders the palette.
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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open command menu"
        className="hidden h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm text-muted-foreground shadow-card transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 sm:inline-flex"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">Search…</span>
        <kbd className="ml-2 hidden items-center gap-0.5 rounded-md border border-border/80 bg-background px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground md:inline-flex">
          <span className="text-[11px]">{isMac ? '⌘' : 'Ctrl'}</span>K
        </kbd>
      </button>
      <CommandMenu open={open} onOpenChange={setOpen} />
    </>
  )
}
