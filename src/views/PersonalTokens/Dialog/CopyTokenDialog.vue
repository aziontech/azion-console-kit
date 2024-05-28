<template>
  <PrimeDialog
    :blockScroll="true"
    modal
    visible
    :closable="false"
    class="max-w-2xl"
    header="Your personal token has been created"
  >
    <div class="flex flex-col gap-3.5">
      <InlineMessage severity="warn">
        If you close this dialog, you'll no longer be able to access your personal token.
      </InlineMessage>

      <div class="flex flex-col w-full gap-2">
        <label
          for="personalToken"
          class="text-color text-base font-medium"
        >
          Personal Token Value
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
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            Copy the personal token now. The token won't be retrievable once this dialog is closed
          </small>
        </span>
      </div>
      <div>
        <PrimeButton
          icon="pi pi-clone"
          outlined
          type="button"
          aria-label="Copy Personal Token"
          label="Copy"
          :disabled="!personalTokenValue"
          @click="params.copy"
        />
      </div>
    </div>

    <template #footer>
      <PrimeButton
        label="Confirm"
        severity="secondary"
        @click="closeDialog"
      />
    </template>
  </PrimeDialog>
</template>

<script setup>
  import { computed, inject } from 'vue'
  import PrimeDialog from 'primevue/dialog'
  import InlineMessage from 'primevue/inlinemessage'
  import PrimePassword from 'primevue/password'
  import PrimeButton from 'primevue/button'

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
