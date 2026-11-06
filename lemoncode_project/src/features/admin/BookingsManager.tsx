import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Label } from '#/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Skeleton } from '#/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '#/components/ui/tabs'
import {
  bookingWhen,
  DateTile,
  statusVariant,
} from '#/features/bookings/BookingRow'
import { StatTile } from '#/features/profile/ProfileParts'
import { useIsDesktop } from '#/hooks/use-media-query'
import { bookings, bookingsQueries } from '#/lib/api/bookings'
import { clientsQueries } from '#/lib/api/clients'
import type { BookingWithService, PaymentMethod } from '#/lib/api/types'
import { nowInMadrid, toMadrid } from '#/lib/dates'
import {
  bookingStatusLabel,
  formatDayLong,
  formatDayShort,
  formatPrice,
} from '#/lib/format'
import {
  AdminPage,
  EmptyRow,
  LoadError,
  normalize,
  Pager,
  SearchField,
} from './AdminParts'
import { ConfirmDialog } from './ConfirmDialog'

const VIEWS = [
  'proximas',
  'pendientes',
  'pasadas',
  'canceladas',
  'todas',
] as const
type View = (typeof VIEWS)[number]

const viewLabel: Record<View, string> = {
  proximas: 'Próximas',
  pendientes: 'Pendientes de pago',
  pasadas: 'Pasadas',
  canceladas: 'Canceladas',
  todas: 'Todas',
}

const emptyText: Record<View, string> = {
  proximas: 'No hay sesiones próximas con estos filtros.',
  pendientes: 'No hay reservas pendientes de pago.',
  pasadas: 'No hay sesiones pasadas con estos filtros.',
  canceladas: 'No hay reservas canceladas con estos filtros.',
  todas: 'No hay reservas con estos filtros.',
}

const paymentLabel: Record<PaymentMethod, string> = {
  tarjeta: 'Tarjeta',
  en_sesion: 'En la sesión',
}

const PAGE_SIZE = 10

export const adminBookingsSearchSchema = z.object({
  vista: z.enum(VIEWS).optional().catch(undefined),
  q: z.string().optional().catch(undefined),
  servicio: z.string().optional().catch(undefined),
  cliente: z.string().optional().catch(undefined),
  pagina: z.coerce.number().int().min(1).optional().catch(undefined),
})

export type AdminBookingsSearch = z.infer<typeof adminBookingsSearchSchema>

const isActive = (b: BookingWithService) =>
  b.status === 'confirmada' || b.status === 'pendiente_pago'

function inView(view: View, b: BookingWithService) {
  switch (view) {
    case 'proximas':
      return isActive(b)
    case 'pendientes':
      return b.status === 'pendiente_pago'
    case 'pasadas':
      return b.status === 'completada'
    case 'canceladas':
      return b.status === 'cancelada'
    case 'todas':
      return true
  }
}

