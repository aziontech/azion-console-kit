<script setup>
  import { computed, inject, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { columnBuilder } from '@/components/list-table/columns/column-builder'
  import CloneBlock from '@/templates/clone-block'
  import ListTable from '@/components/list-table/ListTable.vue'
  import { wafService } from '@/services/v2/waf/waf-service'
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
  const listTableRef = ref(null)

  const handleNavigateToCreate = () => {
    router.push('waf/create')
  }

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

  const hasContentToList = ref(true)

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="WAF Rules"
        description="Define and manage firewall rules that inspect and control workload traffic."
      >
        <template #default>
          <DataTableActionsButtons
            size="small"
            label="WAF Rule"
            createPagePath="waf/create"
            @click="handleTrackClickToCreate"
            data-testid="create_WAFRule_button"
          />
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <ListTable
        ref="listTableRef"
        :listService="wafService.listWafRules"
        :columns="getColumns"
        :actions="actions"
        editPagePath="/waf/edit"
        defaultOrderingFieldName="-last_modified"
        exportFileName="WAF Rules"
        :csvMapper="csvMapper"
        :frozenColumns="['name']"
        :allowedFilters="allowedFilters"
        emptyListMessage="No WAF rules found."
        :emptyBlock="{
          title: 'No WAF Rules yet',
          description: 'Create your first WAF rule to inspect and control incoming requests.',
          createButtonLabel: 'WAF Rule',
          documentationService: documentationService
        }"
        @click-to-create="handleNavigateToCreate"
        @on-load-data="handleLoadData"
        @on-before-go-to-add-page="handleTrackClickToCreate"
        @on-before-go-to-edit="handleTrackClickToEdit"
      />
    </template>
  </ContentBlock>
</template>
