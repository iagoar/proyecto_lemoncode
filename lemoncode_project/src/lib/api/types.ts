// Modelo de datos (HANDOFF §3)

export type Category = 'coaching' | 'bienestar' | 'formacion'
export type Mode = 'online' | 'presencial'

export interface Professional {
  id: string
  name: string
  title: string
  bio: string
  avatarUrl?: string
}

export interface Service {
  id: string
  slug: string
  name: string
  category: Category
  mode: Mode
  durationMin: number
  priceCents: number | null
  professionalId: string
  summary: string
  description: string
  includes: string[]
  imageUrl?: string
  published: boolean
}

export interface ServiceWithProfessional extends Service {
  professional: Professional
}

export interface User {
  id: string
  name: string
  email: string
  role: 'cliente' | 'admin'
}

export type ServiceSort = 'relevancia' | 'precio-asc' | 'precio-desc' | 'duracion'

export interface ServiceListParams {
  q?: string
  category?: Category
  mode?: Mode
  sort?: ServiceSort
  page?: number
  pageSize?: number
}

export interface Paginated<T> {
  items: T[]
  total: number
}
