import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ReleaseCompositionField from '@/templates/release-composition/components/ReleaseCompositionField.vue'

const applicationOptions = [
  { label: 'app-one', value: 'app-1' },
  { label: 'app-two', value: 'app-2' }
]

const applicationVersions = [
  { label: 'v3 (ready)', value: 'app-ver-3' },
  { label: 'v2', value: 'app-ver-2' }
]

const versionOptions = [
  { label: 'v9 (ready)', value: 'ver-9' },
  { label: 'v8', value: 'ver-8' }
]

const readOnlyResources = [
  {
    resourceType: 'firewall',
    resourceId: 'fw-1',
    resourceName: 'main-firewall',
    resourceVersion: 'v7'
  },
  {
    resourceType: 'function',
    resourceId: 'fn-9',
    resourceName: 'edge-fn',
    resourceVersion: 'v2'
  }
]

const editableResources = [
  {
    key: 'firewall',
    resourceType: 'firewall',
    optional: false,
    versioned: true,
    selectedId: 'fw-2',
    selectedVersionId: 'fw-ver-1',
    options: [{ label: 'fw-two', value: 'fw-2' }],
    versionOptions: [{ label: 'fw-v1', value: 'fw-ver-1' }],
    isLoadingOptions: false,
    isLoadingVersions: false
  },
  {
    key: 'custom_page',
    resourceType: 'custom_page',
    optional: true,
    versioned: false,
    selectedId: null,
    selectedVersionId: null,
    options: [{ label: 'page-one', value: 'page-1' }],
    versionOptions: [],
    isLoadingOptions: false,
    isLoadingVersions: false
  }
]

const makeWrapper = (props = {}) =>
  mount(ReleaseCompositionField, {
    props: {
      deploymentName: 'my-deployment',
      ...props
    }
  })

