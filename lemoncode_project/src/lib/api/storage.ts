// Utilidades de la capa mock: latencia simulada y persistencia en el navegador.

export function delay<T>(value: T, min = 200, max = 400): Promise<T> {
  const ms = min + Math.random() * (max - min)
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

export function readJson<T>(storage: Storage, key: string): T | null {
  try {
    const raw = storage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function writeJson(storage: Storage, key: string, value: unknown) {
  try {
    storage.setItem(key, JSON.stringify(value))
  } catch {
    // almacenamiento lleno o no disponible
  }
}
