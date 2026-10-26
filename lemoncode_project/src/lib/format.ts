import type { Category, Mode } from '#/lib/api/types'

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
