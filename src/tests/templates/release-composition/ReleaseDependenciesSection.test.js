import { describe, it, expect } from 'vitest'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'

import ReleaseDependenciesSection from '@/templates/release-composition/components/ReleaseDependenciesSection.vue'

const ResourceVersionFieldStub = defineComponent({
  name: 'release-resource-version-field',
  props: {
    modelValue: { type: String, default: null },
    versions: { type: Array, default: () => [] },
    showResource: { type: Boolean, default: true },
    label: { type: String, default: '' },
    required: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false }
  },
  emits: ['update:modelValue'],
  template: `
    <button
      class="version-field-stub"
      :data-required="required"
      :data-disabled="disabled"
      @click="$emit('update:modelValue', 'V-PICKED')"
    >version</button>
  `
})

const ResourceSelectFieldStub = defineComponent({
  name: 'release-resource-select-field',
  props: {
    modelValue: { type: [String, Number], default: null },
    options: { type: Array, default: () => [] },
    label: { type: String, default: '' },
    required: { type: Boolean, default: false },
    placeholder: { type: String, default: '' }
  },
  emits: ['update:modelValue'],
  template: `<div class="resource-select-stub" />`
})

const PrimeButtonStub = defineComponent({
  name: 'PrimeButton',
  props: ['label', 'icon', 'severity', 'outlined', 'text', 'size', 'ariaLabel'],
  emits: ['click'],
  template: `<button class="prime-button-stub" @click="$emit('click')">{{ label }}</button>`
})

const GLOBAL_STUBS = {
  ResourceVersionField: ResourceVersionFieldStub,
  ResourceSelectField: ResourceSelectFieldStub,
  PrimeButton: PrimeButtonStub
}

const READY_VERSION = {
  value: 'V-7f3a',
  label: '7f3a',
  createdAt: '2026-06-29T10:00:00Z',
  author: 'jane.doe',
  isCurrent: true
}

const makeLockedFunctionsCollection = (instances) => ({
  type: 'functions',
  label: 'Functions',
  icon: 'pi pi-bolt',
  count: instances.length,
  open: true,
  instances
})

const makeEditableConnectorsCollection = (instances) => ({
  type: 'connectors',
  label: 'Edge Connectors',
  icon: 'pi pi-link',
  count: instances.length,
  open: true,
  instances
})

const mountSection = (collections) =>
  mount(ReleaseDependenciesSection, {
    props: { collections },
    global: { stubs: GLOBAL_STUBS }
  })

