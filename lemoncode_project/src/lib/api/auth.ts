import { delay, readJson, writeJson } from './storage'
import type { User } from './types'

// Auth mock (HANDOFF §3): cualquier email entra como cliente; `admin@…` entra como admin.
// "Recordarme" guarda la sesión en localStorage; si no, en sessionStorage.

const SESSION_KEY = 'rumbo-session'

function nameFromEmail(email: string) {
  return email
    .split('@')[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function saveSession(user: User, remember: boolean) {
  localStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(SESSION_KEY)
  writeJson(remember ? localStorage : sessionStorage, SESSION_KEY, user)
}

/** Lectura síncrona para guardas de ruta. Solo en cliente. */
export function getSession(): User | null {
  return (
    readJson<User>(localStorage, SESSION_KEY) ??
    readJson<User>(sessionStorage, SESSION_KEY)
  )
}

async function login(email: string, _password: string, remember = true) {
  const normalized = email.trim().toLowerCase()
  const user: User = {
    id: `usr-${normalized}`,
    name: nameFromEmail(normalized) || normalized,
    email: normalized,
    role: normalized.startsWith('admin@') ? 'admin' : 'cliente',
  }
  saveSession(user, remember)
  return delay(user)
}

async function loginWithGoogle() {
  const user: User = {
    id: 'usr-google-demo',
    name: 'Lucía Fernández',
    email: 'lucia.fernandez@gmail.com',
    role: 'cliente',
  }
  saveSession(user, true)
  return delay(user)
}

async function logout() {
  localStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(SESSION_KEY)
  return delay(undefined, 50, 100)
}

async function me() {
  return delay(getSession(), 50, 100)
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}

export const auth = { login, loginWithGoogle, logout, me }
