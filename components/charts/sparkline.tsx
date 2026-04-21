'use client'

import { Line, LineChart, ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/utils'

interface SparklineProps {
  data: { value: number }[]
  className?: string
  colorClass?: string
}

/**
 * Minimal, axisless line chart for summary cards.
 * Uses currentColor so it inherits from Tailwind text-* on the parent.
 */
export function Sparkline({ data, className, colorClass = 'text-foreground/70' }: SparklineProps) {
  if (!data || data.length === 0) {
    return <div className={cn('h-10 w-full rounded-md bg-muted/40', className)} />
  }
  return (
    <div className={cn('h-10 w-full', colorClass, className)}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke="currentColor"
            strokeWidth={1.75}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
