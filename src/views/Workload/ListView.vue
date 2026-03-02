<script setup>
  import { computed, inject } from 'vue'
  import { useToast } from 'primevue/usetoast'
  import { workloadService } from '@/services/v2/workload/workload-service'
  import TEXT_DOMAIN_WORKLOAD from '@/helpers/handle-text-workload-domain-flag.js'
  import INFORMATION_TEXTS from '@/helpers/azion-information-texts.js'
  import { COLUMN_STYLES, columnStyles } from '@/helpers/column-styles'
  import { clipboardWrite } from '@/helpers/clipboard'
  import { deleteDomainService } from '@/services/domains-services'
  import {
    documentationSecureProducts,
    documentationBuildProducts
  } from '@/helpers/azion-documentation-catalog'
  import ContentBlock from '@/templates/content-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { DataTableActionsButtons } from '@/components/DataTable'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const handleTextDomainWorkload = TEXT_DOMAIN_WORKLOAD()
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

  const actions = computed(() => [
    {
      label: 'Delete',
      type: 'delete',
      title: `${handleTextDomainWorkload.singularTitle}`,
      icon: 'pi pi-trash',
      tooltip: 'Delete',
      service: isWorkload.value ? workloadService.deleteWorkload : deleteDomainService
    }
  ])

  const isWorkload = computed(() => handleTextDomainWorkload.singularLabel === 'workload')

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
        style: columnStyles.priority(2, 200, 350),
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
        sortField: 'id',
        style: COLUMN_STYLES.FIT_CONTENT
      },
      {
        field: 'domains',
        header: 'Domains',
        filterPath: 'domains',
        disableSort: true,
        type: 'component',
        style: columnStyles.priority(3, 200, 300),
        component: (columnData) => {
          return columnBuilder({
            data: Array.isArray(columnData) ? columnData : columnData?.content,
            columnAppearance: 'text-array-with-popup',
            dependencies: {
              showCopy: !!clipboardWrite
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
        style: columnStyles.priority(2, 200, 300),
        component: (columnData) => {
          return columnBuilder({
            data: columnData.content,
            columnAppearance: 'text-format-with-popup',
            dependencies: {
              copyContentService: clipboardWrite,
              showCopy: !!clipboardWrite
            }
          })
        }
      },
      {
        field: 'infrastructure',
        header: 'Infrastructure',
        filterPath: 'infrastructure',
        sortField: 'infrastructure',
        style: COLUMN_STYLES.FIT_CONTENT
      },
      {
        field: 'active',
        sortField: 'active',
        header: 'Status',
        filterPath: 'active',
        type: 'component',
        style: COLUMN_STYLES.FIT_CONTENT,
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
  const allowedFilters = computed(() =>
    getColumns.value.filter((col) => col.field !== 'workloadHostname' && col.field !== 'domains')
  )
  const titleEmptyPage = computed(() => `No ${handleTextDomainWorkload.pluralTitle} yet`)
  const descriptionEmptyPage = computed(() =>
    isWorkload.value
      ? `Create your first Workload to configure domains, protocols, security, and application execution for incoming traffic.`
      : `Create your first Domain to configure firewalls and applications execution for incoming traffic.`
  )

  const pageDescription = computed(() => {
    return isWorkload.value
      ? "Deploy and manage workloads that bind domains, protocols, security, and application on Azion's global infrastructure."
      : "Deploy and manage domains that execute firewalls and applications on Azion's global infrastructure."
  })

  const handleTrackEvent = () => {
    tracker.product.clickToCreate({
      productName: 'Workload'
    })
  }

  const documentationHandler = () => {
    if (isWorkload.value) {
      documentationSecureProducts.workload()
    } else {
      documentationBuildProducts.domains()
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
        :exportFileName="handleTextDomainWorkload.singularTitle"
        :allowedFilters="allowedFilters"
        :emptyBlock="{
          title: titleEmptyPage,
          description: descriptionEmptyPage,
          createPagePath: 'workloads/create',
          createButtonLabel: handleTextDomainWorkload.singularTitle,
          documentationService: documentationHandler
        }"
      />
    </template>
  </ContentBlock>
</template>
