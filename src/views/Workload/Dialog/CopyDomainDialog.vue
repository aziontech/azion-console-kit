<template>
  <PrimeDialog
    :blockScroll="true"
    modal
    visible
    class="max-w-2xl"
    header="Workload has been created"
    :pt="{
      headerTitle: {
        'data-testid': 'workloads-view__copy-workload-dialog__header-title'
      }
    }"
  >
    <div class="flex flex-col gap-3.5">
      <InlineMessage severity="info">
        The domain is now available in the Workload management section. Navigate to Products menu >
        Workloads to access the details.
      </InlineMessage>

      <div class="flex flex-col w-full gap-2">
        <label
          for="domain"
          class="text-color text-sm font-medium"
        >
          Workload
        </label>

        <span class="p-input-icon-right w-full flex flex-col items-start gap-2">
          <PrimeInputText
            id="domain"
            readonly
            data-testid="workloads-dialog__workload-field__input"
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
        <PrimeButton
          icon="pi pi-clone"
          data-testid="workloads-dialog__copy-workload__button"
          outlined
          type="button"
          aria-label="Copy"
          label="Copy"
          :disabled="hasWorkload"
          @click="params.copy"
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
        data-testid="workloads-dialog__confirm__button"
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
  import PrimeInputText from 'primevue/inputtext'
  import PrimeButton from 'primevue/button'

  defineOptions({ name: 'CopyDomainDialog' })

  const dialogRef = inject('dialogRef')

  const params = dialogRef.value.data

  const domainValue = computed(() => params.domain)

  const closeDialog = () => {
    dialogRef.value.close()
  }

  const hasWorkload = computed(() => {
    return !domainValue.value
  })
</script>
