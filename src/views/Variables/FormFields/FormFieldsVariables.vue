<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldSwitchBlock from '@aziontech/webkit/field-switch-block'
  import FieldText from '@aziontech/webkit/field-text'
  import InlineMessage from '@aziontech/webkit/inlinemessage'

  import { computed } from 'vue'
  import { useField } from 'vee-validate'

  defineOptions({ name: 'form-fields-variables' })

  const props = defineProps({
    secretChangeValueOnly: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    }
  })

  const { value: key } = useField('key')
  const { value: value } = useField('value')

  const valueDescription = computed(() =>
    props.secretChangeValueOnly
      ? 'Enter a new value for this secret. The current secret value is not exposed.'
      : 'Enter the data associated with the variable key.'
  )
</script>

<template>
  <FormHorizontal
    title="Variables"
    description="Create environment variables or secrets to use with configured Functions."
  >
    <template #inputs>
      <FieldText
        label="Key"
        required
        name="key"
        placeholder="VARIABLE_KEY_NAME"
        :value="key"
        description="Give a name or identifier for the variable. Accepts upper-case letters, numbers, and
        underscore."
        data-testid="variables-form__key-field"
        :disabled="disabled || secretChangeValueOnly"
        sensitive
      />

      <FieldText
        label="Value"
        required
        name="value"
        :placeholder="secretChangeValueOnly ? 'NEW_SECRET_VALUE' : 'VARIABLE_VALUE'"
        :value="value"
        :description="valueDescription"
        data-testid="variables-form__value-field"
        :disabled="disabled"
        sensitive
      />
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <div class="flex items-center">
          <FieldSwitchBlock
            nameField="secret"
            name="secret"
            auto
            :isCard="false"
            title="Secret"
            :disabled="disabled || secretChangeValueOnly"
            data-testid="variables-form__secret-field"
          />
        </div>
        <InlineMessage
          severity="info"
          class="w-fit"
        >
          Once a variable is saved as a secret, its behavior cannot be edited.
        </InlineMessage>
      </div>
    </template>
  </FormHorizontal>
</template>
