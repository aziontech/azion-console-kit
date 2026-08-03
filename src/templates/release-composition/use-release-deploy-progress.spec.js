import { describe, it, expect, vi } from 'vitest'
import { useReleaseDeployProgress } from '@/templates/release-composition/use-release-deploy-progress'

const resolveRow = (id) => ({
  name: `deploy-${id}`,
  environmentNames: ['Staging'],
  policyLabel: 'Single Version'
})

describe('useReleaseDeployProgress', () => {
  it('seeds each row as deploying and keeps the dialog running until dispatch settles', async () => {
    let resolveDispatch
    const dispatch = vi.fn(() => new Promise((resolve) => (resolveDispatch = resolve)))
    const progress = useReleaseDeployProgress({ dispatch, resolveRow })

    const runPromise = progress.run(['ds-1', 'ds-2'])

    expect(progress.visible.value).toBe(true)
    expect(progress.isRunning.value).toBe(true)
    expect(progress.items.value.map((item) => item.status)).toEqual(['deploying', 'deploying'])
    expect(progress.items.value[0]).toMatchObject({
      id: 'ds-1',
      name: 'deploy-ds-1',
      environmentNames: ['Staging'],
      policyLabel: 'Single Version'
    })

    resolveDispatch([])
    await runPromise
    expect(progress.isRunning.value).toBe(false)
  })

  it('updates each row from its per-settle outcome and counts done/failed/skipped', async () => {
    const dispatch = vi.fn((ids, onOutcome) => {
      onOutcome({ id: 'ds-1', ok: true, traceId: 't1' })
      onOutcome({
        id: 'ds-2',
        ok: false,
        error: new Error('boom'),
        errorType: 'versioned_urls_active_limit'
      })
      onOutcome({ id: 'ds-3', ok: false, skipped: true, skipReason: 'degraded' })
      return Promise.resolve([])
    })
    const progress = useReleaseDeployProgress({ dispatch, resolveRow })

    await progress.run(['ds-1', 'ds-2', 'ds-3'])

    const byId = Object.fromEntries(progress.items.value.map((item) => [item.id, item]))
    expect(byId['ds-1'].status).toBe('done')
    expect(byId['ds-2'].status).toBe('failed')
    expect(byId['ds-2'].errorType).toBe('versioned_urls_active_limit')
    expect(byId['ds-3'].status).toBe('skipped')
    expect(progress.counts.value).toMatchObject({
      total: 3,
      done: 1,
      failed: 2,
      inProgress: 0,
      settled: 3
    })
  })

  it('retryFailed re-dispatches only the failed rows — never skipped — and resets them', async () => {
    const calls = []
    const dispatch = vi.fn((ids, onOutcome) => {
      calls.push([...ids])
      if (calls.length === 1) {
        onOutcome({ id: 'ds-1', ok: true })
        onOutcome({ id: 'ds-2', ok: false, error: new Error('boom') })
        onOutcome({ id: 'ds-3', ok: false, skipped: true, skipReason: 'degraded' })
      } else {
        ids.forEach((id) => onOutcome({ id, ok: true }))
      }
      return Promise.resolve([])
    })
    const progress = useReleaseDeployProgress({ dispatch, resolveRow })

    await progress.run(['ds-1', 'ds-2', 'ds-3'])
    await progress.retryFailed()

    expect(calls[1]).toEqual(['ds-2'])
    const byId = Object.fromEntries(progress.items.value.map((item) => [item.id, item]))
    expect(byId['ds-2'].status).toBe('done')
    expect(byId['ds-3'].status).toBe('skipped')
  })

  it('retryFailed is a no-op when there is nothing failed', async () => {
    const dispatch = vi.fn((ids, onOutcome) => {
      ids.forEach((id) => onOutcome({ id, ok: true }))
      return Promise.resolve([])
    })
    const progress = useReleaseDeployProgress({ dispatch, resolveRow })

    await progress.run(['ds-1'])
    await progress.retryFailed()

    expect(dispatch).toHaveBeenCalledTimes(1)
  })

  it('exposes the active (still deploying) row name and clears everything on close', async () => {
    let resolveDispatch
    const dispatch = vi.fn(
      (ids, onOutcome) =>
        new Promise((resolve) => {
          onOutcome({ id: 'ds-1', ok: true })
          resolveDispatch = () => {
            onOutcome({ id: 'ds-2', ok: true })
            resolve([])
          }
        })
    )
    const progress = useReleaseDeployProgress({ dispatch, resolveRow })

    const runPromise = progress.run(['ds-1', 'ds-2'])
    expect(progress.activeName.value).toBe('deploy-ds-2')

    resolveDispatch()
    await runPromise
    expect(progress.activeName.value).toBe(null)

    progress.close()
    expect(progress.visible.value).toBe(false)
    expect(progress.items.value).toEqual([])
    expect(progress.isRunning.value).toBe(false)
  })

  it('opens without dispatching when the selection is empty', async () => {
    const dispatch = vi.fn()
    const progress = useReleaseDeployProgress({ dispatch, resolveRow })

    await progress.run([])

    expect(progress.visible.value).toBe(true)
    expect(progress.items.value).toEqual([])
    expect(dispatch).not.toHaveBeenCalled()
  })
})
