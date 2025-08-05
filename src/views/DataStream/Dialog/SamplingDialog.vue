<template>
  <PrimeDialog
    :blockScroll="true"
    modal
    :closable="false"
    :pt="{
      root: { class: 'p-0 w-[576px]' },
      header: {
        class: 'flex py-5 border-b border-solid'
      },
      content: { class: 'p-5 h-full' },
      footer: {
        class: 'flex p-5 justify-end items-end border-t border-solid'
      }
    }"
  >
    <template #header>
      <h5 class="text-lg font-semibold leading-tight">Attention</h5>
    </template>

    <div class="flex flex-col gap-3.5">
      <InlineMessage severity="warn">
        After activating and saving these settings, all other Data Streams will be disabled.
      </InlineMessage>
      <p class="text-color-secondary text-sm font-normal leading-tight">
        Sampling percentage is statistical and not absolutely precise. When multiple Data Streams
        have different sampling rates, the system uses the lowest percentage.
      </p>
    </div>

    <template #footer>
      <PrimeButton
        outlined
        label="Cancel"
        @click="emit('cancel')"
      />
      <PrimeButton
        severity="secondary"
        label="Confirm"
        @click="emit('confirm')"
      />
    </template>
  </PrimeDialog>
</template>

<script setup>
  import PrimeDialog from 'primevue/dialog'
  import InlineMessage from 'primevue/inlinemessage'
  import PrimeButton from 'primevue/button'

  const emit = defineEmits(['confirm', 'cancel'])
</script>
