'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useCurrency } from '@/contexts/currency-context'

interface StatCardProps {
  title: string
  value: number
  isCurrency?: boolean
  suffix?: string
  icon: React.ReactNode
  iconToneClass: string
  subtitle: string
  valueColorClass?: string
  isLoading?: boolean
}

export function StatCard({
  title,
  value,
  isCurrency = true,
  suffix,
  icon,
  iconToneClass,
  subtitle,
  valueColorClass,
  isLoading,
}: StatCardProps) {
  const { formatCurrency } = useCurrency()
  const displayValue = isCurrency
    ? formatCurrency(value)
    : `${value}${suffix ?? ''}`

  return (
    <Card className="h-full w-full min-w-0 overflow-hidden">
      <CardContent className="flex h-full flex-col gap-3 p-5">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
              iconToneClass,
            )}
          >
            {icon}
          </span>
          <span className="text-xs font-semibold text-muted-foreground">{title}</span>
        </div>

        {isLoading ? (
          <div className="flex flex-1 flex-col gap-2 py-1">
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ) : (
          <>
            <span
              className={cn(
                'truncate font-mono text-2xl font-semibold leading-none tracking-tight tabular-nums',
                valueColorClass,
              )}
              title={displayValue}
            >
              {displayValue}
            </span>
            <p className="mt-auto text-[11px] font-medium text-muted-foreground">
              {subtitle}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
