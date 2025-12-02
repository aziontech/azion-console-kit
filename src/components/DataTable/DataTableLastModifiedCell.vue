<template>
  <div
    :data-testid="`list-table-block__column__lastModify__row`"
    class="cursor-pointer flex items-center max-w-[234px] overflow-hidden"
    @mouseenter="(event) => handleMouseEnter(event, rowData)"
    @mouseleave="handleMouseLeave"
  >
    <div class="text-ellipsis whitespace-nowrap overflow-hidden block">
      <span>{{ rowData.lastModify || rowData.lastModified }}</span>
      <span
        v-if="rowData.lastEditor && rowData.lastEditor !== '-'"
        class="text-xs"
      >
        by {{ rowData.lastEditor }}</span
      >
    </div>
  </div>
</template>

<script setup>
  defineProps({
    rowData: {
      type: Object,
      required: true
    },
    handleMouseEnter: {
      type: Function,
      required: true
    },
    handleMouseLeave: {
      type: Function,
      required: true
    }
  })
</script>
