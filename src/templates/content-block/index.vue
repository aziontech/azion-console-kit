<template>
  <section class="w-full min-h-[calc(100vh-120px)] relative">
    <section class="w-full h-full flex flex-col max-w-screen-2xl mx-auto">
      <Message
        severity="warn"
        :closable="false"
        :pt="{
          root: { class: 'mx-3 sm:mx-8 mt-4' },
          wrapper: { class: 'py-3 px-8 ' }
        }"
      >
        <template #messageicon>
          <Avatar
            icon="pi pi-exclamation-triangle"
            class="bg-yellow-600 bg-opacity-20 text-yellow-600 mr-2 min-w-[32px]"
          />
        </template>
        <p class="text-color-secondary">
          <b class="text-color">Ongoing Experiment.</b>
          Our platform is in its early release stage. Please bear with us as occasional instability or bugs may occur during this time.
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
