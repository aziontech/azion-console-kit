<template>
  <PrimeDialog
    :blockScroll="true"
    modal
    visible
    :closable="false"
    class="max-w-xl"
    header="Save your token"
  >
    <div class="flex flex-col gap-3.5">
      <InlineMessage severity="info">
        Please save this secret key in a secure and easily accessible location. For security
        reasons, you won't be able to view it again through your Azion account. If you lose this
        secret key, you'll need to generate a new one.
      </InlineMessage>

      <div class="flex flex-col w-full gap-2">
        <label
          for="personalToken"
          class="text-color text-base font-medium"
        >
          Personal Token
        </label>

        <span class="p-input-icon-right w-full flex flex-col items-start gap-2">
          <InputText
            class="flex flex-col w-full"
            v-model="personalTokenValue"
            id="personalToken"
            type="text"
            readonly
            :pt="{
              input: { class: 'opacity-100' }
            }"
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            In case you need the Personal Token code after that, you must create a new one.
          </small>
        </span>
      </div>
      <div>
        <PrimeButton
          icon="pi pi-clone"
          outlined
          type="button"
          aria-label="Copy Personal Token"
          label="Copy to Clipboard"
          :disabled="!personalTokenValue"
          @click="params.copy"
        />
      </div>
    </div>

    <template #footer>
      <PrimeButton
        outlined
        label="Done"
        @click="closeDialog"
      />
    </template>
  </PrimeDialog>
</template>

<script setup>
  import { computed, inject } from 'vue'
  import PrimeDialog from 'primevue/dialog'
  import InlineMessage from 'primevue/inlinemessage'
  import InputText from 'primevue/inputtext'
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