describe('ReleaseCompositionField', () => {
  it('renders the composition wrapper with the deployment name in the description', () => {
    const wrapper = makeWrapper()

    const root = wrapper.find('[data-testid="release-composition__composition"]')
    expect(root.exists()).toBe(true)
    expect(root.text()).toContain('my-deployment')
  })

  describe('editable Application card (default branch)', () => {
    it('renders the Application card marked Required with the application select', () => {
      const wrapper = makeWrapper({
        applicationOptions,
        selectedApplicationId: 'app-1'
      })

      const card = wrapper.find('[data-testid="release-composition__composition-application"]')
      expect(card.exists()).toBe(true)
      expect(wrapper.find('[data-testid="release-composition__composition-required"]').text()).toBe(
        'Required'
      )
      expect(card.find('[data-testid="release-composition__resource-select"]').exists()).toBe(true)
    })

    it('emits update:selectedApplicationId when the application changes', () => {
      const wrapper = makeWrapper({ applicationOptions })

      wrapper
        .findComponent({ name: 'release-resource-select-field' })
        .vm.$emit('update:modelValue', 'app-2')

      expect(wrapper.emitted('update:selectedApplicationId').at(-1)).toEqual(['app-2'])
    })

    it('emits update:selectedApplicationVersionId when the version changes', () => {
      // hasScopedResource: false drops the top scoped card, leaving the
      // Application card as the only resource-version field.
      const wrapper = makeWrapper({
        hasScopedResource: false,
        applicationOptions,
        applicationVersions,
        selectedApplicationVersionId: 'app-ver-3'
      })

      wrapper
        .findComponent({ name: 'release-resource-version-field' })
        .vm.$emit('update:modelValue', 'app-ver-2')

      expect(wrapper.emitted('update:selectedApplicationVersionId').at(-1)).toEqual(['app-ver-2'])
    })

    it('forwards invalid to the application version field', () => {
      const wrapper = makeWrapper({
        hasScopedResource: false,
        applicationOptions,
        applicationVersions,
        invalid: true
      })

      const field = wrapper.findComponent({ name: 'release-resource-version-field' })
      expect(field.props('invalid')).toBe(true)
      expect(wrapper.find('[data-testid="release-composition__version-error"]').exists()).toBe(true)
    })
  })

  describe('scoped Application branch (isScopedApplication)', () => {
    it('hides the application select and emits update:selectedVersionId from the version field', () => {
      const wrapper = makeWrapper({
        isScopedApplication: true,
        resourceName: 'my-application',
        applicationVersions,
        selectedVersionId: 'app-ver-3'
      })

      const card = wrapper.find('[data-testid="release-composition__composition-application"]')
      expect(card.exists()).toBe(true)
      expect(card.find('[data-testid="release-composition__resource-select"]').exists()).toBe(false)

      wrapper
        .findComponent({ name: 'release-resource-version-field' })
        .vm.$emit('update:modelValue', 'app-ver-2')

      expect(wrapper.emitted('update:selectedVersionId').at(-1)).toEqual(['app-ver-2'])
    })
  })

  describe('read-only Application branch (applicationReadOnly)', () => {
    it('renders the locked application name and resolved version', () => {
      const wrapper = makeWrapper({
        applicationReadOnly: true,
        applicationName: 'pinned-app',
        activeReleaseApplication: { resourceVersion: 'v5' }
      })

      const card = wrapper.find(
        '[data-testid="release-composition__composition-application-readonly"]'
      )
      expect(card.exists()).toBe(true)
      expect(card.text()).toContain('pinned-app')
      expect(card.text()).toContain('v5')
      expect(card.text()).toContain('Read-only')
      expect(
        wrapper.find('[data-testid="release-composition__composition-application"]').exists()
      ).toBe(false)
    })

    it('shows a skeleton while the application name resolves', () => {
      const wrapper = makeWrapper({
        applicationReadOnly: true,
        applicationName: null,
        isResolvingApplicationName: true,
        activeReleaseApplication: { resourceVersion: 'v5' }
      })

      expect(wrapper.findComponent({ name: 'Skeleton' }).exists()).toBe(true)
    })
  })

  describe('no Application branch (noApplication)', () => {
    it('renders the empty-state block and emits create-application', async () => {
      const wrapper = makeWrapper({ noApplication: true })

      const block = wrapper.find('[data-testid="release-composition__composition-no-application"]')
      expect(block.exists()).toBe(true)
      expect(
        wrapper.find('[data-testid="release-composition__composition-application"]').exists()
      ).toBe(false)

      await wrapper.find('[data-testid="release-composition__create-application"]').trigger('click')
      expect(wrapper.emitted('create-application')).toBeTruthy()
    })
  })

  describe('scoped resource card (hasScopedResource && !isScopedApplication)', () => {
    it('renders the scoped resource card with its type label and version field', () => {
      const wrapper = makeWrapper({
        hasScopedResource: true,
        isScopedApplication: false,
        scopedType: 'firewall',
        resourceName: 'main-firewall',
        versionOptions,
        selectedVersionId: 'ver-9'
      })

      const scoped = wrapper.find('[data-testid="release-composition__composition-scoped"]')
      expect(scoped.exists()).toBe(true)
      expect(scoped.text()).toContain('Firewall')

      wrapper
        .findAllComponents({ name: 'release-resource-version-field' })[0]
        .vm.$emit('update:modelValue', 'ver-8')
      expect(wrapper.emitted('update:selectedVersionId').at(-1)).toEqual(['ver-8'])
    })

    it('omits the scoped resource card when the scoped type is the application', () => {
      const wrapper = makeWrapper({
        hasScopedResource: true,
        isScopedApplication: true,
        scopedType: 'application'
      })

      expect(wrapper.find('[data-testid="release-composition__composition-scoped"]').exists()).toBe(
        false
      )
    })
  })

  describe('read-only carried resources (hasScopedResource)', () => {
    it('renders each read-only resource with its label, name and version', () => {
      const wrapper = makeWrapper({ hasScopedResource: true, readOnlyResources })

      const firewall = wrapper.find(
        '[data-testid="release-composition__composition-keep-firewall-fw-1"]'
      )
      expect(firewall.exists()).toBe(true)
      expect(firewall.text()).toContain('Firewall')
      expect(firewall.text()).toContain('main-firewall')
      expect(firewall.text()).toContain('v7')
      expect(firewall.text()).toContain('Read-only')

      const fn = wrapper.find('[data-testid="release-composition__composition-keep-function-fn-9"]')
      expect(fn.exists()).toBe(true)
      expect(fn.text()).toContain('edge-fn')
      expect(fn.text()).toContain('v2')
    })

    it('does not render editable resources when hasScopedResource is true', () => {
      const wrapper = makeWrapper({
        hasScopedResource: true,
        readOnlyResources,
        editableResources
      })

      expect(
        wrapper.find('[data-testid="release-composition__composition-editable-firewall"]').exists()
      ).toBe(false)
    })
  })

  describe('editable resources (!hasScopedResource)', () => {
    it('renders an editable card per resource with select and version fields', () => {
      const wrapper = makeWrapper({ hasScopedResource: false, editableResources })

      const firewall = wrapper.find(
        '[data-testid="release-composition__composition-editable-firewall"]'
      )
      expect(firewall.exists()).toBe(true)
      expect(firewall.find('[data-testid="release-composition__resource-select"]').exists()).toBe(
        true
      )
      // versioned + selectedId != null -> version field present
      expect(firewall.find('[data-testid="release-composition__version-select"]').exists()).toBe(
        true
      )

      const customPage = wrapper.find(
        '[data-testid="release-composition__composition-editable-custom_page"]'
      )
      expect(customPage.exists()).toBe(true)
      expect(
        wrapper.find('[data-testid="release-composition__composition-optional"]').exists()
      ).toBe(true)
    })

    it('emits update:resourceId with the resource key when an editable selection changes', () => {
      const wrapper = makeWrapper({
        noApplication: true,
        hasScopedResource: false,
        editableResources
      })

      // noApplication drops the Application select, so the first select field
      // is the editable firewall resource.
      wrapper
        .findAllComponents({ name: 'release-resource-select-field' })[0]
        .vm.$emit('update:modelValue', 'fw-3')

      expect(wrapper.emitted('update:resourceId').at(-1)).toEqual([
        { key: 'firewall', value: 'fw-3' }
      ])
    })

    it('emits update:resourceVersion with the resource key when an editable version changes', () => {
      const wrapper = makeWrapper({
        noApplication: true,
        hasScopedResource: false,
        editableResources
      })

      // noApplication drops the Application card, so the first version field is
      // the editable firewall resource (versioned with a selected id).
      wrapper
        .findAllComponents({ name: 'release-resource-version-field' })[0]
        .vm.$emit('update:modelValue', 'fw-ver-2')

      expect(wrapper.emitted('update:resourceVersion').at(-1)).toEqual([
        { key: 'firewall', value: 'fw-ver-2' }
      ])
    })
  })
})
