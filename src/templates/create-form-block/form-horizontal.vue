<template>
  <fieldset
    class="flex max-w-screen-2xl-test mx-auto gap-8 w-full surface-section px-8 py-8 rounded-md flex-wrap min-w-[2rem]"
    :class="[
      {
        'lg:flex-nowrap xl:py-14 xl:p-14 lg:gap-16': !isDrawer,
        'border surface-border ': !noBorder,
        'first:py-0': noBorder,
        [severityClasses]: severityClasses
      },
      pt.root
    ]"
  >
    <!-- title and description -->
    <div
      class="flex flex-col gap-2 flex-1 w-full md:min-w-[15rem]"
      :class="pt.titleContainer"
      v-if="!hiddenTitle"
    >
      <div
        class="text-color text-xl font-medium flex gap-2 items-center"
        :class="pt.title"
      >
        <slot name="title">
          {{ props.title }}
        </slot>
      </div>

      <div
        class="text-color-secondary text-sm font-normal flex flex-col gap-2"
        :class="pt.description"
        style="white-space: pre-line"
      >
        <slot name="description">
          {{ props.description }}
        </slot>
      </div>
    </div>
    <!-- inputs  -->
    <div
      class="max-w-3xl w-full flex flex-col gap-8 max-md:gap-6"
      :class="pt.content"
    >
      <slot name="inputs"></slot>
    </div>
  </fieldset>
</template>
<script setup>
  import { computed } from 'vue'

  const props = defineProps({
    title: { type: String, required: false },
    description: { type: String },
    isDrawer: { type: Boolean, default: false },
    hiddenTitle: { type: Boolean, default: false },
    noBorder: { type: Boolean, default: false },
    severity: { type: String, default: '' },
    pt: { type: Object, default: () => ({}) }
  })

  const severityClasses = computed(() => {
    if (props.severity === 'danger') {
      return 'bg-[#F2646420] border-[#C4170B]'
    }
    return ''
  })
</script>
