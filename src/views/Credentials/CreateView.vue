<template>
  <CreateFormBlock
    pageTitle="Create Credential"
    :createService="createCredentialService"
    :formData="values"
    :formMeta="meta"
    :cleanFormCallback="resetForm"
  >
    <template #form>
      <FormHorizontal
        title="Credentials"
        description="Espaço livre para descrição e instruções de preenchimento. Esse conteúdo deve ser criado pensando tanto em funcionalidade quanto em em alinhamento e estética. Devemos sempre criar os blocos conforme o contexto, cuidando sempre para não ter blocos muito longos."
      >
        <template #inputs>
          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label
              for="name"
              class="text-color text-base font-medium"
              >Name *</label
            >
            <InputText
              placeholder="Add Credential Name"
              v-model="name"
              id="name"
              type="text"
              :class="{ 'p-invalid': errors.name }"
              v-tooltip.top="{ value: errors.name, showDelay: 200 }"
            />
            <small
              v-if="errors.name"
              class="p-error text-xs font-normal leading-tight"
              >{{ errors.name }}</small
            >
          </div>

          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label
              for="description"
              class="text-color text-base font-medium"
              >Description</label
            >
            <PrimeTextarea
              v-model="description"
              id="description"
              rows="2"
              cols="30"
              class="w-full"
              :class="{ 'p-invalid': errors.description }"
              v-tooltip.top="{ value: errors.description, showDelay: 200 }"
            />
            <small
              v-if="errors.description"
              class="p-error text-xs font-normal leading-tight"
              >{{ errors.description }}</small
            >
          </div>
        </template>
      </FormHorizontal>
    </template>
  </CreateFormBlock>
</template>

<script>
  import CreateFormBlock from '@/templates/create-form-block-new'
  import FormHorizontal from '@/templates/create-form-block-new/form-horizontal'
  import InputText from 'primevue/inputtext'
  import PrimeTextarea from 'primevue/textarea'
  import { useField, useForm } from 'vee-validate'
  import * as yup from 'yup'

  export default {
    components: {
      CreateFormBlock,
      InputText,
      PrimeTextarea,
      FormHorizontal
    },
    props: {
      createCredentialService: Function
    },
    setup() {
      const validationSchema = yup.object({
        name: yup.string().required('Name is a required field'),
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
