import * as React from 'react'
import { cn } from '@/lib/utils'

interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Delay in ms before the animation starts. */
  delay?: number
  /** Disable the animation entirely (useful for reduced-motion parents). */
  disabled?: boolean
  as?: 'div' | 'section' | 'article' | 'header'
}

/**
 * Server-friendly entrance animation wrapper.
 * Applies `animate-fade-up` with an optional stagger delay.
 * Respects `prefers-reduced-motion` via the global reset in `globals.css`.
 */
export function Reveal({
  className,
  style,
  delay = 0,
  disabled,
  as = 'div',
  ...props
}: RevealProps) {
  const Tag = as as React.ElementType
  return (
    <Tag
      className={cn(!disabled && 'motion-safe:animate-fade-up', className)}
      style={{
        animationDelay: delay ? `${delay}ms` : undefined,
        animationFillMode: 'both',
        ...style,
      }}
      {...props}
    />
  )
}
