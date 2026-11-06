import { queryOptions, useQuery } from '@tanstack/react-query'

import { requireAdmin } from './auth'
import { ApiError, http } from './http'

// Ajustes del negocio (backoffice → Ajustes). Viven en json-server como
// recurso singular (`/settings`). Si aún no existen en db.json, se usan los
// valores por defecto, que son el comportamiento original de la app.

export interface Settings {
  /** Horas antes de la sesión hasta las que el cliente puede cancelar. 0 = siempre. */
  cancellationHours: number
  /** Antelación mínima para reservar una franja, en horas. */
  minNoticeHours: number
  /** Ofrece "Pagar en la sesión" al reservar. */
  payInSessionEnabled: boolean
  /** Muestra el recomendador en el catálogo. */
  recommenderEnabled: boolean
  /** Email de contacto que se muestra al cliente. */
  contactEmail: string
}

export const DEFAULT_SETTINGS: Settings = {
  cancellationHours: 24,
  minNoticeHours: 0,
  payInSessionEnabled: true,
  recommenderEnabled: true,
  contactEmail: 'hola@rumbo.es',
}

export async function getSettings(): Promise<Settings> {
  try {
    const stored = await http.get<Partial<Settings>>('/settings')
    return { ...DEFAULT_SETTINGS, ...stored }
  } catch (error) {
    // Sin `settings` en db.json (o sin servidor), la app sigue con los valores por defecto.
    if (error instanceof ApiError) return DEFAULT_SETTINGS
    throw error
  }
}

async function update(input: Settings): Promise<Settings> {
  requireAdmin()
  try {
    return {
      ...DEFAULT_SETTINGS,
      ...(await http.put<Settings>('/settings', input)),
    }
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      throw new Error(
        'Falta la sección de ajustes en db.json. Reinicia `npm run api` para crearla.',
      )
    }
    throw error
  }
}

export const settings = { get: getSettings, update }

export const settingsQueries = {
  all: ['settings'] as const,
  get: () =>
    queryOptions({
      queryKey: settingsQueries.all,
      queryFn: getSettings,
      staleTime: 60_000,
    }),
}

/** Ajustes con los valores por defecto mientras cargan. */
export function useSettings(): Settings {
  return useQuery(settingsQueries.get()).data ?? DEFAULT_SETTINGS
}

/** "Cancelación gratuita hasta 24 h antes de la sesión." */
export function cancellationPolicyText({ cancellationHours }: Settings) {
  return cancellationHours > 0
    ? `Cancelación gratuita hasta ${cancellationHours} h antes de la sesión.`
    : 'Cancelación gratuita hasta el inicio de la sesión.'
}

export function useCancellationPolicy() {
  return cancellationPolicyText(useSettings())
}
