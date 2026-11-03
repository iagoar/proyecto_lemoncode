import { ChevronRight, Pencil, Search, Trash2 } from 'lucide-react'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Skeleton } from '#/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import type { ServiceWithProfessional } from '#/lib/api/types'
import { categoryLabel, formatDuration, formatPrice } from '#/lib/format'
import { cn } from '#/lib/utils'

export type StatusFilter = 'publicado' | 'borrador' | undefined

export function StatusBadge({ published }: { published: boolean }) {
  return published ? (
    <Badge variant="accent">Publicado</Badge>
  ) : (
    <Badge variant="draft">Borrador</Badge>
  )
}

export function AdminSearch({
  id,
  value,
  onChange,
  className,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  return (
    <div className={cn('relative', className)}>
      <Label htmlFor={id} className="sr-only">
        Buscar servicio
      </Label>
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        id={id}
        type="search"
        placeholder="Buscar servicio…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 md:h-10 md:text-sm"
      />
    </div>
  )
}

// Escritorio: tabla en Card con buscador, filtro de estado y paginación (HANDOFF §5.6).
export function ServicesTable({
  items,
  loading,
  editingId,
  query,
  onQueryChange,
  status,
  onStatusChange,
  page,
  pageSize,
  total,
  onPageChange,
  onEdit,
  onDelete,
}: {
  items: ServiceWithProfessional[]
  loading: boolean
  editingId?: string
  query: string
  onQueryChange: (value: string) => void
  status: StatusFilter
  onStatusChange: (value: StatusFilter) => void
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onEdit: (service: ServiceWithProfessional) => void
  onDelete: (service: ServiceWithProfessional) => void
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <section
      aria-label="Listado de servicios"
      className="min-w-0 overflow-hidden rounded-xl border bg-card"
    >
      <div className="flex flex-wrap gap-3 border-b p-4">
        <AdminSearch
          id="admin-buscar"
          value={query}
          onChange={onQueryChange}
          className="flex-[1_1_220px]"
        />
        <Label htmlFor="admin-estado" className="sr-only">
          Estado
        </Label>
        <Select
          value={status ?? 'todos'}
          onValueChange={(v) =>
            onStatusChange(v === 'todos' ? undefined : (v as StatusFilter))
          }
        >
          <SelectTrigger
            id="admin-estado"
            size="sm"
            className="flex-[0_1_180px] text-sm"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="publicado">Publicado</SelectItem>
            <SelectItem value="borrador">Borrador</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table className="min-w-[560px]">
        <TableHeader>
          <tr>
            <TableHead>Nombre</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Duración</TableHead>
            <TableHead>Precio</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 6 }, (_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={6}>
                  <Skeleton className="h-7" />
                </TableCell>
              </TableRow>
            ))
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="py-10 text-center text-muted-foreground"
              >
                No hay servicios con esos filtros.
              </TableCell>
            </TableRow>
          ) : (
            items.map((service) => {
              const editing = service.id === editingId
              return (
                <TableRow
                  key={service.id}
                  aria-current={editing ? 'true' : undefined}
                  className={cn(
                    editing &&
                      'bg-muted shadow-[inset_3px_0_0_var(--color-primary)]',
                  )}
                >
                  <TableCell className="font-semibold">
                    {service.name}
                  </TableCell>
                  <TableCell>{categoryLabel[service.category]}</TableCell>
                  <TableCell className="font-mono">
                    {formatDuration(service.durationMin)}
                  </TableCell>
                  <TableCell className="font-mono">
                    {formatPrice(service.priceCents)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge published={service.published} />
                  </TableCell>
                  <TableCell className="py-1.5">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Editar ${service.name}`}
                        onClick={() => onEdit(service)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Eliminar ${service.name}`}
                        className="text-destructive hover:bg-destructive/5 hover:text-destructive"
                        onClick={() => onDelete(service)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-caption text-muted-foreground">
        <span aria-live="polite">
          Mostrando {from}–{to} de {total}
        </span>
        <div className="flex gap-1.5">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={to >= total}
            onClick={() => onPageChange(page + 1)}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </section>
  )
}

// Móvil: lista en Card con botón de editar por fila.
export function ServicesList({
  items,
  loading,
  onEdit,
}: {
  items: ServiceWithProfessional[]
  loading: boolean
  onEdit: (service: ServiceWithProfessional) => void
}) {
  if (loading) {
    return (
      <div className="flex flex-col gap-px overflow-hidden rounded-xl border bg-card">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="p-4">
            <Skeleton className="h-12" />
          </div>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <p className="rounded-xl border bg-card p-6 text-center text-muted-foreground">
        No hay servicios con esa búsqueda.
      </p>
    )
  }

  return (
    <ul className="divide-y overflow-hidden rounded-xl border bg-card">
      {items.map((service) => (
        <li key={service.id}>
          <button
            type="button"
            aria-label={`Editar ${service.name}`}
            onClick={() => onEdit(service)}
            className="flex w-full items-center gap-3 py-3 pr-2 pl-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          >
            <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
              <span className="font-semibold">{service.name}</span>
              <span className="text-caption text-muted-foreground">
                {categoryLabel[service.category]} ·{' '}
                <span className="font-mono">
                  {formatDuration(service.durationMin)} ·{' '}
                  {formatPrice(service.priceCents)}
                </span>
              </span>
              <StatusBadge published={service.published} />
            </span>
            <span
              aria-hidden
              className="grid size-11 place-items-center text-muted-foreground"
            >
              <ChevronRight className="size-5" />
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
