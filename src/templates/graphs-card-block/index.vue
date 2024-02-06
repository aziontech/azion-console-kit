<template>
  <div
    :class="[
      cardColumns,
      'flex flex-col rounded-md h-[552px] border surface-border col-span-12 p-6'
    ]"
  >
    <header class="flex w-full items-center justify-between gap-2">
      <span class="w-full gap-2 flex">
        <ChartOwner :chartOwner="chartOwner" />
        <span class="font-medium overflow-ellipsis break-all line-clamp-1">{{ title }}</span>
      </span>
      <MoreOptionsMenu
        :reportId="reportId"
        :clipboardWrite="clipboardWrite"
      />
    </header>
    <div class="flex h-full flex-col gap-6 flex-auto">
      <div class="flex flex-col">
        <span class="break-words text-sm text-color-secondary font-normal line-height-1 py-3.5">
          {{ description }}
        </span>
        <AggregationInfo
          :aggregationType="aggregationType"
          :variationType="variationType"
          :variationValue="variationValue"
          :displayTag="displayTag"
        />
      </div>
      <section class="flex-auto">
        <slot name="chart" />
      </section>
    </div>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import AggregationInfo from './components/aggregation-info.vue'
  import ChartOwner from './components/chart-owner.vue'
  import MoreOptionsMenu from './components/more-options-menu.vue'

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
    },
    aggregationType: {
      type: String,
      default: 'sum',
      validator(value) {
        return ['sum', 'avg'].includes(value)
      }
    },
    displayTag: {
      type: Boolean,
      default: true
    },
    variationType: {
      type: String,
      default: 'none',
      validator(value) {
        return [
          'none',
          'positive',
          'negative',
          'positive-inverse',
          'negative-inverse',
          'not-compare'
        ].includes(value)
      }
    },
    variationValue: { type: String, default: '' },
    reportId: String,
    clipboardWrite: Function
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
