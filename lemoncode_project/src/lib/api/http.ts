// Cliente HTTP de json-server (`npm run api`). La URL se configura con VITE_API_URL.

const API_URL = (
  import.meta.env.VITE_API_URL ?? 'http://localhost:3001'
).replace(/\/$/, '')

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message = 'No hemos podido conectar con el servidor.',
  ) {
    super(message)
  }
}

type QueryValue = string | number | boolean | undefined
/** Un array repite el parámetro (`?serviceId=a&serviceId=b`): json-server lo trata como OR. */
type Query = Record<string, QueryValue | QueryValue[]>

function url(path: string, query?: Query) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query ?? {})) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item !== undefined) params.append(key, String(item))
    }
  }
  const search = params.toString()
  return `${API_URL}${path}${search ? `?${search}` : ''}`
}

async function request<T>(
  method: string,
  path: string,
  { query, body }: { query?: Query; body?: unknown } = {},
): Promise<T> {
  let response: Response
  try {
    response = await fetch(url(path, query), {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0)
  }
  if (!response.ok) throw new ApiError(response.status)
  return (await response.json()) as T
}

/** GET que devuelve `null` si el recurso no existe (404). */
async function find<T>(path: string, query?: Query): Promise<T | null> {
  try {
    return await request<T>('GET', path, { query })
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export const http = {
  get: <T>(path: string, query?: Query) => request<T>('GET', path, { query }),
  find,
  post: <T>(path: string, body: unknown) => request<T>('POST', path, { body }),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, { body }),
  patch: <T>(path: string, body: unknown) =>
    request<T>('PATCH', path, { body }),
  delete: (path: string) => request<unknown>('DELETE', path),
}
