import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, Navigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { ChevronLeft } from 'lucide-react'
import { useCallback, useState } from 'react'
import { z } from 'zod'

import { StatePage } from '#/components/StatePage'
import { Button } from '#/components/ui/button'
import { Progress } from '#/components/ui/progress'
import { Skeleton } from '#/components/ui/skeleton'
import { CancellationPolicy } from '#/components/CancellationPolicy'
import { BookingSummary, slotRange } from '#/features/booking/BookingSummary'
import { ConfirmationStep } from '#/features/booking/ConfirmationStep'
import { DateTimeStep } from '#/features/booking/DateTimeStep'
import {
  DETAILS_FORM_ID,
  DetailsStep,
  type DetailsSubmit,
} from '#/features/booking/DetailsStep'
import {
  BOOKING_STEPS,
  Stepper,
  type BookingStep,
} from '#/features/booking/Stepper'
import { useBookingDraft } from '#/features/booking/useBookingDraft'
import { availabilityQueries } from '#/lib/api/availability'
import { bookings, bookingsQueries } from '#/lib/api/bookings'
import { servicesQueries } from '#/lib/api/services'
import type { ServiceWithProfessional } from '#/lib/api/types'
import { nowInMadrid, toMadrid } from '#/lib/dates'
import { formatDayLong, formatPrice } from '#/lib/format'
import { cn } from '#/lib/utils'

const reservarSearchSchema = z.object({
  paso: z.coerce.number().int().min(1).max(3).optional().catch(undefined),
  reprogramar: z.string().optional().catch(undefined),
})

// HANDOFF §5.4: una ruta, tres pasos en ?paso=. En móvil, layout de flujo sin tab bar.
// Con ?reprogramar=:id reutiliza el paso 1 y confirma el cambio (HANDOFF §5.5).
export const Route = createFileRoute('/_cliente/reservar/$slug')({
  validateSearch: (search) => reservarSearchSchema.parse(search),
  staticData: { hideMobileNav: true },
  head: () => ({ meta: [{ title: 'Reservar · rumbo.' }] }),
  component: BookingPage,
})

function BookingPage() {
  const { slug } = Route.useParams()
  const { reprogramar } = Route.useSearch()
  const query = useQuery(servicesQueries.detail(slug))

  if (query.isPending) return <BookingSkeleton />

  if (query.isError) {
    return (
      <StatePage
        eyebrow="Error"
        title="No hemos podido cargar el servicio"
        text="Comprueba tu conexión y vuelve a intentarlo."
        action={<Button onClick={() => query.refetch()}>Reintentar</Button>}
      />
    )
  }

  if (!query.data) {
    return (
      <StatePage
        eyebrow="Error 404"
        title="No encontramos este servicio"
        text="Puede que ya no esté disponible o que el enlace no sea correcto."
      />
    )
  }

  return reprogramar ? (
    <RescheduleFlow service={query.data} bookingId={reprogramar} />
  ) : (
    <BookingFlow service={query.data} />
  )
}

