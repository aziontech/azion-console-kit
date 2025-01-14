<template>
  <PrimeDialog
    :blockScroll="true"
    modal
    visible
    :closable="false"
    class="max-w-2xl w-full"
    :header="`${params.title} has been created`"
  >
    <div class="flex flex-col sm:flex-row sm:items-end gap-6">
      <div class="flex flex-col w-full gap-2">
        <FieldText
          id="key"
          :name="params.title"
          :label="params.title"
          :value="keyValue"
          disabled
          ref="keyInput"
          icon="pi pi-lock"
        />
      </div>
      <div>
        <PrimeButton
          icon="pi pi-clone"
          outlined
          type="button"
          :aria-label="`Copy ${params.title}`"
          label="Copy"
          @click="params.copy(keyValue)"
          :data-testid="`copy-key-dialog__token-field__copy-key-button`"
        />
      </div>
    </div>

    <template #footer>
      <PrimeButton
        label="Confirm"
        severity="secondary"
        @click="closeDialog"
        :data-testid="`copy-key-dialog__dialog-footer__confirm-button`"
      />
    </template>
  </PrimeDialog>
</template>

<script setup>
  import { computed, inject } from 'vue'
  import PrimeDialog from 'primevue/dialog'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import PrimeButton from 'primevue/button'

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
