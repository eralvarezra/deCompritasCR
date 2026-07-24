import { MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const WHATSAPP_NUMBER = '50663365661'
const WHATSAPP_MESSAGE =
  'Hola, quiero información sobre sus servicios de publicidad en redes sociales.'

function whatsAppLink(): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`
}

interface WhatsAppButtonProps {
  variant?: 'button' | 'floating'
  className?: string
  label?: string
}

export function WhatsAppButton({
  variant = 'button',
  className,
  label = 'Cotizar por WhatsApp',
}: WhatsAppButtonProps) {
  if (variant === 'floating') {
    return (
      <a
        href={whatsAppLink()}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Escríbenos por WhatsApp"
        className={cn(
          'fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center',
          'rounded-full bg-[color:var(--color-whatsapp)] text-white',
          'shadow-lg shadow-black/20 transition-transform hover:scale-105',
          className
        )}
      >
        <MessageCircle className="h-7 w-7" fill="white" />
      </a>
    )
  }

  return (
    <a
      href={whatsAppLink()}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full',
        'bg-[color:var(--color-whatsapp)] px-6 py-3 font-semibold text-white',
        'shadow-md transition-transform hover:scale-105',
        className
      )}
    >
      <MessageCircle className="h-5 w-5" fill="white" />
      {label}
    </a>
  )
}
