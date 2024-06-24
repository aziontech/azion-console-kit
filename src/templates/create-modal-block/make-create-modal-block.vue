<script setup>
  import CreateModalBlock from './index.vue'
  import * as SolutionsService from '@/services/solutions-services'

  defineOptions({
    name: 'make-create-modal-block'
  })
</script>

<template>
  <CreateModalBlock :listSolutionsService="SolutionsService.listSolutionsService" />
</template>
