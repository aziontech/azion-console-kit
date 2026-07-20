import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import FormFieldsVariables from '@/views/Variables/FormFields/FormFieldsVariables.vue'
import { createFormHarness } from '@/tests/kit/vee-validate-setup'

const FieldTextStub = defineComponent({
  props: {
    name: String,
    disabled: Boolean,
    placeholder: String,
    description: String
  },
  template: `
    <input
      :data-testid="name"
      :data-disabled="String(disabled)"
      :placeholder="placeholder"
      :data-description="description"
    />
  `
})

const FieldSwitchBlockStub = defineComponent({
  props: {
    name: String,
    disabled: Boolean
  },
  template: '<button :data-testid="name" :data-disabled="String(disabled)" />'
})

const mountFormFields = ({ initialValues, secretChangeValueOnly, disabled = false }) => {
  const FormHarness = createFormHarness({ initialValues })

  return mount(FormHarness, {
    slots: {
      default: {
        render: () =>
          h(FormFieldsVariables, {
            disabled,
            secretChangeValueOnly
          })
      }
    },
    global: {
      stubs: {
        FormHorizontal: {
          template: '<section><slot name="inputs" /></section>'
        },
        FieldText: FieldTextStub,
        FieldSwitchBlock: FieldSwitchBlockStub,
        InlineMessage: {
          template: '<div><slot /></div>'
        }
      }
    }
  })
}

describe('FormFieldsVariables', () => {
  // The V6 rework dropped the secret/loading field-lock from this component (its
  // parents no longer pass `disabled`/`secretChangeValueOnly`), so no field is
  // ever disabled here and the value placeholder is static.
  it('renders key, value and secret fields without locking any of them', () => {
    const wrapper = mountFormFields({
      initialValues: { key: 'SECRET_KEY', value: '', secret: true }
    })

    expect(
      wrapper.get('[data-testid="variables-form__key-field"]').attributes('data-disabled')
    ).toBe('false')
    expect(
      wrapper.get('[data-testid="variables-form__value-field"]').attributes('data-disabled')
    ).toBe('false')
    expect(
      wrapper.get('[data-testid="variables-form__secret-field"]').attributes('data-disabled')
    ).toBe('false')
  })

  it('uses the static value placeholder (no NEW_SECRET_VALUE special-casing)', () => {
    const wrapper = mountFormFields({
      initialValues: { key: 'VARIABLE_KEY', value: 'value', secret: true }
    })

    expect(
      wrapper.get('[data-testid="variables-form__value-field"]').attributes('placeholder')
    ).toBe('VARIABLE_VALUE')
  })
})
