import { createFileRoute } from '@tanstack/react-router'

import { ComingSoon } from '#/components/ComingSoon'

// TODO: pantalla de detalle (HANDOFF §5.3).
export const Route = createFileRoute('/_cliente/servicios/$slug')({
  component: () => <ComingSoon title="Detalle del servicio" />,
})
