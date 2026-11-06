import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { CalendarCheck, ChevronRight } from 'lucide-react'
import { z } from 'zod'

import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { StatTile } from '#/features/profile/ProfileParts'
import { useIsDesktop } from '#/hooks/use-media-query'
import { UserAvatar } from '#/layouts/UserMenu'
import { clientsQueries, type ClientRow } from '#/lib/api/clients'
import { nowInMadrid, toMadrid } from '#/lib/dates'
import { formatDayWithYear, formatPrice } from '#/lib/format'
import {
  AdminPage,
  EmptyRow,
  LoadError,
  normalize,
  Pager,
  SearchField,
} from './AdminParts'

const PAGE_SIZE = 10

export const adminClientsSearchSchema = z.object({
  q: z.string().optional().catch(undefined),
  pagina: z.coerce.number().int().min(1).optional().catch(undefined),
})

export type AdminClientsSearch = z.infer<typeof adminClientsSearchSchema>

function lastBooking(client: ClientRow) {
  return client.lastBookingAt
    ? formatDayWithYear(toMadrid(client.lastBookingAt).date)
    : 'Sin reservas'
}

function ClientBookingsLink({
  client,
  className,
}: {
  client: ClientRow
  className?: string
}) {
  return (
    <Link
      to="/admin/reservas"
      search={{ cliente: client.id, vista: 'todas' }}
      aria-label={`Ver las reservas de ${client.name}`}
      className={className}
    >
      <CalendarCheck aria-hidden />
      Reservas
    </Link>
  )
}

// Backoffice → Clientes: cuentas de cliente con su actividad. Sus reservas se
// ven en Reservas, filtradas por cliente.
export function ClientsManager({
  search,
  onSearchChange,
}: {
  search: AdminClientsSearch
  onSearchChange: (patch: Partial<AdminClientsSearch>) => void
}) {
  const isDesktop = useIsDesktop()
  const query = useQuery(clientsQueries.list())
  const all = query.data ?? []

  const needle = normalize(search.q?.trim() ?? '')
  const filtered = all.filter(
    (c) =>
      !needle ||
      normalize(`${c.name} ${c.email} ${c.phone ?? ''}`).includes(needle),
  )
  const page = Math.min(
    search.pagina ?? 1,
    Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)),
  )
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const month = nowInMadrid().date.slice(0, 7)
  const withUpcoming = all.filter((c) => c.upcomingCount > 0).length
  const newThisMonth = all.filter((c) => c.createdAt?.startsWith(month)).length

  return (
    <AdminPage
      title="Clientes"
      description="Las personas registradas en rumbo. y su actividad."
    >
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatTile
          label="Clientes"
          value={all.length}
          loading={query.isPending}
        />
        <StatTile
          label="Con sesiones próximas"
          value={withUpcoming}
          loading={query.isPending}
        />
        <StatTile
          label="Nuevos este mes"
          value={newThisMonth}
          loading={query.isPending}
        />
      </dl>

      <SearchField
        id="clientes-buscar"
        label="Buscar por nombre, email o teléfono"
        value={search.q ?? ''}
        onChange={(q) =>
          onSearchChange({ q: q || undefined, pagina: undefined })
        }
        className="md:max-w-sm"
      />

      {query.isError ? (
        <LoadError what="los clientes" onRetry={() => query.refetch()} />
      ) : query.isPending ? (
        <div className="flex flex-col gap-2" aria-hidden>
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyRow>
          {all.length === 0
            ? 'Aún no hay clientes registrados.'
            : 'No hay clientes con esa búsqueda.'}
        </EmptyRow>
      ) : isDesktop ? (
        <section
          aria-label="Listado de clientes"
          className="min-w-0 overflow-hidden rounded-xl border bg-card"
        >
          <Table className="min-w-[720px]">
            <TableHeader>
              <tr>
                <TableHead>Cliente</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Alta</TableHead>
                <TableHead>Reservas</TableHead>
                <TableHead>Total reservado</TableHead>
                <TableHead>Última reserva</TableHead>
                <TableHead className="text-right">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {pageItems.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <span className="flex items-center gap-3">
                      <UserAvatar user={c} className="size-9 text-xs" />
                      <span className="flex min-w-0 flex-col">
                        <span className="font-semibold">{c.name}</span>
                        <span className="text-caption text-muted-foreground">
                          {c.email}
                        </span>
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="font-mono">
                    {c.phone ?? (
                      <span className="font-sans text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {c.createdAt ? formatDayWithYear(c.createdAt) : '—'}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono">{c.bookingCount}</span>
                    {c.upcomingCount > 0 && (
                      <span className="text-caption text-muted-foreground">
                        {' '}
                        · {c.upcomingCount}{' '}
                        {c.upcomingCount === 1 ? 'próxima' : 'próximas'}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono">
                    {formatPrice(c.spentCents)}
                  </TableCell>
                  <TableCell>{lastBooking(c)}</TableCell>
                  <TableCell className="py-1.5 text-right">
                    <Button asChild variant="ghost" size="sm">
                      <ClientBookingsLink client={c} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      ) : (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card">
          {pageItems.map((c) => (
            <li key={c.id}>
              <Link
                to="/admin/reservas"
                search={{ cliente: c.id, vista: 'todas' }}
                aria-label={`${c.name}: ver sus reservas`}
                className="flex w-full items-center gap-3 py-3 pr-2 pl-4 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              >
                <UserAvatar user={c} className="size-10 text-xs" />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="font-semibold">{c.name}</span>
                  <span className="truncate text-caption text-muted-foreground">
                    {c.email}
                  </span>
                  <span className="text-caption text-muted-foreground">
                    <span className="font-mono">{c.bookingCount}</span>{' '}
                    {c.bookingCount === 1 ? 'reserva' : 'reservas'} ·{' '}
                    <span className="font-mono">
                      {formatPrice(c.spentCents)}
                    </span>
                  </span>
                </span>
                <span
                  aria-hidden
                  className="grid size-11 place-items-center text-muted-foreground"
                >
                  <ChevronRight className="size-5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Pager
        page={page}
        pageSize={PAGE_SIZE}
        total={filtered.length}
        onPageChange={(pagina) => onSearchChange({ pagina })}
      />
    </AdminPage>
  )
}
