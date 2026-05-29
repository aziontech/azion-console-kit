<template>
  <PrimeDialog
    blockScroll
    :draggable="false"
    modal
    visible
    header="Review Changes"
    class="w-full max-w-xl"
    @keyup.enter="cancelDialog"
    data-testid="review-changes-dialog"
  >
    <div
      class="flex flex-col max-h-96"
      data-testid="review-changes-dialog-content"
    >
      <p
        class="text-color-secondary py-2"
        v-for="rule in rules"
        :key="rule.id"
        data-testid="review-changes-dialog-warning-message-details"
      >
        Rule <span class="font-medium">”{{ rule.name }}”</span> reordered from
        {{ rule.position.immutableValue }} to {{ rule.position.value }}.
      </p>
    </div>

    <template #closeicon>
      <IconButton
        kind="outlined"
        size="medium"
        @click="cancelDialog"
        icon="pi pi-times"
        aria-label="button"
      />
    </template>

    <template #footer>
      <div class="flex flex-row justify-end w-full flex-wrap md:flex-nowrap gap-3">
        <PrimeButton
          kind="outlined"
          size="medium"
          label="Cancel"
          @click="cancelDialog()"
          data-testid="review-changes-dialog-footer-cancel-button"
        />
        <PrimeButton
          kind="secondary"
          size="medium"
          label="Save and Apply"
          @click="saveRules()"
          data-testid="review-changes-dialog-footer-delete-button"
        />
      </div>
    </template>
  </PrimeDialog>
</template>

<script setup>
  import { inject } from 'vue'
  import PrimeButton from '@aziontech/webkit/button'
  import IconButton from '@aziontech/webkit/icon-button'
  import PrimeDialog from '@aziontech/webkit/dialog'

  const dialogRef = inject('dialogRef')

  const data = dialogRef.value.data
  const rules = data.rules

  const saveRules = () => {
    dialogRef.value.close({ save: true })
  }

  const cancelDialog = () => {
    dialogRef.value.close()
  }
</script>
