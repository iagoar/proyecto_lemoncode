import { zodResolver } from '@hookform/resolvers/zod'
import { useId } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Switch } from '#/components/ui/switch'
import { Textarea } from '#/components/ui/textarea'
import type {
  ProfessionalAdminInput,
  ProfessionalRow,
} from '#/lib/api/professionals'
import { Field } from './ServiceForm'

const PASSWORD_MIN = 8

const professionalSchema = z
  .object({
    name: z.string().trim().min(1, 'Introduce el nombre y apellidos'),
    title: z
      .string()
      .trim()
      .min(1, 'Introduce su especialidad')
      .max(80, 'Máximo 80 caracteres'),
    bio: z
      .string()
      .trim()
      .min(1, 'Escribe una presentación breve')
      .max(400, 'Máximo 400 caracteres'),
    createAccount: z.boolean(),
    email: z.string().trim(),
    password: z.string(),
    newPassword: z.string(),
  })
  .superRefine((v, ctx) => {
    if (v.createAccount) {
      if (!z.string().email().safeParse(v.email).success) {
        ctx.addIssue({
          code: 'custom',
          path: ['email'],
          message: 'Introduce un email válido',
        })
      }
      if (v.password.length < PASSWORD_MIN) {
        ctx.addIssue({
          code: 'custom',
          path: ['password'],
          message: `La contraseña necesita al menos ${PASSWORD_MIN} caracteres`,
        })
      }
    }
    if (v.newPassword && v.newPassword.length < PASSWORD_MIN) {
      ctx.addIssue({
        code: 'custom',
        path: ['newPassword'],
        message: `La contraseña necesita al menos ${PASSWORD_MIN} caracteres`,
      })
    }
  })

type ProfessionalValues = z.infer<typeof professionalSchema>

// Ficha pública del profesional (la que se ve en el detalle de cada servicio)
// y, opcionalmente, su cuenta de acceso para gestionar sus servicios.
export function ProfessionalForm({
  formId,
  professional,
  pending,
  emailError,
  onSubmit,
}: {
  formId: string
  professional?: ProfessionalRow
  pending: boolean
  /** Error del servidor sobre el email (p. ej. ya en uso). */
  emailError?: string
  onSubmit: (input: ProfessionalAdminInput) => void
}) {
  const uid = useId()
  const account = professional?.account ?? null

  const {
    register,
    control,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfessionalValues>({
    resolver: zodResolver(professionalSchema),
    defaultValues: {
      name: professional?.name ?? '',
      title: professional?.title ?? '',
      bio: professional?.bio ?? '',
      createAccount: !professional,
      email: '',
      password: '',
      newPassword: '',
    },
  })
  const createAccount = watch('createAccount')

  const ids = (name: keyof ProfessionalValues) => ({
    id: `${uid}-${name}`,
    errorId: `${uid}-${name}-error`,
  })
  const fieldProps = (name: keyof ProfessionalValues, error?: string) => ({
    id: ids(name).id,
    'aria-invalid': error ? (true as const) : undefined,
    'aria-describedby': error ? ids(name).errorId : undefined,
  })

  const emailMessage = errors.email?.message ?? emailError

  return (
    <form
      id={formId}
      noValidate
      onSubmit={handleSubmit((v) =>
        onSubmit({
          name: v.name,
          title: v.title,
          bio: v.bio,
          account:
            !account && v.createAccount
              ? { email: v.email, password: v.password }
              : undefined,
          newPassword: account && v.newPassword ? v.newPassword : undefined,
        }),
      )}
      className="flex flex-col gap-4"
    >
      <fieldset disabled={pending} className="contents">
        <Field
          label="Nombre y apellidos"
          htmlFor={ids('name').id}
          error={errors.name?.message}
          errorId={ids('name').errorId}
        >
          <Input
            autoComplete="off"
            placeholder="Ej. Laura Gómez"
            {...fieldProps('name', errors.name?.message)}
            {...register('name')}
          />
        </Field>

        <Field
          label="Especialidad"
          htmlFor={ids('title').id}
          error={errors.title?.message}
          errorId={ids('title').errorId}
          hint="Aparece bajo su nombre en la ficha del servicio."
        >
          <Input
            placeholder="Ej. Coach ejecutiva certificada (ICF PCC)"
            {...fieldProps('title', errors.title?.message)}
            {...register('title')}
          />
        </Field>

        <Field
          label="Presentación"
          htmlFor={ids('bio').id}
          error={errors.bio?.message}
          errorId={ids('bio').errorId}
        >
          <Textarea
            rows={4}
            placeholder="Experiencia, enfoque y a quién acompaña."
            {...fieldProps('bio', errors.bio?.message)}
            {...register('bio')}
          />
        </Field>

        <div className="flex flex-col gap-4 border-t pt-4">
          <div className="flex flex-col gap-1">
            <h3 className="font-display font-semibold">Cuenta de acceso</h3>
            <p className="text-sm text-muted-foreground">
              Con cuenta, el profesional entra en rumbo. y gestiona sus propios
              servicios y su ficha.
            </p>
          </div>

          {account ? (
            <>
              <p className="rounded-lg border bg-background px-3.5 py-3 text-sm">
                <span className="text-muted-foreground">Entra con </span>
                <span className="font-medium">{account.email}</span>
              </p>
              <Field
                label="Nueva contraseña"
                htmlFor={ids('newPassword').id}
                error={errors.newPassword?.message}
                errorId={ids('newPassword').errorId}
                hint="Déjala vacía para mantener la actual."
              >
                <Input
                  type="password"
                  autoComplete="new-password"
                  {...fieldProps('newPassword', errors.newPassword?.message)}
                  {...register('newPassword')}
                />
              </Field>
            </>
          ) : (
            <>
              <div className="flex min-h-11 items-center justify-between gap-3">
                <Label
                  htmlFor={ids('createAccount').id}
                  className="font-normal"
                >
                  Crear cuenta de acceso
                </Label>
                <Controller
                  control={control}
                  name="createAccount"
                  render={({ field }) => (
                    <Switch
                      id={ids('createAccount').id}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
              {createAccount && (
                <>
                  <Field
                    label="Email"
                    htmlFor={ids('email').id}
                    error={emailMessage}
                    errorId={ids('email').errorId}
                  >
                    <Input
                      type="email"
                      autoComplete="off"
                      placeholder="nombre@rumbo.es"
                      {...fieldProps('email', emailMessage)}
                      {...register('email')}
                    />
                  </Field>
                  <Field
                    label="Contraseña"
                    htmlFor={ids('password').id}
                    error={errors.password?.message}
                    errorId={ids('password').errorId}
                    hint={`Mínimo ${PASSWORD_MIN} caracteres. Compártela con el profesional.`}
                  >
                    <Input
                      type="password"
                      autoComplete="new-password"
                      {...fieldProps('password', errors.password?.message)}
                      {...register('password')}
                    />
                  </Field>
                </>
              )}
            </>
          )}
        </div>
      </fieldset>
    </form>
  )
}
