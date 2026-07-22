import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { defineComponent } from 'vue'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import Tooltip from 'primevue/tooltip'
import { Form } from 'vee-validate'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { useAccountStore } from '@/stores/account'
import MenuProduction from '@/layout/components/menu-production/index.vue'
import FormFieldsEnvironment from '@/views/Environments/FormFields/FormFieldsEnvironment.vue'
import {
  flagOn,
  flagOff,
  installFlagReset,
  spyHttpRequest,
  FLAG_NAME,
  ACCOUNT_WITH_FLAG,
  ACCOUNT_LEGACY
} from '../support/flag-v6'

/**
 * View/menu-level forks (spec flag-v6-coverage, req 5 / ADR-5) — real
 * components rendered in both modes; only true boundaries stubbed (HTTP,
 * PrimeVue Sidebar shell, router history).
 *
 * IMPORTANT dual mechanism (audited): the sidebar menu does NOT read the
 * user-flag composable — it reads `account.client_flags` straight from the
 * Pinia account store. Both mechanisms are exercised here accordingly.
 */
installFlagReset()

afterEach(() => {
  vi.restoreAllMocks()
})

const stubQueryCache = () => {
  vi.spyOn(queryClient, 'ensureQueryData').mockImplementation(({ queryFn } = {}) =>
    typeof queryFn === 'function' ? queryFn() : undefined
  )
  vi.spyOn(queryClient, 'removeQueries').mockImplementation(() => {})
}

const freshRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', name: 'catch-all', component: { template: '<div />' } }]
  })

describe('sidebar menu — Deployments item visibility forks on account client_flags (req 5.3)', () => {
  const mountMenu = (account) => {
    const pinia = createPinia()
    setActivePinia(pinia)
    useAccountStore().$patch({ account })

    return mount(MenuProduction, {
      global: {
        plugins: [pinia, PrimeVue, freshRouter()],
        directives: { tooltip: Tooltip },
        // PrimeVue Sidebar only renders its slot when visible — stubbing the
        // SHELL (external lib) lets the real PrimeMenu + item template render.
        stubs: { Sidebar: { template: '<div><slot /></div>' } }
      }
    })
  }

  it('account WITH the flag: the Deployments menu item is rendered', () => {
    const wrapper = mountMenu({ ...ACCOUNT_WITH_FLAG })

    expect(wrapper.find('[data-testid="sidebar-block__menu-item__deployments"]').exists()).toBe(
      true
    )
  })

  it('legacy account (no flag): the Deployments menu item is NOT rendered', () => {
    const wrapper = mountMenu({ ...ACCOUNT_LEGACY })

    expect(wrapper.find('[data-testid="sidebar-block__menu-item__deployments"]').exists()).toBe(
      false
    )
  })

  it('the Deployments item is gated by THIS flag (inventory sanity)', () => {
    const wrapper = mountMenu({ client_flags: ['another_flag', FLAG_NAME] })

    expect(wrapper.find('[data-testid="sidebar-block__menu-item__deployments"]').exists()).toBe(
      true
    )
  })
})

describe('FormFieldsEnvironment — global-variables request params fork on the flag (req 5.1)', () => {
  const Host = defineComponent({
    components: { VeeForm: Form, FormFieldsEnvironment },
    template: '<VeeForm><FormFieldsEnvironment /></VeeForm>'
  })

  const mountFormAndCaptureRequest = async () => {
    stubQueryCache()
    const http = spyHttpRequest()
    http.spy.mockResolvedValue({ data: { results: [], count: 0 } })

    const pinia = createPinia()
    setActivePinia(pinia)

    mount(Host, {
      global: {
        plugins: [pinia, PrimeVue, ToastService, freshRouter()],
        directives: { tooltip: Tooltip }
      }
    })
    // onMounted → fetchGlobalVariables → variablesService.list → HTTP boundary.
    await vi.waitFor(() => {
      expect(http.spy).toHaveBeenCalled()
    })
    const call = http.spy.mock.calls.find(([request]) => request.url.includes('variables'))
    expect(call, 'expected a variables list request').toBeTruthy()
    return call[0]
  }

  it('flag ON (v6): lists variables scoped to global', async () => {
    flagOn()

    const request = await mountFormAndCaptureRequest()

    expect(request.params).toMatchObject({ scope_type: 'global' })
  })

  it('flag OFF (legacy): lists variables with no scope params', async () => {
    flagOff()

    const request = await mountFormAndCaptureRequest()

    expect(request.params ?? {}).not.toHaveProperty('scope_type')
  })
})
