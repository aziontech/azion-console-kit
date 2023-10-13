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
          type="text"
          :class="{ 'p-invalid': errors.name }"
          v-tooltip.top="errors.name"
        />
      </div>

      <div class="flex flex-col gap-2">
        <label for="cname">Description:</label>
        <PrimeTextarea
          :class="{ 'p-invalid': errors.description }"
          v-model="description"
          rows="5"
          cols="30"
          class="w-full"
          v-tooltip.top="errors.description"
        />
      </div>

      <div class="flex flex-col gap-2">
        <label for="name">Token:</label>
        <InputText
          placeholder="Save the credential to visualize the token in this field"
          type="text"
          readonly
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
