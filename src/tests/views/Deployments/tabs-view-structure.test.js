// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve, dirname } from 'node:path'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../')

const read = (relative) => readFileSync(resolve(ROOT, relative), 'utf8')

const TABS_VIEW = 'src/views/Deployments/TabsView.vue'

const parseTabOrder = (src) => {
  const match = src.match(/const\s+TAB_ORDER\s*=\s*\[([^\]]*)\]/)
  if (!match) return null
  return [...match[1].matchAll(/['"]([^'"]+)['"]/g)].map((entry) => entry[1])
}

const EXPECTED_ORDER = ['settings', 'releases', 'version-history']

describe('TabsView — tab structure', () => {
  it('declares TAB_ORDER as settings, releases, version-history in that order', () => {
    const order = parseTabOrder(read(TABS_VIEW))

    expect(order).not.toBeNull()
    expect(order).toEqual(EXPECTED_ORDER)
  })

  it('keeps settings before releases before version-history', () => {
    const order = parseTabOrder(read(TABS_VIEW))

    expect(order.indexOf('settings')).toBe(0)
    expect(order.indexOf('releases')).toBeGreaterThan(order.indexOf('settings'))
    expect(order.indexOf('version-history')).toBeGreaterThan(order.indexOf('releases'))
  })

  it('renders exactly three TabPanel entries', () => {
    const src = read(TABS_VIEW)

    const panels = src.match(/<TabPanel\b/g) ?? []
    expect(panels).toHaveLength(3)
  })

  it('exposes the three tab headers in order', () => {
    const src = read(TABS_VIEW)

    const headers = [...src.matchAll(/<TabPanel[^>]*header="([^"]+)"/g)].map((entry) => entry[1])
    expect(headers).toEqual(['Settings', 'Releases', 'Version history'])
  })

  it('defaults to the settings tab when the route param is absent or invalid', () => {
    const src = read(TABS_VIEW)

    expect(src).toMatch(
      /TAB_ORDER\.includes\(route\.params\.tab\)\s*\?\s*route\.params\.tab\s*:\s*'settings'/
    )
  })
})
