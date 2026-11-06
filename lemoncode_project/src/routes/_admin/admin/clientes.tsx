import { createFileRoute } from '@tanstack/react-router'

import {
  adminClientsSearchSchema,
  ClientsManager,
} from '#/features/admin/ClientsManager'

export const Route = createFileRoute('/_admin/admin/clientes')({
  validateSearch: (search) => adminClientsSearchSchema.parse(search),
  head: () => ({ meta: [{ title: 'Clientes · Backoffice · rumbo.' }] }),
  component: AdminClientsPage,
})

function AdminClientsPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  return (
    <ClientsManager
      search={search}
      onSearchChange={(patch) =>
        navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true })
      }
    />
  )
}
