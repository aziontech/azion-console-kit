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
      <FormHorizontal
        title="Credentials"
        description="Espaço livre para descrição e instruções de preenchimento. Esse conteúdo deve ser criado pensando tanto em funcionalidade quanto em em alinhamento e estética. Devemos sempre criar os blocos conforme o contexto, cuidando sempre para não ter blocos muito longos."
      >
        <template #inputs>
          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label
              for="token"
              class="text-color text-base font-medium"
              >Token *</label
            >
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

          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label
              for="name"
              class="text-color text-base font-medium"
              >Name *</label
            >
            <InputText
              placeholder="Edit Credential Name"
              v-model="name"
              id="name"
              type="text"
              :class="{ 'p-invalid': errors.name }"
              v-tooltip.top="{ value: errors.name, showDelay: 200 }"
            />
          </div>

          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label
              for="description"
              class="text-color text-base font-medium"
              >Description</label
            >
            <PrimeTextarea
              :class="{ 'p-invalid': errors.description }"
              v-model="description"
              id="description"
              rows="2"
              cols="30"
              class="w-full"
              v-tooltip.top="{ value: errors.description, showDelay: 200 }"
            />
          </div>

          <Card
            :pt="{
              root: { class: 'shadow-none  rounded-none' },
              body: { class: 'py-4 border-0' },
              title: { class: 'flex items-center text-base m-0 gap-3 font-medium' },
              subtitle: {
                class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]'
              }
            }"
          >
            <template #title>
              <InputSwitch
                :class="{ 'p-invalid': errors.status }"
                v-model="status"
                id="active"
              />
              <div class="flex-col gap-1">
                <div class="">
                  <div class="text-color text-sm font-normal">Active</div>
                </div>
                <div class="self-stretch text-color-secondary text-sm font-normal">Description</div>
              </div>
            </template>
          </Card>
        </template>
      </FormHorizontal>
    </template>
  </EditFormBlock>
</template>

<script>
  import EditFormBlock from '@/templates/edit-form-block-new'
  import FormHorizontal from '@/templates/create-form-block-new/form-horizontal'
  import InputText from 'primevue/inputtext'
  import Password from 'primevue/password'
  import PrimeButton from 'primevue/button'
  import PrimeTextarea from 'primevue/textarea'
  import InputSwitch from 'primevue/inputswitch'
  import Card from 'primevue/card'
  import { useField, useForm } from 'vee-validate'
  import * as yup from 'yup'

  export default {
    components: {
      EditFormBlock,
      InputText,
      Password,
      PrimeButton,
      PrimeTextarea,
      InputSwitch,
      FormHorizontal,
      Card
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
          closable: true,
          severity: 'success',
          summary: 'token copied',
          life: 10000
        })
      }
    }
  }
</script>
