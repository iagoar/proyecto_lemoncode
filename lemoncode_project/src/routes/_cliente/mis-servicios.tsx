import { createFileRoute, redirect } from '@tanstack/react-router'

import {
  ServicesManager,
  manageServicesSearchSchema,
} from '#/features/admin/ServicesManager'

// Gestión de servicios del profesional, dentro del layout de cliente.
// El admin tiene la suya en el backoffice; un cliente vuelve al catálogo.
export const Route = createFileRoute('/_cliente/mis-servicios')({
  validateSearch: (search) => manageServicesSearchSchema.parse(search),
  beforeLoad: ({ context }) => {
    if (context.user.role === 'admin') {
      throw redirect({ to: '/admin/servicios' })
    }
    if (context.user.role !== 'profesional') {
      throw redirect({ to: '/servicios' })
    }
  },
  head: () => ({ meta: [{ title: 'Mis servicios · rumbo.' }] }),
  component: MyServicesPage,
})

function MyServicesPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  return (
    <ServicesManager
      variant="profesional"
      search={search}
      onSearchChange={(patch) =>
        navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true })
      }
    />
  )
}
