import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

// "Continuar con Google" con Google Identity Services (popup OAuth, sin SDK
// en npm). El navegador obtiene un access token; el servidor lo valida con
// Google (que sea para NUESTRO client id y con email verificado) y solo
// entonces devuelve email y nombre. Client id en VITE_GOOGLE_CLIENT_ID.

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

export class GoogleCancelledError extends Error {}

type TokenResponse = { access_token?: string; error?: string }
type GoogleOAuth = {
  initTokenClient: (config: {
    client_id: string
    scope: string
    callback: (response: TokenResponse) => void
    error_callback?: (error: { type: string }) => void
  }) => { requestAccessToken: () => void }
}
declare global {
  interface Window {
    google?: { accounts: { oauth2: GoogleOAuth } }
  }
}

let gisScript: Promise<GoogleOAuth> | undefined

function loadGis() {
  gisScript ??= new Promise<GoogleOAuth>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => resolve(window.google!.accounts.oauth2)
    script.onerror = () => {
      gisScript = undefined
      reject(new Error('No hemos podido cargar Google'))
    }
    document.head.appendChild(script)
  })
  return gisScript
}

/** Abre el popup de Google y devuelve un access token. Solo en cliente. */
export async function requestGoogleToken() {
  if (!CLIENT_ID) throw new Error('El acceso con Google no está configurado')
  const oauth2 = await loadGis()
  return new Promise<string>((resolve, reject) => {
    oauth2
      .initTokenClient({
        client_id: CLIENT_ID,
        scope: 'openid email profile',
        callback: (response) =>
          response.access_token
            ? resolve(response.access_token)
            : reject(new GoogleCancelledError(response.error)),
        error_callback: (error) => reject(new GoogleCancelledError(error.type)),
      })
      .requestAccessToken()
  })
}

const tokenInfoSchema = z.object({
  aud: z.string(),
  email: z.string().email(),
  email_verified: z.union([z.literal('true'), z.literal(true)]),
})
const userInfoSchema = z.object({ name: z.string().optional() })

export const verifyGoogleToken = createServerFn({ method: 'POST' })
  .validator((input: unknown) => z.object({ accessToken: z.string().min(1) }).parse(input))
  .handler(async ({ data: { accessToken } }) => {
    // tokeninfo dice para qué app se emitió el token: sin esto, un token de
    // cualquier otra web serviría para entrar aquí con la cuenta de su dueño.
    const infoResponse = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`,
    )
    const info = tokenInfoSchema.safeParse(infoResponse.ok ? await infoResponse.json() : null)
    if (!CLIENT_ID || !info.success || info.data.aud !== CLIENT_ID) {
      throw new Error('Google no ha validado tu cuenta')
    }
    const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const profile = userInfoSchema.safeParse(profileResponse.ok ? await profileResponse.json() : {})
    return { email: info.data.email, name: profile.data?.name }
  })
