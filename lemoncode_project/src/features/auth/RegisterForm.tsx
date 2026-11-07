import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '#/components/ui/button'
import { Checkbox } from '#/components/ui/checkbox'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { auth, EmailTakenError } from '#/lib/api/auth'
import { ApiError } from '#/lib/api/http'
import type { User } from '#/lib/api/types'
import { cn } from '#/lib/utils'
import { GoogleButton } from './GoogleButton'
import { Divider } from './LoginForm'

const registerSchema = z.object({
  name: z.string().trim().min(1, 'Introduce tu nombre y apellidos'),
  email: z
    .string()
    .trim()
    .min(1, 'Introduce tu email')
    .email('Introduce un email válido'),
  password: z.string().min(8, 'La contraseña necesita al menos 8 caracteres'),
  terms: z.literal(true, {
    errorMap: () => ({ message: 'Acepta las condiciones para continuar' }),
  }),
})

type RegisterValues = z.infer<typeof registerSchema>

const linkClass =
  'rounded-sm font-medium text-primary underline-offset-4 hover:underline'

// Registro en la misma tarjeta que el login. Al terminar no abre sesión:
// la página vuelve al login con el email ya puesto. Mismo orden que el login:
// escritorio empieza por Google; móvil lo deja al final.
export function RegisterForm({
  onSuccess,
  onSignedIn,
  onLogin,
}: {
  onSuccess: (user: User) => void
  /** Entrada con Google: abre sesión sin pasar por el login. */
  onSignedIn: (user: User) => void
  onLogin: () => void
}) {
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', terms: false as true },
  })

  const onSubmit = handleSubmit(async ({ name, email, password }) => {
    setFormError(null)
    try {
      onSuccess(await auth.register(name, email, password))
    } catch (error) {
      if (error instanceof EmailTakenError) {
        setError('email', {
          type: 'taken',
          message: 'Ya existe una cuenta con ese email',
        })
      } else if (error instanceof ApiError && error.status === 0) {
        setFormError(
          'No hay conexión con el servidor. Comprueba que la API está arrancada (npm run api) e inténtalo de nuevo.',
        )
      } else {
        setFormError('No hemos podido crear tu cuenta. Inténtalo de nuevo.')
      }
    }
  })

  // Con Google no hay paso intermedio: entra directamente.
  const googleButton = (className: string) => (
    <GoogleButton onSuccess={onSignedIn} className={className} />
  )

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      className="flex flex-col gap-4 md:gap-5"
    >
      <div className="hidden flex-col gap-5 md:flex">
        {googleButton('')}
        <Divider>o con tu email</Divider>
      </div>

      <div className="flex flex-col gap-1.5 md:gap-2">
        <Label htmlFor="r-nombre">Nombre y apellidos</Label>
        <Input
          id="r-nombre"
          autoComplete="name"
          className="shadow-xs"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? 'r-nombre-error' : undefined}
          {...register('name')}
        />
        {errors.name && (
          <p id="r-nombre-error" className="text-sm text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5 md:gap-2">
        <Label htmlFor="r-email">Email</Label>
        <Input
          id="r-email"
          type="email"
          autoComplete="email"
          placeholder="tu@email.com"
          className="shadow-xs"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? 'r-email-error' : undefined}
          {...register('email')}
        />
        {errors.email && (
          <p id="r-email-error" className="text-sm text-destructive">
            {errors.email.message}
            {errors.email.type === 'taken' && (
              <>
                .{' '}
                <button
                  type="button"
                  onClick={onLogin}
                  className={cn(linkClass, 'font-semibold')}
                >
                  Inicia sesión
                </button>
              </>
            )}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5 md:gap-2">
        <Label htmlFor="r-password">Contraseña</Label>
        <Input
          id="r-password"
          type="password"
          autoComplete="new-password"
          className="shadow-xs"
          aria-invalid={errors.password ? true : undefined}
          aria-describedby="r-password-ayuda"
          {...register('password')}
        />
        <p
          id="r-password-ayuda"
          className={cn(
            'text-sm',
            errors.password ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {errors.password?.message ?? 'Mínimo 8 caracteres.'}
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex min-h-11 items-start gap-2.5 pt-2.5">
          <Controller
            control={control}
            name="terms"
            render={({ field }) => (
              <Checkbox
                id="r-terms"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                onBlur={field.onBlur}
                ref={field.ref}
                aria-invalid={errors.terms ? true : undefined}
                aria-describedby={errors.terms ? 'r-terms-error' : undefined}
              />
            )}
          />
          <Label htmlFor="r-terms" className="leading-5 font-normal">
            {/* Decorativos: las condiciones y la política no tienen página. */}
            <span>
              Acepto las <span className={linkClass}>condiciones de uso</span> y
              la <span className={linkClass}>política de privacidad</span>
            </span>
          </Label>
        </div>
        {errors.terms && (
          <p id="r-terms-error" className="text-sm text-destructive">
            {errors.terms.message}
          </p>
        )}
      </div>

      {formError && (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      )}

      <Button
        type="submit"
        size="xl"
        className="w-full md:h-11 md:text-body"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Creando tu cuenta…' : 'Crear cuenta'}
      </Button>

      <div className="flex flex-col gap-4 md:hidden">
        <Divider>o</Divider>
        {googleButton('h-13 text-base')}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{' '}
        <button
          type="button"
          onClick={onLogin}
          className={cn(linkClass, 'font-semibold')}
        >
          Inicia sesión
        </button>
      </p>
    </form>
  )
}
