import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { WebkitPlugin } from '@aziontech/webkit/plugin'
import VersionListDataView from '@/components/VersionListDataView/index.vue'
import { VERSION_STATES } from '@/composables/versioning/version-machine'

/**
 * Task 5.3 — UI/a11y of the VersionListDataView kebab. Unlike task 5.1/5.2
 * (model-level, stubbed Menu), these mount the REAL webkit/PrimeVue popup via
 * WebkitPlugin and assert on the rendered DOM: Property P5 (only DS tokens +
 * appendTo=body), keyboard navigation, accessible disabled items, and that the
 * panel renders above a drawer (Req 8.5). _Requirements: 8.5, 8.6, NFR-A.1_
 */

// DataView stub: render the #list slot once per item so a row + kebab exist.
const DataViewStub = {
  name: 'DataView',
  props: ['value'],
  template:
    '<div><template v-for="row in value" :key="row.id"><slot name="list" :data="row" /></template></div>'
}

const COLUMNS = [{ key: 'version', label: 'Version' }]
const PANEL = '.version-row-menu'

// Mounts the SFC with the real popup machinery (PrimeVue config + tooltip from
// WebkitPlugin), opens the row kebab, and returns the teleported panel element.
const openRealMenu = async (state) => {
  const version = { id: 'v-x', state }
  const wrapper = mount(VersionListDataView, {
    attachTo: document.body,
    props: {
      items: [version],
      columns: COLUMNS,
      hasVersions: true,
      resourceType: 'edge_application'
    },
    global: { plugins: [WebkitPlugin], stubs: { DataView: DataViewStub } }
  })
  await wrapper.get(`[data-testid="version-list-data-view__row-${version.id}__menu"]`).trigger('click')
  await nextTick()
  await nextTick()
  await nextTick()
  return { wrapper, version, panel: document.querySelector(PANEL) }
}

afterEach(() => {
  // Popups teleport to body; clear any leftover panel between tests.
  document.querySelectorAll(PANEL).forEach((node) => node.remove())
})

