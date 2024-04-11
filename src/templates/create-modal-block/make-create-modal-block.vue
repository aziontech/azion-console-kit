<script setup>
  import CreateModalBlock from './index.vue'
  import * as MarketplaceService from '@/services/marketplace-services'

  defineOptions({
    name: 'make-create-modal-block'
  })
</script>

<template>
  <CreateModalBlock :listSolutionsService="MarketplaceService.listSolutionsService" />
</template>
