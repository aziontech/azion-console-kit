<script setup>
  import { computed, inject } from 'vue'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import CloneBlock from '@/templates/clone-block'
  import { wafService } from '@/services/v2/waf/waf-service'
  import { DataTableActionsButtons } from '@/components/DataTable'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  defineProps({
    documentationService: {
      required: true,
      type: Function
    }
  })

  const actions = [
    {
      type: 'dialog',
      label: 'Clone',
      icon: 'pi pi-fw pi-clone',
      dialog: {
        component: CloneBlock,
        body: (item) => ({
          data: {
            service: wafService.cloneWafRule,
            itemType: 'WAF Rule',
            ...item
          }
        })
      }
    },
    {
      type: 'delete',
      label: 'Delete',
      title: 'WAF rule',
      icon: 'pi pi-trash',
      service: wafService.deleteWafRule
    }
  ]

  const allowedFilters = [
    {
      header: 'Name',
      field: 'name'
    },
    {
      header: 'ID',
      field: 'id'
    }
  ]

  const handleTrackClickToCreate = () => {
    tracker.product
      .clickToCreate({
        productName: 'WAF Rules'
      })
      .track()
  }

  const handleTrackClickToEdit = () => {
    tracker.product
      .clickToEdit({
        productName: 'WAF Rules'
      })
      .track()
  }

  const csvMapper = (rowData) => {
    return {
      name: rowData.name,
      id: rowData.id,
      threatsConfiguration: rowData.threatsConfiguration,
      lastEditor: rowData.lastEditor,
      lastModified: rowData.lastModified,
      active: rowData.data?.content || rowData.active
    }
  }

  const getColumns = computed(() => {
    return [
      {
        field: 'name',
        header: 'Name',
        type: 'component',
        style: 'max-width: 240px',
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
        field: 'threatsConfiguration',
        header: 'Threat Type Configuration',
        type: 'component',
        sortField: 'threats_configuration',
        filterPath: 'threats_configuration',
        disableSort: true,
        component: (columnData) =>
          columnBuilder({ data: columnData, columnAppearance: 'text-array-with-popup' })
      },
      {
        field: 'active',
        header: 'Status',
        type: 'component',
        sortField: 'active',
        filterPath: 'active',
        component: (columnData) =>
          columnBuilder({
            data: columnData,
            columnAppearance: 'tag'
          })
      }
    ]
  })
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="WAF Rules">
        <template #default>
          <div class="flex justify-between gap-2 w-full">
            <div class="flex gap-2">
              <DataTableActionsButtons
                size="small"
                label="WAF Rule"
                createPagePath="waf/create"
                @click="handleTrackClickToCreate"
                data-testid="create_WAFRule_button"
              />
            </div>
          </div>
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <FetchListTableBlock
        :listService="wafService.listWafRules"
        :columns="getColumns"
        @on-before-go-to-edit="handleTrackClickToEdit"
        @on-before-go-to-add-page="handleTrackClickToCreate"
        editPagePath="waf/edit"
        @on-load-data="handleLoadData"
        :actions="actions"
        :defaultOrderingFieldName="'-last_modified'"
        :frozenColumns="['name']"
        exportFileName="WAF Rules"
        :csvMapper="csvMapper"
        :allowedFilters="allowedFilters"
        :emptyBlock="{
          title: 'No WAF rules have been created',
          description: 'Click the button below to create your first WAF rule.',
          createButtonLabel: 'WAF Rule',
          createPagePath: 'waf/create',
          documentationService: documentationService
        }"
      />
    </template>
  </ContentBlock>
</template>
