<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
  import FieldText from '@/templates/form-fields-inputs/fieldText'

  import { useField } from 'vee-validate'
  defineOptions({ name: 'form-fields-variables' })

  const { value: key } = useField('key')
  const { value: value } = useField('value')
</script>

<template>
  <FormHorizontal
    title="Variables"
    description="Create environment variables or secrets to use with configured edge functions."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Key *"
          name="key"
          placeholder="VARIABLE_KEY_NAME"
          :value="key"
          description="Give a name or identifier for the variable. Accepts upper-case letters, numbers, and
          underscore."
          data-testid="variables-form__key-field"
        />
      </div>

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Value *"
          name="value"
          placeholder="VARIABLE_VALUE"
          :value="value"
          description="Enter the data associated with the variable key."
          data-testid="variables-form__value-field"
        />
      </div>
      <div class="flex gap-3 items-center">
        <FieldSwitchBlock
          nameField="secret"
          name="secret"
          auto
          :isCard="false"
          title="Secret"
        />
      </div>
    </template>
  </FormHorizontal>
</template>
