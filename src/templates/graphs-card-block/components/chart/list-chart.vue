<script setup>
  import ListTableBlock from '@templates/list-table-block/graphic.vue'
  import { computed } from 'vue'
  const props = defineProps({
    resultChart: Array
  })

  const HEIGHT_ROW = '375px'
  const chartData = computed(() => props.resultChart[0].data)
  const columns = computed(() => props.resultChart[0].columns)
</script>

<template>
  <div class="w-full h-full">
    <ListTableBlock
      :scrollHeight="HEIGHT_ROW"
      :data="chartData"
      :columns="columns"
      smallRow
      hiddenHeader
    />
  </div>
</template>
