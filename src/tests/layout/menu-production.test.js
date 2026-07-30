import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MenuProduction from '@/layout/components/menu-production/index.vue'

const mocks = vi.hoisted(() => ({
  routerPush: vi.fn(),
  windowOpen: vi.fn(),
  menus: []
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mocks.routerPush })
}))

vi.mock('@/helpers/window-open', () => ({
  windowOpen: mocks.windowOpen
}))

vi.mock('@vueuse/core', async () => {
  const { ref } = await vi.importActual('vue')
  return {
    useMagicKeys: () => ({ meta: ref(false), control: ref(false) })
  }
})

vi.mock('@/stores/account', () => ({
  useAccountStore: () => ({
    account: { kind: 'client', client_flags: [] },
    hasAccessToMarketplaceProducts: true
  })
}))

vi.mock('@services/sidebar-menus-services', () => ({
  listSidebarMenusService: () => ({ body: { menus: mocks.menus } })
}))

vi.mock('@aziontech/webkit/button', () => ({
  default: { template: '<button><slot /></button>' }
}))

vi.mock('@aziontech/webkit/prime-tag', () => ({
  default: { template: '<span><slot /></span>' }
}))

vi.mock('@aziontech/webkit/sidebar', () => ({
  default: { template: '<div><slot /></div>' }
}))

// PrimeMenu stub: renders the #item slot for each leaf menu item, mirroring how
// the real component drives the slot with { item, label, props }.
vi.mock('@aziontech/webkit/menu', () => ({
  default: {
    props: ['model'],
    computed: {
      leaves() {
        return this.model.flatMap((entry) => (entry.items ? entry.items : [entry]))
      }
    },
    template: `
      <div>
        <template v-for="(item, index) in leaves" :key="index">
          <slot
            name="item"
            :item="item"
            :label="item.label"
            :props="{ action: {}, icon: {}, label: {} }"
          />
        </template>
      </div>
    `
  }
}))

const RouterLinkStub = {
  props: ['to'],
  template: '<a :href="to"><slot /></a>'
}

const mountMenu = () =>
  mount(MenuProduction, {
    global: {
      stubs: {
        RouterLink: RouterLinkStub
      },
      directives: {
        tooltip: () => {}
      }
    }
  })

describe('sidebar-block (menu-production)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.menus = []
  })

  it('opens external items in a new tab without navigating the current tab', async () => {
    const externalUrl = 'https://caixa-siem.azion.com/login'
    mocks.menus = [{ label: 'SIEM', to: externalUrl, id: 'siem', external: true }]

    const wrapper = mountMenu()
    const link = wrapper.get('[data-testid="sidebar-block__menu-item__siem"]')

    // Regression guard: external links must render as a plain anchor targeting a
    // new tab, never as a router-link (which resolves the absolute URL into a
    // broken relative route and 404s the current tab).
    expect(link.element.tagName).toBe('A')
    expect(link.attributes('href')).toBe(externalUrl)
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toBe('noopener noreferrer')

    await link.trigger('click')

    expect(mocks.windowOpen).toHaveBeenCalledWith(externalUrl)
    expect(mocks.routerPush).not.toHaveBeenCalled()
  })

  it('navigates internal items within the same tab', async () => {
    mocks.menus = [{ label: 'Variables', to: '/variables', id: 'variables' }]

    const wrapper = mountMenu()
    const link = wrapper.get('[data-testid="sidebar-block__menu-item__variables"]')

    expect(link.attributes('target')).toBeUndefined()

    await link.trigger('click')

    expect(mocks.routerPush).toHaveBeenCalledWith('/variables')
    expect(mocks.windowOpen).not.toHaveBeenCalled()
  })
})
