import type { BookingStatus, Category, Mode } from '#/lib/api/types'

const priceFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

/** 6500 → "65 €" */
export function formatPrice(cents: number | null) {
  if (cents === null) return 'Precio a consultar'
  return priceFormatter.format(cents / 100)
}

/** 60 → "60 min" */
export function formatDuration(minutes: number) {
  return `${minutes} min`
}

export const categoryLabel: Record<Category, string> = {
  coaching: 'Coaching',
  bienestar: 'Bienestar',
  formacion: 'Formación',
}

export const modeLabel: Record<Mode, string> = {
  online: 'Online',
  presencial: 'Presencial',
}

function toUtcNoon(date: string) {
  return new Date(`${date}T12:00:00Z`)
}

function joinParts(parts: Intl.DateTimeFormatPart[]) {
  return parts
    .map((p) => (p.type === 'literal' ? ' ' : p.value))
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
}

const dayLongFormatter = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})

const dayShortFormatter = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})

const dayYearFormatter = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

/** '2026-10-27' → "martes 27 oct" */
export function formatDayLong(date: string) {
  return joinParts(dayLongFormatter.formatToParts(toUtcNoon(date)))
}

/** '2026-10-27' → "27 oct" */
export function formatDayShort(date: string) {
  return joinParts(dayShortFormatter.formatToParts(toUtcNoon(date)))
}

/** '2026-10-27' → "27 oct 2026" */
export function formatDayWithYear(date: string) {
  return joinParts(dayYearFormatter.formatToParts(toUtcNoon(date)))
}

const ratingFormatter = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

/** 4.666 → "4,7" */
export function formatRating(value: number) {
  return ratingFormatter.format(value)
}

const dayFullFormatter = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
})

/** '2026-10-27' → "martes 27 de octubre" (etiquetas accesibles) */
export function formatDayFull(date: string) {
  return dayFullFormatter.format(toUtcNoon(date)).replace(',', '')
}

const monthFormatter = new Intl.DateTimeFormat('es-ES', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

/** '2026-10' → "Octubre 2026" */
export function formatMonth(month: string) {
  const label = monthFormatter
    .format(toUtcNoon(`${month}-01`))
    .replace(' de ', ' ')
  return label.charAt(0).toUpperCase() + label.slice(1)
}

const weekdayShortFormatter = new Intl.DateTimeFormat('es-ES', {
  weekday: 'short',
  timeZone: 'UTC',
})
const monthShortFormatter = new Intl.DateTimeFormat('es-ES', {
  month: 'short',
  timeZone: 'UTC',
})

/** '2026-10-27' → { weekday: 'mar', day: '27', month: 'oct' } (tira de días) */
export function dayParts(date: string) {
  const d = toUtcNoon(date)
  return {
    weekday: weekdayShortFormatter.format(d).replace('.', ''),
    day: String(Number(date.slice(8, 10))),
    month: monthShortFormatter.format(d).replace('.', ''),
  }
}

/** '11:30' + 60 → "11:30–12:30" */
export function formatTimeRange(start: string, end: string) {
  return `${start}–${end}`
}

const weekdayLongFormatter = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  timeZone: 'UTC',
})

/** '2026-10-27' → "Martes" */
export function formatWeekday(date: string) {
  const label = weekdayLongFormatter.format(toUtcNoon(date))
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export const bookingStatusLabel: Record<BookingStatus, string> = {
  confirmada: 'Confirmada',
  pendiente_pago: 'Pendiente de pago',
  completada: 'Completada',
  cancelada: 'Cancelada',
}
