<script setup>
  import { computed, ref, inject } from 'vue'
  import { useRouter } from 'vue-router'
  import ContentBlock from '@/templates/content-block'
  import { columnBuilder } from '@/components/list-table/columns/column-builder'
  import { useToast } from '@aziontech/webkit/use-toast'
  import { INFORMATION_TEXTS, TEXT_DOMAIN_WORKLOAD } from '@/helpers'

  const handleTextDomainWorkload = TEXT_DOMAIN_WORKLOAD()
  import { workloadService } from '@/services/v2/workload/workload-service'
  import { deleteDomainService } from '@/services/domains-services'
  import {
    documentationSecureProducts,
    documentationBuildProducts
  } from '@/helpers/azion-documentation-catalog'

  import PageHeadingBlock from '@/templates/page-heading-block'
  import { DataTableActionsButtons } from '@/components/list-table'
  import ListTable from '@/components/list-table/ListTable.vue'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const router = useRouter()
  const createDomainPath = `${handleTextDomainWorkload.pluralLabel}/create?origin=list`
  const toast = useToast()

  const handleNavigateToCreate = () => {
    router.push(createDomainPath)
  }
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
        component: (columnData) => {
          return columnBuilder({
            data: Array.isArray(columnData) ? columnData : columnData?.content,
            columnAppearance: 'text-array-with-popup',
            dependencies: {
              showCopy: true
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
        component: (columnData) => {
          return columnBuilder({
            data: columnData.content,
            columnAppearance: 'text-format-with-popup',
            dependencies: {
              showCopy: true
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

  const hasContentToList = ref(true)

  const frozenColumns = ['name']

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const handleBeforeGoToAddPage = () => {
    handleTrackEvent()
  }

  const handleBeforeGoToEdit = (item) => {
    handleTrackEditEvent(item)
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
      <ListTable
        :listService="workloadService.listWorkloads"
        :columns="getColumns"
        :actions="actions"
        :editPagePath="`/${handleTextDomainWorkload.pluralLabel}/edit`"
        defaultOrderingFieldName="-last_modified"
        :hiddenByDefault="columnsHiddenByDefault"
        :exportFileName="handleTextDomainWorkload.singularTitle"
        :lazy="true"
        :frozenColumns="frozenColumns"
        :allowedFilters="allowedFilters"
        :emptyListMessage="`No ${handleTextDomainWorkload.singularTitle} found.`"
        :emptyBlock="{
          title: titleEmptyPage,
          description: descriptionEmptyPage,
          createButtonLabel: handleTextDomainWorkload.singularTitle,
          documentationService: documentationHandler
        }"
        @click-to-create="handleNavigateToCreate"
        @on-load-data="handleLoadData"
        @on-before-go-to-add-page="handleBeforeGoToAddPage"
        @on-before-go-to-edit="handleBeforeGoToEdit"
      />
    </template>
  </ContentBlock>
</template>
