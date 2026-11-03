import { keepPreviousData, queryOptions } from '@tanstack/react-query'

import { getSession } from './auth'
import { http } from './http'
import type {
  Paginated,
  Professional,
  Service,
  ServiceInput,
  ServiceListParams,
  ServiceWithProfessional,
} from './types'

// Servicios en json-server. El profesional se une con `_expand=professional`.
// json-server filtra por campo exacto (publicado, categoría, modalidad); la
// búsqueda sin tildes, la ordenación y la paginación se hacen aquí para
// conservar el comportamiento del catálogo.

export const SERVICES_PAGE_SIZE = 9

export function getService(id: string) {
  return http.find<Service>(`/services/${encodeURIComponent(id)}`)
}

function normalize(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

async function list({
  q,
  category,
  mode,
  sort = 'relevancia',
  page = 1,
  pageSize = SERVICES_PAGE_SIZE,
}: ServiceListParams = {}): Promise<Paginated<ServiceWithProfessional>> {
  const needle = q ? normalize(q.trim()) : ''

  let items = (
    await http.get<ServiceWithProfessional[]>('/services', {
      published: true,
      category,
      mode,
      _expand: 'professional',
    })
  ).filter(
    (s) =>
      !needle ||
      normalize(`${s.name} ${s.summary} ${s.professional.name}`).includes(
        needle,
      ),
  )

  const price = (s: Service) => s.priceCents ?? 0
  if (sort === 'precio-asc') items = items.sort((a, b) => price(a) - price(b))
  if (sort === 'precio-desc') items = items.sort((a, b) => price(b) - price(a))
  if (sort === 'duracion')
    items = items.sort((a, b) => a.durationMin - b.durationMin)

  const start = (page - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
  }
}

async function get(slug: string): Promise<ServiceWithProfessional | null> {
  const [service] = await http.get<ServiceWithProfessional[]>('/services', {
    slug,
    published: true,
    _expand: 'professional',
  })
  return service ?? null
}

function slugify(name: string, taken: Set<string>) {
  const base =
    normalize(name)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'servicio'
  let slug = base
  for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`
  return slug
}

/** Primera frase de la descripción, para la tarjeta del catálogo. */
function summaryFrom(description: string) {
  const sentence = description.split(/(?<=\.)\s/)[0] ?? ''
  return sentence.length > 80 ? `${sentence.slice(0, 77)}…` : sentence
}

/**
 * Profesional con sesión: solo puede gestionar los servicios de su ficha.
 * Devuelve `undefined` para el admin (sin restricción).
 */
function ownProfessionalId() {
  const user = getSession()
  if (user?.role !== 'profesional') return undefined
  if (!user.professionalId) {
    throw new Error('Tu cuenta no tiene una ficha de profesional asociada.')
  }
  return user.professionalId
}

/** Backoffice: también los borradores. Un profesional solo ve los suyos. */
async function listAdmin(): Promise<ServiceWithProfessional[]> {
  return http.get<ServiceWithProfessional[]>('/services', {
    professionalId: ownProfessionalId(),
    _expand: 'professional',
  })
}

async function listProfessionals(): Promise<Professional[]> {
  const own = ownProfessionalId()
  return http.get<Professional[]>('/professionals', { id: own })
}

export class NotOwnServiceError extends Error {
  constructor() {
    super('Solo puedes gestionar tus propios servicios.')
  }
}

async function save(input: ServiceInput): Promise<Service> {
  const own = ownProfessionalId()
  const { id, summary, ...fields } = input
  const existing = id ? await getService(id) : null
  if (own) {
    if (existing && existing.professionalId !== own) {
      throw new NotOwnServiceError()
    }
    fields.professionalId = own
  }
  const data = {
    ...fields,
    summary: summary?.trim() || summaryFrom(fields.description),
    includes: fields.includes.map((item) => item.trim()).filter(Boolean),
  }

  if (existing) {
    // PUT reemplaza el recurso: así se borran los campos vaciados (p. ej. la imagen).
    return http.put<Service>(`/services/${encodeURIComponent(existing.id)}`, {
      ...existing,
      ...data,
      imageUrl: data.imageUrl,
    })
  }

  const slugs = await http.get<Pick<Service, 'slug'>[]>('/services')
  return http.post<Service>('/services', {
    ...data,
    id: `srv-${Date.now().toString(36)}`,
    slug: slugify(fields.name, new Set(slugs.map((s) => s.slug))),
  })
}

async function remove(id: string) {
  const own = ownProfessionalId()
  if (own && (await getService(id))?.professionalId !== own) {
    throw new NotOwnServiceError()
  }
  await http.delete(`/services/${encodeURIComponent(id)}`)
}

export const services = {
  list,
  get,
  listAdmin,
  listProfessionals,
  save,
  remove,
}

export const servicesQueries = {
  all: ['services'] as const,
  list: (params: ServiceListParams) =>
    queryOptions({
      queryKey: [...servicesQueries.all, 'list', params],
      queryFn: () => list(params),
      placeholderData: keepPreviousData,
    }),
  admin: () =>
    queryOptions({
      // La sesión cambia el resultado (admin ve todo; profesional, lo suyo).
      queryKey: [...servicesQueries.all, 'admin', getSession()?.id],
      queryFn: listAdmin,
    }),
  professionals: () =>
    queryOptions({
      queryKey: ['professionals', 'list', getSession()?.id],
      queryFn: listProfessionals,
      staleTime: Infinity,
    }),
  detail: (slug: string) =>
    queryOptions({
      queryKey: [...servicesQueries.all, 'detail', slug],
      queryFn: () => get(slug),
    }),
}
