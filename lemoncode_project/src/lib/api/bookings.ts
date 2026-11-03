import { queryOptions } from '@tanstack/react-query'

import {
  addDays,
  addMinutes,
  madridToIso,
  nowInMadrid,
  weekdayIndex,
} from '#/lib/dates'
import { isSlotAvailable } from './availability'
import { getSession } from './auth'
import { http } from './http'
import { addReview } from './reviews'
import { getService } from './services'
import type {
  Booking,
  BookingContact,
  BookingWithService,
  CreateBookingInput,
  Service,
  ServiceWithProfessional,
  User,
} from './types'

// Reservas en json-server. Cada reserva lleva `serviceId` y `userId`; el
// servicio (con su profesional) se une aquí, porque json-server solo
// expande un nivel.

function currentUser() {
  const user = getSession()
  if (!user) throw new Error('Tu sesión ha caducado. Vuelve a entrar.')
  return user
}

/** Día laborable más cercano a `offset` días de hoy. */
function workday(offset: number) {
  let date = addDays(nowInMadrid().date, offset)
  const step = offset < 0 ? -1 : 1
  while (weekdayIndex(date) >= 5) date = addDays(date, step)
  return date
}

// Semilla por usuario (HANDOFF §3): 2 próximas + 1 pendiente + 2 pasadas,
// con fechas relativas a hoy para que siempre tengan sentido. Se crea la
// primera vez que un usuario sin reservas abre su lista (las reservas no se
// borran, solo se cancelan, así que no se repite).
async function seedFor(user: User) {
  const contact: BookingContact = { name: user.name, email: user.email }
  const services = await http.get<Service[]>('/services')
  const entries: [
    slug: string,
    date: string,
    time: string,
    status: Booking['status'],
  ][] = [
    ['coaching-ejecutivo', workday(3), '11:30', 'confirmada'],
    ['hablar-en-publico', workday(8), '17:30', 'pendiente_pago'],
    ['mindfulness-inicial', workday(13), '09:00', 'confirmada'],
    ['coaching-de-carrera', workday(-12), '10:00', 'completada'],
    ['asesoria-nutricional', workday(-26), '16:00', 'completada'],
  ]
  const seed = entries.flatMap(([slug, date, time, status], i) => {
    const service = services.find((s) => s.slug === slug)
    if (!service) return []
    const booking: Booking = {
      id: `bk-seed-${i + 1}-${user.id}`,
      serviceId: service.id,
      userId: user.id,
      start: madridToIso(date, time),
      end: madridToIso(date, addMinutes(time, service.durationMin)),
      status,
      paymentMethod: status === 'pendiente_pago' ? 'en_sesion' : 'tarjeta',
      contact,
    }
    return booking
  })
  // En serie: json-server reescribe db.json entero en cada escritura.
  for (const booking of seed) await http.post('/bookings', booking)
}

/** Una reserva activa ya terminada se muestra como completada. */
function withDerivedStatus(booking: Booking): Booking {
  const ended = new Date(booking.end) < new Date()
  return ended && booking.status !== 'cancelada'
    ? { ...booking, status: 'completada' }
    : booking
}

async function withServices(items: Booking[]): Promise<BookingWithService[]> {
  if (items.length === 0) return []
  const services = await http.get<ServiceWithProfessional[]>('/services', {
    _expand: 'professional',
  })
  const byId = new Map(services.map((s) => [s.id, s]))
  return items.flatMap((booking) => {
    const service = byId.get(booking.serviceId)
    // Si el servicio se ha eliminado, la reserva deja de mostrarse.
    return service ? { ...withDerivedStatus(booking), service } : []
  })
}

async function findMine(id: string) {
  const user = currentUser()
  const booking = await http.find<Booking>(
    `/bookings/${encodeURIComponent(id)}`,
  )
  if (!booking || booking.userId !== user.id) {
    throw new Error('No encontramos esta reserva.')
  }
  return booking
}

async function updateMine(id: string, patch: Partial<Booking>) {
  await findMine(id)
  const updated = await http.patch<Booking>(
    `/bookings/${encodeURIComponent(id)}`,
    patch,
  )
  const [withService] = await withServices([updated])
  return withService
}

