<template>
  <PrimeDialog
    :blockScroll="true"
    modal
    visible
    :closable="false"
    class="max-w-2xl"
    header="Personal token has been created"
    data-testid="copy-token-dialog__header"
  >
    <div class="flex flex-col gap-4">
      <InlineMessage
        severity="warn"
        data-testid="copy-token-dialog__warning__inline-message"
      >
        This token will only be displayed once. Make sure to copy and store it safely.
      </InlineMessage>

      <div class="flex flex-col w-full gap-2">
        <label
          for="personalToken"
          class="text-color text-base font-medium"
          data-testid="copy-token-dialog__token-field__label"
        >
          Personal Token
        </label>

        <span class="p-input-icon-right w-full flex flex-col items-start gap-2">
          <PrimePassword
            id="personalToken"
            v-model="personalTokenValue"
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
            data-testid="copy-token-dialog__token-field__password-input"
          />
          <small
            class="text-xs text-color-secondary font-normal leading-5"
            data-testid="copy-token-dialog__token-field__description"
          >
            Once the dialog is closed, the token cannot be retrieved. It'll be necessary to generate
            a new one.
          </small>
        </span>
      </div>
      <div>
        <CopyBlock
          :value="personalTokenValue"
          label="Copy"
          copiedLabel="Copied"
          :disabled="!personalTokenValue"
          aria-label="Copy Personal Token"
          data-testid="copy-token-dialog__token-field__copy-token-button"
        />
      </div>
    </div>

    <template #footer>
      <PrimeButton
        label="Confirm"
        size="small"
        severity="secondary"
        @click="closeDialog"
        data-testid="copy-token-dialog__dialog-footer__confirm-button"
      />
    </template>
  </PrimeDialog>
</template>

<script setup>
  import { computed, inject } from 'vue'
  import PrimeDialog from '@aziontech/webkit/dialog'
  import InlineMessage from '@aziontech/webkit/inline-message'
  import PrimePassword from '@aziontech/webkit/password'
  import CopyBlock from '@aziontech/webkit/button-copy'
  import PrimeButton from '@aziontech/webkit/button'

  defineOptions({ name: 'CopyTokenDialog' })

  const dialogRef = inject('dialogRef')

  const params = dialogRef.value.data

  const personalTokenValue = computed({
    get: () => params.personalToken
  })

  const closeDialog = () => {
    dialogRef.value.close()
  }
</script>
