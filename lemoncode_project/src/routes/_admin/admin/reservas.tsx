import { createFileRoute } from '@tanstack/react-router'

import {
  adminBookingsSearchSchema,
  BookingsManager,
} from '#/features/admin/BookingsManager'

export const Route = createFileRoute('/_admin/admin/reservas')({
  validateSearch: (search) => adminBookingsSearchSchema.parse(search),
  head: () => ({ meta: [{ title: 'Reservas · Backoffice · rumbo.' }] }),
  component: AdminBookingsPage,
})

function AdminBookingsPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  return (
    <BookingsManager
      search={search}
      onSearchChange={(patch) =>
        navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true })
      }
    />
  )
}