async function listMine(): Promise<BookingWithService[]> {
  const user = currentUser()
  const query = { userId: user.id, _sort: 'start', _order: 'asc' }
  let items = await http.get<Booking[]>('/bookings', query)
  if (items.length === 0) {
    await seedFor(user)
    items = await http.get<Booking[]>('/bookings', query)
  }
  return withServices(items)
}

async function get(id: string): Promise<BookingWithService | null> {
  const user = getSession()
  const booking = await http.find<Booking>(
    `/bookings/${encodeURIComponent(id)}`,
  )
  if (!booking || booking.userId !== user?.id) return null
  const [withService] = await withServices([booking])
  return withService ?? null
}

async function create(input: CreateBookingInput): Promise<Booking> {
  const user = currentUser()
  const service = await getService(input.serviceId)
  if (!service) throw new Error('No hemos podido crear la reserva.')
  if (!(await isSlotAvailable(input.serviceId, input.date, input.time))) {
    throw new Error('Esa hora ya no está disponible. Elige otra.')
  }

  return http.post<Booking>('/bookings', {
    id: `bk-${Date.now().toString(36)}`,
    serviceId: input.serviceId,
    userId: user.id,
    start: madridToIso(input.date, input.time),
    end: madridToIso(input.date, addMinutes(input.time, service.durationMin)),
    status: input.paymentMethod === 'tarjeta' ? 'confirmada' : 'pendiente_pago',
    paymentMethod: input.paymentMethod,
    notes: input.notes || undefined,
    contact: input.contact,
  } satisfies Booking)
}

async function cancel(id: string) {
  return updateMine(id, { status: 'cancelada' })
}

async function reschedule(id: string, date: string, time: string) {
  const booking = await findMine(id)
  const service = await getService(booking.serviceId)
  if (!service) throw new Error('No encontramos esta reserva.')
  if (!(await isSlotAvailable(service.id, date, time, id))) {
    throw new Error('Esa hora ya no está disponible. Elige otra.')
  }
  return updateMine(id, {
    start: madridToIso(date, time),
    end: madridToIso(date, addMinutes(time, service.durationMin)),
  })
}

async function rate(id: string, rating: 1 | 2 | 3 | 4 | 5, text: string) {
  const user = currentUser()
  const updated = await updateMine(id, { rated: true })
  const [first, last] = user.name.split(/\s+/)
  await addReview({
    serviceId: updated.serviceId,
    author: last ? `${first} ${last[0]}.` : first,
    rating,
    text,
    date: nowInMadrid().date,
  })
  return updated
}

/**
 * Profesional: próximas sesiones que otras personas han reservado de sus
 * servicios (activas y sin terminar), de la más cercana a la más lejana.
 */
async function listReceived(): Promise<BookingWithService[]> {
  const user = currentUser()
  if (user.role !== 'profesional' || !user.professionalId) return []
  const own = await http.get<Service[]>('/services', {
    professionalId: user.professionalId,
  })
  if (own.length === 0) return []
  const items = await http.get<Booking[]>('/bookings', {
    serviceId: own.map((s) => s.id),
    status_ne: 'cancelada',
    // Las fechas llevan desfase horario (+01:00), así que json-server solo
    // puede descartar por día; la hora exacta se compara abajo.
    end_gte: nowInMadrid().date,
    _sort: 'start',
    _order: 'asc',
  })
  const now = new Date()
  return withServices(
    items.filter((b) => b.userId !== user.id && new Date(b.end) > now),
  )
}

export const bookings = {
  listMine,
  listReceived,
  get,
  create,
  cancel,
  reschedule,
  rate,
}

export const bookingsQueries = {
  all: ['bookings'] as const,
  mine: () =>
    queryOptions({
      queryKey: [...bookingsQueries.all, 'mine'],
      queryFn: listMine,
    }),
  received: () =>
    queryOptions({
      queryKey: [...bookingsQueries.all, 'received', getSession()?.id],
      queryFn: listReceived,
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: [...bookingsQueries.all, 'detail', id],
      queryFn: () => get(id),
    }),
}
