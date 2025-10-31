<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Variables" />
    </template>
    <template #content>
      <ListTableBlock
        @on-before-go-to-edit="checkIfIsEditable"
        @on-before-go-to-add-page="handleTrackEvent"
        :listService="listVariablesService"
        :columns="getColumns"
        addButtonLabel="Variable"
        createPagePath="variables/create"
        editPagePath="variables/edit"
        ref="refListTable"
        @on-load-data="handleLoadData"
        emptyListMessage="No variables found."
        :actions="actions"
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

<script setup>
  import { onBeforeRouteLeave } from 'vue-router'
  import ContentBlock from '@/templates/content-block'
  import ListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { h, computed, ref, inject } from 'vue'

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
        style: 'max-width: 240px',
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
