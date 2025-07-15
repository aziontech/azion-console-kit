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
      class="flex flex-col max-h-96 gap-6"
      data-testid="review-changes-dialog-content"
    >
      <template v-if="data.isEdgeApplicationRulesEngine">
        <ReorderedRules
          v-if="hasRequestPhase"
          title="Request Phase"
          :rules="requestPhase"
        />
        <ReorderedRules
          v-if="hasResponsePhase"
          title="Response Phase"
          :rules="responsePhase"
        />
      </template>

      <template v-else>
        <ReorderedRules :rules="rules" />
      </template>
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
            label="Save"
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
  import { inject, computed } from 'vue'
  import PrimeButton from 'primevue/button'
  import PrimeDialog from 'primevue/dialog'
  import ReorderedRules from './components/ReorderedRules.vue'

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

  const requestPhase = computed(() => rules.filter((rule) => rule.phase.content === 'Request'))
  const responsePhase = computed(() => rules.filter((rule) => rule.phase.content === 'Response'))

  const hasRequestPhase = computed(() => requestPhase.value.length > 0)
  const hasResponsePhase = computed(() => responsePhase.value.length > 0)
</script>
