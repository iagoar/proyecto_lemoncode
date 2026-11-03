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
  /** Horario definido en el backoffice. Sin él se usan las reglas mock. */
  schedule?: ServiceSchedule
}

export interface ServiceSchedule {
  weekdays: number[] // 0 = lunes … 6 = domingo
  times: string[] // 'HH:mm', ordenadas
}

export interface ServiceWithProfessional extends Service {
  professional: Professional
}

export interface Review {
  id: string
  serviceId: string
  author: string
  rating: 1 | 2 | 3 | 4 | 5
  text: string
  date: string // 'YYYY-MM-DD'
}

export interface ReviewSummary {
  items: Review[]
  total: number
  average: number | null
}

export interface Slot {
  time: string // 'HH:mm'
  available: boolean
}

export interface NextSlot {
  date: string // 'YYYY-MM-DD'
  time: string // 'HH:mm'
}

export type DayStatus = 'disponible' | 'completo' | 'cerrado'

export interface DayAvailability {
  date: string // 'YYYY-MM-DD'
  status: DayStatus
}

export type BookingStatus =
  'confirmada' | 'pendiente_pago' | 'completada' | 'cancelada'
export type PaymentMethod = 'tarjeta' | 'en_sesion'

export interface BookingContact {
  name: string
  email: string
  phone?: string
}

export interface Booking {
  id: string
  serviceId: string
  userId: string
  start: string // ISO
  end: string // ISO
  status: BookingStatus
  paymentMethod: PaymentMethod
  notes?: string
  contact: BookingContact
  rated?: boolean
}

export interface BookingWithService extends Booking {
  service: ServiceWithProfessional
}

export interface ServiceInput {
  id?: string
  name: string
  category: Category
  mode: Mode
  durationMin: number
  priceCents: number | null
  professionalId: string
  summary?: string
  description: string
  includes: string[]
  imageUrl?: string
  published: boolean
  schedule: ServiceSchedule
}

export interface CreateBookingInput {
  serviceId: string
  date: string // 'YYYY-MM-DD'
  time: string // 'HH:mm'
  paymentMethod: PaymentMethod
  notes?: string
  contact: BookingContact
}

/** admin: gestiona todo el catálogo. profesional: solo sus servicios. */
export type Role = 'cliente' | 'admin' | 'profesional'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  /** Solo rol 'profesional': su ficha en `professionals`. */
  professionalId?: string
  phone?: string
  createdAt?: string // 'YYYY-MM-DD'
}

export interface ProfileInput {
  name: string
  phone?: string
}

export type ServiceSort =
  'relevancia' | 'precio-asc' | 'precio-desc' | 'duracion'

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
