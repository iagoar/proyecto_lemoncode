import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import { auth } from '#/lib/api/auth'
import { GoogleCancelledError } from '#/lib/api/google'
import { ApiError } from '#/lib/api/http'
import type { User } from '#/lib/api/types'
import { cn } from '#/lib/utils'

export function GoogleButton({
  onSuccess,
  remember,
  className,
}: {
  onSuccess: (user: User) => void
  /** Lee "Recordarme" en el momento del clic. */
  remember?: () => boolean
  className?: string
}) {
  const [pending, setPending] = useState(false)

  async function handleClick() {
    setPending(true)
    try {
      onSuccess(await auth.loginWithGoogle(remember?.() ?? true))
    } catch (error) {
      // Cerrar el popup no es un error.
      if (error instanceof GoogleCancelledError) return
      toast.error(
        error instanceof ApiError && error.status === 0
          ? 'No hay conexión con el servidor. Inténtalo de nuevo.'
          : error instanceof Error
            ? error.message
            : 'No hemos podido entrar con Google. Inténtalo de nuevo.',
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      onClick={handleClick}
      className={cn('w-full shadow-xs', className)}
    >
      {pending ? 'Conectando con Google…' : 'Continuar con Google'}
    </Button>
  )
}
