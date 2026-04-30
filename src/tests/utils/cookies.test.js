import { getHubSpotUtk, getHubSpotContext } from '@/utils/cookies'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

describe('getHubSpotUtk', () => {
  let cookieGetter

  beforeEach(() => {
    cookieGetter = vi.spyOn(document, 'cookie', 'get')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return the hubspotutk cookie value when present', () => {
    cookieGetter.mockReturnValue('hubspotutk=abc123; other=value')

    expect(getHubSpotUtk()).toBe('abc123')
  })

  it('should return undefined when hubspotutk cookie is not present', () => {
    cookieGetter.mockReturnValue('other=value')

    expect(getHubSpotUtk()).toBeUndefined()
  })

  it('should decode URL-encoded cookie values', () => {
    cookieGetter.mockReturnValue('hubspotutk=abc%20123')

    expect(getHubSpotUtk()).toBe('abc 123')
  })

  it('should handle hubspotutk at the end of cookie string', () => {
    cookieGetter.mockReturnValue('session=xyz; hubspotutk=last-token')

    expect(getHubSpotUtk()).toBe('last-token')
  })

  it('should handle hubspotutk as the only cookie', () => {
    cookieGetter.mockReturnValue('hubspotutk=only-token')

    expect(getHubSpotUtk()).toBe('only-token')
  })

  it('should return undefined when no cookies are set', () => {
    cookieGetter.mockReturnValue('')

    expect(getHubSpotUtk()).toBeUndefined()
  })
})

describe('getHubSpotContext', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      location: {
        href: 'https://console.azion.com/signup?utm_source=google&utm_medium=cpc',
        search: '?utm_source=google&utm_medium=cpc'
      },
      screen: {
        height: 1080,
        width: 1920
      }
    })
    vi.stubGlobal('document', {
      title: 'Sign Up - Azion',
      referrer: 'https://google.com'
    })
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0',
      language: 'en-US'
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should return page context properties', () => {
    const context = getHubSpotContext()

    expect(context.hs_page_url).toBe(
      'https://console.azion.com/signup?utm_source=google&utm_medium=cpc'
    )
    expect(context.hs_page_title).toBe('Sign Up - Azion')
    expect(context.hs_referrer).toBe('https://google.com')
  })

  it('should return device/screen context properties', () => {
    const context = getHubSpotContext()

    expect(context.hs_screen_height).toBe(1080)
    expect(context.hs_screen_width).toBe(1920)
    expect(context.hs_user_agent).toBe('Mozilla/5.0')
    expect(context.hs_language).toBe('en-US')
  })

  it('should return UTM parameters from URL', () => {
    const context = getHubSpotContext()

    expect(context.hs_utm_source).toBe('google')
    expect(context.hs_utm_medium).toBe('cpc')
    expect(context.hs_utm_campaign).toBeUndefined()
  })

  it('should not include UTM properties when not present', () => {
    vi.stubGlobal('window', {
      location: {
        href: 'https://console.azion.com/signup',
        search: ''
      },
      screen: {
        height: 1080,
        width: 1920
      }
    })

    const context = getHubSpotContext()

    expect(context.hs_utm_source).toBeUndefined()
    expect(context.hs_utm_medium).toBeUndefined()
  })
})
