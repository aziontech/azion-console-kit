<script setup>
  import { computed } from 'vue'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldSwitchBlock from '@aziontech/webkit/field-switch-block'
  import FieldText from '@aziontech/webkit/field-text'
  import InlineMessage from '@aziontech/webkit/inlinemessage'
  import { useField } from 'vee-validate'

  defineOptions({ name: 'form-fields-variables-v6' })

  const props = defineProps({
    secretLocked: {
      type: Boolean,
      default: false
    }
  })

  const { value: key } = useField('key')
  const { value: value } = useField('value')
  const { value: secret } = useField('secret')

  const isSecret = computed(() => secret.value === true)

  const valuePlaceholder = computed(() =>
    isSecret.value ? 'Enter a new value to replace the secret' : 'VARIABLE_VALUE'
  )

  const valueDescription = computed(() =>
    isSecret.value
      ? 'Secret values are write-only. Leave it empty to keep the stored value.'
      : 'Enter the data associated with the variable key.'
  )

  const secretHelperText = computed(() =>
    props.secretLocked
      ? 'A variable saved as a secret cannot have this behavior changed. This action is irreversible.'
      : 'Once a variable is saved as a secret, its behavior cannot be edited.'
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
        sensitive
      />

      <FieldText
        label="Value"
        :required="!secretLocked"
        name="value"
        :placeholder="valuePlaceholder"
        :value="value"
        :description="valueDescription"
        data-testid="variables-form__value-field"
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
            :disabled="secretLocked"
            data-testid="variables-form__secret-field"
          />
        </div>
        <InlineMessage
          severity="info"
          class="w-fit"
        >
          {{ secretHelperText }}
        </InlineMessage>
      </div>
    </template>
  </FormHorizontal>
</template>
