'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { WalletCards } from 'lucide-react'
import { cn } from '@/lib/utils'
import { navItems, navSections } from './nav-items'

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
      <div className="sticky top-0 flex h-screen flex-col px-4 py-5">
        {/* Brand */}
        <Link href="/" className="mb-8 flex items-center gap-2.5 px-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <WalletCards className="h-4 w-4" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-sidebar-foreground">
            Finance Tracker
          </span>
        </Link>

        {/* Nav sections */}
        <nav className="flex-1 space-y-6 overflow-y-auto">
          {navSections.map((section) => {
            const items = navItems.filter((i) => i.section === section.id)
            if (items.length === 0) return null
            return (
              <div key={section.id} className="space-y-1">
                <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
                  {section.label}
                </p>
                {items.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground',
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-4 w-4 transition-colors',
                          isActive
                            ? 'text-sidebar-primary-foreground'
                            : 'text-muted-foreground/80 group-hover:text-sidebar-foreground',
                        )}
                      />
                      <span className="truncate">{item.title}</span>
                    </Link>
                  )
                })}
              </div>
            )
          })}
        </nav>

        {/* Footer blurb */}
        <div className="mt-6 rounded-xl border border-sidebar-border bg-muted/40 p-3">
          <p className="text-[11px] font-medium leading-snug text-muted-foreground">
            Track income, expenses and budgets at a glance.
          </p>
        </div>
      </div>
    </aside>
  )
}
