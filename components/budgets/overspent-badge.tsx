import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OverspentBadgeProps {
  isOverspent: boolean
  className?: string
}

export function OverspentBadge({ isOverspent, className }: OverspentBadgeProps) {
  if (!isOverspent) return null

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
        className,
      )}
    >
      <AlertTriangle className="h-3 w-3" />
      Overspent
    </span>
  )
}