import { queryOptions } from '@tanstack/react-query'

import { getSession } from './auth'
import { http } from './http'
import type { Professional } from './types'

// Ficha pública del profesional con sesión (la que se ve en el detalle de
// cada servicio). El nombre se sincroniza desde el perfil de la cuenta.

export type ProfessionalCardInput = Pick<Professional, 'title' | 'bio'>

function ownId() {
  const user = getSession()
  if (user?.role !== 'profesional' || !user.professionalId) {
    throw new Error('Tu cuenta no tiene una ficha de profesional asociada.')
  }
  return user.professionalId
}

async function getMine(): Promise<Professional | null> {
  return http.find<Professional>(
    `/professionals/${encodeURIComponent(ownId())}`,
  )
}

async function updateMine(input: ProfessionalCardInput): Promise<Professional> {
  return http.patch<Professional>(
    `/professionals/${encodeURIComponent(ownId())}`,
    { title: input.title.trim(), bio: input.bio.trim() },
  )
}

export const professionals = { getMine, updateMine }

export const professionalsQueries = {
  all: ['professionals'] as const,
  mine: () =>
    queryOptions({
      queryKey: [...professionalsQueries.all, 'mine', getSession()?.id],
      queryFn: getMine,
    }),
}
