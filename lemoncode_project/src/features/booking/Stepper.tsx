import { Check } from 'lucide-react'

import { cn } from '#/lib/utils'

export const BOOKING_STEPS = [
  'Fecha y hora',
  'Datos y pago',
  'Confirmación',
] as const

export type BookingStep = 1 | 2 | 3

// Stepper de escritorio (HANDOFF §5.4): actual en primary, completado en foreground con check.
export function Stepper({
  step,
  className,
}: {
  step: BookingStep
  className?: string
}) {
  return (
    <ol
      aria-label="Pasos de la reserva"
      className={cn('flex flex-wrap items-center gap-3 text-sm', className)}
    >
      {BOOKING_STEPS.map((label, i) => {
        const n = i + 1
        const current = n === step
        const done = n < step
        return (
          <li
            key={label}
            aria-current={current ? 'step' : undefined}
            className="flex items-center gap-2.5 font-medium"
          >
            <span
              className={cn(
                'grid size-7 place-items-center rounded-full font-mono text-[13px] font-semibold',
                current && 'bg-primary text-primary-foreground',
                done && 'bg-foreground text-background',
                !current &&
                  !done &&
                  'border border-input bg-background text-muted-foreground',
              )}
            >
              {done ? (
                <Check aria-hidden className="size-3.5" strokeWidth={3} />
              ) : (
                n
              )}
            </span>
            <span
              className={cn(
                current || done
                  ? 'font-semibold text-foreground'
                  : 'text-muted-foreground',
              )}
            >
              {label}
              {done && <span className="sr-only"> (completado)</span>}
            </span>
            {n < BOOKING_STEPS.length && (
              <span aria-hidden className="ml-0.5 h-px w-10 bg-input" />
            )}
          </li>
        )
      })}
    </ol>
  )
}
