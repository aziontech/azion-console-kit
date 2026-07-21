/**
 * Functional (real Chromium) — VersionListDataView (spec task 4.2).
 *
 * Real user actions + observable consequences: the primary cell opens the config
 * (row-action OPEN_CONFIGURATION), the kebab opens the menu without dispatching a
 * row open, a menu item dispatches its action, an optional column auto-hides when
 * no row carries its data, and — at a phone viewport (real matchMedia) — the kebab
 * opens the bottom action sheet without the card's row-click firing.
 */
import { render } from '@testing-library/vue'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import PrimeVue from 'primevue/config'
import Tooltip from 'primevue/tooltip'
import { userEvent, page } from 'vitest/browser'
import VersionListDataView from '@/components/VersionListDataView/index.vue'

const primevue = { plugins: [PrimeVue], directives: { tooltip: Tooltip } }

const BASE_COLUMNS = [
  { key: 'version', label: 'Version' },
  { key: 'status', label: 'Status' }
]

const makeItem = (overrides = {}) => ({
  id: 'abc123',
  state: 'ready',
  comment: 'first build',
  ...overrides
})

const renderList = (props = {}) =>
  render(VersionListDataView, {
    props: {
      items: [makeItem()],
      columns: BASE_COLUMNS,
      hasVersions: true,
      showPaginator: false,
      resourceType: '',
      ...props
    },
    global: primevue
  })

// The popup Menu and the action sheet teleport to <body>; find their items there.
const findInBody = async (text) => {
  await vi.waitFor(() => {
    const hit = [
      ...document.body.querySelectorAll('.version-row-menu__item, .action-sheet__button')
    ].some((el) => el.textContent.includes(text))
    expect(hit).toBe(true)
  })
  return [...document.body.querySelectorAll('.version-row-menu__item, .action-sheet__button')].find(
    (el) => el.textContent.includes(text)
  )
}

describe('VersionListDataView (functional)', () => {
  beforeEach(async () => {
    // Desktop by default (table + popup menu). The phone test overrides this.
    await page.viewport(1280, 800)
  })

  it('primary cell click emits row-action OPEN_CONFIGURATION with the item', async () => {
    const item = makeItem()
    const { getByTestId, emitted } = renderList({ items: [item] })
    await userEvent.click(getByTestId('version-list-data-view__row-abc123__primary'))
    expect(emitted()['row-action']).toEqual([[{ action: 'OPEN_CONFIGURATION', item }]])
  })

  it('kebab opens the menu and does NOT emit a row open', async () => {
    const { getByTestId, emitted } = renderList()
    await userEvent.click(getByTestId('version-list-data-view__row-abc123__menu'))
    // The menu content proves it opened…
    await findInBody('Open configuration')
    // …and opening the menu is not a row open.
    expect(emitted()['row-action']).toBeUndefined()
  })

  it('clicking a menu item dispatches that action for the row', async () => {
    const item = makeItem()
    const { getByTestId, emitted } = renderList({ items: [item] })
    await userEvent.click(getByTestId('version-list-data-view__row-abc123__menu'))
    const openItem = await findInBody('Open configuration')
    await userEvent.click(openItem)
    expect(emitted()['row-action']).toEqual([[{ action: 'OPEN_CONFIGURATION', item }]])
  })

  it('optional column stays hidden when no row carries its data', () => {
    const columns = [
      ...BASE_COLUMNS,
      { key: 'inUse', field: 'referenceCount', label: 'In use', optional: true }
    ]
    const { container, queryByTestId } = renderList({
      columns,
      items: [makeItem({ referenceCount: null })]
    })
    // No header cell for the auto-hidden column, and no in-use cell in the row.
    expect(container.querySelector('.header-row').textContent).not.toContain('In use')
    expect(queryByTestId('version-list-data-view__row-abc123__in-use')).toBeNull()
  })

  it('optional column appears when at least one row carries its data', () => {
    const columns = [
      ...BASE_COLUMNS,
      { key: 'inUse', field: 'referenceCount', label: 'In use', optional: true }
    ]
    const { container, getByTestId } = renderList({
      columns,
      items: [makeItem({ referenceCount: 4 })]
    })
    expect(container.querySelector('.header-row').textContent).toContain('In use')
    expect(getByTestId('version-list-data-view__row-abc123__in-use')).toHaveTextContent('4')
  })

  it('phone viewport: kebab opens the action sheet without a row open', async () => {
    await page.viewport(390, 844)
    const { emitted } = renderList()
    const cardKebab = await vi.waitFor(() => {
      const el = document.querySelector('.card-kebab')
      expect(el).not.toBeNull()
      return el
    })
    await userEvent.click(cardKebab)
    // The bottom sheet opened (its buttons live in <body>)…
    await findInBody('Open configuration')
    // …and the tap did not bubble to the card's row-click (stopPropagation).
    expect(emitted()['row-action']).toBeUndefined()
  })
})
