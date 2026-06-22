import { defineComponent, h, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

import GeneralBlock from '@/views/EdgeConnectors/FormFields/blocks/General.vue'
import StatusBlock from '@/views/EdgeConnectors/FormFields/blocks/Status.vue'
import ConnectorTypeBlock from '@/views/EdgeConnectors/FormFields/blocks/ConnectorType.vue'
import { VERSION_CONTEXT_KEY } from '@/composables/versioning/use-version-context'
import { createFormHarness } from '@/tests/kit/vee-validate-setup'

// Task 11.4 (optional): Connector v6 across the 3 connector types
// (HTTP / Storage / LiveIngest). Verifies the framework contract a new resource
// must honor: read-only in immutable states, state-eligible row actions, and a
// thin version adapter.

// ConnectorType reads the route to lock the type selector on edit screens; a
// version is always an edit context, so stub it deterministically.
vi.mock('vue-router', () => ({
  useRoute: () => ({ name: 'edit-connectors-version', path: '/connectors/edit/1/versions/2' })
}))

const CONNECTOR_TYPES = ['http', 'storage', 'live_ingest']

const NAME_FIELD = 'edge-connectors-form__general__name-field'
const ACTIVE_FIELD = 'edge-connectors-form__status__active-field'
const TYPE_FIELD = 'edge-connectors-form__connector-type__type-field'

// Lightweight stubs that surface the resolved `disabled` so we can assert the
// read-only contract without pulling the real webkit stack. The real block
// passes data-testid through, so we read by the block's own testid.
const FieldTextStub = defineComponent({
  props: { name: String, disabled: Boolean },
  template: '<input :data-disabled="String(disabled)" />'
})
const FieldSwitchBlockStub = defineComponent({
  props: { name: String, disabled: Boolean },
  template: '<button :data-disabled="String(disabled)" />'
})
const FieldGroupRadioStub = defineComponent({
  props: { nameField: String, disabled: Boolean },
  template: '<div :data-disabled="String(disabled)" />'
})

const disabledOf = (wrapper, testid) =>
  wrapper.get(`[data-testid="${testid}"]`).attributes('data-disabled')

const mountBlocks = ({ type, readOnly }) => {
  const FormHarness = createFormHarness({
    initialValues: { name: 'conn', active: true, type }
  })

  return mount(FormHarness, {
    slots: {
      default: {
        render: () => [h(GeneralBlock), h(StatusBlock), h(ConnectorTypeBlock)]
      }
    },
    global: {
      provide: { [VERSION_CONTEXT_KEY]: { readOnly: ref(readOnly) } },
      stubs: {
        FormHorizontal: { template: '<section><slot name="inputs" /></section>' },
        FieldText: FieldTextStub,
        FieldSwitchBlock: FieldSwitchBlockStub,
        FieldGroupRadio: FieldGroupRadioStub
      }
    }
  })
}

describe('EdgeConnectors v6 — read-only in immutable state (3 types)', () => {
  it.each(CONNECTOR_TYPES)('keeps form fields editable in a draft (type=%s)', (type) => {
    const wrapper = mountBlocks({ type, readOnly: false })
    expect(disabledOf(wrapper, NAME_FIELD)).toBe('false')
    expect(disabledOf(wrapper, ACTIVE_FIELD)).toBe('false')
  })

  it.each(CONNECTOR_TYPES)('disables form fields in an immutable version (type=%s)', (type) => {
    const wrapper = mountBlocks({ type, readOnly: true })
    expect(disabledOf(wrapper, NAME_FIELD)).toBe('true')
    expect(disabledOf(wrapper, ACTIVE_FIELD)).toBe('true')
    // The connector type selector is locked in any version (edit route) too.
    expect(disabledOf(wrapper, TYPE_FIELD)).toBe('true')
  })

  it('reacts when the version context toggles to immutable', async () => {
    const readOnly = ref(false)
    const FormHarness = createFormHarness({ initialValues: { name: 'conn' } })
    const wrapper = mount(FormHarness, {
      slots: { default: { render: () => h(GeneralBlock) } },
      global: {
        provide: { [VERSION_CONTEXT_KEY]: { readOnly } },
        stubs: {
          FormHorizontal: { template: '<section><slot name="inputs" /></section>' },
          FieldText: FieldTextStub
        }
      }
    })
    expect(disabledOf(wrapper, NAME_FIELD)).toBe('false')
    readOnly.value = true
    await wrapper.vm.$nextTick()
    expect(disabledOf(wrapper, NAME_FIELD)).toBe('true')
  })
})

// The legacy Clone/Build row-eligibility suite (getRowActions) was retired in
// Phase 4 (task 9.1). The fixed 5-item row menu is now covered by
// `src/tests/composables/versioning/version-menu-items.test.js` (Properties P1–P4),
// and Clone as Draft / Build remain available in the shell action bar.

describe('EdgeConnectors v6 — thin version adapter', () => {
  const __dirname = dirname(fileURLToPath(import.meta.url))
  const adapterPath = resolve(
    __dirname,
    '../../../../views/EdgeConnectors/v6/EdgeConnectorVersionAdapter.vue'
  )
  const source = readFileSync(adapterPath, 'utf-8')

  it('is <= 35 lines', () => {
    const lines = source.replace(/\n$/, '').split('\n')
    expect(lines.length).toBeLessThanOrEqual(35)
  })

  it('renders only a passthrough <slot /> (no inline form markup)', () => {
    const template = source.match(/<template>([\s\S]*?)<\/template>/)?.[1] ?? ''
    expect(template.trim()).toBe('<slot />')
  })

  it('delegates the lifecycle to useVersionFormAdapter with the shared specializations', () => {
    expect(source).toContain('useVersionFormAdapter')
    expect(source).toContain('edgeConnectorVersionService')
    expect(source).toContain('validationSchema')
    expect(source).toContain('defaultSaveStrategy')
  })

  it('registers no lifecycle handlers inline (the bus wiring lives in the composable)', () => {
    expect(source).not.toMatch(/onVersionCommand/)
    expect(source).not.toMatch(/SAVE_AND_BUILD/)
    expect(source).not.toMatch(/NEW_DRAFT_FROM/)
  })
})