function BookingFlow({ service }: { service: ServiceWithProfessional }) {
  const { user } = Route.useRouteContext()
  const step = (Route.useSearch().paso ?? 1) as BookingStep
  const navigate = Route.useNavigate()
  const queryClient = useQueryClient()
  const [today] = useState(() => nowInMadrid().date)
  // Entrar en el paso 1 con una reserva ya hecha empieza una nueva.
  const { draft, update } = useBookingDraft(service.slug, { fresh: step === 1 })

  const goTo = (paso: BookingStep) => navigate({ search: { paso } })

  const create = useMutation({
    mutationFn: (values: DetailsSubmit) =>
      bookings.create({
        serviceId: service.id,
        date: draft.date!,
        time: draft.time!,
        ...values,
      }),
    onSuccess: (booking) => {
      update({ bookingId: booking.id })
      queryClient.invalidateQueries({ queryKey: availabilityQueries.all })
      queryClient.invalidateQueries({ queryKey: bookingsQueries.all })
      navigate({ search: { paso: 3 }, replace: true })
    },
  })

  const onDetailsChange = useCallback(
    (values: DetailsSubmit) => update(values),
    [update],
  )

  // Guardas: no se salta a 2 sin día y hora, ni a 3 sin reserva creada.
  const hasSlot = Boolean(draft.date && draft.time)
  const validStep: BookingStep = draft.bookingId ? 3 : hasSlot ? 2 : 1
  if (step > validStep || (step < 3 && draft.bookingId)) {
    return (
      <Navigate
        to="/reservar/$slug"
        params={{ slug: service.slug }}
        search={{ paso: validStep }}
        replace
      />
    )
  }

  const price = formatPrice(service.priceCents)
  const payCta =
    draft.paymentMethod === 'tarjeta' && service.priceCents
      ? `Pagar ${price} y confirmar`
      : 'Confirmar reserva'
  const range = slotRange(draft.time, service.durationMin)

  const primaryCta = (size: 'lg' | 'xl', className?: string) =>
    step === 1 ? (
      <Button
        size={size}
        variant={draft.time ? 'default' : 'pending'}
        disabled={!draft.time}
        className={className}
        onClick={() => goTo(2)}
      >
        {draft.time ? (
          'Continuar'
        ) : (
          <>
            <span className="md:hidden">Elige una hora</span>
            <span className="hidden md:inline">
              Elige una hora para continuar
            </span>
          </>
        )}
      </Button>
    ) : (
      <Button
        type="submit"
        form={DETAILS_FORM_ID}
        size={size}
        disabled={create.isPending}
        className={className}
      >
        {create.isPending ? 'Confirmando…' : payCta}
      </Button>
    )

  return (
    <main
      className={cn(
        'mx-auto flex max-w-page flex-col gap-5 md:gap-6 md:px-6 md:pt-6 md:pb-14',
        step === 3 ? 'px-6 pb-44' : 'pb-40',
      )}
    >
      {step < 3 && (
        <MobileHeader
          service={service}
          step={step}
          onBack={step === 2 ? () => goTo(1) : undefined}
        />
      )}

      <Button
        asChild
        variant="ghost"
        size="sm"
        className="hidden self-start px-2 text-muted-foreground md:inline-flex"
      >
        <Link to="/servicios/$slug" params={{ slug: service.slug }}>
          <ChevronLeft aria-hidden />
          Volver al servicio
        </Link>
      </Button>

      <div className="contents md:flex md:flex-col md:gap-4">
        <h1 className="sr-only md:not-sr-only md:text-h1 md:font-bold">
          Reserva: {service.name}
        </h1>
        <Stepper step={step} className="hidden md:flex" />
      </div>

      {step === 3 ? (
        <Confirmation service={service} bookingId={draft.bookingId!} />
      ) : (
        <div className="flex flex-col gap-6 px-4 md:px-0 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          {step === 1 ? (
            <DateTimeStep
              serviceId={service.id}
              today={today}
              date={draft.date}
              time={draft.time}
              onDateChange={(date) => update({ date, time: undefined })}
              onTimeChange={(time) => update({ time })}
            />
          ) : (
            <DetailsStep
              defaults={{
                contact: draft.contact ?? {
                  name: user.name,
                  email: user.email,
                },
                notes: draft.notes,
                paymentMethod: draft.paymentMethod,
              }}
              onChange={onDetailsChange}
              onSubmit={(values) => create.mutate(values)}
              error={create.error?.message}
            />
          )}

          <BookingSummary service={service} date={draft.date} time={draft.time}>
            {primaryCta('lg', 'w-full')}
            {step === 2 && (
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => goTo(1)}
              >
                Cambiar fecha u hora
              </Button>
            )}
            <p className="text-caption text-muted-foreground">
              <CancellationPolicy />
            </p>
          </BookingSummary>

          <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col gap-2.5 border-t bg-background px-4 pt-3 pb-[max(env(safe-area-inset-bottom),1rem)] md:hidden">
            <p className="flex justify-between gap-3 text-sm">
              <span className="text-muted-foreground">
                {draft.date ? formatDayLong(draft.date) : 'Sin fecha'} ·{' '}
                <span className="font-mono text-foreground">{range}</span>
              </span>
              <span className="font-mono font-semibold">{price}</span>
            </p>
            {primaryCta('xl', 'w-full')}
          </div>
        </div>
      )}
    </main>
  )
}

