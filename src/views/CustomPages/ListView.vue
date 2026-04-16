<script setup>
  import { computed, inject, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { columnBuilder } from '@/components/list-table/columns/column-builder'
  import { customPageService } from '@/services/v2/custom-page/custom-page-service'
  import ListTable from '@/components/list-table'
  import { DataTableActionsButtons } from '@/components/list-table'

  defineOptions({ name: 'list-custom-pages' })
  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const props = defineProps({
    documentationService: {
      required: true,
      type: Function
    }
  })

  const router = useRouter()
  const listTableRef = ref()

  const handleNavigateToCreate = () => {
    router.push('/custom-pages/create')
  }

  const actions = [
    {
      type: 'delete',
      label: 'Delete',
      title: 'custom pages',
      icon: 'pi pi-trash',
      service: customPageService.deleteCustomPagesService
    }
  ]

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
        style: 'max-width: 300px',
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
        filterPath: 'id'
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

  const allowedFilters = computed(() => {
    return getColumns.value.filter((col) => col.header && col.header !== 'Last Modified')
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
      <ListTable
        ref="listTableRef"
        :listService="customPageService.listCustomPagesService"
        :columns="getColumns"
        :actions="actions"
        editPagePath="/custom-pages/edit"
        defaultOrderingFieldName="-last_modified"
        exportFileName="Custom Pages"
        :lazy="true"
        :frozenColumns="['name']"
        :allowedFilters="allowedFilters"
        :emptyBlock="{
          title: 'No Custom Pages yet',
          description: 'Create your first custom page to control responses for defined conditions.',
          createButtonLabel: 'Custom Page',
          documentationService: props.documentationService
        }"
        @click-to-create="handleNavigateToCreate"
        @on-before-go-to-add-page="handleTrackEvent"
        @on-before-go-to-edit="handleTrackEditEvent"
      />
    </template>
  </ContentBlock>
</template>
