<template>
  <Message
    severity="warn"
    :closable="false"
    :pt="{
      root: { class: 'mx-3 mt-4 md:mx-8' },
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
      <b class="text-color">Preview Stage:</b>
      The new Azion Console is in preview. You may encounter minor issues during this time.
      <PrimeButton
        label="Switch to the classic interface"
        link
        class="p-0"
        @click="goToClassicInterface()"
      />
    </p>
  </Message>
</template>

<script setup>
  defineOptions({ name: 'ProjectStageMessageBlock' })

  import Message from 'primevue/message'
  import Avatar from 'primevue/avatar'
  import PrimeButton from 'primevue/button'

  import { goToClassicInterface } from '@/helpers/go-to-classic-interface'
</script>
