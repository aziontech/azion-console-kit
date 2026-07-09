import { describe, it, expect, vi } from 'vitest'
import { buildVersionRowActions } from '@/views/Variables/v6/version-row-actions'

const idsOf = (actions) => actions.map((action) => action.id)

describe('Property P6 — rollback is never offered on the current version', () => {
  it('omits rollback but keeps copy-version-id when isCurrent is true', () => {
    const actions = buildVersionRowActions({ id: 'v3', isCurrent: true })
    const ids = idsOf(actions)

    expect(ids).not.toContain('rollback')
    expect(ids).toContain('copy-version-id')
  })

  it('offers rollback before copy-version-id when isCurrent is false', () => {
    const actions = buildVersionRowActions({ id: 'v2', isCurrent: false })
    const ids = idsOf(actions)

    expect(ids).toContain('rollback')
    expect(ids).toContain('copy-version-id')
    expect(ids.indexOf('rollback')).toBeLessThan(ids.indexOf('copy-version-id'))
  })

  it('treats missing isCurrent as non-current because the helper checks isCurrent !== true', () => {
    const actions = buildVersionRowActions({ id: 'v1' })
    const ids = idsOf(actions)

    expect(ids).toContain('rollback')
    expect(ids).toContain('copy-version-id')
  })

  it('exposes only copy-version-id when the single version in the list is current (requirement 3.7)', () => {
    const versions = [{ id: 'only', isCurrent: true }]
    const actions = buildVersionRowActions(versions[0])

    expect(idsOf(actions)).toEqual(['copy-version-id'])
  })

  it('runs onRollback with the version when the rollback action executes', () => {
    const version = { id: 'v2', isCurrent: false }
    const onRollback = vi.fn()

    const actions = buildVersionRowActions(version, { onRollback })
    const rollback = actions.find((action) => action.id === 'rollback')
    rollback.execute()

    expect(onRollback).toHaveBeenCalledTimes(1)
    expect(onRollback).toHaveBeenCalledWith(version)
  })

  it('runs onCopy with the version when the copy-version-id action executes', () => {
    const version = { id: 'v5', isCurrent: true }
    const onCopy = vi.fn()

    const actions = buildVersionRowActions(version, { onCopy })
    const copy = actions.find((action) => action.id === 'copy-version-id')
    copy.execute()

    expect(onCopy).toHaveBeenCalledTimes(1)
    expect(onCopy).toHaveBeenCalledWith(version)
  })

  it('does not throw when executing actions built without handlers', () => {
    const currentActions = buildVersionRowActions({ id: 'v9', isCurrent: true })
    const historyActions = buildVersionRowActions({ id: 'v8', isCurrent: false })

    for (const action of [...currentActions, ...historyActions]) {
      expect(() => action.execute()).not.toThrow()
    }
  })
})
