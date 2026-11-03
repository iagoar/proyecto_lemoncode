import { useCallback, useState } from 'react'

import { readJson, writeJson } from '#/lib/api/storage'
import type { BookingContact, PaymentMethod } from '#/lib/api/types'

// Borrador de la reserva en curso (HANDOFF §5.4). Vive en sessionStorage para
// sobrevivir a recargas dentro del flujo. Los datos de tarjeta nunca se guardan.

export interface BookingDraft {
  date?: string // 'YYYY-MM-DD'
  time?: string // 'HH:mm'
  contact?: BookingContact
  notes?: string
  paymentMethod: PaymentMethod
  bookingId?: string
}

const emptyDraft: BookingDraft = { paymentMethod: 'tarjeta' }

const storageKey = (slug: string) => `rumbo-booking-draft:${slug}`

/** `fresh` descarta un borrador ya confirmado (empezar una reserva nueva). */
export function useBookingDraft(slug: string, { fresh = false } = {}) {
  const [draft, setDraft] = useState<BookingDraft>(() => {
    const stored = readJson<BookingDraft>(sessionStorage, storageKey(slug))
    if (!stored || (fresh && stored.bookingId)) return emptyDraft
    return { ...emptyDraft, ...stored }
  })

  const update = useCallback(
    (patch: Partial<BookingDraft>) => {
      setDraft((prev) => {
        const next = { ...prev, ...patch }
        writeJson(sessionStorage, storageKey(slug), next)
        return next
      })
    },
    [slug],
  )

  return { draft, update }
}
