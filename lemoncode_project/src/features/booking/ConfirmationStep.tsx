import { Link } from '@tanstack/react-router'
import { CalendarPlus, Check } from 'lucide-react'

import { Button } from '#/components/ui/button'
import type { Booking, ServiceWithProfessional } from '#/lib/api/types'
import { toMadrid } from '#/lib/dates'
import { formatDayLong, formatTimeRange } from '#/lib/format'
import { downloadIcs } from '#/lib/ics'
import { SummaryRow } from './BookingSummary'

// Paso 3 (HANDOFF §5.4). En móvil las acciones van en una barra inferior fija.
export function ConfirmationStep({
  service,
  booking,
}: {
  service: ServiceWithProfessional
  booking: Booking
}) {
  const start = toMadrid(booking.start)
  const end = toMadrid(booking.end)
  const online = service.mode === 'online'

  function addToCalendar() {
    downloadIcs({
      id: booking.id,
      title: `${service.name} · rumbo.`,
      description: `Sesión con ${service.professional.name}.`,
      location: online ? 'Videollamada' : undefined,
      start: booking.start,
      end: booking.end,
    })
  }

  return (
    <section
      aria-labelledby="reserva-ok"
      className="flex w-full flex-col items-center gap-5 self-center px-2 pt-[max(env(safe-area-inset-top),4rem)] text-center md:max-w-[560px] md:rounded-2xl md:border md:bg-card md:p-10"
    >
      <div
        aria-hidden
        className="grid size-[72px] place-items-center rounded-[22px] bg-success text-success-foreground md:size-16 md:rounded-[20px]"
      >
        <Check className="size-9 md:size-8" strokeWidth={2.5} />
      </div>
      <div className="flex flex-col gap-1.5">
        <h2 id="reserva-ok" className="text-h2 font-bold md:font-semibold">
          ¡Reserva confirmada!
        </h2>
        <p className="text-muted-foreground">
          {online
            ? 'Te hemos enviado los detalles y el enlace de la videollamada por email.'
            : 'Te hemos enviado los detalles y la dirección por email.'}
        </p>
      </div>
      <dl className="grid w-full grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 rounded-xl border bg-card p-4 text-left md:border-0 md:bg-canvas md:p-5">
        <SummaryRow label="Servicio">{service.name}</SummaryRow>
        <SummaryRow label="Fecha">{formatDayLong(start.date)}</SummaryRow>
        <SummaryRow label="Hora" mono>
          {formatTimeRange(start.time, end.time)}
        </SummaryRow>
        <SummaryRow label="Pago">
          {booking.paymentMethod === 'tarjeta'
            ? 'Pagado con tarjeta'
            : 'Pendiente · en la sesión'}
        </SummaryRow>
      </dl>
      <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col-reverse gap-2 bg-canvas px-4 pt-3 pb-[max(env(safe-area-inset-bottom),1rem)] md:static md:w-full md:flex-row md:gap-3 md:bg-transparent md:p-0">
        <Button
          variant="outline"
          size="xl"
          className="font-semibold md:h-12 md:flex-1"
          onClick={addToCalendar}
        >
          <CalendarPlus aria-hidden />
          Añadir al calendario
        </Button>
        <Button asChild size="xl" className="md:h-12 md:flex-1">
          <Link to="/reservas" search={{ confirmada: booking.id }}>
            Ver mis reservas
          </Link>
        </Button>
      </div>
    </section>
  )
}
