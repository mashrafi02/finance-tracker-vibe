'use client'

import * as React from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme, type Theme } from './theme-provider'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const options: { value: Theme; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Toggle theme"
        className={cn(
          buttonVariants({ variant: 'outline', size: 'icon' }),
          'relative h-10 w-10 rounded-xl',
        )}
      >
        {/* CSS-only icon swap driven by the `.dark` class on <html> — avoids hydration state. */}
        <Sun className="h-4 w-4 transition-all duration-300 dark:scale-0 dark:-rotate-90 dark:opacity-0" />
        <Moon className="absolute h-4 w-4 scale-0 rotate-90 opacity-0 transition-all duration-300 dark:scale-100 dark:rotate-0 dark:opacity-100" />
        <span className="sr-only">Toggle theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[9rem]">
        {options.map((opt) => {
          const Icon = opt.icon
          const active = theme === opt.value
          return (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={cn('gap-2', active && 'font-semibold text-foreground')}
            >
              <Icon className="h-4 w-4" />
              {opt.label}
              {active ? (
                <span className="ml-auto text-xs text-muted-foreground">•</span>
              ) : null}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
