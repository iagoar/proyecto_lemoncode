import { createFileRoute, redirect } from '@tanstack/react-router'

import { AdminLayout } from '#/layouts/AdminLayout'
import { getSession } from '#/lib/api/auth'

// Layout de admin con guarda (HANDOFF §4): sin sesión → login; cliente → catálogo;
// profesional → sus servicios (usa el layout de cliente).
export const Route = createFileRoute('/_admin')({
  ssr: false,
  beforeLoad: ({ location }) => {
    const user = getSession()
    if (!user) {
      throw redirect({ to: '/login', search: { next: location.href } })
    }
    if (user.role === 'profesional') throw redirect({ to: '/mis-servicios' })
    if (user.role !== 'admin') throw redirect({ to: '/servicios' })
    return { user }
  },
  component: AdminLayout,
})
