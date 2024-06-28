<!-- eslint-disable vue/no-mutating-props -->
<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldTextArea from '@/templates/form-fields-inputs/fieldTextArea'

  import PrimePassword from 'primevue/password'
  import PrimeButton from 'primevue/button'
  import InputSwitch from 'primevue/inputswitch'
  import { useField } from 'vee-validate'
  defineEmits(['copyToken'])

  const { value: name } = useField('name')
  const { value: description } = useField('description')
  const { value: status } = useField('status')
  const { value: token } = useField('token')
</script>
<template>
  <FormHorizontal
    title="General"
    description="Edit a credential to use and authenticate Edge Orchestrator services."
    data-testid="credentials-edit-form__section__general"
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Name *"
          name="name"
          :value="name"
        />
      </div>

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldTextArea
          label="Description"
          name="description"
          :value="description"
          description="Description of the credential."
          rows="2"
        />
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal
    title="Token"
    description="Copy the credential token to use with Edge Orchestrator."
    data-testid="credentials-edit-form__section__token"
  >
    <template #inputs>
      <div class="flex flex-col w-full gap-2">
        <label
          data-testid="credentials-edit-form__token-field__label"
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
              data-testid="credentials-edit-form__token-field__input"
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
            data-testid="credentials-edit-form__token-field__copy-token-button"
            icon="pi pi-clone"
            outlined
            type="button"
            aria-label="Copy Token"
            label="Copy"
            @click="$emit('copyToken', { token })"
          />
        </div>
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal
    title="Status"
    data-testid="credentials-edit-form__section__status"
  >
    <template #inputs>
      <div class="flex flex-col w-full gap-2">
        <div
          class="flex gap-6 md:align-items-center max-sm:flex-col max-sm:align-items-baseline max-sm:gap-3"
        >
          <span class="p-input-icon-right w-full flex max-w-lg items-start gap-2 pb-3 pt-2">
            <InputSwitch
              data-testid="credentials-edit-form__status-field__switch"
              v-model="status"
              id="active"
            />
            <div class="flex-col gap-1">
              <div
                class="text-color text-sm font-normal leading-5"
                data-testid="credentials-edit-form__status-field__label"
              >
                Active
              </div>
            </div>
          </span>
        </div>
      </div>
    </template>
  </FormHorizontal>
</template>
