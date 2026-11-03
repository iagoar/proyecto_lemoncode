import { createFileRoute } from '@tanstack/react-router'

import {
  ServicesManager,
  manageServicesSearchSchema,
} from '#/features/admin/ServicesManager'

export const Route = createFileRoute('/_admin/admin/servicios')({
  validateSearch: (search) => manageServicesSearchSchema.parse(search),
  head: () => ({ meta: [{ title: 'Servicios · Backoffice · rumbo.' }] }),
  component: AdminServicesPage,
})

function AdminServicesPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  return (
    <ServicesManager
      variant="backoffice"
      search={search}
      onSearchChange={(patch) =>
        navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true })
      }
    />
  )
}
