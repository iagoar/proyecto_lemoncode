import { queryOptions } from '@tanstack/react-query'

import {
  addDays,
  daysOfMonth,
  madridToIso,
  nowInMadrid,
  toMadrid,
  weekdayIndex,
} from '#/lib/dates'
import { http } from './http'
import { getService } from './services'
import { getSettings } from './settings'
import type {
  Booking,
  DayAvailability,
  NextSlot,
  ServiceSchedule,
  Slot,
} from './types'

// Reglas mock de disponibilidad (HANDOFF §3): sin huecos en fines de semana
// ni en días pasados, un día al mes completo y algunas franjas ocupadas.
// Es determinista para que un mismo día muestre siempre lo mismo; además
// quedan ocupadas las franjas que ya tienen una reserva activa.
// Si el servicio tiene un horario definido en el backoffice (`schedule`),
// manda ese horario y solo ocupan franjas las reservas reales.
// Cada consulta pide a json-server el servicio y sus reservas activas una vez
// y calcula todos los días con esos datos.

/** Horario por defecto: el de las reglas mock. */
export const DEFAULT_SCHEDULE: ServiceSchedule = {
  weekdays: [0, 1, 2, 3, 4],
  times: [
    '09:00',
    '10:00',
    '11:30',
    '13:00',
    '16:00',
    '17:30',
    '19:00',
    '20:00',
  ],
}
const SEARCH_DAYS = 60

function hash(text: string) {
  let h = 0
  for (const char of text) h = (h * 31 + char.charCodeAt(0)) | 0
  return Math.abs(h)
}

interface Context {
  serviceId: string
  schedule?: ServiceSchedule
  /** Ajustes → antelación mínima: no se reserva antes de este instante. */
  earliest: Date
  /** 'YYYY-MM-DD' → horas ('HH:mm') ya reservadas */
  booked: Map<string, Set<string>>
}

/** `exceptBookingId`: al reprogramar, la hora propia no cuenta como ocupada. */
async function loadContext(
  serviceId: string,
  exceptBookingId?: string,
): Promise<Context> {
  const [service, bookings, settings] = await Promise.all([
    getService(serviceId),
    http.get<Booking[]>('/bookings', { serviceId, status_ne: 'cancelada' }),
    getSettings(),
  ])
  const booked = new Map<string, Set<string>>()
  for (const booking of bookings) {
    if (booking.id === exceptBookingId) continue
    const start = toMadrid(booking.start)
    const day = booked.get(start.date) ?? new Set<string>()
    day.add(start.time)
    booked.set(start.date, day)
  }
  return {
    serviceId,
    schedule: service?.schedule,
    booked,
    earliest: new Date(Date.now() + settings.minNoticeHours * 3_600_000),
  }
}

function isClosed(date: string, today: string, schedule?: ServiceSchedule) {
  const weekdays = (schedule ?? DEFAULT_SCHEDULE).weekdays
  return date < today || !weekdays.includes(weekdayIndex(date))
}

function isFullDay({ serviceId, schedule }: Context, date: string) {
  if (schedule) return false
  const fullDayOfMonth = (hash(`${serviceId}:${date.slice(0, 7)}`) % 20) + 5
  return Number(date.slice(8, 10)) === fullDayOfMonth
}

function computeSlots(ctx: Context, date: string): Slot[] {
  const now = nowInMadrid()
  if (isClosed(date, now.date, ctx.schedule)) return []
  const fullDay = isFullDay(ctx, date)
  const booked = ctx.booked.get(date)
  return (ctx.schedule ?? DEFAULT_SCHEDULE).times.map((time) => ({
    time,
    available:
      !fullDay &&
      !booked?.has(time) &&
      !(date === now.date && time <= now.time) &&
      new Date(madridToIso(date, time)) > ctx.earliest &&
      (ctx.schedule !== undefined ||
        hash(`${ctx.serviceId}:${date}:${time}`) % 3 !== 0),
  }))
}

function computeDay(
  ctx: Context,
  date: string,
  today: string,
): DayAvailability {
  if (isClosed(date, today, ctx.schedule)) return { date, status: 'cerrado' }
  const slots = computeSlots(ctx, date)
  // Hoy sin franjas futuras cuenta como cerrado, no como completo.
  if (
    date === today &&
    slots.every((s) => !s.available) &&
    !isFullDay(ctx, date)
  ) {
    return { date, status: 'cerrado' }
  }
  return {
    date,
    status: slots.some((s) => s.available) ? 'disponible' : 'completo',
  }
}

export async function isSlotAvailable(
  serviceId: string,
  date: string,
  time: string,
  exceptBookingId?: string,
) {
  const ctx = await loadContext(serviceId, exceptBookingId)
  return computeSlots(ctx, date).some((s) => s.time === time && s.available)
}

/** Estado de cada día del mes ('YYYY-MM'). */
async function days(
  serviceId: string,
  month: string,
  exceptBookingId?: string,
): Promise<DayAvailability[]> {
  const ctx = await loadContext(serviceId, exceptBookingId)
  const today = nowInMadrid().date
  return daysOfMonth(month).map((date) => computeDay(ctx, date, today))
}

async function slots(
  serviceId: string,
  date: string,
  exceptBookingId?: string,
): Promise<Slot[]> {
  return computeSlots(await loadContext(serviceId, exceptBookingId), date)
}

async function nextSlot(serviceId: string): Promise<NextSlot | null> {
  const ctx = await loadContext(serviceId)
  const today = nowInMadrid().date
  for (let i = 0; i < SEARCH_DAYS; i++) {
    const date = addDays(today, i)
    const slot = computeSlots(ctx, date).find((s) => s.available)
    if (slot) return { date, time: slot.time }
  }
  return null
}

export const availability = { days, slots, nextSlot }

export const availabilityQueries = {
  all: ['availability'] as const,
  days: (serviceId: string, month: string, exceptBookingId?: string) =>
    queryOptions({
      queryKey: [
        ...availabilityQueries.all,
        'days',
        serviceId,
        month,
        exceptBookingId,
      ],
      queryFn: () => days(serviceId, month, exceptBookingId),
    }),
  slots: (serviceId: string, date: string, exceptBookingId?: string) =>
    queryOptions({
      queryKey: [
        ...availabilityQueries.all,
        'slots',
        serviceId,
        date,
        exceptBookingId,
      ],
      queryFn: () => slots(serviceId, date, exceptBookingId),
    }),
  next: (serviceId: string) =>
    queryOptions({
      queryKey: [...availabilityQueries.all, 'next', serviceId],
      queryFn: () => nextSlot(serviceId),
    }),
}
