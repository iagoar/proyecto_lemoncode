import { createFileRoute } from '@tanstack/react-router'

import { ComingSoon } from '#/components/ComingSoon'

// TODO: pantalla Tus reservas (HANDOFF §5.5).
export const Route = createFileRoute('/_cliente/reservas')({
  component: () => <ComingSoon title="Tus reservas" />,
})
