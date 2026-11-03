import { Link } from '@tanstack/react-router'

import { Button } from '#/components/ui/button'

/** Página de error o 404 con vuelta al catálogo. */
export function StatePage({
  eyebrow,
  title,
  text,
  action,
}: {
  eyebrow: string
  title: string
  text: string
  action?: React.ReactNode
}) {
  return (
    <main className="mx-auto flex max-w-page flex-col items-start gap-4 px-4 pt-[max(env(safe-area-inset-top),2.5rem)] pb-10 md:px-6 md:pt-10">
      <p className="font-display text-eyebrow text-muted-foreground uppercase">
        {eyebrow}
      </p>
      <h1 className="text-h2 md:text-h1">{title}</h1>
      <p className="text-muted-foreground">{text}</p>
      <div className="flex flex-wrap gap-3">
        {action}
        <Button asChild variant={action ? 'outline' : 'default'}>
          <Link to="/servicios">Volver al catálogo</Link>
        </Button>
      </div>
    </main>
  )
}
