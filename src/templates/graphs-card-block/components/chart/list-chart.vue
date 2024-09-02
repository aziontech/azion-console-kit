<script setup>
  import ListTableBlock from '@templates/list-table-block/index'
  import { computed } from 'vue'

  const props = defineProps({
    chartData: Object,
    resultChart: Array
  })

  const chartFields = Object.keys(props.resultChart[0])

  const convertChartFieldsToColumns = () => {
    return chartFields.map((item) => {
      return {
        field: item,
        header: item
      }
    })
  }

  const getColumns = computed(convertChartFieldsToColumns)

  const loadResultChartDataWithPromisse = () => {
    return new Promise((resolve) => {
      resolve(props.resultChart)
    })
  }
</script>

<template>
  <div class="w-full h-full overflow-scroll overscroll-contain">
    <ListTableBlock
      :listService="loadResultChartDataWithPromisse"
      :columns="getColumns"
    />
  </div>
</template>
