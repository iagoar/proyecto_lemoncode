import { keepPreviousData, queryOptions } from '@tanstack/react-query'

import { professionalsSeed, servicesSeed } from './seed'
import { delay, readJson } from './storage'
import type {
  Paginated,
  Service,
  ServiceListParams,
  ServiceWithProfessional,
} from './types'

const SERVICES_KEY = 'rumbo-services'

export const SERVICES_PAGE_SIZE = 9

function loadServices(): Service[] {
  return readJson<Service[]>(localStorage, SERVICES_KEY) ?? servicesSeed
}

function withProfessional(service: Service): ServiceWithProfessional {
  const professional =
    professionalsSeed.find((p) => p.id === service.professionalId) ??
    professionalsSeed[0]
  return { ...service, professional }
}

function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
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

  let items = loadServices()
    .filter((s) => s.published)
    .map(withProfessional)
    .filter((s) => !category || s.category === category)
    .filter((s) => !mode || s.mode === mode)
    .filter(
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
  return delay({ items: items.slice(start, start + pageSize), total: items.length })
}

async function get(slug: string): Promise<ServiceWithProfessional | null> {
  const service = loadServices().find((s) => s.slug === slug && s.published)
  return delay(service ? withProfessional(service) : null)
}

export const services = { list, get }

export const servicesQueries = {
  all: ['services'] as const,
  list: (params: ServiceListParams) =>
    queryOptions({
      queryKey: [...servicesQueries.all, 'list', params],
      queryFn: () => list(params),
      placeholderData: keepPreviousData,
    }),
  detail: (slug: string) =>
    queryOptions({
      queryKey: [...servicesQueries.all, 'detail', slug],
      queryFn: () => get(slug),
    }),
}
