import { createFileRoute } from '@tanstack/react-router'

import { ProfessionalsManager } from '#/features/admin/ProfessionalsManager'

export const Route = createFileRoute('/_admin/admin/profesionales')({
  head: () => ({ meta: [{ title: 'Profesionales · Backoffice · rumbo.' }] }),
  component: ProfessionalsManager,
})
