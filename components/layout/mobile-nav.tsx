'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Menu, WalletCards } from 'lucide-react'
import { cn } from '@/lib/utils'
import { navItems, navSections } from './nav-items'

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-sm font-medium shadow-card transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 lg:hidden">
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] bg-sidebar p-0 sm:w-[320px]">
        <SheetHeader className="border-b border-sidebar-border px-5 py-4">
          <SheetTitle className="flex items-center gap-2.5 text-left">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <WalletCards className="h-4 w-4" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">Finance Tracker</span>
          </SheetTitle>
        </SheetHeader>
        <nav className="mt-5 space-y-6 px-4 pb-6">
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
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground',
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-4 w-4',
                          isActive ? 'text-sidebar-primary-foreground' : 'text-muted-foreground/80',
                        )}
                      />
                      {item.title}
                    </Link>
                  )
                })}
              </div>
            )
          })}
        </nav>
      </SheetContent>
    </Sheet>
  )
}