// Backoffice → Reservas: todas las reservas del catálogo, con filtros en la URL.
// El admin puede marcar como pagada una reserva pendiente y cancelar cualquiera
// activa (sin el plazo de cancelación que se aplica a los clientes).
export function BookingsManager({
  search,
  onSearchChange,
}: {
  search: AdminBookingsSearch
  onSearchChange: (patch: Partial<AdminBookingsSearch>) => void
}) {
  const queryClient = useQueryClient()
  const isDesktop = useIsDesktop()
  const query = useQuery(bookingsQueries.admin())
  const [cancelling, setCancelling] = useState<BookingWithService | null>(null)

  const all = query.data ?? []
  const view = search.vista ?? 'proximas'
  const needle = normalize(search.q?.trim() ?? '')

  const filtered = all.filter(
    (b) =>
      inView(view, b) &&
      (!search.servicio || b.serviceId === search.servicio) &&
      (!search.cliente || b.userId === search.cliente) &&
      (!needle ||
        normalize(
          `${b.contact.name} ${b.contact.email} ${b.service.name} ${b.service.professional.name}`,
        ).includes(needle)),
  )
  // Lo que está por llegar, de lo más cercano a lo más lejano; el resto, al revés.
  if (view === 'proximas' || view === 'pendientes') filtered.reverse()

  const page = Math.min(
    search.pagina ?? 1,
    Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)),
  )
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Resumen
  const today = nowInMadrid().date
  const month = today.slice(0, 7)
  const active = all.filter(isActive)
  const todayCount = active.filter(
    (b) => toMadrid(b.start).date === today,
  ).length
  const pendingCount = all.filter((b) => b.status === 'pendiente_pago').length
  const monthCents = all
    .filter(
      (b) =>
        b.status !== 'cancelada' && toMadrid(b.start).date.startsWith(month),
    )
    .reduce((sum, b) => sum + (b.service.priceCents ?? 0), 0)

  const services = [
    ...new Map(all.map((b) => [b.serviceId, b.service.name])).entries(),
  ].sort((a, b) => a[1].localeCompare(b[1], 'es'))

  const clientName = search.cliente
    ? all.find((b) => b.userId === search.cliente)?.contact.name
    : undefined

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: bookingsQueries.all })
    queryClient.invalidateQueries({ queryKey: clientsQueries.all })
  }

  const markPaid = useMutation({
    mutationFn: (b: BookingWithService) =>
      bookings.setStatus(b.id, 'confirmada'),
    onSuccess: (_, b) => {
      invalidate()
      toast.success(`Has marcado como pagada la reserva de ${b.contact.name}`)
    },
    onError: () =>
      toast.error('No hemos podido actualizar la reserva. Inténtalo de nuevo.'),
  })

  const cancel = useMutation({
    mutationFn: (b: BookingWithService) =>
      bookings.setStatus(b.id, 'cancelada'),
    onSuccess: (_, b) => {
      setCancelling(null)
      invalidate()
      toast.success(`Has cancelado la reserva de ${b.contact.name}`)
    },
    onError: () =>
      toast.error('No hemos podido cancelar la reserva. Inténtalo de nuevo.'),
  })

  const actions = (b: BookingWithService, full: boolean) => (
    <>
      {b.status === 'pendiente_pago' && (
        <Button
          variant="outline"
          size={full ? 'sm' : 'icon-sm'}
          className={full ? 'h-11' : undefined}
          aria-label={`Marcar como pagada la reserva de ${b.contact.name}`}
          title="Marcar como pagada"
          disabled={markPaid.isPending}
          onClick={() => markPaid.mutate(b)}
        >
          <Check aria-hidden />
          {full && 'Marcar pagada'}
        </Button>
      )}
      {isActive(b) && (
        <Button
          variant={full ? 'destructive-outline' : 'ghost'}
          size={full ? 'sm' : 'icon-sm'}
          aria-label={`Cancelar la reserva de ${b.contact.name}`}
          title="Cancelar reserva"
          className={
            full
              ? 'h-11 font-medium'
              : 'text-destructive hover:bg-destructive/5 hover:text-destructive'
          }
          onClick={() => setCancelling(b)}
        >
          <X aria-hidden />
          {full && 'Cancelar'}
        </Button>
      )}
    </>
  )

  return (
    <AdminPage
      title="Reservas"
      description="Todas las sesiones reservadas en el catálogo."
    >
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Hoy" value={todayCount} loading={query.isPending} />
        <StatTile
          label="Próximas"
          value={active.length}
          loading={query.isPending}
        />
        <StatTile
          label="Pendientes de pago"
          value={pendingCount}
          loading={query.isPending}
        />
        <StatTile
          label="Reservado este mes"
          value={formatPrice(monthCents)}
          loading={query.isPending}
        />
      </dl>

      <Tabs
        value={view}
        onValueChange={(v) =>
          onSearchChange({
            vista: v === 'proximas' ? undefined : (v as View),
            pagina: undefined,
          })
        }
        className="min-w-0"
      >
        <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <TabsList aria-label="Estado de las reservas">
            {VIEWS.map((v) => (
              <TabsTrigger key={v} value={v} className="whitespace-nowrap">
                {viewLabel[v]}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      <div className="flex flex-wrap gap-3">
        <SearchField
          id="reservas-buscar"
          label="Buscar cliente o servicio"
          value={search.q ?? ''}
          onChange={(q) =>
            onSearchChange({ q: q || undefined, pagina: undefined })
          }
          className="flex-[1_1_240px]"
        />
        <Label htmlFor="reservas-servicio" className="sr-only">
          Servicio
        </Label>
        <Select
          value={search.servicio ?? 'todos'}
          onValueChange={(v) =>
            onSearchChange({
              servicio: v === 'todos' ? undefined : v,
              pagina: undefined,
            })
          }
        >
          <SelectTrigger
            id="reservas-servicio"
            className="flex-[1_1_200px] md:h-10 md:flex-[0_1_240px] md:text-sm"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los servicios</SelectItem>
            {services.map(([id, name]) => (
              <SelectItem key={id} value={id}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {search.cliente && (
          <Button
            variant="outline"
            className="md:h-10"
            onClick={() => onSearchChange({ cliente: undefined })}
          >
            <X aria-hidden />
            {clientName ? `Solo ${clientName}` : 'Quitar filtro de cliente'}
            <span className="sr-only">: quitar filtro</span>
          </Button>
        )}
      </div>

      {query.isError ? (
        <LoadError what="las reservas" onRetry={() => query.refetch()} />
      ) : query.isPending ? (
        <div className="flex flex-col gap-2" aria-hidden>
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : all.length === 0 ? (
        <EmptyRow>
          Aún no hay reservas. Aparecerán aquí en cuanto los clientes reserven.
        </EmptyRow>
      ) : filtered.length === 0 ? (
        <EmptyRow>{emptyText[view]}</EmptyRow>
      ) : isDesktop ? (
        <section
          aria-label="Listado de reservas"
          className="min-w-0 overflow-hidden rounded-xl border bg-card"
        >
          <Table className="min-w-[720px]">
            <TableHeader>
              <tr>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Servicio</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {pageItems.map((b) => {
                const when = bookingWhen(b)
                return (
                  <TableRow key={b.id}>
                    <TableCell>
                      <span className="flex flex-col">
                        <span className="font-semibold">
                          {formatDayShort(when.date)}
                        </span>
                        <span className="font-mono text-caption text-muted-foreground">
                          {when.time}–{toMadrid(b.end).time}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex flex-col">
                        <span className="font-medium">{b.contact.name}</span>
                        <span className="text-caption text-muted-foreground">
                          {b.contact.email}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex flex-col">
                        <span className="font-medium">{b.service.name}</span>
                        <span className="text-caption text-muted-foreground">
                          con {b.service.professional.name}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex flex-col">
                        <span className="font-mono">
                          {formatPrice(b.service.priceCents)}
                        </span>
                        <span className="text-caption text-muted-foreground">
                          {paymentLabel[b.paymentMethod]}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[b.status]}>
                        {bookingStatusLabel[b.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-1.5">
                      <div className="flex justify-end gap-1">
                        {actions(b, false)}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </section>
      ) : (
        <ul className="flex flex-col gap-2">
          {pageItems.map((b) => {
            const when = bookingWhen(b)
            return (
              <li
                key={b.id}
                className="flex flex-col gap-3 rounded-xl border bg-card p-3.5"
              >
                <div className="flex items-start gap-3.5">
                  <DateTile date={when.date} />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <Badge variant={statusVariant[b.status]}>
                      {bookingStatusLabel[b.status]}
                    </Badge>
                    <p className="font-display font-semibold">
                      {b.service.name}
                    </p>
                    <p className="text-caption text-muted-foreground">
                      <span className="sr-only">
                        {formatDayLong(when.date)},{' '}
                      </span>
                      {when.label} · {b.contact.name}
                    </p>
                    <p className="font-mono text-caption text-muted-foreground">
                      {formatPrice(b.service.priceCents)} ·{' '}
                      <span className="font-sans">
                        {paymentLabel[b.paymentMethod]}
                      </span>
                    </p>
                  </div>
                </div>
                {isActive(b) && (
                  <div className="grid grid-cols-2 gap-2">
                    {actions(b, true)}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <Pager
        page={page}
        pageSize={PAGE_SIZE}
        total={filtered.length}
        onPageChange={(pagina) => onSearchChange({ pagina })}
      />

      <ConfirmDialog
        open={cancelling !== null}
        title={
          cancelling
            ? `¿Cancelar la reserva de ${cancelling.contact.name}?`
            : ''
        }
        description={
          cancelling
            ? `«${cancelling.service.name}», ${formatDayLong(bookingWhen(cancelling).date)} a las ${bookingWhen(cancelling).time}. La franja queda libre para otras reservas.`
            : ''
        }
        confirmLabel="Cancelar reserva"
        pendingLabel="Cancelando…"
        cancelLabel="Mantener reserva"
        pending={cancel.isPending}
        onOpenChange={(open) => !open && setCancelling(null)}
        onConfirm={() => cancelling && cancel.mutate(cancelling)}
      />
    </AdminPage>
  )
}
