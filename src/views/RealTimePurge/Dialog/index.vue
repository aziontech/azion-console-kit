<script setup>
  import { ref, watch, inject } from 'vue'
  import PrimeDialog from 'primevue/dialog'
  import PrimeButton from 'primevue/button'
  import Message from 'primevue/message'
  import Avatar from 'primevue/avatar'

  defineOptions({ name: 'dialog-real-time-purge' })

  const loading = ref(false)
  const dialogRef = inject('dialogRef')

  const closeDialog = () => {
    dialogRef.value.close()
  }

  const handleRealTimePurge = () => {
    dialogRef.value.data.repurge()
    loading.value = true
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
        <h5 class="text-lg not-italic font-bold leading-5">Confirm Repurge</h5>
      </template>
      <div class="flex flex-col gap-3.5">
        <Message
          severity="warn"
          :closable="false"
          :pt="{
            root: { class: 'w-full' },
            wrapper: { class: 'py-3 px-3 items-start sm:items-center' }
          }"
        >
          <template #messageicon>
            <Avatar
              icon="pi pi-exclamation-triangle"
              class="bg-yellow-600 bg-opacity-20 text-yellow-600 mr-2 min-w-[2rem]"
            />
          </template>
          <p class="text-color-secondary">
            This action may temporarily impact some URLs, causing a minor disruption.
          </p>
        </Message>
        <div class="text-color font-normal text-sm mb-2 text-color-secondary">
          This happens because the purge is queued for execution, and the results may take some time
          to propagate to all edge nodes.
        </div>
      </div>
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
