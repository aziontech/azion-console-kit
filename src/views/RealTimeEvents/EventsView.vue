<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Real-Time Events" />
    </template>
    <template #content>
      <TabsPageBlock
        v-model:tabIndex="tabIndex"
        :tabs="TABLES_FOR_TABS"
        v-model="tableSelected"
        @changeTab="load"
      >
        <template #filter="{ table }">
          <div class="flex flex-col gap-8 my-4">
            <div class="flex gap-1">
              <p class="text-xs font-medium leading-4">Specification</p>
              <p class="text-xs font-normal leading-4">
                {{ table.description }}
              </p>
            </div>
            <IntervalFilterBlock
              v-model:filterDate="filterDate"
              :intervalOptions="DATE_TIME_INTERVALS"
              @applyTSRange="load"
            />
          </div>
        </template>
        <template>
          <div>
            {{ result }}
          </div>
        </template>
      </TabsPageBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { ref, watch } from 'vue'
  import IntervalFilterBlock from './blocks/interval-filter-block.vue'
  import TABLES_FOR_TABS from './constants/tablesForTabs'
  import DATE_TIME_INTERVALS from '@/stores/metrics-store/constants/date-time-interval'
  import bodyGQL from './constants/bodyGQL'
  import TabsPageBlock from './blocks/tabs-page-block'

  const props = defineProps({
    BeholderEventsGQL: {
      type: Function,
      required: true
    }
  })

  const tabIndex = ref()
  const tableSelected = ref({})
  const filterDate = ref({})
  const requestController = ref(null)
  const result = ref(null)

  const load = async () => {
    if (requestController.value) {
      requestController.value.abortGQL()
    }

    requestController.value = new props.BeholderEventsGQL()

    const resultQuery = bodyGQL({ filterDate: filterDate.value }, tableSelected.value.table)

    result.value = await requestController.value.gql(resultQuery)
  }

  watch(
    () => filterDate.value,
    () => {
      console.log('filterDate changed')
      load()
    }
  )
</script>
