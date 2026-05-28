/**
 * Feature: real-time-events-responsividade
 *
 * Property-based test — Property P3: Aria-label completeness.
 *
 * Task 13.3 — Snapshot-style assertion that every interactive button
 * declared in §11.5 of the requirements exposes an `aria-label` attribute
 * in its source template.
 *
 * Strategy: source-level grep via `fs.readFileSync` + regex. JSDOM
 * mounting is rejected here because the surrounding components pull a
 * heavy dependency graph (PrimeVue, Pinia, services) whose mocks would
 * obscure the actual a11y contract under test.
 *
 * **Validates: Requirement 11.5 (Aria-label completeness).**
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const read = (relPath) => readFileSync(path.resolve(__dirname, '../../../', relPath), 'utf-8')

describe('Property P3 — Aria-label completeness', () => {
  it('filter-bar saved searches button has aria-label="Open saved searches"', () => {
    const source = read('views/RealTimeEventsV2/Blocks/components/filter-bar.vue')
    expect(source).toMatch(/aria-label\s*=\s*["']Open saved searches["']/)
  })

  it('event-chart view trigger has aria-label="Change chart view"', () => {
    const source = read('views/RealTimeEventsV2/Blocks/components/event-chart.vue')
    expect(source).toMatch(/aria-label\s*=\s*["']Change chart view["']/)
  })

  it('filterTagsDisplay chip remove button has dynamic aria-label with field/operator/value', () => {
    const source = read('components/base/advanced-filter-system-v2/filterTagsDisplay/index.vue')
    // Template should use a bound :aria-label="..." with interpolation.
    expect(source).toMatch(/:aria-label\s*=/)
    // The helper function must contain the "Remove filter" prefix.
    expect(source).toMatch(/Remove filter/i)
  })

  it('saved-searches-overlay save button has aria-label="Save current search"', () => {
    const source = read('views/RealTimeEventsV2/Blocks/components/saved-searches-overlay.vue')
    expect(source).toMatch(/aria-label\s*=\s*["']Save current search["']/)
  })

  it('saved-searches-overlay delete button has aria-label="Delete saved search"', () => {
    const source = read('views/RealTimeEventsV2/Blocks/components/saved-searches-overlay.vue')
    expect(source).toMatch(/aria-label\s*=\s*["']Delete saved search["']/)
  })

  it('query-history-overlay clear button has aria-label="Clear query history"', () => {
    const source = read('views/RealTimeEventsV2/Blocks/components/query-history-overlay.vue')
    expect(source).toMatch(/aria-label\s*=\s*["']Clear query history["']/)
  })

  it('event-chart bottom-sheet close has aria-label="Close view menu"', () => {
    const source = read('views/RealTimeEventsV2/Blocks/components/event-chart.vue')
    expect(source).toMatch(/aria-label\s*=\s*["']Close view menu["']/)
  })

  it('advanced-filter-system-v2 refresh button has aria-label="Refresh events"', () => {
    const source = read('components/base/advanced-filter-system-v2/index.vue')
    expect(source).toMatch(/aria-label\s*=\s*["']Refresh events["']/)
  })
})
