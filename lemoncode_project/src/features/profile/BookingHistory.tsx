import { Link } from '@tanstack/react-router'

import { Badge } from '#/components/ui/badge'
import { Skeleton } from '#/components/ui/skeleton'
import {
  DateTile,
  bookingWhen,
  statusVariant,
} from '#/features/bookings/BookingRow'
import type { BookingWithService } from '#/lib/api/types'
import {
  bookingStatusLabel,
  formatDayWithYear,
  formatPrice,
  modeLabel,
} from '#/lib/format'

/** Todas las reservas del cliente, de la más reciente a la más antigua. */
export function BookingHistory({
  items,
  loading,
}: {
  items: BookingWithService[]
  loading: boolean
}) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2" aria-hidden>
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-[72px]" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aún no has hecho ninguna reserva.{' '}
        <Link
          to="/servicios"
          className="rounded-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Explora el catálogo
        </Link>
      </p>
    )
  }

  return (
    <ol className="flex flex-col divide-y">
      {[...items]
        .sort((a, b) => b.start.localeCompare(a.start))
        .map((booking) => {
          const when = bookingWhen(booking)
          const { service } = booking
          return (
            <li
              key={booking.id}
              className="flex items-center gap-3.5 py-3 first:pt-0 last:pb-0"
            >
              <DateTile date={when.date} />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <Link
                    to="/servicios/$slug"
                    params={{ slug: service.slug }}
                    className="truncate rounded-sm font-semibold underline-offset-4 hover:underline"
                  >
                    {service.name}
                  </Link>
                  <Badge variant={statusVariant[booking.status]}>
                    {bookingStatusLabel[booking.status]}
                  </Badge>
                </div>
                <p className="text-caption text-muted-foreground">
                  {formatDayWithYear(when.date)} · {when.label} ·{' '}
                  {modeLabel[service.mode]}
                  <span className="hidden md:inline">
                    {' '}
                    · con {service.professional.name}
                  </span>
                </p>
              </div>
              <span className="shrink-0 font-mono text-sm">
                {formatPrice(service.priceCents)}
              </span>
            </li>
          )
        })}
    </ol>
  )
}
