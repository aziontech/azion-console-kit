<script setup>
  import { computed, inject, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ContentBlock from '@/templates/content-block'
  import { columnBuilder } from '@/components/list-table/columns/column-builder'
  import { edgeFunctionService } from '@/services/v2/edge-function/edge-function-service'
  import ListTable from '@/components/list-table'
  import { DataTableActionsButtons } from '@/components/list-table'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  defineProps({
    documentationService: {
      required: true,
      type: Function
    }
  })

  const router = useRouter()
  const listTableRef = ref()

  const handleNavigateToCreate = () => {
    router.push('functions/create?origin=list')
  }

  const actions = [
    {
      label: 'Delete',
      type: 'delete',
      title: 'Function',
      icon: 'pi pi-trash',
      service: edgeFunctionService.deleteEdgeFunctionService
    }
  ]

  const handleCreateTrackEvent = () => {
    tracker.product.clickToCreate({
      productName: 'Edge Functions'
    })
  }

  const handleTrackEditEvent = () => {
    tracker.product.clickToEdit({
      productName: 'Edge Functions'
    })
  }

  const csvMapper = (rowData) => {
    return {
      name: rowData.data?.text || rowData.name,
      id: rowData.id,
      version: rowData.version,
      referenceCount: rowData.referenceCount,
      vendor: rowData.data?.vendor,
      runtime: rowData.data?.content,
      executionEnvironment: rowData.data?.executionEnvironment,
      lastEditor: rowData.data?.lastEditor,
      lastModified: rowData.data?.lastModified,
      status: rowData.data?.content
    }
  }

  const allowedFilters = [
    {
      header: 'Name',
      field: 'name'
    },
    {
      header: 'ID',
      field: 'id'
    },
    {
      header: 'Initiator Type',
      field: 'execution_environment'
    },
    {
      header: 'Status',
      field: 'active'
    }
  ]

  const getColumns = computed(() => [
    {
      field: 'name',
      header: 'Name',
      filterPath: 'name.text',
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
      field: 'version',
      header: 'Version'
    },
    {
      field: 'referenceCount',
      header: 'Ref. Count'
    },
    {
      field: 'vendor',
      header: 'Vendor',
      type: 'component',
      component: (columnData) => {
        return columnBuilder({
          data: {
            vendorData: columnData,
            iconClass: 'pi pi-shopping-cart text-xl'
          },
          columnAppearance: 'icon-with-tooltip'
        })
      }
    },
    {
      field: 'runtime',
      header: 'Language',
      filterPath: 'runtime.content',
      type: 'component',
      component: (columnData) => {
        return columnBuilder({
          data: columnData,
          columnAppearance: 'language-icon-with-text'
        })
      }
    },
    {
      field: 'executionEnvironment',
      header: 'Initiator Type'
    },
    {
      field: 'status',
      header: 'Status',
      sortField: 'active',
      filterPath: 'active',
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
  ])
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Functions"
        description="Define and manage functions that execute code in response to firewall or application events."
      >
        <template #default>
          <DataTableActionsButtons
            size="small"
            label="Function"
            @click="handleCreateTrackEvent"
            createPagePath="functions/create?origin=list"
            data-testid="create_Function_button"
          />
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <ListTable
        ref="listTableRef"
        :listService="edgeFunctionService.listEdgeFunctionsService"
        :columns="getColumns"
        :actions="actions"
        editPagePath="/functions/edit"
        defaultOrderingFieldName="-last_modified"
        exportFileName="Functions"
        emptyListMessage="No functions found."
        :csvMapper="csvMapper"
        :lazy="true"
        :frozenColumns="['name']"
        :allowedFilters="allowedFilters"
        :emptyBlock="{
          title: 'No Functions yet',
          description:
            'Create your first function to execute code at Azion\'s global infrastructure.',
          createButtonLabel: 'Function',
          documentationService: documentationService
        }"
        @click-to-create="handleNavigateToCreate"
        @on-before-go-to-add-page="handleCreateTrackEvent"
        @on-before-go-to-edit="handleTrackEditEvent"
      />
    </template>
  </ContentBlock>
</template>
