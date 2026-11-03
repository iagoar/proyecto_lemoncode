import { useQuery } from '@tanstack/react-query'
import { Mail, Phone } from 'lucide-react'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
import {
  DateTile,
  bookingWhen,
  statusVariant,
} from '#/features/bookings/BookingRow'
import { bookingsQueries } from '#/lib/api/bookings'
import { bookingStatusLabel, formatDayFull, modeLabel } from '#/lib/format'

// "Mis servicios" del profesional: próximas sesiones que otras personas han
// reservado de sus servicios, con los datos de contacto del cliente.
export function UpcomingSessions() {
  const query = useQuery(bookingsQueries.received())
  const items = query.data ?? []

  return (
    <section
      aria-labelledby="proximas-sesiones"
      className="flex flex-col gap-4 rounded-xl border bg-card p-4 md:p-6"
    >
      <div className="flex flex-col gap-1">
        <h2 id="proximas-sesiones" className="text-h3 font-semibold">
          Próximas sesiones
          {query.data && items.length > 0 && (
            <span className="ml-2 font-mono text-base font-normal text-muted-foreground">
              {items.length}
            </span>
          )}
        </h2>
        <p className="text-sm text-muted-foreground">
          Reservas de tus servicios hechas por clientes.
        </p>
      </div>

      {query.isPending ? (
        <div className="flex flex-col gap-2" aria-hidden>
          {Array.from({ length: 2 }, (_, i) => (
            <Skeleton key={i} className="h-[72px]" />
          ))}
        </div>
      ) : query.isError ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm">No hemos podido cargar tus sesiones.</p>
          <Button variant="outline" onClick={() => query.refetch()}>
            Reintentar
          </Button>
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aún no tienes sesiones reservadas. Cuando un cliente reserve uno de
          tus servicios publicados, aparecerá aquí.
        </p>
      ) : (
        <ol className="flex flex-col divide-y">
          {items.map((booking) => {
            const when = bookingWhen(booking)
            const { contact } = booking
            return (
              <li
                key={booking.id}
                className="flex items-start gap-3.5 py-3 first:pt-0 last:pb-0 md:items-center"
              >
                <DateTile date={when.date} />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h3 className="font-semibold">{booking.service.name}</h3>
                    <Badge variant={statusVariant[booking.status]}>
                      {bookingStatusLabel[booking.status]}
                    </Badge>
                  </div>
                  <p className="text-caption text-muted-foreground md:text-sm">
                    <span className="sr-only">
                      {formatDayFull(when.date)},{' '}
                    </span>
                    {when.label} · {modeLabel[booking.service.mode]}
                  </p>
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <span className="font-medium">{contact.name}</span>
                    <a
                      href={`mailto:${contact.email}`}
                      className="inline-flex min-h-8 items-center gap-1 rounded-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                      <Mail aria-hidden className="size-3.5" />
                      {contact.email}
                    </a>
                    {contact.phone && (
                      <a
                        href={`tel:${contact.phone}`}
                        className="inline-flex min-h-8 items-center gap-1 rounded-sm font-mono text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                      >
                        <Phone aria-hidden className="size-3.5" />
                        {contact.phone}
                      </a>
                    )}
                  </p>
                  {booking.notes && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Nota:</span>{' '}
                      {booking.notes}
                    </p>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
