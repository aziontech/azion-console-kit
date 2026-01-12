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
        field: 'lastEditor',
        header: 'Last Editor',
        sortField: 'last_editor',
        filterPath: 'last_editor'
      },
      {
        field: 'lastModified',
        header: 'Last Modified',
        sortField: 'lastModified',
        filterPath: 'lastModified'
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
        description="Define and manage variables that store configuration values across Azion’s products."
      >
        <template #default>
          <DataTableActionsButtons
            size="small"
            label="Variable"
            @click="handleTrackEvent"
            createPagePath="variables/create"
            data-testid="create_Variable_button"
            :documentationService="documentationService"
            :viewDocumentationIsVisible="true"
            :getHelpLinkIsVisible="false"
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
        editPagePath="/variables/edit"
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
          title: 'No Variables yet',
          description: 'Create your first variable to define reusable configuration values for platform resources.',
          createButtonLabel: 'Variable',
          createPagePath: 'variables/create',
          documentationService: props.documentationService
        }"
      />
    </template>
  </ContentBlock>
</template>
