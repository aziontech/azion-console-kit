<script setup>
  import { computed, inject } from 'vue'
  import PrimeDialog from 'primevue/dialog'
  import InlineMessage from 'primevue/inlinemessage'
  import PrimePassword from 'primevue/password'
  import CopyBlock from '@aziontech/webkit/button-copy'
  import PrimeButton from '@aziontech/webkit/button'

  defineOptions({ name: 'CopyKeyDialog' })

  const dialogRef = inject('dialogRef')

  const params = dialogRef.value.data

  const keyValue = computed({
    get: () => params.key
  })

  const closeDialog = () => {
    dialogRef.value.close()
  }
</script>

<template>
  <PrimeDialog
    :blockScroll="true"
    modal
    visible
    :closable="false"
    class="max-w-2xl"
    :header="`${params.title} has been created`"
    :data-testid="`copy-key-dialog__header`"
  >
    <div class="flex flex-col gap-4">
      <InlineMessage
        severity="warn"
        :data-testid="`copy-key-dialog__warning__inline-message`"
      >
        This {{ params.title.toLowerCase() }} will only be displayed once. Make sure to copy and
        store it safely.
      </InlineMessage>

      <div class="flex flex-col w-full gap-2">
        <label
          for="key"
          class="text-color text-base font-medium"
          :data-testid="`copy-key-dialog__token-field__label`"
        >
          {{ params.title }}
        </label>

        <span class="p-input-icon-right w-full flex flex-col items-start gap-2">
          <PrimePassword
            id="key"
            v-model="keyValue"
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
            :data-testid="`copy-key-dialog__token-field__password-input`"
          />
          <small
            class="text-xs text-color-secondary font-normal leading-5"
            :data-testid="`copy-key-dialog__token-field__description`"
          >
            Once the dialog is closed, the {{ params.title.toLowerCase() }} cannot be retrieved.
            It'll be necessary to generate a new one.
          </small>
        </span>
      </div>
      <div>
        <CopyBlock
          :value="keyValue"
          label="Copy"
          copiedLabel="Copied"
          :disabled="!keyValue"
          :aria-label="`Copy ${params.title}`"
          :data-testid="`copy-key-dialog__token-field__copy-key-button`"
        />
      </div>
    </div>

    <template #footer>
      <PrimeButton
        label="Confirm"
        size="small"
        severity="secondary"
        @click="closeDialog"
        :data-testid="`copy-key-dialog__dialog-footer__confirm-button`"
      />
    </template>
  </PrimeDialog>
</template>
