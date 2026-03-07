import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

const routeMock = vi.fn()
const startLoading = vi.fn()

vi.mock('vue-router', () => ({
  useRoute: () => routeMock()
}))

vi.mock('@/stores/loading', () => ({
  useLoadingStore: () => ({ startLoading })
}))

vi.mock('@assets/svg/logo', () => ({
  default: { name: 'AzionLogo', template: '<div />' }
}))

const mountPopup = async (query) => {
  routeMock.mockReturnValue({ query })
  const component = (await import('@/views/GitHubConnectionPopup/index.vue')).default
  mount(component, { global: { stubs: { AzionLogo: true } } })
}

describe('GitHubConnectionPopup callback contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(window, 'opener', {
      configurable: true,
      value: { closed: false, postMessage: vi.fn() }
    })
    window.close = vi.fn()
  })

  it('sends integration-data when code exists', async () => {
    await mountPopup({ code: 'oauth-code', state: 'abc' })

    expect(window.opener.postMessage).toHaveBeenCalledWith(
      { event: 'integration-data', data: { code: 'oauth-code', state: 'abc' } },
      window.location.origin
    )
    expect(window.close).toHaveBeenCalled()
  })

  it('sends integration-connected when no code and no OAuth error', async () => {
    await mountPopup({ installation_id: '123', setup_action: 'install' })

    expect(window.opener.postMessage).toHaveBeenCalledWith(
      {
        event: 'integration-connected',
        data: { installation_id: '123', setup_action: 'install' }
      },
      window.location.origin
    )
  })

  it('sends integration-error when OAuth returns error params', async () => {
    await mountPopup({ error: 'access_denied', error_description: 'User denied access' })

    expect(window.opener.postMessage).toHaveBeenCalledWith(
      {
        event: 'integration-error',
        data: { error: 'access_denied', error_description: 'User denied access' }
      },
      window.location.origin
    )
  })
})