function MobileHeader({
  service,
  step,
  onBack,
  subtitle = `Paso ${step} de 3 · ${BOOKING_STEPS[step - 1]}`,
  backToBookings = false,
}: {
  service: ServiceWithProfessional
  step: BookingStep
  onBack?: () => void
  subtitle?: string
  backToBookings?: boolean
}) {
  const backClass = 'grid size-11 place-items-center rounded-md text-foreground'

  return (
    <header className="flex flex-col gap-2.5 border-b bg-background px-2 pt-[max(env(safe-area-inset-top),2.75rem)] pb-3 md:hidden">
      <div className="flex items-center gap-1">
        {onBack ? (
          <button
            type="button"
            aria-label="Volver a fecha y hora"
            className={backClass}
            onClick={onBack}
          >
            <ChevronLeft aria-hidden className="size-5" />
          </button>
        ) : backToBookings ? (
          <Link
            to="/reservas"
            aria-label="Volver a tus reservas"
            className={backClass}
          >
            <ChevronLeft aria-hidden className="size-5" />
          </Link>
        ) : (
          <Link
            to="/servicios/$slug"
            params={{ slug: service.slug }}
            aria-label="Volver al servicio"
            className={backClass}
          >
            <ChevronLeft aria-hidden className="size-5" />
          </Link>
        )}
        <div className="flex flex-col">
          <span className="font-display text-[17px] leading-[22px] font-semibold">
            {service.name}
          </span>
          <span className="text-caption text-muted-foreground">{subtitle}</span>
        </div>
      </div>
      {!backToBookings && (
        <Progress
          value={(step / 3) * 100}
          aria-label="Progreso de la reserva"
          className="mx-2 w-auto"
        />
      )}
    </header>
  )
}

