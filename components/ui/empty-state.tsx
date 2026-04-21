import * as React from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'relative isolate flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/70 bg-gradient-to-b from-muted/30 via-background to-background px-6 py-12 text-center',
        className,
      )}
    >
      {/* Decorative soft glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-10 top-0 -z-10 h-24 rounded-full bg-foreground/5 blur-3xl dark:bg-foreground/10"
      />
      {icon ? (
        <div className="relative inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-border/60 bg-card text-muted-foreground shadow-sm [&>svg]:h-6 [&>svg]:w-6">
          {icon}
        </div>
      ) : null}
      <div className="max-w-sm space-y-1.5">
        <h3 className="text-base font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        {description ? (
          <p className="text-sm font-medium text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  )
}
