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

export interface CommandMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * The heavy part of the command palette (cmdk + radix dialog + theme
 * provider dependency). Split out so it can be dynamic-imported and only
 * shipped to the client when the user actually opens the menu.
 */
export default function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
  const router = useRouter()
  const { setTheme } = useTheme()

  const run = React.useCallback(
    (fn: () => void) => {
      onOpenChange(false)
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
