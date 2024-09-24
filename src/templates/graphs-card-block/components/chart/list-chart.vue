<script setup>
  import ListTableBlock from '@templates/list-table-block/index'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import { onMounted, ref } from 'vue'

  const columns = ref([
    {
      field: 'geolocCountryName',
      header: 'Country',
      type: 'component',
      filterPath: 'geolocCountryName.geolocCountryName',
      component: (columnData) => {
        return columnBuilder({
          data: columnData,
          columnAppearance: 'country-flag-column'
        })
      }
    }
  ])
  const props = defineProps({
    resultChart: Array
  })

  const handlesDynimacColumns = () => {
    const indexToRemove = props.resultChart[0].columns.findIndex((item) =>
      item.field.includes('Country')
    )
    const field = props.resultChart[0].columns[indexToRemove].field

    if (indexToRemove !== -1) {
      columns.value[0].field = field
      columns.value[0].filterPath = `${field}.${field}`
      columns.value.unshift(...props.resultChart[0].columns.filter((item) => item.field !== field))
    } else {
      columns.value.shift()
      columns.value.push(...props.resultChart[0].columns)
    }
  }

  const loadResultChartDataWithPromisse = () => {
    return new Promise((resolve) => {
      resolve(props.resultChart[0].data)
    })
  }

  onMounted(() => {
    handlesDynimacColumns()
  })
</script>

<template>
  <div class="w-full h-full overflow-scroll overscroll-contain">
    <ListTableBlock
      :listService="loadResultChartDataWithPromisse"
      :columns="columns"
    />
  </div>
</template>
