import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '#/components/ui/button'
import { Checkbox } from '#/components/ui/checkbox'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { auth, InvalidCredentialsError } from '#/lib/api/auth'
import type { User } from '#/lib/api/types'
import { cn } from '#/lib/utils'

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Introduce tu email')
    .email('Introduce un email válido'),
  password: z.string().min(1, 'Introduce tu contraseña'),
  remember: z.boolean(),
})

type LoginValues = z.infer<typeof loginSchema>

const linkClass =
  'rounded-sm font-medium text-primary underline-offset-4 hover:underline'

// HANDOFF §5.1. El orden cambia entre móvil y escritorio, como en el diseño:
// escritorio empieza por Google; móvil empieza por email y deja Google al final.
export function LoginForm({
  onSuccess,
  onRegister,
}: {
  onSuccess: (user: User) => void
  onRegister: () => void
}) {
  const [formError, setFormError] = useState<string | null>(null)
  const [invalidCredentials, setInvalidCredentials] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: true },
  })

  const onSubmit = handleSubmit(async ({ email, password, remember }) => {
    setFormError(null)
    setInvalidCredentials(false)
    try {
      onSuccess(await auth.login(email, password, remember))
    } catch (error) {
      if (error instanceof InvalidCredentialsError) setInvalidCredentials(true)
      else setFormError('No hemos podido iniciar sesión. Inténtalo de nuevo.')
    }
  })

  // Decorativo: el acceso con Google no está implementado.
  const googleButton = (className: string) => (
    <Button
      type="button"
      variant="outline"
      tabIndex={-1}
      aria-hidden
      className={cn('w-full shadow-xs', className)}
    >
      Continuar con Google
    </Button>
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
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="tu@email.com"
          className="shadow-xs"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? 'email-error' : undefined}
          {...register('email')}
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5 md:gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <Label htmlFor="password">Contraseña</Label>
          {/* Decorativo: la recuperación de contraseña no está implementada. */}
          <span
            aria-hidden
            className={cn(linkClass, 'hidden text-caption md:inline')}
          >
            ¿Olvidaste tu contraseña?
          </span>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          className="shadow-xs"
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={errors.password ? 'password-error' : undefined}
          {...register('password')}
        />
        {errors.password && (
          <p id="password-error" className="text-sm text-destructive">
            {errors.password.message}
          </p>
        )}
        <span
          aria-hidden
          className={cn(
            linkClass,
            'flex min-h-11 items-center self-end text-sm md:hidden',
          )}
        >
          ¿Olvidaste tu contraseña?
        </span>
      </div>

      <div className="flex min-h-11 items-center gap-2.5">
        <Controller
          control={control}
          name="remember"
          render={({ field }) => (
            <Checkbox
              id="remember"
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked === true)}
              onBlur={field.onBlur}
              ref={field.ref}
            />
          )}
        />
        <Label htmlFor="remember" className="font-normal">
          Recordarme
        </Label>
      </div>

      {invalidCredentials && (
        <div
          role="alert"
          className="flex flex-col gap-1 rounded-lg border border-destructive bg-background px-3.5 py-3 text-sm"
        >
          <p className="font-semibold text-destructive">
            El email o la contraseña no son correctos
          </p>
          <p className="text-muted-foreground">
            Revísalos o, si aún no tienes cuenta,{' '}
            <button
              type="button"
              onClick={onRegister}
              className={cn(linkClass, 'font-semibold')}
            >
              crea una
            </button>
            .
          </p>
        </div>
      )}

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
        {isSubmitting ? 'Entrando…' : 'Entrar'}
      </Button>

      <div className="flex flex-col gap-4 md:hidden">
        <Divider>o</Divider>
        {googleButton('h-13 text-base')}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{' '}
        <button
          type="button"
          onClick={onRegister}
          className={cn(linkClass, 'font-semibold')}
        >
          Regístrate
        </button>
      </p>
      <Link
        to="/login"
        search={{ next: '/admin/servicios' }}
        className="flex min-h-11 items-center self-center rounded-sm text-caption text-muted-foreground underline underline-offset-4 hover:text-foreground md:min-h-8"
      >
        Acceso administración
      </Link>
    </form>
  )
}

export function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-caption text-muted-foreground">
      <div aria-hidden className="h-px flex-1 bg-border" />
      {children}
      <div aria-hidden className="h-px flex-1 bg-border" />
    </div>
  )
}
