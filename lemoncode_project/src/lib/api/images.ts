import { createServerFn } from '@tanstack/react-start'
import { AwsClient } from 'aws4fetch'

// Subida de imágenes a RustFS (S3, `docker compose up -d`). Las credenciales
// viven solo en el servidor; el bucket tiene lectura pública y la URL que
// devolvemos se guarda tal cual en `imageUrl`.

const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export const uploadImage = createServerFn({ method: 'POST' })
  .validator((input: unknown) => {
    const file = input instanceof FormData ? input.get('file') : null
    if (!(file instanceof File)) throw new Error('Falta la imagen')
    if (!file.type.startsWith('image/'))
      throw new Error('El archivo tiene que ser una imagen')
    if (file.size > MAX_IMAGE_BYTES) throw new Error('La imagen pesa demasiado')
    return file
  })
  .handler(async ({ data: file }) => {
    const endpoint = (process.env.S3_ENDPOINT ?? 'http://localhost:9000').replace(/\/$/, '')
    const bucket = process.env.S3_BUCKET ?? 'images'
    const s3 = new AwsClient({
      accessKeyId: process.env.S3_ACCESS_KEY ?? 'rustfsadmin',
      secretAccessKey: process.env.S3_SECRET_KEY ?? 'rustfsadmin',
      service: 's3',
      region: 'us-east-1',
    })
    // ponytail: la extensión viene del tipo MIME; basta para servirla con su Content-Type.
    const key = `${crypto.randomUUID()}.${file.type.split('/')[1] ?? 'img'}`
    const url = `${endpoint}/${bucket}/${key}`
    const response = await s3.fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: await file.arrayBuffer(),
    })
    if (!response.ok) {
      console.error(`[imágenes] RustFS respondió ${response.status}:`, await response.text())
      throw new Error('No hemos podido subir la imagen')
    }
    return { url: `${(process.env.S3_PUBLIC_URL ?? endpoint).replace(/\/$/, '')}/${bucket}/${key}` }
  })
