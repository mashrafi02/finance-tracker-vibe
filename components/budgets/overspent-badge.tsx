import { Badge } from '@/components/ui/badge'
import { AlertTriangle } from 'lucide-react'

interface OverspentBadgeProps {
  isOverspent: boolean
  className?: string
}

export function OverspentBadge({ isOverspent, className }: OverspentBadgeProps) {
  if (!isOverspent) return null

  return (
    <Badge 
      variant="destructive" 
      className={`inline-flex items-center gap-1 border-destructive/20 ${className}`}
    >
      <AlertTriangle className="h-3 w-3" />
      Overspent
    </Badge>
  )
}