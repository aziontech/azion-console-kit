<script setup>
  import { computed } from 'vue'

  const props = defineProps({
    metric: {
      type: Object,
      required: true
    },
    index: {
      type: Number,
      default: 0
    }
  })

  const trendClasses = computed(() => {
    const isUp = props.metric.trend?.direction === 'up'
    return {
      background: isUp ? 'bg-[rgba(22,163,74,0.2)]' : 'bg-[rgba(245,61,61,0.2)]',
      icon: isUp
        ? 'pi pi-arrow-circle-up text-[#39e478]'
        : 'pi pi-arrow-circle-down text-[#f53d3d]',
      text: isUp ? 'text-[#39e478]' : 'text-[#f53d3d]'
    }
  })
</script>

<template>
  <div
    class="bg-[var(--surface-section)] h-[101px] p-5 flex flex-col gap-2.5 w-1/2 lg:w-1/4 lg:flex-1"
    :class="[
      index % 2 !== 0 ? 'border-l border-[var(--surface-border)]' : '',
      index >= 2 ? 'border-t border-[var(--surface-border)] lg:border-t-0' : '',
      index >= 1 ? 'lg:border-l lg:border-[var(--surface-border)]' : ''
    ]"
  >
    <div class="flex items-center justify-between w-full">
      <div class="flex flex-1 gap-2 items-center">
        <span
          class="text-[10px] uppercase tracking-[1px] text-[var(--text-color-secondary)] font-medium"
          style="font-family: 'Proto Mono', monospace"
        >
          {{ metric.label }}
        </span>
        <div
          v-tooltip.top="metric.tooltip"
          class="bg-[var(--surface-input)] p-[5px] rounded-full flex items-center cursor-help"
        >
          <i class="pi pi-info-circle text-[7px]"></i>
        </div>
      </div>
    </div>

    <div class="flex gap-2 items-center w-full">
      <div class="flex gap-1 items-center">
        <span class="text-[28px] font-semibold tracking-[-1.4px] text-[#ededed]">
          {{ metric.value }}
        </span>
        <span class="text-xs text-[#ededed]">{{ metric.unit }}</span>
      </div>

      <div
        v-if="metric.trend"
        class="flex gap-2 items-center px-2 py-1 rounded-md"
        :class="trendClasses.background"
      >
        <i
          class="text-[10.5px]"
          :class="trendClasses.icon"
        ></i>
        <span
          class="text-[11px] font-semibold leading-4"
          :class="trendClasses.text"
        >
          {{ metric.trend.percentage }}
        </span>
      </div>
    </div>
  </div>
</template>
