<template>
  <block-status-configuration-block
    isDrawer
    :isEdit="isOption"
    :optionsStatusCode="optionsStatusCode"
  />
  <block-response-details-block
    isDrawer
    :isEdit="isOption"
  />
</template>

<script setup>
  import blockStatusConfigurationBlock from '@/views/CustomPages/Blocks/statusConfigurationBlock'
  import blockResponseDetailsBlock from '@/views/CustomPages/Blocks/responseDetailsBlock'
  import { computed } from 'vue'
  const props = defineProps({
    itemStatusCode: {
      type: Object,
      default: () => ({})
    },
    optionsStatusCode: {
      type: Array,
      default: () => []
    }
  })

  const isOption = computed(() => !!props.itemStatusCode.code)
</script>
