<script setup>
  import CreateModalBlock from './index.vue'

  defineOptions({
    name: 'make-create-modal-block'
  })

  defineProps({
    solutions: {
      type: Object,
      required: true
    },
    loading: {
      type: Object,
      required: true
    }
  })
</script>

<template>
  <CreateModalBlock
    :solutions="solutions"
    :loading="loading"
  />
</template>
