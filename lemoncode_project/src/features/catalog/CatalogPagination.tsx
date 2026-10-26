import { Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { buttonVariants } from '#/components/ui/button'
import { cn } from '#/lib/utils'

/** Paginación de escritorio (HANDOFF §5.2). Cada página es un enlace con `?pagina=`. */
export function CatalogPagination({
  page,
  totalPages,
}: {
  page: number
  totalPages: number
}) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  const arrow = cn(buttonVariants({ variant: 'outline', size: 'icon' }))

  return (
    <nav
      aria-label="Paginación"
      className="hidden flex-wrap justify-center gap-1.5 pt-2 md:flex"
    >
      <PageLink
        page={page - 1}
        disabled={page <= 1}
        className={arrow}
        label="Página anterior"
      >
        <ChevronLeft className="size-[18px]" />
      </PageLink>
      {pages.map((p) => (
        <Link
          key={p}
          to="/servicios"
          search={(prev) => ({ ...prev, pagina: p === 1 ? undefined : p })}
          aria-current={p === page ? 'page' : undefined}
          aria-label={`Página ${p}`}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'icon' }),
            'font-mono',
            p === page &&
              'bg-foreground font-medium text-background hover:bg-foreground hover:text-background',
          )}
        >
          {p}
        </Link>
      ))}
      <PageLink
        page={page + 1}
        disabled={page >= totalPages}
        className={arrow}
        label="Página siguiente"
      >
        <ChevronRight className="size-[18px]" />
      </PageLink>
    </nav>
  )
}

function PageLink({
  page,
  disabled,
  className,
  label,
  children,
}: {
  page: number
  disabled: boolean
  className: string
  label: string
  children: React.ReactNode
}) {
  if (disabled) {
    return (
      <span aria-disabled className={cn(className, 'opacity-50')} aria-label={label}>
        {children}
      </span>
    )
  }
  return (
    <Link
      to="/servicios"
      search={(prev) => ({ ...prev, pagina: page === 1 ? undefined : page })}
      aria-label={label}
      className={className}
    >
      {children}
    </Link>
  )
}
