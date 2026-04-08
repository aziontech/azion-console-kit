<template>
  <PrimeDialog
    :blockScroll="true"
    modal
    visible
    class="max-w-2xl"
    header="Domain has been created"
    :pt="{
      headerTitle: {
        'data-testid': 'domains-view__copy-domain-dialog__header-title'
      }
    }"
  >
    <div class="flex flex-col gap-3.5">
      <InlineMessage severity="info">
        The domain is now available in the Domain management section. Navigate to Products menu >
        Domains to access the details.
      </InlineMessage>

      <div class="flex flex-col w-full gap-2">
        <label
          for="domain"
          class="text-color text-sm font-medium"
        >
          Domain
        </label>

        <span class="p-input-icon-right w-full flex flex-col items-start gap-2">
          <PrimeInputText
            id="domain"
            readonly
            data-testid="domains-dialog__domain-field__input"
            v-model="domainValue"
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
        </span>
      </div>

      <div class="flex justify-start w-full">
        <CopyBlock
          :value="domainValue"
          label="Copy"
          copiedLabel="Copied"
          :disabled="hasDomain"
          data-testid="domains-dialog__copy-domain__button"
          aria-label="Copy"
        />
      </div>
    </div>
    <template #closeicon>
      <PrimeButton
        outlined
        type="button"
        icon="pi pi-times"
        @click="closeDialog"
      />
    </template>

    <template #footer>
      <PrimeButton
        data-testid="domains-dialog__confirm__button"
        label="Confirm"
        severity="secondary"
        @click="closeDialog"
      />
    </template>
  </PrimeDialog>
</template>

<script setup>
  import { computed, inject } from 'vue'
  import PrimeDialog from '@aziontech/webkit/dialog'
  import InlineMessage from '@aziontech/webkit/inlinemessage'
  import PrimeInputText from '@aziontech/webkit/inputtext'
  import PrimeButton from '@aziontech/webkit/button'
  import CopyBlock from '@aziontech/webkit/button-copy'

  defineOptions({ name: 'CopyDomainDialog' })

  const dialogRef = inject('dialogRef')

  const params = dialogRef.value.data

  const domainValue = computed(() => params.domain)

  const closeDialog = () => {
    dialogRef.value.close()
  }

  const hasDomain = computed(() => {
    return !domainValue.value
  })
</script>
