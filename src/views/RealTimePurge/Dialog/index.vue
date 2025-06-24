<script setup>
  import { ref, watch, inject } from 'vue'
  import PrimeDialog from 'primevue/dialog'
  import PrimeButton from 'primevue/button'
  import InlineMessage from 'primevue/inlinemessage'

  defineOptions({ name: 'dialog-real-time-purge' })

  const loading = ref(false)
  const dialogRef = inject('dialogRef')

  const closeDialog = () => {
    dialogRef.value.close()
  }

  const handleRealTimePurge = async () => {
    try {
      loading.value = true
      await dialogRef.value.data.repurge(dialogRef.value.data.item)
    } finally {
      loading.value = false
      closeDialog()
    }
  }

  watch(
    () => dialogRef.value.data.isLoading,
    (value) => {
      loading.value = value
    }
  )
</script>

<template>
  <div>
    <PrimeDialog
      :blockScroll="true"
      visible
      modal
      @hide="closeDialog"
      :pt="{
        root: { class: 'p-0 w-[37.5rem]' },
        header: { class: 'flex py-5 px-8 items-center self-stretch border-b border-solid' },
        content: { class: 'py-5 px-8 h-full' },
        footer: {
          class: 'flex py-5 px-8 justify-end items-end border-t border-solid'
        }
      }"
    >
      <template #header>
        <h5 class="text-lg not-italic font-medium leading-5">Confirm Repurge</h5>
      </template>
      <div class="flex flex-col gap-3.5">
        <InlineMessage
          class=""
          severity="warn"
        >
          When creating a new purge, it's queued for execution and will appear in the table below
          once completed.
        </InlineMessage>
        <div class="text-color font-normal text-sm mb-2 text-color-secondary">
          Confirm repurge for the URL "{{ dialogRef.data.item.arguments[0] }}", clearing its cached
          content to ensure users receive the most up-to-date version.
        </div>
        <div class="text-color font-normal text-sm mb-2 text-color-secondary">
          The process will be queued for execution, and changes may take some time to propagate
          across all edge nodes, which could cause brief disruptions.
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
          severity="primary"
          label="Cancel"
          outlined
          @click="closeDialog"
        />
        <PrimeButton
          severity="secondary"
          label="Confirm"
          :loading="loading"
          @click="handleRealTimePurge"
          iconPos="right"
        />
      </template>
    </PrimeDialog>
  </div>
</template>
