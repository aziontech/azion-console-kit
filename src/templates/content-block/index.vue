<template>
  <section class="w-full flex flex-col flex-1 relative">
    <section
      class="w-full flex flex-col flex-1"
      :class="classPadding"
    >
      <div v-if="hasHeadingSlot">
        <slot name="heading" />
      </div>
      <div
        class="h-full flex flex-1 flex-col"
        :class="{ 'mt-4': hasHeadingSlot }"
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
  const props = defineProps({
    disablePadding: {
      type: Boolean,
      default: false
    }
  })

  const classPadding = props.disablePadding ? '' : 'px-8 pt-4 pb-8'
  import { computed, useSlots } from 'vue'
  const slots = useSlots()
  const hasHeadingSlot = computed(() => !!slots.heading)
</script>
