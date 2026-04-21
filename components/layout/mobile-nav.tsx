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
import { navItems } from './nav-items'

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 lg:hidden">
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-[320px] bg-sidebar p-0 sm:w-[360px]">
        <SheetHeader className="border-b border-sidebar-border p-5">
          <SheetTitle className="flex items-center gap-3 text-left">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <WalletCards className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-base font-semibold tracking-tight">Finance Tracker</span>
              <span className="block text-xs font-medium text-muted-foreground">Quick navigation</span>
            </span>
          </SheetTitle>
        </SheetHeader>
        <nav className="mt-6 flex flex-col gap-2 px-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-sidebar-foreground/10 bg-sidebar-accent text-sidebar-foreground'
                    : 'border-transparent text-muted-foreground hover:border-sidebar-border hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'
                )}
              >
                <span
                  className={cn(
                    'inline-flex h-7 w-7 items-center justify-center rounded-lg',
                    isActive
                      ? 'bg-sidebar-foreground text-sidebar'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                {item.title}
              </Link>
            )
          })}
        </nav>
      </SheetContent>
    </Sheet>
  )
}