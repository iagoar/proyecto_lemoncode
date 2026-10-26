import { cn } from '#/lib/utils'

interface LogoProps {
  /** Tamaño del logo (proporción 107:30). */
  className?: string
  /** `auto` cambia a la versión blanca en modo oscuro; `white` fuerza la blanca (fondos de marca). */
  tone?: 'auto' | 'white'
}

// TODO: sustituir por SVG cuando lo entregue negocio (HANDOFF §11).
export function Logo({ className, tone = 'auto' }: LogoProps) {
  const size = cn('h-[30px] w-[107px]', className)

  if (tone === 'white') {
    return (
      <img src="/brand/rumbo-logo-white.png" alt="rumbo." className={size} />
    )
  }

  return (
    <>
      <img
        src="/brand/rumbo-logo.png"
        alt="rumbo."
        className={cn(size, 'dark:hidden')}
      />
      <img
        src="/brand/rumbo-logo-white.png"
        alt="rumbo."
        className={cn(size, 'hidden dark:block')}
      />
    </>
  )
}
