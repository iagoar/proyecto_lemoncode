// Prepara db/db.json para json-server a partir de db/seed.json.
// json-server escribe en db.json, así que la semilla queda intacta.
//   node scripts/ensure-db.mjs          → copia la semilla solo si no hay db.json;
//                                         si lo hay, le añade las colecciones nuevas
//                                         de la semilla (p. ej. `settings`) sin tocar el resto
//   node scripts/ensure-db.mjs --reset  → vuelve a los datos de ejemplo
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'

const seed = new URL('../db/seed.json', import.meta.url)
const db = new URL('../db/db.json', import.meta.url)
const reset = process.argv.includes('--reset')

if (reset || !existsSync(db)) {
  copyFileSync(seed, db)
  console.log(reset ? 'db.json restablecido' : 'db.json creado desde seed.json')
} else {
  const seedData = JSON.parse(readFileSync(seed, 'utf8'))
  const dbData = JSON.parse(readFileSync(db, 'utf8'))
  const missing = Object.keys(seedData).filter((key) => !(key in dbData))
  if (missing.length > 0) {
    for (const key of missing) dbData[key] = seedData[key]
    writeFileSync(db, `${JSON.stringify(dbData, null, 2)}\n`)
    console.log(`db.json: añadido ${missing.join(', ')}`)
  }
}
