import { queryOptions } from '@tanstack/react-query'

import { requireAdmin, toUser, type UserRecord } from './auth'
import { http } from './http'
import type { Booking, Service, User } from './types'

// Backoffice → Clientes: cuentas con rol cliente y un resumen de su actividad.
// El detalle de sus reservas sale de `bookingsQueries.admin()`.

export interface ClientRow extends User {
  bookingCount: number
  /** Reservas activas aún por llegar. */
  upcomingCount: number
  /** Suma de lo reservado sin cancelar, en céntimos. */
  spentCents: number
  /** Inicio (ISO) de la última reserva, si tiene. */
  lastBookingAt?: string
}

async function list(): Promise<ClientRow[]> {
  requireAdmin()
  const [users, bookings, services] = await Promise.all([
    http.get<UserRecord[]>('/users', { role: 'cliente' }),
    http.get<Booking[]>('/bookings'),
    http.get<Pick<Service, 'id' | 'priceCents'>[]>('/services'),
  ])
  const price = new Map(services.map((s) => [s.id, s.priceCents ?? 0]))
  const now = new Date()

  return users
    .map((record) => {
      const own = bookings.filter((b) => b.userId === record.id)
      const active = own.filter((b) => b.status !== 'cancelada')
      const last = own
        .map((b) => b.start)
        .sort()
        .at(-1)
      return {
        ...toUser(record),
        bookingCount: own.length,
        upcomingCount: active.filter((b) => new Date(b.end) > now).length,
        spentCents: active.reduce(
          (sum, b) => sum + (price.get(b.serviceId) ?? 0),
          0,
        ),
        lastBookingAt: last,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

export const clients = { list }

export const clientsQueries = {
  all: ['clients'] as const,
  list: () =>
    queryOptions({
      queryKey: clientsQueries.all,
      queryFn: list,
    }),
}
