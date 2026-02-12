<template>
  <div class="gap-2 flex items-center">
    {{ content || '-' }}
    <CopyBlock
      :value="content"
      v-tooltip.top="{ value: 'Copy to clipboard', showDelay: 200 }"
    />
  </div>
</template>

<script setup>
  import CopyBlock from '@/templates/copy-block/copy-block.vue'
  defineOptions({ name: 'text-full-with-clipboard-column' })

  defineProps({
    content: {
      type: String
    }
  })
</script>
