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
      <PrimeButton
        outlined
        @click="cancelDialog"
        icon="pi pi-times"
      />
    </template>

    <template #footer>
      <div class="flex flex-row justify-between w-full flex-wrap md:flex-nowrap gap-3">
        <PrimeButton
          outlined
          label="Discard Changes"
          @click="resetRules"
          data-testid="review-changes-dialog-footer-cancel-button"
        />
        <div class="flex gap-3 flex-wrap w-full md:w-auto">
          <PrimeButton
            outlined
            label="Cancel"
            @click="cancelDialog()"
            data-testid="review-changes-dialog-footer-cancel-button"
          />
          <PrimeButton
            severity="secondary"
            label="Save and Apply"
            icon-pos="right"
            @click="saveRules()"
            data-testid="review-changes-dialog-footer-delete-button"
          />
        </div>
      </div>
    </template>
  </PrimeDialog>
</template>

<script setup>
  import { inject } from 'vue'
  import PrimeButton from 'primevue/button'
  import PrimeDialog from 'primevue/dialog'

  const dialogRef = inject('dialogRef')

  const data = dialogRef.value.data
  const rules = data.rules

  const saveRules = () => {
    dialogRef.value.close({ save: true })
  }

  const resetRules = () => {
    dialogRef.value.close({ reset: true })
  }
  const cancelDialog = () => {
    dialogRef.value.close()
  }
</script>
