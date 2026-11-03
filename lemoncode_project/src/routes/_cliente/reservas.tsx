import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { CalendarCheck, CalendarX, Check, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '#/components/ui/button'
import { Card } from '#/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import {
  BookingRow,
  BookingRowSkeleton,
  bookingWhen,
} from '#/features/bookings/BookingRow'
import { CancelBookingDialog } from '#/features/bookings/CancelBookingDialog'
import { RateDialog } from '#/features/bookings/RateDialog'
import { availabilityQueries } from '#/lib/api/availability'
import { bookings, bookingsQueries } from '#/lib/api/bookings'
import { reviewsQueries } from '#/lib/api/reviews'
import type { BookingWithService } from '#/lib/api/types'
import { formatDayLong } from '#/lib/format'

const TABS = ['proximas', 'pasadas', 'canceladas'] as const
type Tab = (typeof TABS)[number]

const reservasSearchSchema = z.object({
  tab: z.enum(TABS).optional().catch(undefined),
  confirmada: z.string().optional().catch(undefined),
})

export const Route = createFileRoute('/_cliente/reservas')({
  validateSearch: (search) => reservasSearchSchema.parse(search),
  head: () => ({ meta: [{ title: 'Tus reservas · rumbo.' }] }),
  component: BookingsPage,
})

const tabLabel: Record<Tab, string> = {
  proximas: 'Próximas',
  pasadas: 'Pasadas',
  canceladas: 'Canceladas',
}

const emptyState: Record<Tab, { title: string; text: string }> = {
  proximas: {
    title: 'No tienes reservas próximas',
    text: 'Elige un servicio del catálogo y reserva tu primera sesión.',
  },
  pasadas: {
    title: 'Aún no tienes sesiones pasadas',
    text: 'Elige un servicio del catálogo y reserva tu primera sesión.',
  },
  canceladas: {
    title: 'No tienes reservas canceladas',
    text: 'Cuando canceles una reserva aparecerá aquí.',
  },
}

function groupByTab(
  items: BookingWithService[],
): Record<Tab, BookingWithService[]> {
  return {
    proximas: items.filter(
      (b) => b.status === 'confirmada' || b.status === 'pendiente_pago',
    ),
    // Las pasadas, de la más reciente a la más antigua.
    pasadas: items.filter((b) => b.status === 'completada').reverse(),
    canceladas: items.filter((b) => b.status === 'cancelada'),
  }
}

