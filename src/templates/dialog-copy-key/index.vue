<template>
  <Dialog
    modal
    visible
    class="max-w-2xl"
    data-testid="copy-token-dialog__header"
    :blockScroll="true"
    :closable="false"
    :header="dialogTitle"
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
          {{ fieldLabel }}
        </label>

        <span class="p-input-icon-right w-full flex flex-col items-start gap-2">
          <InputPassword
            v-if="mask"
            toggleMask
            data-sentry-mask
            v-model="token"
            id="inputTokenMask"
            class="flex flex-col w-full"
            data-testid="copy-token-dialog__token-field__password-input"
            :pt="{
              input: {
                readonly: true
              }
            }"
            :feedback="false"
          />
          <InputText
            v-else
            readonly
            toggleMask
            data-sentry-mask
            v-model="token"
            id="inputToken"
            class="flex flex-col w-full"
            data-testid="copy-token-dialog__token-field__input-text"
            :feedback="false"
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
        <ButtonCopy
          :value="token"
          :disabled="!token"
          label="Copy"
          copiedLabel="Copied"
          aria-label="Copy Token"
          data-testid="copy-token-dialog__token-field__copy-token-button"
        />
      </div>
    </div>

    <template #footer>
      <Button
        label="Confirm"
        size="small"
        severity="secondary"
        data-testid="copy-token-dialog__dialog-footer__confirm-button"
        @click="closeDialog"
      />
    </template>
  </Dialog>
</template>

<script setup>
  import { computed, inject } from 'vue'
  import Dialog from '@aziontech/webkit/dialog'
  import InlineMessage from '@aziontech/webkit/inlinemessage'
  import InputPassword from '@aziontech/webkit/password'
  import InputText from '@aziontech/webkit/inputtext'
  import Button from '@aziontech/webkit/button'
  import ButtonCopy from '@aziontech/webkit/button-copy'

  defineOptions({ name: 'DialogCopyKey' })

  const dialogRef = inject('dialogRef')
  const params = dialogRef.value.data

  const dialogTitle = computed(() => `${params.title} has been created`)
  const fieldLabel = computed(() => params.title)
  const mask = computed(() => params.mask)
  const token = computed(() => params.token)

  const closeDialog = () => {
    dialogRef.value.close()
  }
</script>
