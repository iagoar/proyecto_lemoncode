import { useCancellationPolicy } from '#/lib/api/settings'

/** Texto de la política de cancelación según Ajustes del backoffice. */
export function CancellationPolicy() {
  return <>{useCancellationPolicy()}</>
}
