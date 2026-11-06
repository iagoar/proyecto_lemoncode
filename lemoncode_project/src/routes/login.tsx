import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'

import { BrandBlocks } from '#/components/brand/BrandBlocks'
import { Logo } from '#/components/brand/Logo'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { LoginForm } from '#/features/auth/LoginForm'
import { RegisterForm } from '#/features/auth/RegisterForm'
import type { User } from '#/lib/api/types'

const loginSearchSchema = z.object({
  // Solo rutas internas, para no abrir una redirección a otro dominio.
  next: z
    .string()
    .refine((value) => value.startsWith('/') && !value.startsWith('//'))
    .optional()
    .catch(undefined),
  registro: z.literal(1).optional().catch(undefined),
})

export const Route = createFileRoute('/login')({
  validateSearch: (search) => loginSearchSchema.parse(search),
  head: () => ({ meta: [{ title: 'Entra o regístrate · rumbo.' }] }),
  component: LoginPage,
})

// HANDOFF §5.1 (AuthLayout). Escritorio: panel de marca + Card de 420px.
// Móvil: cabecera oscura compacta y el formulario a sangre sobre fondo blanco.
// Login y registro comparten tarjeta con un control segmentado (?registro=1).
function LoginPage() {
  const { next, registro } = Route.useSearch()
  const navigate = useNavigate()
  const mode = registro ? 'registro' : 'login'
  // Email de la cuenta recién creada: rellena el login y muestra el aviso.
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null)

  function setMode(value: string) {
    if (value === 'registro') setRegisteredEmail(null)
    navigate({
      to: '/login',
      search: (prev) => ({
        ...prev,
        registro: value === 'registro' ? (1 as const) : undefined,
      }),
      replace: true,
    })
  }

  function handleSuccess(user: User) {
    if (next) navigate({ href: next, replace: true })
    else if (user.role === 'admin')
      navigate({ to: '/admin/servicios', replace: true })
    else if (user.role === 'profesional')
      navigate({ to: '/mis-servicios', replace: true })
    else navigate({ to: '/servicios', replace: true })
  }

  function handleRegistered(user: User) {
    setRegisteredEmail(user.email)
    setMode('login')
  }

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row md:flex-wrap md:bg-canvas">
      <section
        aria-label="rumbo."
        className="relative flex flex-none flex-col gap-6 overflow-hidden bg-brand-ink px-6 pt-[max(env(safe-area-inset-top),3.5rem)] pb-7 text-brand-mist md:min-h-90 md:flex-[1_1_480px] md:justify-between md:gap-12 md:p-12"
      >
        <BrandBlocks variant="compact" className="md:hidden" />
        <BrandBlocks className="hidden md:grid" />

        <Logo
          tone="white"
          className="relative h-7 w-25 md:h-[35px] md:w-[125px]"
        />

        <div className="relative flex max-w-110 flex-col gap-1.5 md:gap-4">
          <p className="hidden font-display text-eyebrow font-medium text-brand-ink-muted uppercase md:block">
            Catálogo de coaching
          </p>
          <h1 className="font-display text-[32px] leading-9 font-bold tracking-[-0.02em] md:text-display">
            Encuentra
            <br className="md:hidden" /> tu rumbo.
          </h1>
          <p className="text-sm text-brand-ink-muted md:text-body-lg">
            <span className="md:hidden">Coaching, bienestar y formación.</span>
            <span className="hidden md:inline">
              Coaching, bienestar y formación con profesionales verificados.
              Reserva en minutos.
            </span>
          </p>
        </div>
      </section>

      <main className="flex flex-1 md:flex-[1_1_480px] md:items-center md:justify-center md:px-6 md:py-12">
        <div className="flex w-full flex-col gap-4 px-6 pt-6 pb-8 md:max-w-form md:gap-5 md:rounded-xl md:border md:bg-card md:px-9 md:py-10">
          <Tabs value={mode} onValueChange={setMode} className="gap-5">
            <TabsList aria-label="Acceso" className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
              <TabsTrigger value="registro">Crear cuenta</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="flex flex-col gap-4 md:gap-5">
              <AuthHeading
                title="Inicia sesión"
                text="Accede para reservar y gestionar tus sesiones."
              />
              <LoginForm
                key={registeredEmail ?? 'login'}
                defaultEmail={registeredEmail ?? undefined}
                justRegistered={registeredEmail !== null}
                onSuccess={handleSuccess}
                onRegister={() => setMode('registro')}
              />
            </TabsContent>

            <TabsContent
              value="registro"
              className="flex flex-col gap-4 md:gap-5"
            >
              <AuthHeading
                title="Crea tu cuenta"
                text="Regístrate gratis y reserva tu primera sesión."
              />
              <RegisterForm
                onSuccess={handleRegistered}
                onLogin={() => setMode('login')}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

function AuthHeading({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h2 className="text-2xl leading-[30px] font-semibold md:text-h2">
        {title}
      </h2>
      <p className="hidden text-muted-foreground md:block">{text}</p>
    </div>
  )
}
