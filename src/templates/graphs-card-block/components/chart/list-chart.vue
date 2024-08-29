<script setup>
  import ListTableBlock from '@templates/list-table-block/index'
  import { computed } from 'vue'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'

  const props = defineProps({
    chartData: Object,
    resultChart: Array
  })

  const getColumns = computed(() => {
    return [
      {
        field: 'count',
        header: 'Count'
      },
      {
        field: 'countryFlag',
        header: 'Country',
        type: 'component',
        filterPath: 'country.country',
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'country-flag-column'
          })
        }
      },
      {
        field: 'bandwidthTotal',
        header: 'Total Bandwidth'
      },
      {
        field: 'bandwidthMissedData',
        header: 'Missed Data Bandwidth'
      }
    ]
  })

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
