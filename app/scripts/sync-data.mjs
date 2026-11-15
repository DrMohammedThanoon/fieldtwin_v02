// Copy validated science outputs into the app's public folder.
// The browser only ever reads these small precomputed files (no raw DEMs).
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const src = join(here, '..', '..', 'outputs', 'validated')
const dst = join(here, '..', 'public', 'data')

if (!existsSync(src)) {
  console.error(`[sync-data] missing ${src}. Run the science pipeline first.`)
  process.exit(1)
}
rmSync(dst, { recursive: true, force: true })
mkdirSync(dst, { recursive: true })
cpSync(src, dst, { recursive: true, filter: (p) => !p.endsWith('.gitkeep') })
console.log(`[sync-data] copied: ${readdirSync(dst).join(', ')}`)
