import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useId } from 'react'
import { Controller, useForm, type Control } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

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
import { Switch } from '#/components/ui/switch'
import { ProfileSection } from '#/features/profile/ProfileParts'
import { availabilityQueries } from '#/lib/api/availability'
import {
  cancellationPolicyText,
  settings,
  settingsQueries,
  type Settings,
} from '#/lib/api/settings'
import { AdminPage, LoadError } from './AdminParts'
import { Field } from './ServiceForm'

const CANCELLATION_OPTIONS = [0, 12, 24, 48, 72]
const NOTICE_OPTIONS = [0, 2, 12, 24, 48]

const settingsSchema = z.object({
  cancellationHours: z.number().int().min(0),
  minNoticeHours: z.number().int().min(0),
  payInSessionEnabled: z.boolean(),
  recommenderEnabled: z.boolean(),
  contactEmail: z
    .string()
    .trim()
    .min(1, 'Introduce un email de contacto')
    .email('Introduce un email válido'),
})

function hoursLabel(hours: number, zero: string) {
  return hours === 0 ? zero : `${hours} h`
}

// Backoffice → Ajustes: reglas del negocio que se aplican en toda la app.
export function SettingsPage() {
  const query = useQuery(settingsQueries.get())

  return (
    <AdminPage
      title="Ajustes"
      description="Reglas de reserva y opciones del catálogo. Se aplican al momento a todos los clientes."
    >
      {query.isError ? (
        <LoadError what="los ajustes" onRetry={() => query.refetch()} />
      ) : query.isPending ? (
        <div className="flex max-w-3xl flex-col gap-4" aria-hidden>
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      ) : (
        <SettingsForm key={JSON.stringify(query.data)} initial={query.data} />
      )}
    </AdminPage>
  )
}

function SettingsForm({ initial }: { initial: Settings }) {
  const uid = useId()
  const queryClient = useQueryClient()
  const {
    control,
    register,
    watch,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<Settings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initial,
  })

  const save = useMutation({
    mutationFn: settings.update,
    onSuccess: (saved) => {
      queryClient.setQueryData(settingsQueries.all, saved)
      // La antelación mínima cambia los huecos libres.
      queryClient.invalidateQueries({ queryKey: availabilityQueries.all })
      reset(saved)
      toast.success('Has guardado los ajustes')
    },
    onError: (error) =>
      toast.error(
        error instanceof Error && error.message.includes('db.json')
          ? error.message
          : 'No hemos podido guardar los ajustes. Inténtalo de nuevo.',
      ),
  })

  const values = watch()

  return (
    <form
      noValidate
      onSubmit={handleSubmit((v) => save.mutate(v))}
      className="flex max-w-3xl flex-col gap-4 md:gap-6"
    >
      <fieldset disabled={save.isPending} className="contents">
        <ProfileSection
          title="Reservas"
          description="Cuándo pueden reservar y cancelar los clientes."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <HoursSelect
              control={control}
              name="cancellationHours"
              id={`${uid}-cancelacion`}
              label="Cancelación gratuita"
              options={CANCELLATION_OPTIONS}
              format={(h) =>
                h === 0 ? 'Hasta el inicio' : `Hasta ${h} h antes`
              }
              hint={cancellationPolicyText(values)}
            />
            <HoursSelect
              control={control}
              name="minNoticeHours"
              id={`${uid}-antelacion`}
              label="Antelación mínima para reservar"
              options={NOTICE_OPTIONS}
              format={(h) => hoursLabel(h, 'Sin antelación')}
              hint={
                values.minNoticeHours === 0
                  ? 'Se puede reservar cualquier hueco futuro.'
                  : `No se muestran huecos que empiecen en menos de ${values.minNoticeHours} h.`
              }
            />
          </div>
          <SwitchRow
            control={control}
            name="payInSessionEnabled"
            id={`${uid}-pago-sesion`}
            label="Permitir pagar en la sesión"
            description="Si lo desactivas, solo se podrá reservar pagando con tarjeta."
          />
        </ProfileSection>

        <ProfileSection title="Catálogo">
          <SwitchRow
            control={control}
            name="recommenderEnabled"
            id={`${uid}-recomendador`}
            label="Recomendador"
            description="Muestra en el catálogo el asistente que recomienda un servicio según unas preguntas."
          />
          <Field
            label="Email de contacto"
            htmlFor={`${uid}-email`}
            error={errors.contactEmail?.message}
            errorId={`${uid}-email-error`}
            hint="Se muestra al cliente cuando no puede cancelar una reserva."
          >
            <Input
              id={`${uid}-email`}
              type="email"
              aria-invalid={errors.contactEmail ? true : undefined}
              aria-describedby={
                errors.contactEmail ? `${uid}-email-error` : undefined
              }
              className="md:max-w-sm"
              {...register('contactEmail')}
            />
          </Field>
        </ProfileSection>
      </fieldset>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="lg" disabled={save.isPending || !isDirty}>
          {save.isPending ? 'Guardando…' : 'Guardar cambios'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={save.isPending || !isDirty}
          onClick={() => reset(initial)}
        >
          Descartar
        </Button>
      </div>
    </form>
  )
}

function HoursSelect({
  control,
  name,
  id,
  label,
  options,
  format,
  hint,
}: {
  control: Control<Settings>
  name: 'cancellationHours' | 'minNoticeHours'
  id: string
  label: string
  options: number[]
  format: (hours: number) => string
  hint: string
}) {
  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => {
          // Un valor guardado a mano en db.json que no esté en la lista también se muestra.
          const all = options.includes(field.value)
            ? options
            : [...options, field.value].sort((a, b) => a - b)
          return (
            <Select
              value={String(field.value)}
              onValueChange={(v) => field.onChange(Number(v))}
            >
              <SelectTrigger id={id} onBlur={field.onBlur}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {all.map((hours) => (
                  <SelectItem key={hours} value={String(hours)}>
                    {format(hours)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        }}
      />
    </Field>
  )
}

function SwitchRow({
  control,
  name,
  id,
  label,
  description,
}: {
  control: Control<Settings>
  name: 'payInSessionEnabled' | 'recommenderEnabled'
  id: string
  label: string
  description: string
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <Label htmlFor={id}>{label}</Label>
        <p id={`${id}-ayuda`} className="text-sm text-muted-foreground">
          {description}
        </p>
      </div>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <span className="flex min-h-11 items-center">
            <Switch
              id={id}
              aria-describedby={`${id}-ayuda`}
              checked={field.value}
              onCheckedChange={field.onChange}
              onBlur={field.onBlur}
            />
          </span>
        )}
      />
    </div>
  )
}
