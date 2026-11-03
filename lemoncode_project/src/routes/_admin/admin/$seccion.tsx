import { createFileRoute } from '@tanstack/react-router'

import { ComingSoon } from '#/components/ComingSoon'

// Reservas, Profesionales, Clientes y Ajustes quedan fuera de alcance (HANDOFF §10).
const titles: Record<string, string> = {
  reservas: 'Reservas',
  profesionales: 'Profesionales',
  clientes: 'Clientes',
  ajustes: 'Ajustes',
}

export const Route = createFileRoute('/_admin/admin/$seccion')({
  head: () => ({ meta: [{ title: 'Próximamente · rumbo.' }] }),
  component: AdminComingSoon,
})

function AdminComingSoon() {
  const { seccion } = Route.useParams()
  return (
    <ComingSoon
      title={titles[seccion] ?? 'Estamos trabajando en ello'}
      backTo="/admin/servicios"
      backLabel="Volver a servicios"
    />
  )
}
