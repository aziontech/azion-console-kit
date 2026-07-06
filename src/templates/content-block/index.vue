<template>
  <section
    class="w-full flex flex-col flex-1 relative"
    :class="{ 'min-h-0': fillHeight }"
  >
    <section
      class="w-full flex flex-col flex-1"
      :class="[classPadding, { 'min-h-0': fillHeight }]"
    >
      <div v-if="hasHeadingSlot">
        <slot name="heading" />
      </div>
      <div
        class="h-full flex flex-1 flex-col"
        :class="[{ 'mt-4': hasHeadingSlot }, { 'min-h-0': fillHeight }]"
      >
        <slot name="content"></slot>
      </div>
    </section>
    <div
      class="sticky bottom-0 z-50"
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
    },
    // Opt-in full-height mode. When true, the block's internal flex column is
    // allowed to shrink below its content (`min-height: 0` on every level) so a
    // height-bounded ancestor propagates a bounded height down to the `#content`
    // slot — enabling a child region to scroll INTERNALLY instead of growing the
    // page. Default `false` preserves the app's content-growth / window-scroll
    // model for every other view (min-height:0 is inert without a bounded
    // ancestor, so this only activates where an ancestor supplies a real height).
    fillHeight: {
      type: Boolean,
      default: false
    }
  })

  const classPadding = props.disablePadding ? '' : 'px-4 md:px-8 pt-3 md:pt-4 pb-4 md:pb-8'
  import { computed, useSlots } from 'vue'
  const slots = useSlots()
  const hasHeadingSlot = computed(() => !!slots.heading)
</script>