describe('VersionListDataView kebab — Property P5: DS tokens only + appendTo=body (task 5.3)', () => {
  it('appends the popup to <body>, outside the component subtree', async () => {
    const { wrapper, panel } = await openRealMenu(VERSION_STATES.READY)
    expect(panel).not.toBeNull()
    expect(document.body.contains(panel)).toBe(true)
    // Escaping the SFC subtree is what lets it stack over a drawer (Req 8.5).
    expect(wrapper.element.contains(panel)).toBe(false)
    expect(wrapper.findComponent({ name: 'Menu' }).props('appendTo')).toBe('body')
    wrapper.unmount()
  })

  it('carries no hardcoded hex/rgb colors in the rendered markup', async () => {
    const { wrapper, panel } = await openRealMenu(VERSION_STATES.READY)
    const html = panel.outerHTML
    // No raw color literals — color comes from DS tokens in the stylesheet.
    expect(html.match(/#[0-9a-fA-F]{3,8}\b/g)).toBeNull()
    expect(html).not.toMatch(/rgba?\(/)
    wrapper.unmount()
  })

  it('renders each item with its PrimeIcon and a sentence-case label', async () => {
    const { wrapper, panel } = await openRealMenu(VERSION_STATES.READY)
    const icons = [...panel.querySelectorAll('.version-row-menu__icon')].map((node) =>
      node.className.replace('version-row-menu__icon', '').trim()
    )
    expect(icons).toEqual([
      'pi pi-sliders-h',
      'pi pi-arrow-up-right',
      'pi pi-history',
      'pi pi-inbox',
      'pi pi-trash'
    ])
    const labels = [...panel.querySelectorAll('.version-row-menu__label')].map((node) =>
      node.textContent.trim()
    )
    expect(labels).toEqual([
      'Open configuration',
      'Promote version',
      'Rollback to this version',
      'Archive',
      'Delete'
    ])
    wrapper.unmount()
  })

  it('applies the danger class only on an enabled Delete and a separator before it', async () => {
    const { wrapper, panel } = await openRealMenu(VERSION_STATES.READY)
    const danger = panel.querySelector('.version-row-menu__item--danger .version-row-menu__label')
    expect(danger.textContent.trim()).toBe('Delete')
    expect(panel.querySelectorAll('.p-menuitem-separator')).toHaveLength(1)
    wrapper.unmount()
  })
})

describe('VersionListDataView kebab — accessible disabled items (task 5.3)', () => {
  it('marks the deferred Rollback item disabled and accessible (Req NFR-A.1)', async () => {
    const { wrapper, panel } = await openRealMenu(VERSION_STATES.READY)
    const items = [...panel.querySelectorAll('.p-menuitem')]
    const rollback = items.find((node) => node.textContent.includes('Rollback'))
    expect(rollback.classList.contains('p-disabled')).toBe(true)
    expect(rollback.getAttribute('aria-disabled')).toBe('true')
    // Disabled means present-but-blocked, never removed (never-hide pattern).
    expect(items).toHaveLength(5)
    wrapper.unmount()
  })

  it('disables Promote and Archive (with the disabled flag) for an archived version', async () => {
    const { wrapper, panel } = await openRealMenu(VERSION_STATES.ARCHIVED)
    const items = [...panel.querySelectorAll('.p-menuitem')]
    const disabledLabels = items
      .filter((node) => node.getAttribute('aria-disabled') === 'true')
      .map((node) => node.textContent.trim())
    expect(disabledLabels).toEqual(
      expect.arrayContaining(['Promote version', 'Rollback to this version', 'Archive'])
    )
    // Open configuration stays enabled in every state.
    const open = items.find((node) => node.textContent.includes('Open configuration'))
    expect(open.getAttribute('aria-disabled')).not.toBe('true')
    wrapper.unmount()
  })
})

describe('VersionListDataView kebab — keyboard navigation (task 5.3 / Req 8.4)', () => {
  it('exposes a focusable role=menu list with role=menuitem entries', async () => {
    const { wrapper, panel } = await openRealMenu(VERSION_STATES.READY)
    const list = panel.querySelector('[role="menu"]')
    expect(list.tagName).toBe('UL')
    expect(list.getAttribute('tabindex')).toBe('0')
    expect(panel.querySelectorAll('[role="menuitem"]').length).toBe(5)
    wrapper.unmount()
  })

  it('moves focus to the first item on ArrowDown', async () => {
    const { wrapper, panel } = await openRealMenu(VERSION_STATES.READY)
    const list = panel.querySelector('[role="menu"]')
    list.focus()
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', code: 'ArrowDown', bubbles: true }))
    await nextTick()
    const focused = panel.querySelector('.p-menuitem.p-focus')
    expect(focused).not.toBeNull()
    expect(list.getAttribute('aria-activedescendant')).toBe(focused.id)
    wrapper.unmount()
  })

  it('closes the panel on Escape', async () => {
    const { wrapper, panel } = await openRealMenu(VERSION_STATES.READY)
    const list = panel.querySelector('[role="menu"]')
    list.focus()
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }))
    await nextTick()
    await nextTick()
    expect(document.querySelector(PANEL)).toBeNull()
    wrapper.unmount()
  })
})

describe('VersionListDataView kebab — renders above a drawer (task 5.3 / Req 8.5)', () => {
  let drawer

  beforeEach(() => {
    // A drawer establishes its own stacking/overflow context on the page.
    drawer = document.createElement('div')
    drawer.className = 'p-sidebar p-component'
    drawer.style.zIndex = '1101'
    drawer.style.overflow = 'hidden'
    document.body.appendChild(drawer)
  })

  afterEach(() => {
    drawer?.remove()
  })

  it('teleports the overlay panel to body so the drawer cannot clip or trap it', async () => {
    const { wrapper, panel } = await openRealMenu(VERSION_STATES.READY)
    // Panel is a body-level overlay, never nested inside the drawer subtree.
    expect(document.body.contains(panel)).toBe(true)
    expect(drawer.contains(panel)).toBe(false)
    // The overlay class is what the DS theme z-indexes above drawers.
    expect(panel.classList.contains('p-menu-overlay')).toBe(true)
    wrapper.unmount()
  })
})
