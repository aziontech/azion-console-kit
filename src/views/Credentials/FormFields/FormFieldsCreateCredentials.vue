<!-- eslint-disable vue/no-mutating-props -->
<script setup>
  import { computed } from 'vue'

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

  const props = defineProps({
    token: {
      type: String,
      required: true
    },
    generatedToken: {
      type: Boolean,
      required: true
    }
  })

  const tokenValue = computed(() => {
    return props.token
  })
</script>
<template>
  <FormHorizontal
    title="General"
    description="Create a credential to use and authenticate Edge Orchestrator services."
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
          :disabled="props.generatedToken"
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
          :disabled="props.generatedToken"
        />
        <small class="text-xs text-color-secondary font-normal leading-5">
          Description and purpose of the credential.
        </small>
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal
    title="Token"
    description="Save the credential to generate the token for Edge Orchestrator."
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
              v-model="tokenValue"
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
            label="Copy"
            :disabled="!props.generatedToken"
            @click="$emit('copyToken')"
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
              :disabled="props.generatedToken"
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
