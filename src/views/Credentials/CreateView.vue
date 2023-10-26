<template>
  <CreateFormBlock
    pageTitle="Create Credential"
    :createService="createCredentialService"
    :formData="values"
    :isValid="meta.valid"
    :cleanFormCallback="resetForm"
  >
    <template #form>
      <div class="flex flex-col gap-2">
        <label for="name">Name: *</label>
        <InputText
          placeholder="Add Credential Name"
          v-model="name"
          id="name"
          type="text"
          :class="{ 'p-invalid': errors.name }"
          v-tooltip.top="{ value: errors.name, showDelay: 200 }"
        />
      </div>

      <div class="flex flex-col gap-2">
        <label for="description">Description:</label>
        <PrimeTextarea
          :class="{ 'p-invalid': errors.description }"
          v-model="description"
          id="description"
          rows="5"
          cols="30"
          class="w-full"
          v-tooltip.top="{ value: errors.description, showDelay: 200 }"
        />
      </div>
    </template>
  </CreateFormBlock>
</template>

<script>
  import CreateFormBlock from '@/templates/create-form-block'
  import InputText from 'primevue/inputtext'
  import PrimeTextarea from 'primevue/textarea'
  import { useField, useForm } from 'vee-validate'
  import * as yup from 'yup'

  export default {
    components: {
      CreateFormBlock,
      InputText,
      PrimeTextarea
    },
    props: {
      createCredentialService: Function
    },
    setup() {
      const validationSchema = yup.object({
        name: yup.string().required(),
        description: yup.string()
      })

      const { errors, meta, resetForm, values } = useForm({
        validationSchema,
        initialValues: {}
      })

      const { value: name } = useField('name')
      const { value: description } = useField('description')

      return {
        name,
        description,
        validationSchema,
        errors,
        meta,
        resetForm,
        values
      }
    }
  }
</script>
