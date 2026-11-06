import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '#/components/ui/sheet'
import { Skeleton } from '#/components/ui/skeleton'
import { UserAvatar } from '#/layouts/UserMenu'
import { EmailTakenError } from '#/lib/api/auth'
import {
  ProfessionalHasServicesError,
  professionals,
  professionalsQueries,
  type ProfessionalAdminInput,
  type ProfessionalRow,
} from '#/lib/api/professionals'
import { servicesQueries } from '#/lib/api/services'
import {
  AdminPage,
  EmptyRow,
  LoadError,
  normalize,
  SearchField,
} from './AdminParts'
import { ConfirmDialog } from './ConfirmDialog'
import { ProfessionalForm } from './ProfessionalForm'

const FORM_ID = 'profesional'

// Backoffice → Profesionales: fichas públicas, su cuenta de acceso y cuántos
// servicios tiene cada una. Solo se puede eliminar una ficha sin servicios.
export function ProfessionalsManager() {
  const queryClient = useQueryClient()
  const query = useQuery(professionalsQueries.admin())
  const [q, setQ] = useState('')
  // undefined: cerrado; null: nuevo; fila: editando.
  const [editing, setEditing] = useState<ProfessionalRow | null | undefined>()
  const [formKey, setFormKey] = useState(0)
  const [emailError, setEmailError] = useState<string>()
  const [deleting, setDeleting] = useState<ProfessionalRow | null>(null)

  const all = query.data ?? []
  const needle = normalize(q.trim())
  const filtered = all.filter(
    (p) =>
      !needle ||
      normalize(`${p.name} ${p.title} ${p.account?.email ?? ''}`).includes(
        needle,
      ),
  )

  function openForm(row: ProfessionalRow | null) {
    setEmailError(undefined)
    setFormKey((k) => k + 1)
    setEditing(row)
  }

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: professionalsQueries.all })
    // El nombre del profesional aparece en el catálogo y en el formulario de servicios.
    queryClient.invalidateQueries({ queryKey: servicesQueries.all })
  }

  const save = useMutation({
    mutationFn: (input: ProfessionalAdminInput) =>
      professionals.save(editing?.id, input),
    onSuccess: (saved) => {
      invalidate()
      toast.success(
        editing
          ? `Has guardado «${saved.name}»`
          : `Has añadido a ${saved.name}`,
      )
      setEditing(undefined)
    },
    onError: (error) => {
      if (error instanceof EmailTakenError) {
        setEmailError('Ya existe una cuenta con ese email')
      } else {
        toast.error(
          'No hemos podido guardar el profesional. Inténtalo de nuevo.',
        )
      }
    },
  })

  const remove = useMutation({
    mutationFn: (row: ProfessionalRow) => professionals.remove(row.id),
    onSuccess: (_, row) => {
      setDeleting(null)
      invalidate()
      toast.success(`Has eliminado a ${row.name}`)
    },
    onError: (error) => {
      setDeleting(null)
      toast.error(
        error instanceof ProfessionalHasServicesError
          ? `No se puede eliminar: ${error.message}`
          : 'No hemos podido eliminar el profesional. Inténtalo de nuevo.',
      )
    },
  })

  const formTitle = editing ? 'Editar profesional' : 'Nuevo profesional'

  return (
    <AdminPage
      title="Profesionales"
      description="Las personas que imparten los servicios del catálogo."
      action={
        <Button onClick={() => openForm(null)}>
          <Plus aria-hidden />
          Nuevo profesional
        </Button>
      }
    >
      <SearchField
        id="profesionales-buscar"
        label="Buscar profesional"
        value={q}
        onChange={setQ}
        className="md:max-w-sm"
      />

      {query.isError ? (
        <LoadError what="los profesionales" onRetry={() => query.refetch()} />
      ) : query.isPending ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" aria-hidden>
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyRow>
          {all.length === 0
            ? 'Aún no hay profesionales. Añade el primero.'
            : 'No hay profesionales con esa búsqueda.'}
        </EmptyRow>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <li
              key={p.id}
              className="flex flex-col gap-3 rounded-xl border bg-card p-4"
            >
              <div className="flex items-start gap-3">
                <UserAvatar
                  user={{
                    id: p.id,
                    name: p.name,
                    email: '',
                    role: 'profesional',
                  }}
                  className="size-11 text-sm"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <h2 className="font-display font-semibold">{p.name}</h2>
                  <p className="text-caption text-muted-foreground">
                    {p.title}
                  </p>
                </div>
              </div>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {p.bio}
              </p>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="secondary">
                  <span className="font-mono">{p.serviceCount}</span>
                  {p.serviceCount === 1 ? 'servicio' : 'servicios'}
                  {p.serviceCount > 0 && ` · ${p.publishedCount} publicados`}
                </Badge>
                {p.account ? (
                  <Badge variant="accent" title={p.account.email}>
                    Con cuenta
                  </Badge>
                ) : (
                  <Badge variant="draft">Sin cuenta</Badge>
                )}
              </div>
              {p.account && (
                <p className="truncate text-caption text-muted-foreground">
                  {p.account.email}
                </p>
              )}
              <div className="mt-auto flex gap-2 border-t pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-11 flex-1 md:h-10"
                  onClick={() => openForm(p)}
                >
                  <Pencil aria-hidden />
                  Editar
                  <span className="sr-only"> {p.name}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/5 hover:text-destructive md:size-10"
                  aria-label={`Eliminar a ${p.name}`}
                  onClick={() => setDeleting(p)}
                >
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-caption text-muted-foreground">
        Para asignar un servicio a otro profesional, edítalo en{' '}
        <Link
          to="/admin/servicios"
          className="rounded-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Servicios
        </Link>
        .
      </p>

      <Sheet
        open={editing !== undefined}
        onOpenChange={(open) => !open && setEditing(undefined)}
      >
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-full gap-0 bg-canvas sm:max-w-md"
        >
          <header className="flex items-center gap-1 border-b bg-background px-2 pt-[max(env(safe-area-inset-top),0.5rem)] pb-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Cerrar formulario"
              onClick={() => setEditing(undefined)}
            >
              <X className="size-5" />
            </Button>
            <SheetTitle className="font-display text-lg leading-6 font-semibold">
              {formTitle}
            </SheetTitle>
            <SheetDescription className="sr-only">
              Ficha pública del profesional y su cuenta de acceso.
            </SheetDescription>
          </header>
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pt-4 pb-6 md:px-6">
            <ProfessionalForm
              key={formKey}
              formId={FORM_ID}
              professional={editing ?? undefined}
              pending={save.isPending}
              emailError={emailError}
              onSubmit={(input) => {
                setEmailError(undefined)
                save.mutate(input)
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 border-t bg-background px-4 pt-3 pb-[max(env(safe-area-inset-bottom),1rem)] md:px-6">
            <Button
              variant="outline"
              size="lg"
              className="font-medium"
              onClick={() => setEditing(undefined)}
            >
              Descartar
            </Button>
            <Button
              type="submit"
              form={FORM_ID}
              size="lg"
              disabled={save.isPending}
            >
              {save.isPending ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={deleting !== null}
        title={
          deleting
            ? deleting.serviceCount > 0
              ? `No puedes eliminar a ${deleting.name}`
              : `¿Eliminar a ${deleting.name}?`
            : ''
        }
        blocked={(deleting?.serviceCount ?? 0) > 0}
        description={
          deleting
            ? deleting.serviceCount > 0
              ? `Tiene ${deleting.serviceCount} ${deleting.serviceCount === 1 ? 'servicio' : 'servicios'}: asígnalos a otro profesional o elimínalos antes de borrar su ficha.`
              : `Se borrará su ficha${deleting.account ? ' y su cuenta de acceso' : ''}. No se puede deshacer.`
            : ''
        }
        confirmLabel="Eliminar"
        pendingLabel="Eliminando…"
        pending={remove.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting)}
      />
    </AdminPage>
  )
}
