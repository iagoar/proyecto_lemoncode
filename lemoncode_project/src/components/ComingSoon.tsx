import { Link, type LinkProps } from '@tanstack/react-router'

import { Button } from '#/components/ui/button'

export function ComingSoon({
  title,
  backTo = '/servicios',
  backLabel = 'Explorar servicios',
}: {
  title: string
  backTo?: LinkProps['to']
  backLabel?: string
}) {
  return (
    <main className="mx-auto flex max-w-page flex-col items-start gap-4 px-4 py-10 md:px-6">
      <p className="font-display text-eyebrow text-muted-foreground uppercase">
        Próximamente
      </p>
      <h1 className="text-h2 md:text-h1">{title}</h1>
      <p className="text-muted-foreground">
        Esta sección todavía no está disponible.
      </p>
      <Button asChild variant="outline">
        <Link to={backTo}>{backLabel}</Link>
      </Button>
    </main>
  )
}
