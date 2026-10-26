import { createFileRoute } from '@tanstack/react-router'

import { ComingSoon } from '#/components/ComingSoon'

// Destino de registro, recuperación de contraseña y perfil (fuera de alcance, HANDOFF §10).
export const Route = createFileRoute('/proximamente')({
  head: () => ({ meta: [{ title: 'Próximamente · rumbo.' }] }),
  component: () => <ComingSoon title="Estamos trabajando en ello" />,
})
