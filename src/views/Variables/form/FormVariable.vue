<script setup>
  import FormHorizontal from '@/templates/create-form-block-new/form-horizontal'
  import InputSwitch from 'primevue/inputswitch'
  import InputText from 'primevue/inputtext'
  import { useField } from 'vee-validate'

  const { value: key, errorMessage: keyError } = useField('key')
  const { value: value, errorMessage: valueError } = useField('value')
  const { value: secret } = useField('secret')
</script>

<template>
  <FormHorizontal
    title="Variables"
    description="Create environment variables or secrets to use with configured edge functions."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="key"
          class="text-color text-base font-medium"
          >Key *
        </label>
        <InputText
          placeholder="GITHUB_API_KEY"
          v-model="key"
          type="text"
          id="key"
          :class="{ 'p-invalid': keyError }"
        />
        <small
          v-if="keyError"
          class="p-error text-xs font-normal leading-tight"
        >
          {{ keyError }}
        </small>
      </div>

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="value"
          class="text-color text-base font-medium"
        >
          Value *
        </label>
        <InputText
          placeholder="MY_GITHUB_API_VALUE"
          v-model="value"
          id="value"
          type="text"
          :class="{ 'p-invalid': valueError }"
        />
        <small
          v-if="valueError"
          class="p-error text-xs font-normal leading-tight"
          >{{ valueError }}</small
        >
      </div>
      <div class="flex gap-3 items-center">
        <InputSwitch
          id="secret"
          v-model="secret"
        />
        <label for="secret">Secret</label>
      </div>
    </template>
  </FormHorizontal>
</template>
