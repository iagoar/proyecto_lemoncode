import { nowInMadrid } from '#/lib/dates'
import { requestGoogleToken, verifyGoogleToken } from './google'
import { http } from './http'
import { readJson, writeJson } from './storage'
import type { ProfileInput, User } from './types'

// Auth sobre json-server. Los usuarios viven en `/users` con su contraseña
// en texto plano (`password`), que nunca sale de este módulo.
// Para entrar hace falta una cuenta: un email desconocido o una contraseña
// incorrecta dan InvalidCredentialsError (mismo error, para no revelar qué
// emails existen). Al registrarse, `admin@…` queda como admin; el rol se
// guarda en el servidor, así que también se puede cambiar en db.json.
// Es una simulación: json-server no protege nada.
// Registrarse no abre sesión: después hay que iniciarla con la contraseña.
// La sesión es local: "Recordarme" la guarda en localStorage; si no, en sessionStorage.

// v3: invalida las sesiones abiertas antes de que se pidiera contraseña.
const SESSION_KEY = 'rumbo-session-v3'

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function nameFromEmail(email: string) {
  return email
    .split('@')[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export type UserRecord = User & { password?: string }

/** Quita la contraseña antes de que el usuario llegue a la sesión o a las pantallas. */
export function toUser({ password: _password, ...user }: UserRecord): User {
  return user
}

export async function findByEmail(email: string) {
  const [user] = await http.get<UserRecord[]>('/users', { email })
  return user ?? null
}

async function createUser(
  email: string,
  password?: string,
  name?: string,
  extra?: Pick<User, 'role' | 'professionalId'>,
) {
  const user = await http.post<UserRecord>('/users', {
    id: `usr-${Date.now().toString(36)}`,
    name: name?.trim() || nameFromEmail(email) || email,
    email,
    role: email.startsWith('admin@') ? 'admin' : 'cliente',
    createdAt: nowInMadrid().date,
    password,
    ...extra,
  } satisfies UserRecord)
  return toUser(user)
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

export class InvalidCredentialsError extends Error {
  constructor() {
    super('El email o la contraseña no son correctos')
  }
}

async function login(email: string, password: string, remember = true) {
  const normalized = normalizeEmail(email)
  const record = await findByEmail(normalized)
  if (!record?.password || record.password !== password) {
    throw new InvalidCredentialsError()
  }
  const user = toUser(record)
  saveSession(user, remember)
  return user
}

/** Entra (o crea la cuenta) con Google. El email lo ha verificado el servidor. */
async function loginWithGoogle(remember = true) {
  const { email, name } = await verifyGoogleToken({
    data: { accessToken: await requestGoogleToken() },
  })
  const normalized = normalizeEmail(email)
  const record = await findByEmail(normalized)
  // ponytail: contraseña aleatoria para cuentas de Google: así `register` no
  // puede "completar" la cuenta y quedársela. Campo `provider` si hace falta distinguirlas.
  const user = record
    ? toUser(record)
    : await createUser(normalized, crypto.randomUUID(), name)
  saveSession(user, remember)
  return user
}

/** Para la capa de datos del backoffice: corta si quien llama no es admin. */
export function requireAdmin() {
  const user = getSession()
  if (user?.role !== 'admin') {
    throw new Error('Solo un administrador puede hacer esto.')
  }
  return user
}

export class EmailTakenError extends Error {
  constructor() {
    super('Ya existe una cuenta con ese email')
  }
}

async function register(name: string, email: string, password: string) {
  const normalized = normalizeEmail(email)
  const existing = await findByEmail(normalized)
  if (existing?.password) throw new EmailTakenError()

  let user: User
  if (existing) {
    // Cuenta creada antes de que se pidiera contraseña: la completa.
    user = toUser(
      await http.patch<UserRecord>(
        `/users/${encodeURIComponent(existing.id)}`,
        {
          name: name.trim() || existing.name,
          password,
        },
      ),
    )
  } else {
    user = await createUser(normalized, password, name)
  }
  // No abre sesión: tras registrarse, el usuario entra desde el login.
  return user
}

/** Backoffice: cuenta de acceso para la ficha de un profesional. */
export async function createProfessionalAccount(input: {
  name: string
  email: string
  password: string
  professionalId: string
}) {
  requireAdmin()
  const email = normalizeEmail(input.email)
  if (await findByEmail(email)) throw new EmailTakenError()
  return createUser(email, input.password, input.name, {
    role: 'profesional',
    professionalId: input.professionalId,
  })
}

async function logout() {
  localStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(SESSION_KEY)
}

async function me() {
  return getSession()
}

async function updateProfile(input: ProfileInput): Promise<User> {
  const current = getSession()
  if (!current) throw new Error('Tu sesión ha caducado. Vuelve a entrar.')
  const user = toUser(
    await http.patch<UserRecord>(`/users/${encodeURIComponent(current.id)}`, {
      name: input.name.trim(),
      phone: input.phone?.trim() || null,
    }),
  )
  // El nombre de un profesional también es el de su ficha pública.
  if (user.role === 'profesional' && user.professionalId) {
    await http.patch(
      `/professionals/${encodeURIComponent(user.professionalId)}`,
      {
        name: user.name,
      },
    )
  }
  // Mantiene la sesión donde estaba ("Recordarme" o solo esta pestaña).
  const remember = readJson<User>(localStorage, SESSION_KEY) !== null
  saveSession(user, remember)
  return user
}

/** Admin y profesionales entran al backoffice. */
export function isBackofficeUser(user: User) {
  return user.role === 'admin' || user.role === 'profesional'
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}

export const auth = {
  login,
  loginWithGoogle,
  register,
  logout,
  me,
  updateProfile,
}
