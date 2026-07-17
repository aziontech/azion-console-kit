import { describe, it, expect, vi } from 'vitest'
import { buildVersionRowActions } from '@/views/Deployments/tabs/version-history-row-actions'

const idsOf = (actions) => actions.map((action) => action.id)

describe('Deployment version-history row actions — revert is never offered on the current version', () => {
  it.each(['ready', 'active'])(
    'exposes only copy-version-id when the version state is "%s" (current)',
    (state) => {
      const actions = buildVersionRowActions({ id: 'AVDEP001', state })

      expect(idsOf(actions)).toEqual(['copy-version-id'])
    }
  )

  it.each(['draft', 'queued', 'building', 'archived', 'canceled', 'error'])(
    'offers revert before copy-version-id when the version state is "%s" (historical)',
    (state) => {
      const ids = idsOf(buildVersionRowActions({ id: 'AVDEP002', state }))

      expect(ids).toContain('revert')
      expect(ids).toContain('copy-version-id')
      expect(ids.indexOf('revert')).toBeLessThan(ids.indexOf('copy-version-id'))
    }
  )

  it('resolves the state from meta.state when the top-level state is absent', () => {
    const currentByMeta = buildVersionRowActions({ id: 'AVDEP003', meta: { state: 'active' } })
    const historicalByMeta = buildVersionRowActions({ id: 'AVDEP004', meta: { state: 'archived' } })

    expect(idsOf(currentByMeta)).toEqual(['copy-version-id'])
    expect(idsOf(historicalByMeta)).toContain('revert')
  })

  it('runs onRevert with the version when the revert action executes', () => {
    const version = { id: 'AVDEP005', state: 'archived' }
    const onRevert = vi.fn()

    const revert = buildVersionRowActions(version, { onRevert }).find(
      (action) => action.id === 'revert'
    )
    revert.execute()

    expect(onRevert).toHaveBeenCalledTimes(1)
    expect(onRevert).toHaveBeenCalledWith(version)
  })

  it('runs onCopy with the version when the copy-version-id action executes', () => {
    const version = { id: 'AVDEP006', state: 'ready' }
    const onCopy = vi.fn()

    const copy = buildVersionRowActions(version, { onCopy }).find(
      (action) => action.id === 'copy-version-id'
    )
    copy.execute()

    expect(onCopy).toHaveBeenCalledTimes(1)
    expect(onCopy).toHaveBeenCalledWith(version)
  })

  it('does not throw when executing actions built without handlers', () => {
    const currentActions = buildVersionRowActions({ id: 'AVDEP007', state: 'active' })
    const historyActions = buildVersionRowActions({ id: 'AVDEP008', state: 'archived' })

    for (const action of [...currentActions, ...historyActions]) {
      expect(() => action.execute()).not.toThrow()
    }
  })
})
