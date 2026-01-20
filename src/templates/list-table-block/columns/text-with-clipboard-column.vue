<template>
  <div
    class="gap-2 flex items-center w-full justify-between pr-1"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <expand-text-column :value="content"></expand-text-column>
    <CopyBlock
      :value="content"
      :isCopyVisible="isHovered"
      v-tooltip.top="{ value: 'Copy to clipboard', showDelay: 200 }"
    />
  </div>
</template>

<script>
  import ExpandTextColumn from './expand-text-column.vue'
  import CopyBlock from '@/templates/copy-block/copy-block.vue'
  export default {
    name: 'text-with-clipboard-column',
    components: {
      ExpandTextColumn,
      CopyBlock
    },
    data() {
      return {
        isHovered: false
      }
    },
    props: {
      content: {
        type: String,
        required: true
      }
    }
  }
</script>
