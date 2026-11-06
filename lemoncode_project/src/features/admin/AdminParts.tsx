import { Search } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { cn } from '#/lib/utils'

// Piezas comunes de las secciones del backoffice.

export function normalize(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export function AdminPage({
  title,
  description,
  action,
  children,
}: {
  title: string
  description: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <main className="flex flex-col gap-4 px-4 pt-4 pb-10 md:gap-6 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-h2 font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground md:text-body">
            {description}
          </p>
        </div>
        {action}
      </div>
      {children}
    </main>
  )
}

export function SearchField({
  id,
  label,
  value,
  onChange,
  className,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  return (
    <div className={cn('relative', className)}>
      <Label htmlFor={id} className="sr-only">
        {label}
      </Label>
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        id={id}
        type="search"
        placeholder={`${label}…`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 md:h-10 md:text-sm"
      />
    </div>
  )
}

export function LoadError({
  what,
  onRetry,
}: {
  what: string
  onRetry: () => void
}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border bg-card p-6">
      <h2 className="text-h3">No hemos podido cargar {what}</h2>
      <Button variant="outline" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  )
}

export function EmptyRow({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border bg-card p-6 text-center text-muted-foreground">
      {children}
    </p>
  )
}

/** Paginación simple: "Mostrando 1–10 de 32" + Anterior / Siguiente. */
export function Pager({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  if (total <= pageSize) return null
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-caption text-muted-foreground">
      <span aria-live="polite">
        Mostrando {from}–{to} de {total}
      </span>
      <div className="flex gap-1.5">
        <Button
          variant="outline"
          size="sm"
          className="h-11 md:h-10"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-11 md:h-10"
          disabled={to >= total}
          onClick={() => onPageChange(page + 1)}
        >
          Siguiente
        </Button>
      </div>
    </div>
  )
}
