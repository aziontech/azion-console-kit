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
      <IconButton
        kind="outlined"
        size="medium"
        @click="cancelDialog"
        icon="pi pi-times"
        aria-label="button"
      />
    </template>

    <template #footer>
      <div class="flex flex-row w-full justify-end md:flex-nowrap gap-3">
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
          label="Save"
          @click="saveRules()"
          data-testid="review-changes-dialog-footer-delete-button"
        />
      </div>
    </template>
  </PrimeDialog>
</template>

<script setup>
  import { inject, computed } from 'vue'
  import PrimeButton from '@aziontech/webkit/button'
  import IconButton from '@aziontech/webkit/icon-button'
  import PrimeDialog from '@aziontech/webkit/dialog'
  import ReorderedRules from './components/ReorderedRules.vue'

  const dialogRef = inject('dialogRef')

  const data = dialogRef.value.data
  const rules = data.rules

  const saveRules = () => {
    dialogRef.value.close({ save: true })
  }

  const cancelDialog = () => {
    dialogRef.value.close()
  }

  const requestPhase = computed(() => rules.filter((rule) => rule.phase.content === 'Request'))
  const responsePhase = computed(() => rules.filter((rule) => rule.phase.content === 'Response'))

  const hasRequestPhase = computed(() => requestPhase.value.length > 0)
  const hasResponsePhase = computed(() => responsePhase.value.length > 0)
</script>
