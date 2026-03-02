<script setup>
  import { computed, inject, ref } from 'vue'
  import ContentBlock from '@/templates/content-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { customPageService } from '@/services/v2/custom-page/custom-page-service'
  import { COLUMN_STYLES, columnStyles } from '@/helpers/column-styles'
  import { DataTableActionsButtons } from '@/components/DataTable'

  defineOptions({ name: 'list-custom-pages' })
  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const props = defineProps({
    documentationService: {
      required: true,
      type: Function
    }
  })

  const hasContentToList = ref(true)

  const actions = [
    {
      type: 'delete',
      label: 'Delete',
      title: 'custom pages',
      icon: 'pi pi-trash',
      service: customPageService.deleteCustomPagesService
    }
  ]

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const handleTrackEvent = () => {
    tracker.product.clickToCreate({
      productName: 'Custom Pages'
    })
  }

  const handleTrackEditEvent = () => {
    tracker.product.clickToEdit({
      productName: 'Custom Pages'
    })
  }

  const getColumns = computed(() => {
    return [
      {
        field: 'name',
        header: 'Name',
        type: 'component',
        style: columnStyles.priority(2, 200, 350),
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'text-format-with-popup'
          })
        }
      },
      {
        field: 'id',
        header: 'ID',
        sortField: 'id',
        filterPath: 'id',
        style: COLUMN_STYLES.FIT_CONTENT
      },
      {
        field: 'active',
        header: 'Status',
        sortField: 'active',
        filterPath: 'active',
        type: 'component',
        style: COLUMN_STYLES.FIT_CONTENT,
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'tag'
          })
        },
        disableSort: false
      },
      {
        field: 'lastEditor',
        header: 'Last Editor',
        sortField: 'last_editor',
        filterPath: 'last_editor',
        style: COLUMN_STYLES.PRIORITY_SM
      },
      {
        field: 'lastModified',
        header: 'Last Modified',
        sortField: 'lastModified',
        filterPath: 'lastModified',
        style: COLUMN_STYLES.FIT_CONTENT
      }
    ]
  })
</script>

<template>
  <ContentBlock data-testid="custom-pages-content-block">
    <template #heading>
      <PageHeadingBlock
        pageTitle="Custom Pages"
        description="Define custom response pages returned by Workloads when specific criteria are met."
      >
        <template #default>
          <DataTableActionsButtons
            size="small"
            label="Custom Page"
            createPagePath="custom-pages/create"
            data-testid="create_CustomPage_button"
            @click="handleTrackEvent"
          />
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <FetchListTableBlock
        ref="listTableBlockRef"
        editPagePath="/custom-pages/edit"
        :listService="customPageService.listCustomPagesService"
        :columns="getColumns"
        @on-load-data="handleLoadData"
        @on-before-go-to-add-page="handleTrackEvent"
        @on-before-go-to-edit="handleTrackEditEvent"
        emptyListMessage="No Custom Pages found."
        data-testid="custom-pages-list-table-block"
        :actions="actions"
        :defaultOrderingFieldName="'-last_modified'"
        :frozen-columns="['name']"
        exportFileName="Custom Pages"
        :allowedFilters="getColumns"
        :emptyBlock="{
          title: 'No Custom Pages yet',
          description: 'Create your first custom page to control responses for defined conditions.',
          createPagePath: '/custom-pages/create',
          createButtonLabel: 'Custom Page',
          documentationService: props.documentationService
        }"
      />
    </template>
  </ContentBlock>
</template>
