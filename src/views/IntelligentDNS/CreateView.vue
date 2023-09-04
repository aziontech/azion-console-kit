<template>
  <CreateFormBlock
    :pageTitle="'Create Intelligent DNS'"
    :createService="props.createIntelligentDNSService"
    :formData="values"
    :isValid="meta.valid"
    :cleanFormCallback="resetForm"
  >
    <template #form>
      <InputText
        placeholder="Zone Name"
        v-bind="name"
        type="text"
        :class="{ 'p-invalid': errors.name }"
        v-tooltip.top="errors.name"
      />
      <InputText
        placeholder="Domain"
        v-bind="domain"
        type="text"
        :class="{ 'p-invalid': errors.domain }"
        v-tooltip.top="errors.domain"
      />
      <div class="flex gap-3 items-center">
        <label for="">Active</label>
        <InputSwitch
          v-bind="isActive"
          v-model="isActive.value"
          :class="{ 'p-invalid': errors.isActive }"
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
    createIntelligentDNSService: {
      type: Function,
      required: true
    }
  })

  //Validation Schema
  const validationSchema = yup.object({
    name: yup.string().required(),
    domain: yup
      .string()
      .required()
      .test('valid-domain', 'Invalid domain', function (value) {
        const domainRegex = /^(?:[-A-Za-z0-9]+\.)+[A-Za-z]{2,6}$/
        return domainRegex.test(value)
      }),
    isActive: yup.boolean().required().default(false)
  })

  // validation with VeeValidate
  const { errors, defineInputBinds, meta, resetForm, values } = useForm({
    validationSchema,
    initialValues: {
      isActive: false
    }
  })

  const name = defineInputBinds('name', { validateOnInput: true })
  const domain = defineInputBinds('domain', { validateOnInput: true })
  const isActive = defineInputBinds('isActive')
</script>
