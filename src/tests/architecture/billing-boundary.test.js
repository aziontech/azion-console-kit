import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

const PLANS_SURFACE = [
  'services/v2/billing-api',
  'composables/billing',
  'composables/useSubscriptionState.js',
  'composables/useSubscriptionPlanChange.js',
  'composables/useCurrentSubscription.js',
  'composables/useCheckoutSessionPreparer.js',
  'composables/useLatestInvoice.js'
]

const LEGACY_SURFACE = [
  'services/v2/billing-legacy',
  'composables/billing-legacy',
  'views/Billing/legacy'
]

const LEGACY_IMPORT =
  /from\s+['"][^'"]*(?:services\/v2\/billing-legacy|composables\/billing-legacy)/
const PLANS_IMPORT = /from\s+['"][^'"]*(?:services\/v2\/billing-api|composables\/billing\/)/

const collect = (relativePath) => {
  const absolute = join(SRC, relativePath)
  if (statSync(absolute).isFile())
    return [{ path: relativePath, source: readFileSync(absolute, 'utf8') }]

  return readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const child = join(relativePath, entry.name)
    if (entry.isDirectory()) return collect(child)
    if (!/\.(js|vue)$/.test(entry.name)) return []
    return [{ path: child, source: readFileSync(join(SRC, child), 'utf8') }]
  })
}

const filesOf = (surface) => surface.flatMap(collect)

describe('billing boundary', () => {
  it('keeps the plans experience free of legacy billing imports', () => {
    const offenders = filesOf(PLANS_SURFACE)
      .filter((file) => LEGACY_IMPORT.test(file.source))
      .map((file) => file.path)

    expect(offenders).toEqual([])
  })

  it('keeps legacy billing free of billing-api v4 imports', () => {
    const offenders = filesOf(LEGACY_SURFACE)
      .filter((file) => PLANS_IMPORT.test(file.source))
      .map((file) => file.path)

    expect(offenders).toEqual([])
  })

  it('routes every billing-api call through the v4 namespace', () => {
    const offenders = filesOf(['services/v2/billing-api'])
      .filter((file) =>
        /edge_api|v4\/payments\/credit_cards|v4\/payments\/history/.test(file.source)
      )
      .map((file) => file.path)

    expect(offenders).toEqual([])
  })

  it('keeps the legacy surface off the v4 billing routes', () => {
    const offenders = filesOf(['services/v2/billing-legacy'])
      .filter((file) =>
        /'\/v4\/account\/(subscriptions|billing|payments)|'\/v4\/billing_accounts/.test(file.source)
      )
      .map((file) => file.path)

    expect(offenders).toEqual([])
  })
})
