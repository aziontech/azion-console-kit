import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

const ISOLATED_TREES = [
  'src/views/BillingV4',
  'src/services/v2/billing-api',
  'src/router/routes/billing-routes/billing-v4-routes.js'
]

const FORBIDDEN_IMPORTS = [
  '@/services/v2/billing-legacy',
  '@/services/billing-services',
  '@/services/contract-services',
  '@/helpers/account-data',
  '@/views/Billing/',
  'billingGqlService',
  'legacyPaymentsService',
  'legacy-invoices-service'
]

const collectFiles = (target) => {
  const absolute = join(ROOT, target)
  if (statSync(absolute).isFile()) return [absolute]

  const walk = (dir) =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) return walk(full)
      return /\.(js|vue)$/.test(entry.name) ? [full] : []
    })

  return walk(absolute)
}

describe('billing v4 flow stays isolated from the legacy billing surface', () => {
  const files = ISOLATED_TREES.flatMap(collectFiles)

  it('collects the files of the isolated trees', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  it.each(ISOLATED_TREES)('%s imports nothing from the legacy surface', (target) => {
    const offenders = collectFiles(target)
      .map((file) => ({ file, source: readFileSync(file, 'utf8') }))
      .flatMap(({ file, source }) =>
        FORBIDDEN_IMPORTS.filter((forbidden) => source.includes(forbidden)).map((forbidden) => ({
          file: file.replace(`${ROOT}/`, ''),
          forbidden
        }))
      )

    expect(offenders).toEqual([])
  })

  it('keeps the legacy route tree reachable so it can be deleted in one move', () => {
    const legacy = readFileSync(
      join(ROOT, 'src/router/routes/billing-routes/billing-legacy-routes.js'),
      'utf8'
    )
    expect(legacy).toContain('billingLegacyRoutes')

    const gate = readFileSync(join(ROOT, 'src/router/routes/billing-routes/index.js'), 'utf8')
    expect(gate).toContain('isBillingV4Enabled')
    expect(gate).toContain('billingLegacyRoutes')
    expect(gate).toContain('billingV4Routes')
  })
})
