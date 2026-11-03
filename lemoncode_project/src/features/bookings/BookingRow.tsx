import { Link } from '@tanstack/react-router'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
import type { BookingStatus, BookingWithService } from '#/lib/api/types'
import { toMadrid } from '#/lib/dates'
import {
  bookingStatusLabel,
  dayParts,
  formatDayFull,
  formatTimeRange,
  formatWeekday,
  modeLabel,
} from '#/lib/format'

export const statusVariant = {
  confirmada: 'success',
  pendiente_pago: 'warning',
  completada: 'secondary',
  cancelada: 'destructive-outline',
} as const satisfies Record<BookingStatus, string>

export function bookingWhen(booking: BookingWithService) {
  const start = toMadrid(booking.start)
  const end = toMadrid(booking.end)
  return {
    date: start.date,
    time: start.time,
    label: `${formatWeekday(start.date)} · ${formatTimeRange(start.time, end.time)}`,
  }
}

// Fila de Tus reservas (HANDOFF §5.5). Las acciones dependen de la pestaña.
export function BookingRow({
  booking,
  tab,
  onCancel,
  onRate,
}: {
  booking: BookingWithService
  tab: 'proximas' | 'pasadas' | 'canceladas'
  onCancel: (booking: BookingWithService) => void
  onRate: (booking: BookingWithService) => void
}) {
  const when = bookingWhen(booking)
  const { service } = booking

  return (
    <article className="flex flex-col gap-3 rounded-xl border bg-card p-3.5 md:flex-row md:flex-wrap md:items-center md:gap-5 md:py-4 md:pr-5 md:pl-4">
      <div className="flex flex-1 items-start gap-3.5 md:items-center md:gap-5">
        <DateTile date={when.date} />
        <div className="flex min-w-0 flex-1 flex-col gap-1 md:gap-1.5">
          <div className="flex flex-col-reverse items-start gap-1 md:flex-row md:flex-wrap md:items-center md:gap-2.5">
            <h2 className="font-display text-[17px] leading-[22px] font-semibold md:text-h3">
              {service.name}
            </h2>
            <Badge variant={statusVariant[booking.status]}>
              {bookingStatusLabel[booking.status]}
            </Badge>
          </div>
          <p className="text-caption text-muted-foreground md:text-sm">
            <span className="sr-only">{formatDayFull(when.date)}, </span>
            {when.label} · {modeLabel[service.mode]}
            <span className="hidden md:inline">
              {' '}
              · con {service.professional.name}
            </span>
          </p>
        </div>
      </div>

      {tab === 'proximas' && (
        <div className="grid grid-cols-2 gap-2 md:flex">
          <Button asChild variant="outline" size="sm" className="h-11 md:h-10">
            <Link
              to="/reservar/$slug"
              params={{ slug: service.slug }}
              search={{ reprogramar: booking.id }}
            >
              Reprogramar
              <span className="sr-only"> {service.name}</span>
            </Link>
          </Button>
          <Button
            variant="destructive-outline"
            size="sm"
            className="h-11 font-medium md:h-10"
            onClick={() => onCancel(booking)}
          >
            Cancelar
            <span className="sr-only"> {service.name}</span>
          </Button>
        </div>
      )}

      {tab === 'pasadas' && (
        <div className="grid grid-cols-2 gap-2 md:flex">
          <Button
            variant="outline"
            size="sm"
            className="h-11 md:h-10"
            disabled={booking.rated}
            onClick={() => onRate(booking)}
          >
            {booking.rated ? 'Valorada' : 'Valorar'}
            <span className="sr-only"> {service.name}</span>
          </Button>
          <Button asChild size="sm" className="h-11 md:h-10">
            <Link to="/servicios/$slug" params={{ slug: service.slug }}>
              Volver a reservar
              <span className="sr-only"> {service.name}</span>
            </Link>
          </Button>
        </div>
      )}
    </article>
  )
}

/** Mes en mono sobre foreground y día en display (HANDOFF §5.5). */
export function DateTile({ date }: { date: string }) {
  const parts = dayParts(date)
  return (
    <div
      aria-hidden
      className="w-14 shrink-0 overflow-hidden rounded-lg bg-secondary text-center md:w-16"
    >
      <div className="bg-foreground py-0.5 font-mono text-[11px] leading-4 font-semibold tracking-[0.08em] text-background uppercase md:py-1 md:text-xs">
        {parts.month}
      </div>
      <div className="font-display text-[22px] leading-[34px] font-bold md:text-[28px] md:leading-10">
        {parts.day.padStart(2, '0')}
      </div>
    </div>
  )
}

export function BookingRowSkeleton() {
  return (
    <div
      aria-hidden
      className="flex items-center gap-4 rounded-xl border bg-card p-3.5 md:p-4"
    >
      <Skeleton className="h-[52px] w-14 md:h-14 md:w-16" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <Skeleton className="hidden h-10 w-48 md:block" />
    </div>
  )
}