// HANDOFF §5.5
function BookingsPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const queryClient = useQueryClient()
  const tab = search.tab ?? 'proximas'
  const query = useQuery(bookingsQueries.mine())

  const [cancelling, setCancelling] = useState<BookingWithService | null>(null)
  const [rating, setRating] = useState<BookingWithService | null>(null)

  const cancel = useMutation({
    mutationFn: (booking: BookingWithService) => bookings.cancel(booking.id),
    onSuccess: (booking) => {
      setCancelling(null)
      queryClient.invalidateQueries({ queryKey: bookingsQueries.all })
      queryClient.invalidateQueries({ queryKey: availabilityQueries.all })
      toast.success(`Has cancelado «${booking.service.name}»`)
    },
    onError: () =>
      toast.error('No hemos podido cancelar la reserva. Inténtalo de nuevo.'),
  })

  const rate = useMutation({
    mutationFn: ({
      id,
      value,
      text,
    }: {
      id: string
      value: 1 | 2 | 3 | 4 | 5
      text: string
    }) => bookings.rate(id, value, text),
    onSuccess: () => {
      setRating(null)
      queryClient.invalidateQueries({ queryKey: bookingsQueries.all })
      queryClient.invalidateQueries({ queryKey: reviewsQueries.all })
      toast.success('Gracias por tu opinión')
    },
    onError: () =>
      toast.error('No hemos podido publicar tu opinión. Inténtalo de nuevo.'),
  })

  const groups = groupByTab(query.data ?? [])
  const confirmed = search.confirmada
    ? query.data?.find((b) => b.id === search.confirmada)
    : undefined

  return (
    <main className="mx-auto flex max-w-narrow flex-col md:gap-6 md:px-6 md:pt-10 md:pb-14">
      <Tabs
        value={tab}
        onValueChange={(value) =>
          navigate({
            search: (prev) => ({
              ...prev,
              tab: value === 'proximas' ? undefined : (value as Tab),
            }),
            replace: true,
          })
        }
        className="gap-0 md:gap-6"
      >
        <div className="flex flex-col gap-3 border-b bg-background px-4 pt-4 pb-3 md:gap-6 md:border-0 md:bg-transparent md:p-0">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-h2 font-bold md:text-h1">Tus reservas</h1>
            <Button
              asChild
              variant="outline"
              className="hidden font-semibold md:inline-flex"
            >
              <Link to="/servicios">
                <Plus aria-hidden />
                Nueva reserva
              </Link>
            </Button>
          </div>
          <TabsList
            aria-label="Estado de reservas"
            className="grid grid-cols-3 md:inline-flex md:self-start md:border md:bg-card"
          >
            {TABS.map((value) => (
              <TabsTrigger key={value} value={value}>
                {tabLabel[value]}
                {query.data && (
                  <span className="hidden font-mono text-xs opacity-80 md:inline">
                    {groups[value].length}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="flex flex-col gap-3 px-4 pt-4 pb-6 md:gap-4 md:p-0">
          {confirmed && (
            <div
              role="status"
              className="flex items-center gap-3 rounded-xl border bg-card py-3 pr-2 pl-3.5 md:gap-3.5 md:py-4 md:pr-4 md:pl-5"
            >
              <span
                aria-hidden
                className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-success text-success-foreground md:size-9"
              >
                <Check className="size-[18px]" strokeWidth={2.5} />
              </span>
              <p className="flex-1 text-sm">
                <strong className="font-semibold">Reserva confirmada</strong>
                <span className="md:hidden">. Te hemos enviado un email.</span>
                <span className="hidden text-muted-foreground md:block">
                  {confirmed.service.name} ·{' '}
                  {formatDayLong(bookingWhen(confirmed).date)} ·{' '}
                  <span className="font-mono">
                    {bookingWhen(confirmed).time}
                  </span>
                  . Te hemos enviado los detalles por email.
                </span>
              </p>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Cerrar aviso"
                className="text-muted-foreground"
                onClick={() =>
                  navigate({
                    search: (prev) => ({ ...prev, confirmada: undefined }),
                    replace: true,
                  })
                }
              >
                <X className="size-5" />
              </Button>
            </div>
          )}

          {TABS.map((value) => (
            <TabsContent
              key={value}
              value={value}
              className="flex flex-col gap-3 md:gap-4"
            >
              {query.isPending ? (
                Array.from({ length: 3 }, (_, i) => (
                  <BookingRowSkeleton key={i} />
                ))
              ) : query.isError ? (
                <Card className="items-center gap-3 px-6 py-10 text-center shadow-none">
                  <h2 className="text-h3">
                    No hemos podido cargar tus reservas
                  </h2>
                  <p className="text-muted-foreground">
                    Comprueba tu conexión y vuelve a intentarlo.
                  </p>
                  <Button variant="outline" onClick={() => query.refetch()}>
                    Reintentar
                  </Button>
                </Card>
              ) : groups[value].length === 0 ? (
                <EmptyState tab={value} />
              ) : (
                groups[value].map((booking) => (
                  <BookingRow
                    key={booking.id}
                    booking={booking}
                    tab={value}
                    onCancel={setCancelling}
                    onRate={setRating}
                  />
                ))
              )}
            </TabsContent>
          ))}
        </div>
      </Tabs>

      <CancelBookingDialog
        booking={cancelling}
        pending={cancel.isPending}
        onOpenChange={(open) => !open && setCancelling(null)}
        onConfirm={() => cancelling && cancel.mutate(cancelling)}
      />
      <RateDialog
        booking={rating}
        pending={rate.isPending}
        onOpenChange={(open) => !open && setRating(null)}
        onSubmit={(value, text) =>
          rating && rate.mutate({ id: rating.id, value, text })
        }
      />
    </main>
  )
}

function EmptyState({ tab }: { tab: Tab }) {
  const Icon = tab === 'canceladas' ? CalendarX : CalendarCheck
  return (
    <div className="flex flex-col items-center gap-2.5 rounded-xl border border-dashed border-input bg-card px-5 py-8 text-center md:gap-3 md:py-12">
      <span
        aria-hidden
        className="grid size-12 place-items-center rounded-xl bg-accent text-primary"
      >
        <Icon className="size-6" />
      </span>
      <h2 className="font-display text-lg leading-6 font-semibold md:text-h3">
        {emptyState[tab].title}
      </h2>
      <p className="max-w-sm text-sm text-muted-foreground md:text-body">
        {emptyState[tab].text}
      </p>
      <Button asChild size="lg" className="mt-1">
        <Link to="/servicios">Explorar servicios</Link>
      </Button>
    </div>
  )
}