// Reprogramar (HANDOFF §5.5): solo el paso 1, la hora actual cuenta como libre.
function RescheduleFlow({
  service,
  bookingId,
}: {
  service: ServiceWithProfessional
  bookingId: string
}) {
  const navigate = Route.useNavigate()
  const queryClient = useQueryClient()
  const [today] = useState(() => nowInMadrid().date)
  const query = useQuery(bookingsQueries.detail(bookingId))
  const [date, setDate] = useState<string>()
  const [time, setTime] = useState<string>()

  const reschedule = useMutation({
    mutationFn: () => bookings.reschedule(bookingId, date!, time!),
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: bookingsQueries.all })
      queryClient.invalidateQueries({ queryKey: availabilityQueries.all })
      toast.success(
        `Has cambiado «${booking.service.name}» al ${formatDayLong(date!)} a las ${time}`,
      )
      navigate({ to: '/reservas', replace: true })
    },
  })

  if (query.isPending) return <BookingSkeleton />

  const booking = query.data
  const current = booking ? toMadrid(booking.start) : null
  const editable =
    booking &&
    booking.serviceId === service.id &&
    (booking.status === 'confirmada' || booking.status === 'pendiente_pago')
  if (!booking || !current || !editable) {
    return (
      <StatePage
        eyebrow="Error"
        title="No puedes reprogramar esta reserva"
        text="Puede que ya haya pasado, que esté cancelada o que el enlace no sea correcto."
      />
    )
  }

  const unchanged = date === current.date && time === current.time
  const ready = Boolean(date && time) && !unchanged

  const cta = (size: 'lg' | 'xl', className?: string) => (
    <Button
      size={size}
      variant={ready ? 'default' : 'pending'}
      disabled={!ready || reschedule.isPending}
      className={className}
      onClick={() => reschedule.mutate()}
    >
      {reschedule.isPending
        ? 'Guardando…'
        : ready
          ? 'Confirmar cambio'
          : 'Elige una nueva hora'}
    </Button>
  )

  return (
    <main className="mx-auto flex max-w-page flex-col gap-5 pb-40 md:gap-6 md:px-6 md:pt-6 md:pb-14">
      <MobileHeader
        service={service}
        step={1}
        subtitle={`Reprogramar · ahora ${formatDayLong(current.date)}, ${current.time}`}
        backToBookings
      />

      <Button
        asChild
        variant="ghost"
        size="sm"
        className="hidden self-start px-2 text-muted-foreground md:inline-flex"
      >
        <Link to="/reservas">
          <ChevronLeft aria-hidden />
          Volver a tus reservas
        </Link>
      </Button>

      <div className="contents md:flex md:flex-col md:gap-2">
        <h1 className="sr-only md:not-sr-only md:text-h1 md:font-bold">
          Reprogramar: {service.name}
        </h1>
        <p className="hidden text-muted-foreground md:block">
          Ahora es el {formatDayLong(current.date)} a las{' '}
          <span className="font-mono">{current.time}</span>. Elige el nuevo día
          y la nueva hora.
        </p>
      </div>

      <div className="flex flex-col gap-6 px-4 md:px-0 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <DateTimeStep
          serviceId={service.id}
          exceptBookingId={booking.id}
          today={today}
          date={date ?? current.date}
          time={time}
          onDateChange={(next) => {
            setDate(next)
            setTime(undefined)
          }}
          onTimeChange={(next) => {
            setDate((prev) => prev ?? current.date)
            setTime(next)
          }}
        />

        <BookingSummary
          service={service}
          date={date ?? current.date}
          time={time}
        >
          {cta('lg', 'w-full')}
          {reschedule.error && (
            <p role="alert" className="text-sm text-destructive">
              {reschedule.error.message}
            </p>
          )}
          <p className="text-caption text-muted-foreground">
            <CancellationPolicy />
          </p>
        </BookingSummary>

        <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col gap-2.5 border-t bg-background px-4 pt-3 pb-[max(env(safe-area-inset-bottom),1rem)] md:hidden">
          {reschedule.error && (
            <p role="alert" className="text-sm text-destructive">
              {reschedule.error.message}
            </p>
          )}
          <p className="flex justify-between gap-3 text-sm">
            <span className="text-muted-foreground">
              {formatDayLong(date ?? current.date)} ·{' '}
              <span className="font-mono text-foreground">
                {slotRange(time, service.durationMin)}
              </span>
            </span>
          </p>
          {cta('xl', 'w-full')}
        </div>
      </div>
    </main>
  )
}

function Confirmation({
  service,
  bookingId,
}: {
  service: ServiceWithProfessional
  bookingId: string
}) {
  const query = useQuery(bookingsQueries.detail(bookingId))

  if (query.isPending) {
    return (
      <Skeleton className="h-96 w-full self-center rounded-2xl md:max-w-[560px]" />
    )
  }
  if (!query.data) {
    return (
      <StatePage
        eyebrow="Error"
        title="No encontramos esta reserva"
        text="Revisa tus reservas o vuelve a reservar desde el catálogo."
      />
    )
  }
  return <ConfirmationStep service={service} booking={query.data} />
}

function BookingSkeleton() {
  return (
    <div
      aria-hidden
      className="mx-auto flex max-w-page flex-col gap-6 px-4 pt-14 md:px-6 md:pt-6"
    >
      <Skeleton className="h-10 w-2/3 md:w-96" />
      <Skeleton className="hidden h-7 w-[480px] md:block" />
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_320px]">
        <Skeleton className="h-[520px] rounded-xl" />
        <Skeleton className="hidden h-80 rounded-xl md:block" />
      </div>
    </div>
  )
}