describe('ReleaseDependenciesSection', () => {
  describe('locked + required Functions collection (req 3.1, 3.4)', () => {
    const lockedInstances = [
      {
        id: 'fn-1',
        resourceId: 11,
        name: 'image-resizer',
        options: [],
        version: 'V-7f3a',
        versionOptions: [READY_VERSION],
        locked: true,
        required: true
      },
      {
        id: 'fn-2',
        resourceId: 22,
        name: 'auth-gate',
        options: [],
        version: null,
        versionOptions: [READY_VERSION],
        locked: true,
        required: true
      },
      {
        id: 'fn-3',
        resourceId: 33,
        name: 'geo-router',
        options: [],
        version: 'V-7f3a',
        versionOptions: [READY_VERSION],
        locked: true,
        required: true
      }
    ]

    it('should render one fixed-label row per locked instance showing the function name', () => {
      const wrapper = mountSection([makeLockedFunctionsCollection(lockedInstances)])

      const fixedRows = wrapper.findAll(
        '[data-testid^="release-composition__deps-fixed-functions-"]'
      )

      expect(fixedRows).toHaveLength(lockedInstances.length)
      expect(fixedRows[0].text()).toContain('image-resizer')
      expect(fixedRows[1].text()).toContain('auth-gate')
      expect(fixedRows[2].text()).toContain('geo-router')
    })

    it('should render the fixed label using the per-instance testid', () => {
      const wrapper = mountSection([makeLockedFunctionsCollection(lockedInstances)])

      expect(
        wrapper.find('[data-testid="release-composition__deps-fixed-functions-fn-1"]').exists()
      ).toBe(true)
      expect(
        wrapper.find('[data-testid="release-composition__deps-fixed-functions-fn-2"]').exists()
      ).toBe(true)
    })

    it('should NOT render a resource dropdown on locked rows', () => {
      const wrapper = mountSection([makeLockedFunctionsCollection(lockedInstances)])

      expect(wrapper.findAllComponents(ResourceSelectFieldStub)).toHaveLength(0)
    })

    it('should NOT render per-row remove buttons on locked rows', () => {
      const wrapper = mountSection([makeLockedFunctionsCollection(lockedInstances)])

      expect(
        wrapper.findAll('[data-testid^="release-composition__deps-remove-functions-"]')
      ).toHaveLength(0)
    })

    it('should NOT render the group Add button when every instance is locked', () => {
      const wrapper = mountSection([makeLockedFunctionsCollection(lockedInstances)])

      expect(wrapper.find('[data-testid="release-composition__deps-add-functions"]').exists()).toBe(
        false
      )
    })

    it('should pass required = true to the version field of locked+required rows', () => {
      const wrapper = mountSection([makeLockedFunctionsCollection(lockedInstances)])

      const versionFields = wrapper.findAllComponents(ResourceVersionFieldStub)

      expect(versionFields).toHaveLength(lockedInstances.length)
      versionFields.forEach((field) => {
        expect(field.props('required')).toBe(true)
      })
    })

    it('should emit update:instance-version with the type, instance id and chosen value', async () => {
      const wrapper = mountSection([makeLockedFunctionsCollection(lockedInstances)])

      const secondVersionField = wrapper.findAllComponents(ResourceVersionFieldStub)[1]
      await secondVersionField.trigger('click')

      const emitted = wrapper.emitted('update:instance-version')
      expect(emitted).toHaveLength(1)
      expect(emitted[0][0]).toEqual({
        type: 'functions',
        id: 'fn-2',
        value: 'V-PICKED'
      })
    })
  })

  describe('required instance with no selectable versions (req 5.x render)', () => {
    const noVersionsCollection = makeLockedFunctionsCollection([
      {
        id: 'fn-blocked',
        resourceId: 99,
        name: 'broken-fn',
        options: [],
        version: null,
        versionOptions: [],
        locked: true,
        required: true
      }
    ])

    it('should disable the version selector when required and versionOptions is empty', () => {
      const wrapper = mountSection([noVersionsCollection])

      const versionField = wrapper.findComponent(ResourceVersionFieldStub)
      expect(versionField.props('required')).toBe(true)
      expect(versionField.props('disabled')).toBe(true)
    })

    it('should render the no-versions hint for the blocked instance', () => {
      const wrapper = mountSection([noVersionsCollection])

      expect(
        wrapper
          .find('[data-testid="release-composition__deps-no-versions-functions-fn-blocked"]')
          .exists()
      ).toBe(true)
    })

    it('should NOT render the no-versions hint when versions are available', () => {
      const wrapper = mountSection([
        makeLockedFunctionsCollection([
          {
            id: 'fn-ok',
            resourceId: 1,
            name: 'ok-fn',
            options: [],
            version: 'V-7f3a',
            versionOptions: [READY_VERSION],
            locked: true,
            required: true
          }
        ])
      ])

      expect(
        wrapper.find('[data-testid^="release-composition__deps-no-versions-functions-"]').exists()
      ).toBe(false)
    })
  })

  describe('non-locked collection — granular behavior (proves locked is per-instance)', () => {
    const editableCollection = makeEditableConnectorsCollection([
      {
        id: 'conn-1',
        resourceId: 5,
        name: 'origin-connector',
        options: [{ value: 5, label: 'origin-connector' }],
        version: 'V-7f3a',
        versionOptions: [READY_VERSION],
        locked: false,
        required: false
      }
    ])

    it('should render the resource dropdown for editable instances', () => {
      const wrapper = mountSection([editableCollection])

      expect(wrapper.findAllComponents(ResourceSelectFieldStub)).toHaveLength(1)
      expect(
        wrapper.find('[data-testid="release-composition__deps-fixed-connectors-conn-1"]').exists()
      ).toBe(false)
    })

    it('should render the per-row remove button for editable instances', () => {
      const wrapper = mountSection([editableCollection])

      expect(
        wrapper.find('[data-testid="release-composition__deps-remove-connectors-conn-1"]').exists()
      ).toBe(true)
    })

    it('should never render the group Add button (instances are seeded automatically)', () => {
      const wrapper = mountSection([editableCollection])

      expect(
        wrapper.find('[data-testid="release-composition__deps-add-connectors"]').exists()
      ).toBe(false)
    })

    it('should pass required = false to the version field of an editable, non-required instance', () => {
      const wrapper = mountSection([editableCollection])

      const versionField = wrapper.findComponent(ResourceVersionFieldStub)
      expect(versionField.props('required')).toBe(false)
      expect(versionField.props('disabled')).toBe(false)
    })

    it('should keep locked and editable rows independent within a single render', () => {
      const mixedFunctions = makeLockedFunctionsCollection([
        {
          id: 'fn-locked',
          resourceId: 7,
          name: 'managed-fn',
          options: [],
          version: 'V-7f3a',
          versionOptions: [READY_VERSION],
          locked: true,
          required: true
        }
      ])

      const wrapper = mountSection([mixedFunctions, editableCollection])

      expect(
        wrapper.find('[data-testid="release-composition__deps-fixed-functions-fn-locked"]').exists()
      ).toBe(true)
      expect(wrapper.find('[data-testid="release-composition__deps-add-functions"]').exists()).toBe(
        false
      )

      expect(wrapper.findAllComponents(ResourceSelectFieldStub)).toHaveLength(1)
      expect(
        wrapper.find('[data-testid="release-composition__deps-add-connectors"]').exists()
      ).toBe(false)
    })
  })
})
