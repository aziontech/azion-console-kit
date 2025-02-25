import { afterAll, describe, expect, it, vi } from 'vitest'
import { disabledBackButton } from '@/helpers/browser-back-button'

vi.stubGlobal('window', {
  location: {
    hash: ''
  },
  onhashchange: null
})

describe('disabledBackButton', () => {
  afterAll(() => {
    vi.unstubAllGlobals()
  })
  it('should update window.location.hash to "Again-No-back-button"', () => {
    disabledBackButton()
    expect(window.location.hash).toBe('Again-No-back-button')
  })

  it('should reset window.location.hash to "no-back-button" on hash change', () => {
    disabledBackButton()

    window.location.hash = 'some-other-hash'
    window.onhashchange()

    expect(window.location.hash).toBe('no-back-button')
  })
})
