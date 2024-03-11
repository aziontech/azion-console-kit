<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edge Functions" />
    </template>
    <template #content>
      <ListTableBlock
        v-if="hasContentToList"
        :listService="props.listEdgeFunctionsService"
        :deleteService="props.deleteEdgeFunctionsService"
        :columns="getColumns"
        pageTitleDelete="edge function"
        addButtonLabel="Edge Function"
        createPagePath="edge-functions/create"
        editPagePath="edge-functions/edit"
        @on-load-data="handleLoadData"
        emptyListMessage="No edge function found."
      />
      <EmptyResultsBlock
        v-else
        title="No functions have been created"
        description="Create your first function here."
        createButtonLabel="Edge Function"
        createPagePath="edge-functions/create"
        :documentationService="props.documentationService"
      >
        <template #illustration>
          <Illustration />
        </template>
      </EmptyResultsBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import ContentBlock from '@/templates/content-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import ListTableBlock from '@/templates/list-table-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { computed, ref } from 'vue'

  const props = defineProps({
    listEdgeFunctionsService: {
      required: true,
      type: Function
    },
    deleteEdgeFunctionsService: {
      required: true,
      type: Function
    },
    documentationService: {
      required: true,
      type: Function
    }
  })

  let hasContentToList = ref(true)

  const getColumns = computed(() => [
    {
      field: 'name',
      header: 'Name',
      filterPath: 'name.text',
      type: 'component',
      component: (columnData) => {
        return columnBuilder({
          data: columnData,
          columnAppearance: 'text-with-tag'
        })
      }
    },
    {
      field: 'version',
      header: 'Version'
    },
    {
      field: 'referenceCount',
      header: 'Ref. Count'
    },
    {
      field: 'language',
      header: 'Language',
      filterPath: 'language.content',
      type: 'component',
      component: (columnData) => {
        return columnBuilder({
          data: columnData,
          columnAppearance: 'language-icon-with-text'
        })
      }
    },
    {
      field: 'initiatorType',
      header: 'Initiator Type'
    },
    {
      field: 'lastEditor',
      header: 'Last Editor'
    },
    {
      field: 'lastModified',
      sortField: 'lastModifiedDate',
      header: 'Last Modified'
    },
    {
      field: 'status',
      header: 'Status',
      filterPath: 'status.content',
      type: 'component',
      component: (columnData) => {
        return columnBuilder({
          data: columnData,
          columnAppearance: 'tag'
        })
      }
    }
  ])

  function handleLoadData(event) {
    hasContentToList.value = event
  }
</script>
