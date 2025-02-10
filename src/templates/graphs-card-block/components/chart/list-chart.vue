<script setup>
  import ListTableBlock from '@templates/list-table-block/graphic.vue'
  const props = defineProps({
    resultChart: Array
  })
</script>

<template>
  <div class="w-full h-full">
    <ListTableBlock
      scrollHeight="385px"
      :data="props.resultChart[0].data"
      :columns="props.resultChart[0].columns"
      smallRow
      hiddenHeader
    />
  </div>
</template>
