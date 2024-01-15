<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Real-Time Metrics" />
    </template>
    <template #content>
      <TabsPageBlock
        :metricsProductsService="fetchMetricsProductsService"
        :metricsGroupsService="fetchMetricsGroupsService"
        :params="routeParams"
      />
    </template>
  </ContentBlock>
</template>

<script setup>
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { onMounted, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import TabsPageBlock from './blocks/tabs-page-block'

  defineProps({
    fetchMetricsGroupsService: {
      type: Function,
      required: true
    },
    fetchMetricsProductsService: {
      type: Function,
      required: true
    }
  })

  const route = useRoute()
  const routeParams = ref({})

  onMounted(() => {
    const { pageId, dashboardId } = route.params
    routeParams.value = { pageId: pageId || '1', dashboardId: dashboardId || '1' }
  })
</script>
