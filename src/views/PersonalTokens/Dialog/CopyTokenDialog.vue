<template>
  <PrimeDialog
    :blockScroll="true"
    modal
    visible
    :closable="false"
    class="max-w-2xl"
    header="Personal token has been created"
  >
    <div class="flex flex-col gap-3.5">
      <InlineMessage severity="warn">
        This token will only be displayed once. Make sure to copy and store it safely.
      </InlineMessage>

      <div class="flex flex-col w-full gap-2">
        <label
          for="personalToken"
          class="text-color text-base font-medium"
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
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            Once the dialog is closed, the token cannot be retrieved. It'll be necessary to generate a new one.
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
