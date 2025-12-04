<script setup>
  import { onBeforeRouteLeave } from 'vue-router'
  import ContentBlock from '@/templates/content-block'
  import ListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { h, computed, ref, inject } from 'vue'
  import { DataTableActionsButtons } from '@/components/DataTable'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

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

  const enableRedirect = ref(true)
  const refListTable = ref()
  const hasContentToList = ref(true)
  const actions = [
    {
      label: 'Delete',
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
        style: 'max-width: 300px',
        component: (columnData) => {
          if (columnData.isSecret) {
            return h('span', `${columnData.content}`)
          } else {
            return columnBuilder({
              data: columnData.content,
              columnAppearance: 'text-format-with-popup',
              dependencies: {
                showCopy: props.clipboardWrite
              }
            })
          }
        }
      },
      {
        field: 'last_modified',
        header: 'Last Modified',
        sortField: 'last_modified',
        filterPath: 'last_modified',
        type: 'component',
        component: (columnData, rowData, dependencies) => {
          return columnBuilder({
            data: rowData,
            columnAppearance: 'last-modified',
            dependencies
          })
        }
      }
    ]
  })

  const checkIfIsEditable = (item) => {
    tracker.product.clickToEdit({
      productName: 'Variable'
    })
    enableRedirect.value = !item.value.isSecret
  }

  onBeforeRouteLeave((to, from, next) => {
    if (enableRedirect.value) {
      return next()
    }
    enableRedirect.value = true
    return next(false)
  })

  const handleTrackEvent = () => {
    tracker.product.clickToCreate({
      productName: 'Variable'
    })
  }
</script>
<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Variables"
        description="Store and manage environment variables for solutions."
      >
        <template #default>
          <DataTableActionsButtons
            size="small"
            label="Variable"
            @click="handleTrackEvent"
            createPagePath="variables/create"
            data-testid="create_Variable_button"
          />
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <ListTableBlock
        @on-before-go-to-edit="checkIfIsEditable"
        @on-before-go-to-add-page="handleTrackEvent"
        :listService="listVariablesService"
        :columns="getColumns"
        editPagePath="variables/edit"
        ref="refListTable"
        @on-load-data="handleLoadData"
        emptyListMessage="No variables found."
        :actions="actions"
        :lazy="false"
        :filters="[
          {
            field: 'key',
            header: 'Key'
          }
        ]"
        :empty-block="{
          title: 'No variables have been created',
          description: 'Click the button below to create your first variable.',
          createButtonLabel: 'Variable',
          createPagePath: 'variables/create',
          documentationService: props.documentationService
        }"
      />
    </template>
  </ContentBlock>
</template>
