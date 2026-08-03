// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import {
  buildVersionMenuItems,
  mapVersionMenuItemsToMenu
} from '@/composables/versioning/version-actions'
import { VERSION_STATES } from '@/composables/versioning/version-machine'

const ALL_STATES = [...Object.values(VERSION_STATES), 'deleted', 'totally-unknown']
const byAction = (items, action) => items.find((entry) => entry.action === action)

const VERSION_ACTIONS_SRC = readFileSync(
  resolve(
    dirname(fileURLToPath(import.meta.url)),
    '../../../composables/versioning/version-actions.js'
  ),
  'utf8'
)

describe('Phase 2 deferral guard — Rollback stays disabled', () => {
  it.each(ALL_STATES)(
    'Rollback is disabled with a tooltip in every state (state "%s")',
    (state) => {
      const rollback = byAction(buildVersionMenuItems(state), 'ROLLBACK')
      expect(rollback).toBeDefined()
      expect(rollback.disabled).toBe(true)
      expect(rollback.tooltip).toBeTruthy()
    }
  )

  it('keeps Rollback disabled even if ctx carries Phase 2 hints', () => {
    const ctx = { resourceType: 'application', isCurrentSomewhere: true, environments: ['prod'] }
    const rollback = byAction(buildVersionMenuItems(VERSION_STATES.READY, ctx), 'ROLLBACK')
    expect(rollback.disabled).toBe(true)
    expect(rollback.tooltip).toBeTruthy()
  })

  it('maps Rollback to a disabled menu entry (no command side effect wired)', () => {
    const entry = mapVersionMenuItemsToMenu(VERSION_STATES.READY, {}, () => {}, { id: 'v1' }).find(
      (menuItem) => menuItem.label === 'Rollback to this version'
    )
    expect(entry).toBeDefined()
    expect(entry.disabled).toBe(true)
  })
})

describe('Phase 2 deferral guard — no pre-emptive "in use as Current" disabling', () => {
  const ctxVariants = [
    { resourceType: 'application' },
    { resourceType: 'application', isCurrentSomewhere: true },
    { resourceType: 'application', isCurrentSomewhere: true, environments: ['prod', 'staging'] }
  ]

  it.each(ALL_STATES)('Archive enablement ignores Current ctx (state "%s")', (state) => {
    const baseline = byAction(buildVersionMenuItems(state, ctxVariants[0]), 'ARCHIVE')?.disabled
    ctxVariants.forEach((ctx) => {
      const archive = byAction(buildVersionMenuItems(state, ctx), 'ARCHIVE')
      expect(archive?.disabled).toBe(baseline)
    })
  })

  it.each(ALL_STATES)('Delete enablement ignores Current ctx (state "%s")', (state) => {
    const baseline = byAction(buildVersionMenuItems(state, ctxVariants[0]), 'DELETE')
    ctxVariants.forEach((ctx) => {
      const deleteItem = byAction(buildVersionMenuItems(state, ctx), 'DELETE')
      expect(Boolean(deleteItem)).toBe(Boolean(baseline))
      if (baseline) expect(deleteItem.disabled).toBe(baseline.disabled)
    })
  })

  it('does not read isCurrentSomewhere/environments in the menu model source', () => {
    expect(VERSION_ACTIONS_SRC).not.toMatch(/isCurrentSomewhere/)
    expect(VERSION_ACTIONS_SRC).not.toMatch(/ctx\.environments/)
  })
})

describe('Phase 2 deferral guard — no env-driven Current pill', () => {
  it('menu items carry no Current/environment presentation fields', () => {
    buildVersionMenuItems(VERSION_STATES.READY, {
      isCurrentSomewhere: true,
      environments: ['prod']
    }).forEach((entry) => {
      expect(entry).not.toHaveProperty('currentPill')
      expect(entry).not.toHaveProperty('isCurrent')
      expect(entry).not.toHaveProperty('environments')
    })
  })

  it('does not introduce a Current pill helper in the menu model source', () => {
    expect(VERSION_ACTIONS_SRC).not.toMatch(/currentPill|CurrentPill|current-pill/)
  })
})
