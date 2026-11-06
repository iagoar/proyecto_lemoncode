import { queryOptions } from '@tanstack/react-query'

import {
  createProfessionalAccount,
  EmailTakenError,
  getSession,
  normalizeEmail,
  requireAdmin,
  toUser,
  type UserRecord,
} from './auth'
import { http } from './http'
import type { Professional, Service, User } from './types'

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

// --- Backoffice (admin) -----------------------------------------------------

export interface ProfessionalRow extends Professional {
  /** Cuenta de acceso vinculada (rol profesional), si la tiene. */
  account: User | null
  serviceCount: number
  publishedCount: number
}

export interface ProfessionalAdminInput {
  name: string
  title: string
  bio: string
  avatarUrl?: string
  /** Crea la cuenta de acceso si la ficha aún no tiene. */
  account?: { email: string; password: string }
  /** Cambia la contraseña de la cuenta existente. */
  newPassword?: string
}

async function listAdmin(): Promise<ProfessionalRow[]> {
  requireAdmin()
  const [items, services, users] = await Promise.all([
    http.get<Professional[]>('/professionals'),
    http.get<Pick<Service, 'professionalId' | 'published'>[]>('/services'),
    http.get<UserRecord[]>('/users', { role: 'profesional' }),
  ])
  return items.map((professional) => {
    const own = services.filter((s) => s.professionalId === professional.id)
    const account = users.find((u) => u.professionalId === professional.id)
    return {
      ...professional,
      account: account ? toUser(account) : null,
      serviceCount: own.length,
      publishedCount: own.filter((s) => s.published).length,
    }
  })
}

async function save(
  id: string | undefined,
  input: ProfessionalAdminInput,
): Promise<Professional> {
  requireAdmin()
  const card = {
    name: input.name.trim(),
    title: input.title.trim(),
    bio: input.bio.trim(),
    avatarUrl: input.avatarUrl?.trim() || undefined,
  }

  // El email se comprueba antes de crear la ficha, para no dejarla a medias.
  if (input.account) {
    const email = normalizeEmail(input.account.email)
    const [taken] = await http.get<UserRecord[]>('/users', { email })
    if (taken) throw new EmailTakenError()
  }

  let professional: Professional
  if (id) {
    const existing = await http.find<Professional>(
      `/professionals/${encodeURIComponent(id)}`,
    )
    if (!existing) throw new Error('No encontramos este profesional.')
    // PUT: así se borra la foto si se vacía el campo.
    professional = await http.put<Professional>(
      `/professionals/${encodeURIComponent(id)}`,
      { ...existing, ...card },
    )
    const [account] = await http.get<UserRecord[]>('/users', {
      professionalId: id,
    })
    if (account) {
      // El nombre de la ficha y el de la cuenta van siempre a la par.
      await http.patch(`/users/${encodeURIComponent(account.id)}`, {
        name: card.name,
        ...(input.newPassword ? { password: input.newPassword } : {}),
      })
    }
  } else {
    professional = await http.post<Professional>('/professionals', {
      ...card,
      id: `pro-${Date.now().toString(36)}`,
    })
  }

  if (input.account) {
    await createProfessionalAccount({
      name: card.name,
      email: input.account.email,
      password: input.account.password,
      professionalId: professional.id,
    })
  }
  return professional
}

export class ProfessionalHasServicesError extends Error {
  constructor(count: number) {
    super(
      `Tiene ${count} ${count === 1 ? 'servicio' : 'servicios'}. Asígnalos a otro profesional o elimínalos antes.`,
    )
  }
}

/**
 * json-server borra en cascada lo que apunta a la ficha (`professionalId`):
 * su cuenta de acceso y sus servicios. Por eso solo se deja borrar sin servicios.
 */
async function remove(id: string) {
  requireAdmin()
  const own = await http.get<Service[]>('/services', { professionalId: id })
  if (own.length > 0) throw new ProfessionalHasServicesError(own.length)
  await http.delete(`/professionals/${encodeURIComponent(id)}`)
}

export const professionals = {
  getMine,
  updateMine,
  listAdmin,
  save,
  remove,
}

export const professionalsQueries = {
  all: ['professionals'] as const,
  admin: () =>
    queryOptions({
      queryKey: [...professionalsQueries.all, 'admin'],
      queryFn: listAdmin,
    }),
  mine: () =>
    queryOptions({
      queryKey: [...professionalsQueries.all, 'mine', getSession()?.id],
      queryFn: getMine,
    }),
}
