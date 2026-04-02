<script setup>
  import { computed } from 'vue'
  import Skeleton from '@aziontech/webkit/skeleton'

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

  const variationData = computed(() => {
    if (!props.metric.variation || props.metric.variation.value === 0) return null

    const { value, type } = props.metric.variation
    const isPositive = value > 0
    const isSuccess = type === 'regular' ? isPositive : !isPositive

    return {
      background: isSuccess ? 'bg-[rgba(22,163,74,0.2)]' : 'bg-[rgba(245,61,61,0.2)]',
      icon: isPositive ? 'pi pi-arrow-circle-up' : 'pi pi-arrow-circle-down',
      iconColor: isSuccess
        ? 'text-[var(--p-tag-success-color)]'
        : 'text-[var(--p-tag-danger-color)]',
      textColor: isSuccess
        ? 'text-[var(--p-tag-success-color)]'
        : 'text-[var(--p-tag-danger-color)]',
      percentage: `${Math.abs(value).toFixed(2)}%`
    }
  })
</script>

<template>
  <div
    class="bg-[var(--surface-section)] h-[101px] p-5 flex flex-col gap-2.5"
    :class="[
      index % 2 !== 0 ? 'border-l border-[var(--surface-border)]' : '',
      index >= 2 ? 'border-t border-[var(--surface-border)] xl:border-t-0' : '',
      index >= 1 ? 'xl:border-l xl:border-[var(--surface-border)]' : ''
    ]"
  >
    <div class="flex items-center justify-between w-full">
      <div class="flex flex-1 gap-2 items-center">
        <span
          class="text-[10px] font-mono uppercase tracking-[1px] var(--text-color-secondary) font-medium"
        >
          {{ metric.label }}
        </span>
        <div
          v-tooltip.top="metric.tooltip"
          class="bg-[var(--surface-400)] p-[5px] rounded-full flex items-center"
        >
          <i class="pi pi-info-circle text-[var(--text-color-primary)] text-[10px]"></i>
        </div>
      </div>
    </div>

    <div class="flex gap-2 items-center w-full">
      <div
        v-if="metric.isLoading"
        class="flex gap-1 items-center"
      >
        <Skeleton
          width="80px"
          height="28px"
        />
      </div>
      <div
        v-else
        class="flex gap-1 items-center"
      >
        <span class="text-[28px] font-semibold tracking-[-1.4px] var(--text-color-primary)">
          {{ metric.value }}
        </span>
        <span class="text-xs text-[var(--text-color-secondary)]">{{ metric.unit }}</span>
      </div>

      <i
        v-if="metric.isVariationLoading && !metric.isLoading"
        class="pi pi-spin pi-spinner text-[var(--text-color-secondary)] text-sm"
      />
      <div
        v-else-if="variationData && !metric.isLoading"
        class="flex gap-2 items-center px-2 py-1 rounded-md"
        :class="variationData.background"
      >
        <i
          class="text-[10.5px]"
          :class="[variationData.icon, variationData.iconColor]"
        ></i>
        <span
          class="text-[11px] font-semibold leading-4"
          :class="variationData.textColor"
        >
          {{ variationData.percentage }}
        </span>
      </div>
    </div>
  </div>
</template>
