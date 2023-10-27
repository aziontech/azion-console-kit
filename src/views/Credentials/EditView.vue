<template>
  <EditFormBlock
    pageTitle="Edit Credential"
    :editService="editCredentialService"
    :loadService="loadCredentialService"
    :initialDataSetter="setValues"
    :formData="values"
    :isValid="meta.valid"
    :cleanFormCallback="resetForm"
  >
    <template #form>
      <div class="flex flex-col gap-2">
        <label for="token">Token: *</label>
        <div class="flex gap-2">
          <Password
            id="token"
            placeholder="Token"
            v-model="token"
            type="text"
            class="flex flex-col w-full"
            :feedback="false"
            toggleMask
            disabled
          />
          <PrimeButton
            icon="pi pi-copy"
            aria-label="Copy"
            @click="copyToken"
          />
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <label for="name">Name: *</label>
        <InputText
          placeholder="Edit Credential Name"
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

      <div class="flex flex-col gap-2">
        <label for="active">Active:</label>
        <InputSwitch
          :class="{ 'p-invalid': errors.status }"
          v-model="status"
          id="active"
        />
      </div>
    </template>
  </EditFormBlock>
</template>

<script>
  import EditFormBlock from '@/templates/edit-form-block'
  import InputText from 'primevue/inputtext'
  import Password from 'primevue/password'
  import PrimeButton from 'primevue/button'
  import PrimeTextarea from 'primevue/textarea'
  import InputSwitch from 'primevue/inputswitch'
  import { useField, useForm } from 'vee-validate'
  import * as yup from 'yup'

  export default {
    components: {
      EditFormBlock,
      InputText,
      Password,
      PrimeButton,
      PrimeTextarea,
      InputSwitch
    },
    props: {
      editCredentialService: Function,
      loadCredentialService: Function,
      clipboardWrite: Function
    },
    setup() {
      const validationSchema = yup.object({
        id: yup.string().required(),
        name: yup.string().required(),
        description: yup.string(),
        token: yup.string(),
        status: yup.boolean()
      })

      const { setValues, errors, meta, resetForm, values } = useForm({
        validationSchema,
        initialValues: {}
      })

      const { value: name } = useField('name')
      const { value: token } = useField('token')
      const { value: description } = useField('description')
      const { value: status } = useField('status')

      return {
        name,
        token,
        description,
        status,
        errors,
        meta,
        resetForm,
        values,
        setValues
      }
    },
    methods: {
      copyToken() {
        this.clipboardWrite(this.token)
        this.$toast.add({
          closable: false,
          severity: 'success',
          summary: 'token copied',
          life: 10000
        })
      }
    }
  }
</script>
