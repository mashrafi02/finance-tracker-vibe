import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DeltaChipProps {
  delta: number | null
  positiveIsGood?: boolean
}

export function DeltaChip({ delta, positiveIsGood = true }: DeltaChipProps) {
  if (delta === null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
        <Minus className="h-3 w-3" /> new
      </span>
    )
  }
  const rounded = Math.round(delta * 10) / 10
  const up = rounded > 0
  const flat = rounded === 0
  const good = flat ? true : up === positiveIsGood
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums',
        flat && 'bg-muted text-muted-foreground',
        !flat && good && 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
        !flat && !good && 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
      )}
    >
      <Icon className="h-3 w-3" />
      {flat ? '0%' : `${up ? '+' : ''}${rounded}%`}
    </span>
  )
}
