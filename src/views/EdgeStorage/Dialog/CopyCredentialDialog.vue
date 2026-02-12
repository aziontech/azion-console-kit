<template>
  <div class="flex flex-col gap-4">
    <small data-testid="copy-credential-dialog__warning__inline-message">
      Your credential is ready. Copy the keys below to use them securely.
    </small>
    <div class="flex flex-col w-full gap-2">
      <label
        for="accessKey"
        class="text-color text-base font-medium"
        data-testid="copy-credential-dialog__access-key-field__label"
      >
        Access Key
      </label>

      <span class="p-input-icon-right w-full flex flex-col items-start gap-2">
        <PrimePassword
          id="accessKey"
          v-model="accessKeyValue"
          type="text"
          class="flex flex-col w-full"
          :pt="{
            input: {
              readonly: true
            }
          }"
          :feedback="false"
          toggleMask
          data-sentry-mask
          data-testid="copy-credential-dialog__access-key-field__password-input"
        />
        <CopyBlock
          label="Copy Access Key"
          :value="accessKeyValue"
          :disabled="!accessKeyValue"
          isCopyVisible
          data-testid="copy-credential-dialog__access-key-field__copy-button"
        />
      </span>
    </div>

    <div class="flex flex-col w-full gap-2">
      <label
        for="secretKey"
        class="text-color text-base font-medium"
        data-testid="copy-credential-dialog__secret-key-field__label"
      >
        Secret Key
      </label>

      <span class="p-input-icon-right w-full flex flex-col items-start gap-2">
        <PrimePassword
          id="secretKey"
          v-model="secretKeyValue"
          type="text"
          class="flex flex-col w-full"
          :pt="{
            input: {
              readonly: true
            }
          }"
          :feedback="false"
          toggleMask
          data-sentry-mask
          data-testid="copy-credential-dialog__secret-key-field__password-input"
        />
        <CopyBlock
          label="Copy Secret Key"
          :value="secretKeyValue"
          :disabled="!secretKeyValue"
          isCopyVisible
          data-testid="copy-credential-dialog__secret-key-field__copy-button"
        />
      </span>
    </div>

    <div class="flex justify-content-end gap-2 mt-4">
      <PrimeButton
        label="Confirm"
        size="small"
        severity="secondary"
        @click="closeDialog"
        data-testid="copy-credential-dialog__dialog-footer__confirm-button"
      />
    </div>
  </div>
</template>

<script setup>
  import { computed, inject } from 'vue'
  import PrimePassword from 'primevue/password'
  import PrimeButton from 'primevue/button'
  import CopyBlock from '@/templates/copy-block/copy-block.vue'

  defineOptions({ name: 'CopyCredentialDialog' })

  const dialogRef = inject('dialogRef')

  const params = dialogRef.value.data

  const accessKeyValue = computed(() => params.credential.access_key)

  const secretKeyValue = computed(() => params.credential.secret_key)

  const closeDialog = () => {
    dialogRef.value.close()
  }
</script>
