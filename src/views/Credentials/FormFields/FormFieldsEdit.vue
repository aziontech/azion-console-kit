<!-- eslint-disable vue/no-mutating-props -->
<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import InputText from 'primevue/inputtext'
  import PrimeTextarea from 'primevue/textarea'
  import PrimePassword from 'primevue/password'
  import PrimeButton from 'primevue/button'
  import InputSwitch from 'primevue/inputswitch'
  import { useField } from 'vee-validate'
  defineEmits(['copyToken'])

  const { value: name, errorMessage: nameError } = useField('name')
  const { value: description } = useField('description')
  const { value: status } = useField('status')
  const { value: token } = useField('token')
</script>
<template>
  <FormHorizontal
    title="General"
    description="Edit credentials to use and authenticate Edge Orchestrator services."
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
          :class="{ 'p-invalid': nameError }"
        />
        <small
          v-if="nameError"
          class="p-error text-xs font-normal leading-tight"
          >{{ nameError }}</small
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
        />
        <small class="text-color-secondary text-xs font-normal leading-5">
          Description of credential, e.g.: Credential used for clients XYZ.
        </small>
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal
    title="Token"
    description="Save the credential to visualize and copy it."
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
            @click="$emit('copyToken', { token })"
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
