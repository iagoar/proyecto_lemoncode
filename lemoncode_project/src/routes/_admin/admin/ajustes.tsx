import { createFileRoute } from '@tanstack/react-router'

import { SettingsPage } from '#/features/admin/SettingsForm'

export const Route = createFileRoute('/_admin/admin/ajustes')({
  head: () => ({ meta: [{ title: 'Ajustes · Backoffice · rumbo.' }] }),
  component: SettingsPage,
})
