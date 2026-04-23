'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const tabs = [
  { label: 'Profile', href: '/profile' },
  { label: 'Security', href: '/profile/security' },
]

export function ProfileNav() {
  const pathname = usePathname()

  return (
    <div className="flex gap-1 rounded-xl border border-border bg-muted/50 p-1 w-fit">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'rounded-lg px-5 py-1.5 text-sm font-medium transition-all duration-150',
              isActive
                ? 'bg-white shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
