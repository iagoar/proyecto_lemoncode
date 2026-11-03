import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useId } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { auth } from '#/lib/api/auth'
import { servicesQueries } from '#/lib/api/services'
import type { User } from '#/lib/api/types'

const profileSchema = z.object({
  name: z.string().trim().min(1, 'Introduce tu nombre y apellidos'),
  phone: z
    .string()
    .trim()
    .regex(/^(\+?[\d\s]{9,15})?$/, 'Introduce un teléfono válido'),
})

type ProfileValues = z.infer<typeof profileSchema>

// Datos de la cuenta. El email identifica la cuenta en la capa mock y no se edita.
export function ProfileForm({ user }: { user: User }) {
  const uid = useId()
  const router = useRouter()
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name, phone: user.phone ?? '' },
  })

  const save = useMutation({
    mutationFn: auth.updateProfile,
    onSuccess: async (saved) => {
      reset({ name: saved.name, phone: saved.phone ?? '' })
      // El nombre de un profesional aparece en sus servicios.
      if (saved.role === 'profesional') {
        queryClient.invalidateQueries({ queryKey: servicesQueries.all })
      }
      // Vuelve a ejecutar las guardas para que el layout lea la sesión nueva.
      await router.invalidate()
      toast.success('Has guardado tus datos')
    },
    onError: () =>
      toast.error('No hemos podido guardar tus datos. Inténtalo de nuevo.'),
  })

  const ids = {
    name: `${uid}-name`,
    email: `${uid}-email`,
    phone: `${uid}-phone`,
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) => save.mutate(values))}
      className="flex flex-col gap-4"
    >
      <fieldset disabled={save.isPending} className="contents">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={ids.name}>Nombre y apellidos</Label>
          <Input
            id={ids.name}
            autoComplete="name"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? `${ids.name}-error` : undefined}
            {...register('name')}
          />
          {errors.name && (
            <p id={`${ids.name}-error`} className="text-sm text-destructive">
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={ids.email}>Email</Label>
          <Input
            id={ids.email}
            type="email"
            value={user.email}
            readOnly
            aria-describedby={`${ids.email}-hint`}
            className="bg-secondary text-muted-foreground"
          />
          <p
            id={`${ids.email}-hint`}
            className="text-caption text-muted-foreground"
          >
            Es el email con el que entras. Para cambiarlo, escríbenos.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={ids.phone}>
            Teléfono{' '}
            <span className="font-normal text-muted-foreground">
              (opcional)
            </span>
          </Label>
          <Input
            id={ids.phone}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="600 000 000"
            className="font-mono"
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={errors.phone ? `${ids.phone}-error` : undefined}
            {...register('phone')}
          />
          {errors.phone && (
            <p id={`${ids.phone}-error`} className="text-sm text-destructive">
              {errors.phone.message}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={!isDirty || save.isPending}>
            {save.isPending ? 'Guardando…' : 'Guardar cambios'}
          </Button>
          {isDirty && (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                reset({ name: user.name, phone: user.phone ?? '' })
              }
            >
              Descartar
            </Button>
          )}
        </div>
      </fieldset>
    </form>
  )
}
