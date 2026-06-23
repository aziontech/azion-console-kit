import { defineComponent, h, ref } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import FormFieldsEditNetworkLists from '@/views/NetworkLists/FormFields/FormFieldsEditNetworkLists.vue'
import { VERSION_CONTEXT_KEY } from '@/composables/versioning/use-version-context'
import { createFormHarness } from '@/tests/kit/vee-validate-setup'

// Task 6.3 (Property P6): the Network List form honors read-only in immutable
// version states (:disabled from useVersionContext().readOnly), and stays
// editable for the non-versioned create/edit forms (default readOnly=false).

const NAME_FIELD = 'network-list-form__name'
const ASN_FIELD = 'network-list-form__asn-list'
const IPCIDR_FIELD = 'network-list-form__ipcidr-list'
const COUNTRIES_FIELD = 'network-list-form__countries__multiselect'

// Stubs surface the resolved `disabled` so we assert the read-only contract
// without the real webkit stack. The blocks pass data-testid through.
const FieldTextStub = defineComponent({
  props: { name: String, disabled: Boolean },
  template: '<input :data-disabled="String(disabled)" />'
})
const FieldTextAreaStub = defineComponent({
  props: { name: String, disabled: Boolean },
  template: '<textarea :data-disabled="String(disabled)" />'
})
const FieldGroupRadioStub = defineComponent({
  props: { nameField: String, disabled: Boolean },
  template: '<div :data-disabled="String(disabled)" />'
})
const MultiSelectStub = defineComponent({
  props: { name: String, disabled: Boolean, options: Array, modelValue: null },
  template: '<div :data-disabled="String(disabled)" />'
})

const disabledOf = (wrapper, testid) =>
  wrapper.get(`[data-testid="${testid}"]`).attributes('data-disabled')

const listCountriesService = () => Promise.resolve([{ name: 'Brazil', value: 'BR' }])

const mountForm = async ({ networkListType, readOnly }) => {
  const FormHarness = createFormHarness({ initialValues: { networkListType } })

  const wrapper = mount(FormHarness, {
    slots: {
      default: { render: () => h(FormFieldsEditNetworkLists, { listCountriesService }) }
    },
    global: {
      provide: { [VERSION_CONTEXT_KEY]: { readOnly: ref(readOnly) } },
      stubs: {
        FormHorizontal: { template: '<section><slot name="inputs" /></section>' },
        LabelBlock: { template: '<label />' },
        PrimeTag: { template: '<span />' },
        FieldText: FieldTextStub,
        FieldTextArea: FieldTextAreaStub,
        FieldGroupRadio: FieldGroupRadioStub,
        MultiSelect: MultiSelectStub
      }
    }
  })
  await flushPromises()
  return wrapper
}

describe('NetworkLists v6 — read-only in immutable state', () => {
  it('keeps fields editable in a draft (asn)', async () => {
    const wrapper = await mountForm({ networkListType: 'asn', readOnly: false })
    expect(disabledOf(wrapper, NAME_FIELD)).toBe('false')
    expect(disabledOf(wrapper, ASN_FIELD)).toBe('false')
  })

  it('disables fields in an immutable version (asn)', async () => {
    const wrapper = await mountForm({ networkListType: 'asn', readOnly: true })
    expect(disabledOf(wrapper, NAME_FIELD)).toBe('true')
    expect(disabledOf(wrapper, ASN_FIELD)).toBe('true')
  })

  it('disables the ip/cidr list in an immutable version', async () => {
    const wrapper = await mountForm({ networkListType: 'ip_cidr', readOnly: true })
    expect(disabledOf(wrapper, IPCIDR_FIELD)).toBe('true')
  })

  it('disables the countries selector in an immutable version', async () => {
    const wrapper = await mountForm({ networkListType: 'countries', readOnly: true })
    expect(disabledOf(wrapper, COUNTRIES_FIELD)).toBe('true')
  })

  it('reacts when the version context toggles to immutable', async () => {
    const readOnly = ref(false)
    const FormHarness = createFormHarness({ initialValues: { networkListType: 'asn' } })
    const wrapper = mount(FormHarness, {
      slots: {
        default: { render: () => h(FormFieldsEditNetworkLists, { listCountriesService }) }
      },
      global: {
        provide: { [VERSION_CONTEXT_KEY]: { readOnly } },
        stubs: {
          FormHorizontal: { template: '<section><slot name="inputs" /></section>' },
          LabelBlock: { template: '<label />' },
          PrimeTag: { template: '<span />' },
          FieldText: FieldTextStub,
          FieldTextArea: FieldTextAreaStub,
          FieldGroupRadio: FieldGroupRadioStub,
          MultiSelect: MultiSelectStub
        }
      }
    })
    await flushPromises()
    expect(disabledOf(wrapper, NAME_FIELD)).toBe('false')
    readOnly.value = true
    await wrapper.vm.$nextTick()
    expect(disabledOf(wrapper, NAME_FIELD)).toBe('true')
  })
})
