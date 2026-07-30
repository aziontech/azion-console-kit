import { defineComponent, h, nextTick } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { useFormContext, useFormValues, useIsFormDirty } from 'vee-validate'
import DomainsBlock from '@/views/Workload/FormFields/blocks/domainsBlock.vue'
import { createFormHarness } from '@/tests/kit/vee-validate-setup'

vi.mock('@/services/v2/edge-dns/edge-dns-service', () => ({
  edgeDNSService: {
    listEdgeDNSService: vi.fn().mockResolvedValue({ body: [] })
  }
}))

let probeState

const FormProbe = defineComponent({
  name: 'FormProbe',
  setup() {
    probeState = {
      form: useFormContext(),
      values: useFormValues(),
      isDirty: useIsFormDirty()
    }
    return () => null
  }
})

const FieldTextStub = defineComponent({
  name: 'FieldText',
  props: ['name', 'value'],
  emits: ['blur', 'input'],
  template: '<input @blur="$emit(\'blur\')" />'
})

const FieldDropdownStub = defineComponent({
  name: 'FieldDropdown',
  props: ['name', 'value', 'options'],
  emits: ['blur', 'change'],
  template: '<input @blur="$emit(\'blur\')" />'
})

const editModeInitialValues = () => ({
  domains: [{ subdomain: 'www', domain: 'example.com' }],
  tls: { certificate: 0, ciphers: null, minimumVersion: null },
  infrastructure: '1',
  useCustomDomain: false,
  customDomain: '',
  workloadHostname: 'abc123',
  workloadHostnameAllowAccess: true
})

const mountDomainsBlock = async () => {
  const FormHarness = createFormHarness()

  const wrapper = mount(FormHarness, {
    slots: {
      default: {
        render: () => [h(DomainsBlock, { isEdit: true }), h(FormProbe)]
      }
    },
    global: {
      stubs: {
        FormHorizontal: { template: '<section><slot name="inputs" /></section>' },
        LabelBlock: true,
        InputText: true,
        FieldText: FieldTextStub,
        FieldDropdown: FieldDropdownStub,
        FieldSwitchBlock: true,
        FieldInputGroup: true,
        PrimeButton: true,
        CopyBlock: true
      }
    }
  })

  await flushPromises()

  probeState.form.resetForm({ values: editModeInitialValues() })
  await nextTick()
  probeState.form.resetForm({ values: { ...probeState.values.value } })
  await nextTick()

  return {
    wrapper,
    subdomainField: wrapper.find('[data-testid="domains-form__subdomain-field"]'),
    domainField: wrapper.find('[data-testid="domains-form__domain-dropdown"]')
  }
}

describe('Workload domainsBlock unsaved-changes regression', () => {
  it('does not dirty the form when the domain field is blurred without changes', async () => {
    const { domainField } = await mountDomainsBlock()

    await domainField.trigger('blur')
    await nextTick()

    expect(probeState.values.value.letEncrypt.commonName).toBeUndefined()
    expect(probeState.values.value.letEncrypt.alternativeNames).toBeUndefined()
    expect(probeState.values.value.tls.certificate).toBe(0)
    expect(probeState.isDirty.value).toBe(false)
  })

  it('does not dirty the form when the subdomain field is blurred without changes', async () => {
    const { subdomainField } = await mountDomainsBlock()

    await subdomainField.trigger('blur')
    await nextTick()

    expect(probeState.values.value.letEncrypt.commonName).toBeUndefined()
    expect(probeState.isDirty.value).toBe(false)
  })

  it('still syncs letEncrypt and certificate after the user edits domains', async () => {
    const { domainField } = await mountDomainsBlock()

    probeState.form.setFieldValue('domains', [{ subdomain: 'app', domain: 'changed.com' }])
    await nextTick()

    await domainField.trigger('blur')
    await nextTick()

    expect(probeState.values.value.letEncrypt.commonName).toBe('app.changed.com')
    expect(probeState.values.value.letEncrypt.alternativeNames).toEqual([])
    expect(probeState.values.value.tls.certificate).toBe(1)
    expect(probeState.isDirty.value).toBe(true)
  })
})
