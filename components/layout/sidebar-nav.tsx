'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { WalletCards } from 'lucide-react'
import { cn } from '@/lib/utils'
import { navItems } from './nav-items'

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-72 shrink-0 border-r border-sidebar-border bg-sidebar/95 px-5 py-6 lg:block">
      <div className="sticky top-6 flex h-[calc(100vh-3rem)] flex-col">
        <div className="mb-10 flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm ring-1 ring-black/5">
            <WalletCards className="h-5 w-5" />
          </span>
          <div>
            <p className="text-base font-semibold tracking-tight text-sidebar-foreground">Finance Tracker</p>
            <p className="text-xs font-medium text-muted-foreground">Smart money overview</p>
          </div>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'border-sidebar-foreground/10 bg-sidebar-accent text-sidebar-foreground shadow-sm'
                    : 'border-transparent text-muted-foreground hover:border-sidebar-border hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'
                )}
              >
                <span
                  className={cn(
                    'inline-flex h-7 w-7 items-center justify-center rounded-lg transition-colors',
                    isActive
                      ? 'bg-sidebar-foreground text-sidebar'
                      : 'bg-muted text-muted-foreground group-hover:bg-sidebar-foreground group-hover:text-sidebar'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                {item.title}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
