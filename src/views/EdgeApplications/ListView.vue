<script setup>
  import { ref, computed } from 'vue'

  import ListTableBlock from '@/templates/list-table-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'

  defineOptions({ name: 'list-edge-applications' })

  const props = defineProps({
    listEdgeApplicationsService: {
      required: true,
      type: Function
    },
    deleteEdgeApplicationService: {
      required: true,
      type: Function
    },
    documentationService: {
      required: true,
      type: Function
    }
  })

  const hasContentToList = ref(true)

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const getColumns = computed(() => {
    return [
      {
        field: 'name',
        header: 'Name'
      },
      {
        field: 'origins',
        header: 'Origins',
        type: 'component',
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'expand-column'
          })
        }
      },
      {
        field: 'status',
        header: 'Status',
        type: 'component',
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'tag'
          })
        }
      },
      {
        field: 'lastEditor',
        header: 'Last Editor'
      },
      {
        field: 'lastModify',
        sortField: 'lastModifyDate',
        header: 'Last Modified'
      }
    ]
  })
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edge Applications"></PageHeadingBlock>
    </template>
    <template #content>
      <ListTableBlock
        v-if="hasContentToList"
        pageTitleDelete="Edge Application"
        addButtonLabel="Edge Application"
        createPagePath="/edge-applications/create"
        editPagePath="/edge-applications/edit"
        :listService="props.listEdgeApplicationsService"
        :deleteService="props.deleteEdgeApplicationService"
        :columns="getColumns"
        @on-load-data="handleLoadData"
      />
      <EmptyResultsBlock
        v-else
        title="No edge application added"
        description="Create your first edge application."
        createButtonLabel="Edge Application"
        createPagePath="/edge-applications/create"
        :documentationService="props.documentationService"
      >
        <template #illustration>
          <Illustration />
        </template>
      </EmptyResultsBlock>
    </template>
  </ContentBlock>
</template>
