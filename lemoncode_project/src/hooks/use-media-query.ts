import { useSyncExternalStore } from 'react'

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query)
      media.addEventListener('change', onChange)
      return () => media.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** Breakpoint de cambio móvil/escritorio (`md`, 768px). */
export function useIsDesktop() {
  return useMediaQuery('(min-width: 768px)')
}
