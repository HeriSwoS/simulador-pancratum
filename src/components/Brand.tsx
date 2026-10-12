import { Crown } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2.5 font-display text-lg font-bold tracking-[0.16em] text-[#f0d77b]',
        className,
      )}
    >
      <span className="brand-mark">
        <Crown className="h-5 w-5" />
      </span>
      {!compact && <span>PANCRATUM</span>}
    </span>
  )
}
