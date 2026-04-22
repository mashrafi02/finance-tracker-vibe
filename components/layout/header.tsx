'use client'

import { usePathname } from 'next/navigation'
import { LogoutButton } from '@/components/auth/logout-button'
import { MobileNav } from './mobile-nav'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { CommandMenuTrigger } from '@/components/command-menu'
import { navItems } from './nav-items'

interface HeaderProps {
  user: {
    email: string
  }
}

function usePageTitle() {
  const pathname = usePathname()
  const match = navItems.find((n) => n.href === pathname)
  return match?.title ?? 'Overview'
}

export function Header({ user }: HeaderProps) {
  const title = usePageTitle()
  const initial = user.email?.[0]?.toUpperCase() ?? '?'

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="lg:hidden">
            <MobileNav />
          </div>
          <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <CommandMenuTrigger />
          <ThemeToggle />
          <div className="hidden h-10 items-center gap-2.5 rounded-xl border border-border bg-card px-2 pr-3 shadow-card sm:inline-flex">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
              {initial}
            </span>
            <span className="max-w-[160px] truncate text-xs font-semibold text-foreground">
              {user.email}
            </span>
          </div>
          <LogoutButton />
        </div>
      </div>
    </header>
  )
}