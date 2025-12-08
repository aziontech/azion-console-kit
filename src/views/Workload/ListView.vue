<script setup>
  import ContentBlock from '@/templates/content-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import { useToast } from 'primevue/usetoast'
  import { INFORMATION_TEXTS, TEXT_DOMAIN_WORKLOAD } from '@/helpers'

  const handleTextDomainWorkload = TEXT_DOMAIN_WORKLOAD()
  import { workloadService } from '@/services/v2/workload/workload-service'
  import { deleteDomainService } from '@/services/domains-services'
  import * as Helpers from '@/helpers'

  import PageHeadingBlock from '@/templates/page-heading-block'
  import { computed, inject } from 'vue'
  import { DataTableActionsButtons } from '@/components/DataTable'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const createDomainPath = `${handleTextDomainWorkload.pluralLabel}/create?origin=list`
  const toast = useToast()
  const DOMAINS_API_FIELDS = [
    'name',
    'domains',
    'workload_domain',
    'infrastructure',
    'active',
    'last_modified',
    'id',
    'last_editor',
    'product_version',
    'workload_domain'
  ]

  const columnsHiddenByDefault = ['lastEditor', 'protocols']

  const isWorkload = computed(() => handleTextDomainWorkload.singularLabel === 'workload')
  const actions = [
    {
      label: 'Delete',
      type: 'delete',
      title: `${handleTextDomainWorkload.singularTitle}`,
      icon: 'pi pi-trash',
      tooltip: 'Delete',
      service: isWorkload.value ? workloadService.deleteWorkload : deleteDomainService
    }
  ]

  const handleTrackEvent = () => {
    tracker.product.clickToCreate({
      productName: 'Workload'
    })
  }

  const documentationHandler = () => {
    if (isWorkload.value) {
      Helpers.documentationCatalog.workload()
    } else {
      Helpers.documentationCatalog.domains()
    }
  }

  const handleTrackEditEvent = (domain) => {
    tracker.product.clickToEdit({
      productName: 'Workload'
    })
    if (domain.isLocked) {
      toast.add({
        closable: true,
        severity: 'warn',
        summary: 'Warning',
        detail: INFORMATION_TEXTS.LOCKED_MESSAGE_TOAST
      })
    }
  }

  const domainNameColumn = computed(() => {
    if (handleTextDomainWorkload.singularLabel === 'workload') {
      return 'Workload Domain'
    }
    return 'Domain name'
  })

  const getColumns = computed(() => {
    return [
      {
        field: 'name',
        header: 'Name',
        filterPath: 'name.text',
        type: 'component',
        style: 'max-width: 300px',
        component: (columnData) => {
          return columnBuilder({
            data: columnData.text,
            columnAppearance: 'text-format-with-popup'
          })
        }
      },
      {
        field: 'id',
        header: 'ID',
        filterPath: 'id',
        sortField: 'id'
      },
      {
        field: 'domains',
        header: 'Domains',
        filterPath: 'domains',
        disableSort: true,
        type: 'component',
        style: 'max-width: 300px',
        component: (columnData) => {
          return columnBuilder({
            data: Array.isArray(columnData) ? columnData : columnData?.content,
            columnAppearance: 'text-array-with-popup',
            dependencies: {
              showCopy: !!Helpers.clipboardWrite
            }
          })
        }
      },
      {
        field: 'workloadHostname',
        header: domainNameColumn.value,
        filterPath: 'workloadHostname',
        disableSort: true,
        type: 'component',
        style: 'max-width: 150px',
        component: (columnData) => {
          return columnBuilder({
            data: columnData.content,
            columnAppearance: 'text-format-with-popup',
            dependencies: {
              copyContentService: Helpers.clipboardWrite,
              showCopy: !!Helpers.clipboardWrite
            }
          })
        }
      },
      {
        field: 'infrastructure',
        header: 'Infrastructure',
        filterPath: 'infrastructure',
        sortField: 'infrastructure'
      },
      {
        field: 'active',
        sortField: 'active',
        header: 'Status',
        filterPath: 'active',
        type: 'component',
        component: (columnData) =>
          columnBuilder({
            data: columnData,
            columnAppearance: 'tag'
          })
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
  const allowedFilters = computed(() =>
    getColumns.value.filter((col) => col.field !== 'workloadHostname' && col.field !== 'domains')
  )
  const titleEmptyPage = computed(
    () => `No ${handleTextDomainWorkload.singularTitle} have been created`
  )
  const descriptionEmptyPage = computed(
    () => `Click the button below to create your first ${handleTextDomainWorkload.singularTitle}.`
  )

  const pageDescription = computed(() => {
    return isWorkload.value
      ? 'Deploy and manage scalable workloads across the network.'
      : 'Manage and secure domains for applications.'
  })
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        :pageTitle="`${handleTextDomainWorkload.pluralTitle}`"
        :description="pageDescription"
      >
        <template #default>
          <DataTableActionsButtons
            size="small"
            :label="handleTextDomainWorkload.singularTitle"
            @click="handleTrackEvent"
            :createPagePath="createDomainPath"
            :data-testid="`create_${handleTextDomainWorkload.singularTitle}_button`"
          />
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <FetchListTableBlock
        :createPagePath="createDomainPath"
        :editPagePath="`/${handleTextDomainWorkload.pluralLabel}/edit`"
        :listService="workloadService.listWorkloads"
        :columns="getColumns"
        @on-before-go-to-add-page="handleTrackEvent"
        @on-before-go-to-edit="handleTrackEditEvent"
        :emptyListMessage="`No ${handleTextDomainWorkload.singularTitle} found.`"
        :actions="actions"
        :apiFields="DOMAINS_API_FIELDS"
        :defaultOrderingFieldName="'-last_modified'"
        :hiddenByDefault="columnsHiddenByDefault"
        :frozenColumns="['name']"
        exportFileName="Workload"
        :allowedFilters="allowedFilters"
        :emptyBlock="{
          title: titleEmptyPage,
          description: descriptionEmptyPage,
          createButtonLabel: handleTextDomainWorkload.singularTitle,
          documentationService: documentationHandler
        }"
      />
    </template>
  </ContentBlock>
</template>
