import { createFileRoute } from '@tanstack/react-router'

import { ComingSoon } from '#/components/ComingSoon'

// Destino de recuperación de contraseña, condiciones y perfil (fuera de alcance, HANDOFF §10).
export const Route = createFileRoute('/proximamente')({
  head: () => ({ meta: [{ title: 'Próximamente · rumbo.' }] }),
  component: () => <ComingSoon title="Estamos trabajando en ello" />,
})
