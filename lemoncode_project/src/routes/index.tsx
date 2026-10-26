import { createFileRoute, redirect } from '@tanstack/react-router'

// HANDOFF §4: `/` → `/servicios`
export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/servicios' })
  },
})
