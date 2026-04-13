<script setup>
  import ListTableGraphic from '@/components/list-table/ListTableGraphic.vue'
  import { computed } from 'vue'

  defineOptions({ name: 'list-chart' })

  const props = defineProps({
    resultChart: Array
  })

  const chartData = computed(() => props.resultChart[0].data)
  const columns = computed(() => props.resultChart[0].columns)
</script>

<template>
  <div class="w-full h-full">
    <ListTableGraphic
      :data="chartData"
      :columns="columns"
      scrollHeight="375px"
      emptyListMessage="No registers found."
      smallRow
    />
  </div>
</template>
