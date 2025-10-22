<script setup>
  import { computed, inject, ref } from 'vue'
  import ContentBlock from '@/templates/content-block'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import { customPageService } from '@/services/v2/custom-page/custom-page-service'

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
        header: 'Name'
      },
      {
        field: 'id',
        header: 'ID',
        sortField: 'id',
        filterPath: 'id'
      },
      {
        field: 'lastEditor',
        header: 'Last Editor'
      },
      {
        field: 'lastModify',
        sortField: 'lastModified',
        header: 'Last Modified'
      },
      {
        field: 'active',
        header: 'Status',
        sortField: 'active',
        filterPath: 'active',
        type: 'component',
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'tag'
          })
        },
        disableSort: false
      }
    ]
  })

  const CUSTOM_PAGES_API_FIELDS = [
    'id',
    'name',
    'last_editor',
    'last_modified',
    'active',
    'last_modify'
  ]
</script>

<template>
  <ContentBlock data-testid="custom-pages-content-block">
    <template #heading>
      <PageHeadingBlock
        pageTitle="Custom Pages"
        data-testid="custom-pages-heading"
      />
    </template>
    <template #content>
      <FetchListTableBlock
        ref="listTableBlockRef"
        addButtonLabel="Custom Page"
        createPagePath="custom-pages/create"
        editPagePath="custom-pages/edit"
        :listService="customPageService.listCustomPagesService"
        :columns="getColumns"
        :apiFields="CUSTOM_PAGES_API_FIELDS"
        @on-load-data="handleLoadData"
        @on-before-go-to-add-page="handleTrackEvent"
        @on-before-go-to-edit="handleTrackEditEvent"
        emptyListMessage="No Custom Pages found."
        data-testid="custom-pages-list-table-block"
        :actions="actions"
        :defaultOrderingFieldName="'-last_modified'"
        :frozen-columns="['name']"
        :emptyBlock="{
          title: 'No custom pages have been created',
          description: 'Click the button below to create your first custom page.',
          createPagePath: '/custom-pages/create',
          createButtonLabel: 'Custom Page',
          documentationService: props.documentationService
        }"
      />
    </template>
  </ContentBlock>
</template>
