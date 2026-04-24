'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ReceiptText, Tags, Sprout } from 'lucide-react'
import { cn } from '@/lib/utils'

const bottomNavItems = [
  { title: 'Dashboard',     href: '/',             icon: LayoutDashboard },
  { title: 'Transactions',  href: '/transactions', icon: ReceiptText },
  { title: 'Categories',    href: '/categories',   icon: Tags },
  { title: 'Savings',       href: '/savings',      icon: Sprout },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'flex items-stretch border-t border-border bg-background',
        'sm:hidden',
        'pb-[env(safe-area-inset-bottom)]',
      )}
      aria-label="Mobile navigation"
    >
      {bottomNavItems.map((item) => {
        const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
        const Icon = item.icon

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 py-2.5',
              'text-[10px] font-medium tracking-wide transition-colors duration-150',
              isActive
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon
              className={cn(
                'h-5 w-5 transition-transform duration-150',
                isActive ? 'scale-110' : 'scale-100',
              )}
              aria-hidden="true"
            />
            <span>{item.title}</span>
          </Link>
        )
      })}
    </nav>
  )
}
