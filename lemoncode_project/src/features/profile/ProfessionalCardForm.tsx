import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useId } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { professionals, professionalsQueries } from '#/lib/api/professionals'
import { servicesQueries } from '#/lib/api/services'
import type { Professional } from '#/lib/api/types'

const cardSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Indica tu titulación o especialidad')
    .max(80, 'Máximo 80 caracteres'),
  bio: z
    .string()
    .trim()
    .min(1, 'Cuéntales a los clientes quién eres')
    .max(400, 'Máximo 400 caracteres'),
})

type CardValues = z.infer<typeof cardSchema>

// Ficha pública del profesional: aparece en "Tu profesional" del detalle de servicio.
export function ProfessionalCardForm({
  professional,
}: {
  professional: Professional
}) {
  const uid = useId()
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<CardValues>({
    resolver: zodResolver(cardSchema),
    defaultValues: { title: professional.title, bio: professional.bio },
  })

  const save = useMutation({
    mutationFn: professionals.updateMine,
    onSuccess: (saved) => {
      reset({ title: saved.title, bio: saved.bio })
      queryClient.invalidateQueries({ queryKey: professionalsQueries.all })
      queryClient.invalidateQueries({ queryKey: servicesQueries.all })
      toast.success('Has guardado tu ficha de profesional')
    },
    onError: () =>
      toast.error('No hemos podido guardar tu ficha. Inténtalo de nuevo.'),
  })

  const ids = { title: `${uid}-title`, bio: `${uid}-bio` }

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) => save.mutate(values))}
      className="flex flex-col gap-4"
    >
      <fieldset disabled={save.isPending} className="contents">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={ids.title}>Titulación o especialidad</Label>
          <Input
            id={ids.title}
            placeholder="Ej. Coach ejecutiva certificada (ICF PCC)"
            aria-invalid={errors.title ? true : undefined}
            aria-describedby={errors.title ? `${ids.title}-error` : undefined}
            {...register('title')}
          />
          {errors.title && (
            <p id={`${ids.title}-error`} className="text-sm text-destructive">
              {errors.title.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={ids.bio}>Sobre ti</Label>
          <Textarea
            id={ids.bio}
            rows={4}
            placeholder="Tu experiencia y cómo trabajas"
            aria-invalid={errors.bio ? true : undefined}
            aria-describedby={errors.bio ? `${ids.bio}-error` : undefined}
            {...register('bio')}
          />
          {errors.bio && (
            <p id={`${ids.bio}-error`} className="text-sm text-destructive">
              {errors.bio.message}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            variant="outline"
            disabled={!isDirty || save.isPending}
          >
            {save.isPending ? 'Guardando…' : 'Guardar ficha'}
          </Button>
          {isDirty && (
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                reset({ title: professional.title, bio: professional.bio })
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
