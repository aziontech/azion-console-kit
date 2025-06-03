<script setup>
  import { computed, inject, ref } from 'vue'
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import ContentBlock from '@/templates/content-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import { customPageService } from '@/services/v2'

  defineOptions({ name: 'list-custom-pages' })
  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const props = defineProps({
    listCustomPagesService: {
      required: true,
      type: Function
    },
    deleteCustomPagesService: {
      required: true,
      type: Function
    },
    documentationService: {
      required: true,
      type: Function
    },
    createCustomPagesService: {
      required: true,
      type: Function
    },
    loadCustomPagesService: {
      required: true,
      type: Function
    },
    editCustomPagesService: {
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
      service: props.deleteCustomPagesService
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
        field: 'lastEditor',
        header: 'Last Editor'
      },
      {
        field: 'lastModified',
        sortField: 'lastModified',
        header: 'Last Modified'
      },
      {
        field: 'default',
        header: 'Default',
        sortField: 'default',
        filterPath: 'default',
        type: 'component',
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'tag'
          })
        },
        disableSort: false
      },
      {
        field: 'active',
        header: 'Active',
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
    'default',
    'active'
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
        v-if="hasContentToList"
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
        :defaultOrderingFieldName="'name'"
      />
      <EmptyResultsBlock
        v-else
        title="No custom pages have been created"
        description="Click the button below to create your first custom page."
        createButtonLabel="Custom Page"
        createPagePath="custom-pages/create"
        :documentationService="props.documentationService"
        data-testid="custom-pages-empty-results-block"
      >
        <template #illustration>
          <Illustration />
        </template>
      </EmptyResultsBlock>
    </template>
  </ContentBlock>
</template>
