import { defineComponent, h } from 'vue'
import { Form as VeeForm, Field as VeeField } from 'vee-validate'

export const createFormHarness = ({ schema, initialValues = {}, onSubmit = () => {} } = {}) =>
  defineComponent({
    components: { VeeForm, VeeField },
    setup(_props, { slots }) {
      return () =>
        h(
          VeeForm,
          {
            validationSchema: schema,
            initialValues,
            onSubmit
          },
          {
            default: slots.default ?? (() => null)
          }
        )
    }
  })
