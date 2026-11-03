// Fechas de calendario ('YYYY-MM-DD') y horas ('HH:mm') en Europe/Madrid.
// Las reservas guardan instantes ISO con offset; aquí se convierten en ambos sentidos.

export const TIME_ZONE = 'Europe/Madrid'

const dateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE })
const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})
const offsetFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  timeZoneName: 'longOffset',
})

/** Fecha y hora de un instante en Madrid. */
export function toMadrid(instant: Date | string) {
  const d = typeof instant === 'string' ? new Date(instant) : instant
  return { date: dateFormatter.format(d), time: timeFormatter.format(d) }
}

export function nowInMadrid() {
  return toMadrid(new Date())
}

/** '2026-10-27' + '11:30' → '2026-10-27T11:30:00+01:00' */
export function madridToIso(date: string, time: string) {
  const noon = new Date(`${date}T12:00:00Z`)
  const zone =
    offsetFormatter.formatToParts(noon).find((p) => p.type === 'timeZoneName')
      ?.value ?? 'GMT+01:00'
  const offset = zone === 'GMT' ? '+00:00' : zone.replace('GMT', '')
  return `${date}T${time}:00${offset}`
}

export function addDays(date: string, days: number) {
  const d = new Date(`${date}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** 0 = lunes … 6 = domingo */
export function weekdayIndex(date: string) {
  return (new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7
}

/** '2026-10' → días del mes en 'YYYY-MM-DD' */
export function daysOfMonth(month: string) {
  const [y, m] = month.split('-').map(Number)
  const count = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return Array.from(
    { length: count },
    (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`,
  )
}

/** '2026-12' + 1 → '2027-01' */
export function addMonths(month: string, n: number) {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + n, 1))
  return d.toISOString().slice(0, 7)
}

/** '11:30' + 60 → '12:30' */
export function addMinutes(time: string, minutes: number) {
  const [h, m] = time.split(':').map(Number)
  const total = (h * 60 + m + minutes) % (24 * 60)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}
