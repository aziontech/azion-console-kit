<template>
  <div :class="cardClasses">
    <header class="flex w-full items-center justify-between gap-2 py-3 px-6">
      <span class="w-full gap-2 flex">
        <PrimeTag
          icon="pi pi-user"
          severity="primary"
          :pt="{ icon: { class: 'mr-0' } }"
        />
        <span class="font-medium overflow-hidden overflow-ellipsis break-all">{{ title }}</span>
      </span>
      <span class="flex gap-4">
        <PrimeButton
          icon="pi pi-question-circle"
          text
          aria-label="Get help"
          size="small"
          @click="console.log('help')"
        />
        <PrimeButton
          icon="pi pi-ellipsis-h"
          text
          aria-label="More options"
          size="small"
          @click="console.log('more options')"
        />
      </span>
    </header>
    <PrimeDivider />
    <div class="flex flex-col gap-4 bg-black">OK</div>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import PrimeTag from 'primevue/tag'
  import PrimeButton from 'primevue/button'
  import PrimeDivider from 'primevue/divider'

  defineOptions({ name: 'GraphsCardBlock' })

  const props = defineProps({
    title: String,
    cols: {
      type: Number,
      default: 8,
      validator(value) {
        return [4, 6, 8, 12].includes(value)
      }
    }
  })

  const cardClasses = computed(() => {
    return `col-span-${props.cols} rounded-md h-[552px] border`
  })
</script>
