/**
 * Wave 1 — Bug 4 layout integration test.
 *
 * Asserts the post-fix shape of `discover-toolbar.vue`:
 *   - search wrapper uses BEM class `discover-toolbar__search`
 *   - search input uses BEM class `discover-toolbar__search-input` with NO
 *     `width: clamp(...)` inline rule. Instead the SFC `<style>` block must
 *     define `.discover-toolbar__search-input { width: 100%; max-width: 14rem; }`.
 *   - `.discover-toolbar__right` uses `flex-shrink: 1` post-fix (today it's `0`).
 *
 * Event-emission assertions (`update:documentSearchQuery`) are preservation
 * guarantees — they should PASS today and continue to PASS post-fix.
 *
 * CSS-rule assertions read the SFC source file directly via fs because
 * JSDOM does not compute scoped CSS, and the scoped `<style>` block carries
 * the layout rules we need to validate.
 */
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import DiscoverToolbar from '../discover-toolbar.vue'

vi.mock('@/helpers', () => ({
  eventsPlaygroundOpener: vi.fn()
}))

const PrimeButtonStub = {
  name: 'PrimeButton',
  props: ['icon', 'label', 'text', 'size', 'severity', 'outlined'],
  emits: ['click'],
  template:
    '<button :class="$attrs.class" :data-icon="icon" @click="$emit(\'click\', $event)"><slot /></button>',
  inheritAttrs: false
}

const InputTextStub = {
  name: 'InputText',
  props: ['modelValue', 'placeholder'],
  emits: ['update:modelValue'],
  template:
    '<input :class="$attrs.class" :placeholder="placeholder" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  inheritAttrs: false
}

const DropdownStub = {
  name: 'Dropdown',
  props: ['modelValue', 'options', 'optionLabel', 'optionValue'],
  emits: ['update:modelValue'],
  template: '<div class="dropdown-stub" />',
  inheritAttrs: false
}

const MenuStub = {
  name: 'Menu',
  props: ['model', 'popup'],
  template: '<div class="menu-stub" />',
  methods: { toggle() {} },
  inheritAttrs: false
}

const mountComponent = (props = {}) =>
  mount(DiscoverToolbar, {
    props: {
      sidebarVisible: true,
      recordsFound: '',
      documentSearchQuery: '',
      detailViewMode: 'inline',
      isFullscreen: false,
      pageSize: 50,
      pageSizeOptions: [
        { label: '50', value: 50 },
        { label: '100', value: 100 }
      ],
      exportMenuItems: [],
      ...props
    },
    global: {
      stubs: {
        PrimeButton: PrimeButtonStub,
        InputText: InputTextStub,
        Dropdown: DropdownStub,
        Menu: MenuStub
      },
      directives: { tooltip: {} }
    }
  })

const readToolbarSource = () =>
  readFileSync(
    resolve(__dirname, '..', 'discover-toolbar.vue'),
    'utf8'
  )

describe('DiscoverToolbar — layout (Bug 4)', () => {
  describe('structural classes', () => {
    it('renders the search wrapper with `discover-toolbar__search`', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('.discover-toolbar__search').exists()).toBe(true)
    })

    it('renders the search input with `discover-toolbar__search-input`', () => {
      const wrapper = mountComponent()
      const input = wrapper.find('.discover-toolbar__search-input')
      expect(input.exists()).toBe(true)
    })
  })

  describe('CSS rules in scoped <style> block', () => {
    it('search input must use `width: 100%` and `max-width: 14rem` (no `clamp(...)`)', () => {
      const src = readToolbarSource()

      // Isolate the `.discover-toolbar__search-input` base rule (not the
      // media-query override) to validate the post-fix CSS.
      const baseRuleMatch = src.match(
        /\.discover-toolbar__search-input\s*\{([^}]*)\}/
      )
      expect(baseRuleMatch).not.toBeNull()
      const body = baseRuleMatch[1]

      // POST-FIX expectations:
      expect(body).toMatch(/width:\s*100%/)
      expect(body).toMatch(/max-width:\s*14rem/)

      // No clamp() in the base rule — that is the pre-fix shape we're
      // removing.
      expect(body).not.toMatch(/width:\s*clamp\(/)
    })

    it('`.discover-toolbar__right` must use `flex-shrink: 1` post-fix', () => {
      const src = readToolbarSource()
      const rightRuleMatch = src.match(
        /\.discover-toolbar__right\s*\{([^}]*)\}/
      )
      expect(rightRuleMatch).not.toBeNull()
      const body = rightRuleMatch[1]

      expect(body).toMatch(/flex-shrink:\s*1\b/)
      // Make sure the pre-fix value is gone.
      expect(body).not.toMatch(/flex-shrink:\s*0\b/)
    })
  })

  describe('preservation: event-emission contract', () => {
    it('typing in the search input emits `update:documentSearchQuery` with the typed value', async () => {
      const wrapper = mountComponent()
      const input = wrapper.find('.discover-toolbar__search-input')
      expect(input.exists()).toBe(true)

      await input.setValue('hello world')

      const emitted = wrapper.emitted('update:documentSearchQuery')
      expect(emitted).toBeTruthy()
      expect(emitted.at(-1)).toEqual(['hello world'])
    })

    it('clicking the `pi pi-times` clear button emits `update:documentSearchQuery` with `\'\'`', async () => {
      const wrapper = mountComponent({ documentSearchQuery: 'existing-query' })

      // The clear button is the PrimeButton that contains a child icon span
      // with classes "pi pi-times". JSDOM renders the full PrimeVue button
      // tree, so we locate the icon span and click its closest <button>.
      const timesIcon = wrapper.find('.pi.pi-times')
      expect(timesIcon.exists(), 'clear icon (.pi.pi-times) should be rendered when query is non-empty').toBe(true)

      const clearBtn = timesIcon.element.closest('button')
      expect(clearBtn, 'clear icon should be inside a <button>').toBeTruthy()

      clearBtn.dispatchEvent(new Event('click', { bubbles: true }))
      await wrapper.vm.$nextTick()

      const emitted = wrapper.emitted('update:documentSearchQuery')
      expect(emitted).toBeTruthy()
      expect(emitted.at(-1)).toEqual([''])
    })
  })
})
