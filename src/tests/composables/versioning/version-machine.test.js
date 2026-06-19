import { describe, it, expect } from 'vitest'
import { getAvailableActions, VERSION_ACTIONS } from '@/composables/versioning/version-machine'

const { DEPLOY } = VERSION_ACTIONS

describe('version-machine getAvailableActions — DEPLOY availability (Property P1)', () => {
  it('exposes DEPLOY in the `ready` state', () => {
    expect(getAvailableActions('ready')).toContain(DEPLOY)
  })

  it('exposes DEPLOY in the `active` state', () => {
    expect(getAvailableActions('active')).toContain(DEPLOY)
  })

  it.each(['draft', 'queued', 'building', 'canceled', 'error', 'archived', 'totally-unknown'])(
    'does NOT expose DEPLOY in the `%s` state',
    (state) => {
      expect(getAvailableActions(state)).not.toContain(DEPLOY)
    }
  )

  it('fails closed: unknown states return no actions at all', () => {
    expect(getAvailableActions('totally-unknown')).toEqual([])
  })
})
