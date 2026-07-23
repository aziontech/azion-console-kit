// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest'
import { BroadcastChannel as NodeBroadcastChannel } from 'node:worker_threads'

/**
 * session-broadcast — the cross-tab session channel (logout/switch account
 * propagation). Real Node BroadcastChannel (re-stubbed per test, see
 * broadcast-manager.test.js); the module singleton starts at import, so each
 * test re-imports a fresh instance.
 */
const peers = []
const makePeerTab = async () => {
  const { BroadcastManager } = await import('@/services/v2/base/broadcast')
  const peer = new BroadcastManager('session-sync')
  peer.start()
  peers.push(peer)
  return peer
}

beforeEach(() => {
  vi.resetModules()
  vi.stubGlobal('BroadcastChannel', NodeBroadcastChannel)
})

afterEach(async () => {
  const { stopSessionBroadcast } = await import('@/services/v2/base/auth/session-broadcast')
  stopSessionBroadcast()
  while (peers.length) peers.pop().close()
})

afterAll(() => {
  vi.unstubAllGlobals()
})

describe('cross-tab session events', () => {
  it('sendLogoutBroadcast reaches another tab on the session channel', async () => {
    const { sendLogoutBroadcast } = await import('@/services/v2/base/auth/session-broadcast')
    const otherTab = await makePeerTab()
    const received = vi.fn()
    otherTab.on('LOGOUT', received)

    sendLogoutBroadcast()

    await vi.waitFor(() => expect(received).toHaveBeenCalled())
  })

  it('onSwitchAccount fires when ANOTHER tab announces the completed switch', async () => {
    const { onSwitchAccount } = await import('@/services/v2/base/auth/session-broadcast')
    const otherTab = await makePeerTab()
    const callback = vi.fn()
    onSwitchAccount(callback)

    otherTab.send('SWITCH_ACCOUNT')

    await vi.waitFor(() => expect(callback).toHaveBeenCalled())
  })

  it('does NOT react to its own broadcast (self-filter)', async () => {
    const { sendLogoutBroadcast, onLogout } =
      await import('@/services/v2/base/auth/session-broadcast')
    const callback = vi.fn()
    onLogout(callback)

    sendLogoutBroadcast()
    await new Promise((resolve) => setTimeout(resolve, 25))

    expect(callback).not.toHaveBeenCalled()
  })
})
