import { describe, it, expect, beforeEach } from 'vitest'
import { cliGuard } from '@/router/hooks/guards/cliGuard'

/**
 * cliGuard — the `azion login` browser handshake: persists the CLI callback
 * config and strips the query by re-targeting the login route.
 */
beforeEach(() => {
  localStorage.clear()
})

describe('CLI login handshake', () => {
  it('persists the CLI flag and callback port, then re-targets login without the query', () => {
    const result = cliGuard({
      to: { name: 'login', query: { next: 'cli', callback_port: '9182' } }
    })

    expect(result).toEqual({ name: 'login' })
    // the storage helper base64-encodes the payload (obfuscation, pinned here)
    const decode = (key) => JSON.parse(atob(localStorage.getItem(key)))
    expect(decode('CLI').value).toBe(true)
    expect(decode('callbackPort').value).toBe('9182')
  })

  it('does nothing on a login navigation without the CLI query', () => {
    const result = cliGuard({ to: { name: 'login', query: {} } })

    expect(result).toBeUndefined()
    expect(localStorage.getItem('CLI')).toBeNull()
  })

  it('does nothing on any other route', () => {
    expect(cliGuard({ to: { name: 'home', query: { next: 'cli' } } })).toBeUndefined()
  })
})
