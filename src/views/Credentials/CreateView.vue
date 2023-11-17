<template>
  <CreateFormBlock
    pageTitle="New Credential"
    :createService="props.createCredentialService"
    :formData="values"
    :formMeta="meta"
    @on-response="handleResponse"
    :buttonBackList="generatedToken"
    :callback="false"
    :disabledFeedback="true"
  >
    <template #form>
      <FormHorizontal
        title="General"
        description="Choose a name that is descriptive and easy to remember. Use the description to help you remember why the token was created and/or what it was created for."
      >
        <template #inputs>
          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label
              for="name"
              class="text-color text-base font-medium"
              >Name *</label
            >
            <InputText
              v-model="name"
              id="name"
              type="text"
              :disabled="generatedToken"
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
              :disabled="generatedToken"
            />
            <small class="text-color-secondary text-xs font-normal leading-5">
              Description of credential, e.g.: Credential used for clients XYZ.
            </small>
          </div>
        </template>
      </FormHorizontal>
      <FormHorizontal
        title="Token"
        description="Save the credential to visualize the token."
      >
        <template #inputs>
          <div class="flex flex-col w-full gap-2">
            <label
              for="personalToken"
              class="text-color text-base font-medium"
            >
              Credential Token
            </label>
            <div
              class="flex gap-6 md:align-items-center max-sm:flex-col max-sm:align-items-baseline max-sm:gap-3"
            >
              <span class="p-input-icon-right w-full flex max-w-lg flex-col items-start gap-2">
                <PrimePassword
                  id="personalToken"
                  v-model="token"
                  type="text"
                  class="flex flex-col w-full"
                  :feedback="false"
                  toggleMask
                  disabled
                />
              </span>
              <PrimeButton
                icon="pi pi-clone"
                outlined
                type="button"
                aria-label="Copy Token"
                label="Copy to Clipboard"
                :disabled="!generatedToken"
                @click="copyToken"
              />
            </div>
          </div>
        </template>
      </FormHorizontal>
      <FormHorizontal title="Status">
        <template #inputs>
          <div class="flex flex-col w-full gap-2">
            <div
              class="flex gap-6 md:align-items-center max-sm:flex-col max-sm:align-items-baseline max-sm:gap-3"
            >
              <span class="p-input-icon-right w-full flex max-w-lg items-start gap-2 pb-3 pt-2">
                <InputSwitch
                  v-model="status"
                  :disabled="generatedToken"
                  id="active"
                />
                <div class="flex-col gap-1">
                  <div class="text-color text-sm font-normal leading-5">Active</div>
                </div>
              </span>
            </div>
          </div>
        </template>
      </FormHorizontal>
    </template>
  </CreateFormBlock>
</template>

<script setup>
  import { ref } from 'vue'
  import CreateFormBlock from '@/templates/create-form-block-new'
  import FormHorizontal from '@/templates/create-form-block-new/form-horizontal'
  import InputText from 'primevue/inputtext'
  import PrimeTextarea from 'primevue/textarea'
  import PrimePassword from 'primevue/password'
  import PrimeButton from 'primevue/button'
  import InputSwitch from 'primevue/inputswitch'
  import { useField, useForm } from 'vee-validate'
  import * as yup from 'yup'
  import { useToast } from 'primevue/usetoast'

  const props = defineProps({
    createCredentialService: {
      type: Function,
      required: true
    },
    clipboardWrite: {
      type: Function,
      required: true
    }
  })

  const validationSchema = yup.object({
    name: yup.string().required('Name is a required field'),
    description: yup.string(),
    token: yup.string(),
    status: yup.boolean()
  })

  const { errors, meta, values } = useForm({
    validationSchema,
    initialValues: {
      status: true
    }
  })

  const { value: name } = useField('name')
  const { value: description } = useField('description')
  const { value: status } = useField('status')
  const token = ref('')
  const generatedToken = ref(false)

  const toast = useToast()
  const handleResponse = (data) => {
    toast.add({
      closable: false,
      severity: 'success',
      summary: data.feedback,
      life: 10000
    })
    if (data.token) {
      token.value = data.token
      generatedToken.value = true
    }
  }

  const copyToken = async () => {
    props.clipboardWrite(this.token)
    toast.add({
      closable: false,
      severity: 'success',
      summary: 'token copied',
      life: 10000
    })
  }
</script>
