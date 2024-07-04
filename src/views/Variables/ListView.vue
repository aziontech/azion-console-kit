<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Variables" />
    </template>
    <template #content>
      <ListTableBlock
        v-if="hasContentToList"
        :listService="listVariablesService"
        :columns="getColumns"
        addButtonLabel="Variable"
        createPagePath="variables/create"
        editPagePath="variables/edit"
        @on-load-data="handleLoadData"
        emptyListMessage="No variables found."
        :actions="actions"
      />
      <EmptyResultsBlock
        v-else
        title="No variables have been created"
        description="Click the button below to create your first variable."
        createButtonLabel="Variable"
        createPagePath="variables/create"
        :documentationService="documentationService"
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
  import ListTableBlock from '@/templates/list-table-block/index.vue'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { h, computed, ref } from 'vue'

  defineOptions({ name: 'variables-view' })

  const props = defineProps({
    listVariablesService: {
      required: true,
      type: Function
    },
    deleteVariablesService: {
      required: true,
      type: Function
    },
    clipboardWrite: {
      required: true,
      type: Function
    },
    documentationService: {
      required: true,
      type: Function
    }
  })

  const hasContentToList = ref(true)
  const actions = [
    {
      type: 'delete',
      title: 'variable',
      icon: 'pi pi-trash',
      service: props.deleteVariablesService
    }
  ]

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const getColumns = computed(() => {
    return [
      {
        field: 'key',
        header: 'Key'
      },
      {
        field: 'value',
        header: 'Value',
        type: 'component',
        filterPath: 'value.content',
        component: (columnData) => {
          if (columnData.isSecret) {
            return h('span', `${columnData.content}`)
          } else {
            return columnBuilder({
              data: columnData,
              columnAppearance: 'text-with-clipboard',
              dependencies: {
                copyContentService: props.clipboardWrite
              }
            })
          }
        }
      },
      {
        field: 'lastEditor',
        header: 'Last Editor'
      },
      {
        field: 'updatedAt',
        sortField: 'updatedAtDate',
        header: 'Last Update'
      }
    ]
  })
</script>
