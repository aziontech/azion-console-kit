<template>
  <div class="gap-2 flex items-center w-full justify-between pr-1">
    <expand-text-column :value="content"></expand-text-column>
    <CopyBlock
      :value="content"
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
    props: {
      content: {
        type: String,
        required: true
      }
    }
  }
</script>
