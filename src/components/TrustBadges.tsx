import { ShieldCheck, CreditCard, BadgeCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

const BADGES = [
  { icon: ShieldCheck, text: 'Pagos 100% seguros' },
  { icon: CreditCard, text: 'Aceptamos PayPal' },
  { icon: BadgeCheck, text: 'Resultados medibles' },
] as const

export function TrustBadges({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center justify-center gap-x-8 gap-y-3', className)}>
      {BADGES.map(({ icon: Icon, text }) => (
        <div key={text} className="flex items-center gap-2 text-sm font-medium text-[color:var(--color-ink-soft)]">
          <Icon className="h-5 w-5 text-[color:var(--color-brand)]" />
          {text}
        </div>
      ))}
    </div>
  )
}
