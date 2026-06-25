import { describe, expect, it } from 'vitest'
import {
  VERSION_POLL_INTERVAL_MS,
  LIVE_UPDATE_STRATEGY,
  hasTransientVersions,
  versionListCachePolicy
} from '@/services/v2/versioning/version-cache-policy'

const queryWith = (...states) => ({
  state: { data: { body: states.map((state) => ({ state })) } }
})

describe('version-cache-policy', () => {
  it('exposes a tunable poll interval (3s) and defaults to the polling strategy', () => {
    expect(VERSION_POLL_INTERVAL_MS).toBe(3000)
    expect(LIVE_UPDATE_STRATEGY).toBe('polling')
  })

  describe('hasTransientVersions', () => {
    it.each(['building', 'queued'])('is true when the list has a %s version', (state) => {
      expect(hasTransientVersions({ body: [{ state: 'ready' }, { state }] })).toBe(true)
    })

    it('is false when every version is in a terminal/editable state', () => {
      const body = ['ready', 'active', 'archived', 'draft', 'error', 'canceled'].map((state) => ({
        state
      }))
      expect(hasTransientVersions({ body })).toBe(false)
    })

    it.each([undefined, null, {}, { body: [] }, { body: 'nope' }])(
      'is false for missing/empty/invalid data (%j)',
      (data) => {
        expect(hasTransientVersions(data)).toBe(false)
      }
    )
  })

  describe('versionListCachePolicy', () => {
    const { refetchInterval, refetchOnMount } = versionListCachePolicy()

    it('polls at the configured interval while a version is transient', () => {
      expect(refetchInterval(queryWith('ready', 'building'))).toBe(VERSION_POLL_INTERVAL_MS)
    })

    it('stops polling once the list is fully settled', () => {
      expect(refetchInterval(queryWith('ready', 'active'))).toBe(false)
    })

    it('refetches on mount only when a version is still transient', () => {
      expect(refetchOnMount(queryWith('queued'))).toBe('always')
      expect(refetchOnMount(queryWith('ready'))).toBe(false)
    })
  })
})
