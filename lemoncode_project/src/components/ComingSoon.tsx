import { Link } from '@tanstack/react-router'

import { Button } from '#/components/ui/button'

export function ComingSoon({ title }: { title: string }) {
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
        <Link to="/servicios">Explorar servicios</Link>
      </Button>
    </main>
  )
}
