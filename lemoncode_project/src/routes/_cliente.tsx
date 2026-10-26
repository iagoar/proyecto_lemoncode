import { createFileRoute, redirect } from '@tanstack/react-router'

import { ClientLayout } from '#/layouts/ClientLayout'
import { getSession } from '#/lib/api/auth'

// Layout de cliente con guarda de sesión (HANDOFF §4).
// La sesión mock vive en el navegador, así que esta rama se renderiza solo en cliente.
export const Route = createFileRoute('/_cliente')({
  ssr: false,
  beforeLoad: ({ location }) => {
    const user = getSession()
    if (!user) {
      throw redirect({ to: '/login', search: { next: location.href } })
    }
    return { user }
  },
  component: ClienteRoute,
})

function ClienteRoute() {
  const { user } = Route.useRouteContext()
  return <ClientLayout user={user} />
}
