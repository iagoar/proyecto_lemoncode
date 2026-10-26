import { z } from 'zod'

import type { ServiceListParams } from '#/lib/api/types'

// Filtros del catálogo en la URL (HANDOFF §5.2): ?q=&cat=&modo=&orden=&pagina=
export const catalogSearchSchema = z.object({
  q: z.string().trim().min(1).optional().catch(undefined),
  cat: z.enum(['coaching', 'bienestar', 'formacion']).optional().catch(undefined),
  modo: z.enum(['online', 'presencial']).optional().catch(undefined),
  orden: z
    .enum(['relevancia', 'precio-asc', 'precio-desc', 'duracion'])
    .optional()
    .catch(undefined),
  pagina: z.coerce.number().int().min(1).optional().catch(undefined),
})

export type CatalogSearch = z.infer<typeof catalogSearchSchema>

export function toListParams(search: CatalogSearch): ServiceListParams {
  return {
    q: search.q,
    category: search.cat,
    mode: search.modo,
    sort: search.orden,
  }
}

export const modeOptions = [
  { value: 'todas', label: 'Todas' },
  { value: 'online', label: 'Online' },
  { value: 'presencial', label: 'Presencial' },
] as const

export const sortOptions = [
  { value: 'relevancia', label: 'Relevancia' },
  { value: 'precio-asc', label: 'Precio: menor a mayor' },
  { value: 'precio-desc', label: 'Precio: mayor a menor' },
  { value: 'duracion', label: 'Duración' },
] as const

export const categoryOptions = [
  { value: 'todos', label: 'Todos' },
  { value: 'coaching', label: 'Coaching' },
  { value: 'bienestar', label: 'Bienestar' },
  { value: 'formacion', label: 'Formación' },
] as const
