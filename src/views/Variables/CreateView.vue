<template>
  <CreateFormBlock
    pageTitle="Create Variables"
    :createService="props.createVariablesService"
    :formData="values"
    :isValid="meta.valid"
    :cleanFormCallback="resetForm"
  >
    <template #form>
      <InputText
        placeholder="ex: GITHUB_API_KEY"
        v-bind="key"
        type="text"
        :class="{ 'p-invalid': errors.key }"
        v-tooltip.top="errors.key"
      />
      <InputText
        placeholder="ex: MY_GITHUB_API_VALUE"
        v-bind="value"
        type="text"
        :class="{ 'p-invalid': errors.value }"
        v-tooltip.top="errors.value"
      />
      <div class="flex gap-3 items-center">
        <label for="">Secret</label>
        <InputSwitch
          v-bind="secret"
          v-model="secret.value"
          :class="{ 'p-invalid': errors.secret }"
        />
      </div>
    </template>
  </CreateFormBlock>
</template>

<script setup>
  import CreateFormBlock from '@/templates/create-form-block'
  import InputText from 'primevue/inputtext'
  import InputSwitch from 'primevue/inputswitch'
  import { useForm } from 'vee-validate'
  import * as yup from 'yup'

  const props = defineProps({
    createVariablesService: {
      type: Function,
      required: true
    }
  })
  //Validation Schema
  const validationSchema = yup.object({
    key: yup.string().required(),
    value: yup.string().required(),
    secret: yup.boolean().required().default(false)
  })

  // validation with VeeValidate
  const { errors, defineInputBinds, meta, resetForm, values } = useForm({
    validationSchema
  })

  const key = defineInputBinds('key', { validateOnInput: true })
  const value = defineInputBinds('value', { validateOnInput: true })
  const secret = defineInputBinds('secret')
</script>
