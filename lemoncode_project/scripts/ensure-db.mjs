// Prepara db/db.json para json-server a partir de db/seed.json.
// json-server escribe en db.json, así que la semilla queda intacta.
//   node scripts/ensure-db.mjs          → copia la semilla solo si no hay db.json
//   node scripts/ensure-db.mjs --reset  → vuelve a los datos de ejemplo
import { copyFileSync, existsSync } from 'node:fs'

const seed = new URL('../db/seed.json', import.meta.url)
const db = new URL('../db/db.json', import.meta.url)
const reset = process.argv.includes('--reset')

if (reset || !existsSync(db)) {
  copyFileSync(seed, db)
  console.log(reset ? 'db.json restablecido' : 'db.json creado desde seed.json')
}
