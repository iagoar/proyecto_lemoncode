import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '#/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '#/components/ui/sheet'
import { Skeleton } from '#/components/ui/skeleton'
import { DeleteServiceDialog } from '#/features/admin/DeleteServiceDialog'
import { ServiceForm } from '#/features/admin/ServiceForm'
import {
  AdminSearch,
  ServicesList,
  ServicesTable,
  type StatusFilter,
} from '#/features/admin/ServicesTable'
import { UpcomingSessions } from '#/features/admin/UpcomingSessions'
import { useIsDesktop } from '#/hooks/use-media-query'
import {
  NotOwnServiceError,
  services,
  servicesQueries,
} from '#/lib/api/services'
import type { ServiceInput, ServiceWithProfessional } from '#/lib/api/types'
import { cn } from '#/lib/utils'

const PAGE_SIZE = 6
const FORM_ID = 'servicio'

export const manageServicesSearchSchema = z.object({
  editar: z.string().optional().catch(undefined),
  nuevo: z.literal(1).optional().catch(undefined),
  q: z.string().optional().catch(undefined),
  estado: z.enum(['publicado', 'borrador']).optional().catch(undefined),
  pagina: z.coerce.number().int().min(1).optional().catch(undefined),
})

function normalize(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export type ManageServicesSearch = z.infer<typeof manageServicesSearchSchema>

// HANDOFF §5.6. Gestión de servicios compartida: el backoffice del admin
// (`variant="backoffice"`, todo el catálogo) y "Mis servicios" del profesional
// (`variant="profesional"`, dentro del layout de cliente y solo con lo suyo;
// la capa de datos ya filtra y fija el profesional).
export function ServicesManager({
  variant,
  search,
  onSearchChange,
}: {
  variant: 'backoffice' | 'profesional'
  search: ManageServicesSearch
  onSearchChange: (patch: Partial<ManageServicesSearch>) => void
}) {
  const own = variant === 'profesional'
  const queryClient = useQueryClient()
  const isDesktop = useIsDesktop()
  const query = useQuery(servicesQueries.admin())
  const professionalsQuery = useQuery(servicesQueries.professionals())
  // Cambia para vaciar el formulario de "Nuevo servicio" al descartar.
  const [formKey, setFormKey] = useState(0)
  const [deleting, setDeleting] = useState<ServiceWithProfessional | null>(null)

  const all = query.data ?? []
  const editing = search.editar
    ? all.find((s) => s.id === search.editar)
    : undefined
  const formOpen = Boolean(search.nuevo || editing)

  const needle = normalize(search.q?.trim() ?? '')
  const filtered = all.filter(
    (s) =>
      (!needle || normalize(s.name).includes(needle)) &&
      (!search.estado || s.published === (search.estado === 'publicado')),
  )
  const page = Math.min(
    search.pagina ?? 1,
    Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)),
  )
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const publishedCount = all.filter((s) => s.published).length

  const setSearch = onSearchChange

  function closeForm() {
    setSearch({ editar: undefined, nuevo: undefined })
    setFormKey((k) => k + 1)
  }

  const save = useMutation({
    mutationFn: (input: ServiceInput) => services.save(input),
    onSuccess: (saved, input) => {
      queryClient.invalidateQueries({ queryKey: servicesQueries.all })
      toast.success(
        input.id
          ? `Has guardado «${saved.name}»`
          : `Has creado «${saved.name}»`,
      )
      if (isDesktop) setSearch({ editar: saved.id, nuevo: undefined })
      else closeForm()
    },
    onError: (error) =>
      toast.error(
        error instanceof NotOwnServiceError
          ? error.message
          : 'No hemos podido guardar el servicio. Inténtalo de nuevo.',
      ),
  })

  const remove = useMutation({
    mutationFn: (service: ServiceWithProfessional) =>
      services.remove(service.id),
    onSuccess: (_, service) => {
      setDeleting(null)
      queryClient.invalidateQueries({ queryKey: servicesQueries.all })
      toast.success(`Has eliminado «${service.name}»`)
      if (service.id === search.editar) closeForm()
    },
    onError: (error) =>
      toast.error(
        error instanceof NotOwnServiceError
          ? error.message
          : 'No hemos podido eliminar el servicio. Inténtalo de nuevo.',
      ),
  })

  const formTitle = editing ? 'Editar servicio' : 'Nuevo servicio'
  const form =
    professionalsQuery.data && !query.isPending ? (
      <ServiceForm
        key={editing?.id ?? `nuevo-${formKey}`}
        formId={FORM_ID}
        service={editing}
        professionals={professionalsQuery.data}
        fixedProfessionalId={own ? professionalsQuery.data[0]?.id : undefined}
        pending={save.isPending}
        onSubmit={(input) => save.mutate(input)}
      />
    ) : (
      <div className="flex flex-col gap-4" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    )

  const saveButton = (className?: string) => (
    <Button
      type="submit"
      form={FORM_ID}
      disabled={save.isPending}
      className={className}
    >
      {save.isPending ? 'Guardando…' : 'Guardar'}
    </Button>
  )

  return (
    <main
      className={cn(
        'flex flex-col gap-4 md:gap-6',
        own
          ? 'mx-auto w-full max-w-page px-4 pt-5 pb-6 md:px-6 md:pt-10 md:pb-14'
          : 'px-4 pt-4 pb-28 md:p-8',
      )}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-h2 font-bold">
            {own ? 'Mis servicios' : 'Servicios'}
          </h1>
          <p className="text-sm text-muted-foreground md:text-body">
            <span className="md:hidden">
              {query.data
                ? `${all.length} ${all.length === 1 ? 'servicio' : 'servicios'} · ${publishedCount} ${publishedCount === 1 ? 'publicado' : 'publicados'}`
                : 'Cargando…'}
            </span>
            <span className="hidden md:inline">
              {own
                ? 'Crea y publica tus servicios. Aparecen en el catálogo con tu ficha de profesional.'
                : 'Crea, edita y publica los servicios del catálogo.'}
            </span>
          </p>
        </div>
        <Button
          className="hidden md:inline-flex"
          onClick={() => {
            setSearch({ editar: undefined, nuevo: 1 })
            setFormKey((k) => k + 1)
          }}
        >
          <Plus aria-hidden />
          Nuevo servicio
        </Button>
      </div>

      {own && <UpcomingSessions />}

      {query.isError ? (
        <div className="flex flex-col items-start gap-3 rounded-xl border bg-card p-6">
          <h2 className="text-h3">No hemos podido cargar los servicios</h2>
          <Button variant="outline" onClick={() => query.refetch()}>
            Reintentar
          </Button>
        </div>
      ) : isDesktop ? (
        <div className="flex flex-wrap items-start gap-6">
          <div className="min-w-0 flex-[999_1_520px]">
            <ServicesTable
              items={pageItems}
              loading={query.isPending}
              editingId={editing?.id}
              query={search.q ?? ''}
              onQueryChange={(q) =>
                setSearch({ q: q || undefined, pagina: undefined })
              }
              status={search.estado}
              onStatusChange={(estado: StatusFilter) =>
                setSearch({ estado, pagina: undefined })
              }
              page={page}
              pageSize={PAGE_SIZE}
              total={filtered.length}
              onPageChange={(pagina) => setSearch({ pagina })}
              onEdit={(s) => setSearch({ editar: s.id, nuevo: undefined })}
              onDelete={setDeleting}
            />
          </div>
          <section
            aria-labelledby="form-title"
            className="flex min-w-0 flex-[1_1_340px] flex-col gap-4 rounded-xl border bg-card p-6 lg:sticky lg:top-8"
          >
            <h2 id="form-title" className="text-h3 font-semibold">
              {formTitle}
            </h2>
            {form}
            <div className="flex flex-wrap gap-2">
              {saveButton('flex-[1_1_120px]')}
              <Button
                variant="outline"
                className="flex-[1_1_120px]"
                onClick={closeForm}
              >
                Descartar
              </Button>
            </div>
          </section>
        </div>
      ) : (
        <>
          <AdminSearch
            id="admin-buscar-m"
            value={search.q ?? ''}
            onChange={(q) => setSearch({ q: q || undefined })}
          />
          <ServicesList
            items={filtered}
            loading={query.isPending}
            onEdit={(s) => setSearch({ editar: s.id, nuevo: undefined })}
          />
          {/* En "Mis servicios" la barra inferior es la de pestañas del cliente:
              el botón va en el flujo, no fijo. */}
          <div
            className={cn(
              !own &&
                'fixed inset-x-0 bottom-0 z-30 border-t bg-background px-4 pt-3 pb-[max(env(safe-area-inset-bottom),1rem)]',
            )}
          >
            <Button
              size="xl"
              className="w-full"
              onClick={() => setSearch({ nuevo: 1 })}
            >
              <Plus aria-hidden />
              Nuevo servicio
            </Button>
          </div>

          <Sheet open={formOpen} onOpenChange={(open) => !open && closeForm()}>
            <SheetContent
              side="right"
              showCloseButton={false}
              className="w-full gap-0 bg-canvas sm:max-w-none"
            >
              <header className="flex items-center gap-1 border-b bg-background px-2 pt-[max(env(safe-area-inset-top),0.5rem)] pb-2">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Cerrar formulario"
                  onClick={closeForm}
                >
                  <X className="size-5" />
                </Button>
                <SheetTitle className="font-display text-lg leading-6 font-semibold">
                  {formTitle}
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Datos del servicio tal y como se verán en el catálogo.
                </SheetDescription>
              </header>
              <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pt-4 pb-6">
                {form}
                {editing && (
                  <Button
                    variant="destructive-outline"
                    size="lg"
                    className="font-medium"
                    onClick={() => setDeleting(editing)}
                  >
                    <Trash2 aria-hidden />
                    Eliminar servicio
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 border-t bg-background px-4 pt-3 pb-[max(env(safe-area-inset-bottom),1rem)]">
                <Button
                  variant="outline"
                  size="xl"
                  className="font-medium"
                  onClick={closeForm}
                >
                  Descartar
                </Button>
                {saveButton('h-13 text-base')}
              </div>
            </SheetContent>
          </Sheet>
        </>
      )}

      <DeleteServiceDialog
        service={deleting}
        pending={remove.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting)}
      />
    </main>
  )
}
