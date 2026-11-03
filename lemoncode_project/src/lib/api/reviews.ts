import { queryOptions } from '@tanstack/react-query'

import { http } from './http'
import type { Review, ReviewSummary } from './types'

// Opiniones en json-server, de la más reciente a la más antigua.

async function listByService(serviceId: string): Promise<ReviewSummary> {
  const items = await http.get<Review[]>('/reviews', {
    serviceId,
    _sort: 'date',
    _order: 'desc',
  })
  const average = items.length
    ? items.reduce((sum, r) => sum + r.rating, 0) / items.length
    : null
  return { items, total: items.length, average }
}

/** Lo usa bookings.rate al valorar una sesión. */
export function addReview(review: Omit<Review, 'id'>): Promise<Review> {
  return http.post<Review>('/reviews', {
    ...review,
    id: `rev-${Date.now().toString(36)}`,
  })
}

export const reviews = { listByService }

export const reviewsQueries = {
  all: ['reviews'] as const,
  byService: (serviceId: string) =>
    queryOptions({
      queryKey: [...reviewsQueries.all, serviceId],
      queryFn: () => listByService(serviceId),
    }),
}
