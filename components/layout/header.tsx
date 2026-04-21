import Link from 'next/link'
import { LogoutButton } from '@/components/auth/logout-button'
import { MobileNav } from './mobile-nav'
import { WalletCards } from 'lucide-react'

interface HeaderProps {
  user: {
    email: string
  }
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="lg:hidden">
            <MobileNav />
          </div>

          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm lg:hidden">
              <WalletCards className="h-4 w-4" />
            </span>
            <div>
              <p className="text-base font-semibold tracking-tight">Finance Tracker</p>
              <p className="text-xs font-medium text-muted-foreground">Personal money workspace</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm font-medium text-muted-foreground sm:block">{user.email}</span>
          <LogoutButton />
        </div>
      </div>
    </header>
  )
}