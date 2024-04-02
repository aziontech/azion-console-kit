<template>
  <section class="w-full min-h-[calc(100vh-120px)] relative">
    <section class="w-full h-full flex flex-col max-w-screen-2xl-test mx-auto">
      <Message
        severity="warn"
        :closable="false"
        :pt="{
          root: { class: 'mx-3 mt-4 sm:mx-8' },
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
          The new Azion Console is in preview. You may encounter minor issues during this time. Your
          feedback is valuable.
        </p>
      </Message>
      <div
        class="mx-3 sm:mx-8 mt-4"
        v-if="hasHeadingSlot"
      >
        <slot name="heading"></slot>
      </div>
      <div
        class="mx-3 sm:mx-8 mb-8 h-full"
        :class="{ 'mt-4 sm:mt-8': !hasHeadingSlot, 'mt-4': hasHeadingSlot }"
      >
        <slot name="content"></slot>
      </div>
    </section>
    <div
      class="sticky bottom-0"
      id="action-bar"
    ></div>
  </section>
</template>
<script setup>
  defineOptions({ name: 'ContentBlock' })

  import Message from 'primevue/message'
  import Avatar from 'primevue/avatar'

  import { computed, useSlots } from 'vue'
  const slots = useSlots()
  const hasHeadingSlot = computed(() => !!slots.heading)
</script>
