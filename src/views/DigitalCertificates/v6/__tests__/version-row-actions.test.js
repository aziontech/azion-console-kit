import { describe, it, expect, vi } from 'vitest'
import { buildVersionRowActions } from '@/views/DigitalCertificates/v6/version-row-actions'

const idsOf = (actions) => actions.map((action) => action.id)

describe('Property P6 — revert is never offered on the current version', () => {
  it('exposes only copy-version-id when isCurrent is true', () => {
    const actions = buildVersionRowActions({ id: 'v3', isCurrent: true })
    const ids = idsOf(actions)

    expect(ids).not.toContain('revert')
    expect(ids).toEqual(['copy-version-id'])
  })

  it('offers revert before copy-version-id when isCurrent is false', () => {
    const actions = buildVersionRowActions({ id: 'v2', isCurrent: false })
    const ids = idsOf(actions)

    expect(ids).toContain('revert')
    expect(ids).toContain('copy-version-id')
    expect(ids.indexOf('revert')).toBeLessThan(ids.indexOf('copy-version-id'))
  })

  it('runs onRevert with the version when the revert action executes', () => {
    const version = { id: 'v2', isCurrent: false }
    const onRevert = vi.fn()

    const actions = buildVersionRowActions(version, { onRevert })
    const revert = actions.find((action) => action.id === 'revert')
    revert.execute()

    expect(onRevert).toHaveBeenCalledTimes(1)
    expect(onRevert).toHaveBeenCalledWith(version)
  })

  it('runs onCopy with the version when the copy-version-id action executes', () => {
    const version = { id: 'v5', isCurrent: false }
    const onCopy = vi.fn()

    const actions = buildVersionRowActions(version, { onCopy })
    const copy = actions.find((action) => action.id === 'copy-version-id')
    copy.execute()

    expect(onCopy).toHaveBeenCalledTimes(1)
    expect(onCopy).toHaveBeenCalledWith(version)
  })

  it('treats missing isCurrent as non-current because only isCurrent === true blocks revert', () => {
    const actions = buildVersionRowActions({ id: 'v1' })
    const ids = idsOf(actions)

    expect(ids).toContain('revert')
    expect(ids).toContain('copy-version-id')
  })

  it('does not throw when executing actions built without handlers', () => {
    const currentActions = buildVersionRowActions({ id: 'v9', isCurrent: true })
    const historyActions = buildVersionRowActions({ id: 'v8', isCurrent: false })

    for (const action of [...currentActions, ...historyActions]) {
      expect(() => action.execute()).not.toThrow()
    }
  })
})
