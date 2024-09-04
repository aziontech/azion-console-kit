<script setup>
  import ListTableBlock from '@templates/list-table-block/index'

  const props = defineProps({
    resultChart: Array
  })

  const loadResultChartDataWithPromisse = () => {
    return new Promise((resolve) => {
      resolve(props.resultChart[0].data)
    })
  }
</script>

<template>
  <div class="w-full h-full overflow-scroll overscroll-contain">
    <ListTableBlock
      :listService="loadResultChartDataWithPromisse"
      :columns="props.resultChart[0].columns"
    />
  </div>
</template>
