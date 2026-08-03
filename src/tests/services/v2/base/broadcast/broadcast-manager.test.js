// @vitest-environment node
import { describe, it, expect, beforeEach, afterAll, afterEach, vi } from 'vitest'
import { BroadcastChannel as NodeBroadcastChannel } from 'node:worker_threads'
import { BroadcastManager, generateTabId } from '@/services/v2/base/broadcast'

/**
 * BroadcastManager — cross-tab messaging under account switch/logout
 * (test-maturity deep pass). The suite-wide setup nulls BroadcastChannel in a
 * global beforeEach (legacy stub), so the restore to Node's REAL
 * implementation must ALSO be per-test — file hooks run after setup hooks.
 */
beforeEach(() => {
  vi.stubGlobal('BroadcastChannel', NodeBroadcastChannel)
})

afterAll(() => {
  vi.unstubAllGlobals()
})

const managers = []
const makeTab = () => {
  const manager = new BroadcastManager('spec-channel')
  manager.start()
  managers.push(manager)
  return manager
}

afterEach(() => {
  while (managers.length) managers.pop().close()
})

describe('cross-tab delivery', () => {
  it('delivers a typed message with payload and sender tab id to the OTHER tab', async () => {
    const tabA = makeTab()
    const tabB = makeTab()
    const received = vi.fn()
    tabB.on('LOGOUT', received)

    tabA.send('LOGOUT', { reason: 'expired' })

    await vi.waitFor(() => expect(received).toHaveBeenCalled())
    const [data, fromTabId] = received.mock.calls[0]
    expect(data.reason).toBe('expired')
    expect(fromTabId).toBe(tabA.tabId)
  })

  it('filters its OWN messages — a tab never reacts to itself', async () => {
    const tabA = makeTab()
    const tabB = makeTab()
    const selfListener = vi.fn()
    const otherListener = vi.fn()
    tabA.on('PING', selfListener)
    tabB.on('PING', otherListener)

    tabA.send('PING')

    await vi.waitFor(() => expect(otherListener).toHaveBeenCalled())
    expect(selfListener).not.toHaveBeenCalled()
  })
})

describe('lifecycle safety', () => {
  it('send() before start() is a silent no-op (no channel yet)', () => {
    const manager = new BroadcastManager('spec-channel')

    expect(() => manager.send('LOGOUT')).not.toThrow()
  })

  it('close() detaches the channel and drops listeners', async () => {
    const tabA = makeTab()
    const tabB = makeTab()
    const witness = makeTab() // deterministic fence: proves the send WAS delivered
    const received = vi.fn()
    const witnessed = vi.fn()
    tabB.on('LOGOUT', received)
    witness.on('LOGOUT', witnessed)

    tabB.close()
    tabA.send('LOGOUT')

    await vi.waitFor(() => expect(witnessed).toHaveBeenCalled())
    expect(received).not.toHaveBeenCalled()
  })

  it('generateTabId produces unique ids', () => {
    expect(generateTabId()).not.toBe(generateTabId())
  })
})
