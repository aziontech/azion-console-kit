<template>
  <div :class="[cardColumns, 'flex flex-col rounded-md h-[552px] border col-span-12']">
    <header class="flex w-full items-center justify-between gap-2 py-3 px-6">
      <span class="w-full gap-2 flex">
        <ChartOwner :chartOwner="chartOwner" />
        <span class="font-medium overflow-ellipsis break-all line-clamp-1">{{ title }}</span>
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
    <div class="flex h-full flex-col gap-6 flex-auto p-6">
      <div class="flex flex-col gap-2">
        <span class="break-all">{{ description }}</span>
        <slot name="aggregation" />
      </div>
      <section class="flex-auto bg-slate-400 gap-2">Chart</section>
    </div>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import PrimeButton from 'primevue/button'
  import PrimeDivider from 'primevue/divider'
  import ChartOwner from './components/chart-owner.vue'

  defineOptions({ name: 'GraphsCardBlock' })

  const props = defineProps({
    chartOwner: {
      type: String,
      default: 'azion',
      validator(value) {
        return ['azion', 'account', 'user'].includes(value)
      }
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    cols: {
      type: Number,
      default: 6,
      validator(value) {
        return [4, 6, 8, 12].includes(value)
      }
    }
  })

  const cardColumns = computed(() => {
    // For some reason, template strings do not work here
    switch (props.cols) {
      case 4:
        return 'lg:col-span-4'
      case 8:
        return 'lg:col-span-8'
      case 12:
        return 'lg:col-span-12'
      default:
        return 'lg:col-span-6'
    }
  })
</script>
