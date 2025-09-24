<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock :pageTitle="`${handleTextDomainWorkload.pluralTitle}`"></PageHeadingBlock>
    </template>
    <template #content>
      <FetchListTableBlock
        v-if="hasContentToList"
        :addButtonLabel="`${handleTextDomainWorkload.singularTitle}`"
        :createPagePath="createDomainPath"
        :editPagePath="`${handleTextDomainWorkload.pluralLabel}/edit`"
        :listService="workloadService.listWorkloads"
        :columns="getColumns"
        @on-load-data="handleLoadData"
        @on-before-go-to-add-page="handleTrackEvent"
        @on-before-go-to-edit="handleTrackEditEvent"
        :emptyListMessage="`No ${handleTextDomainWorkload.singularLabel} found.`"
        :actions="actions"
        :apiFields="DOMAINS_API_FIELDS"
        :defaultOrderingFieldName="'-last_modified'"
        :hiddenByDefault="columnsHiddenByDefault"
      />
      <EmptyResultsBlock
        v-else
        :title="titleEmptyPage"
        :description="descriptionEmptyPage"
        :createButtonLabel="`${handleTextDomainWorkload.singularTitle}`"
        :createPagePath="createDomainPath"
        @click-to-create="handleTrackEvent"
        :documentationService="documentationHandler"
      >
        <template #illustration>
          <Illustration />
        </template>
      </EmptyResultsBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import ContentBlock from '@/templates/content-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import { useToast } from 'primevue/usetoast'
  import { INFORMATION_TEXTS, TEXT_DOMAIN_WORKLOAD } from '@/helpers'

  const handleTextDomainWorkload = TEXT_DOMAIN_WORKLOAD()
  import { workloadService } from '@/services/v2/workload/workload-service'
  import { deleteDomainService } from '@/services/domains-services'
  import * as Helpers from '@/helpers'

  import PageHeadingBlock from '@/templates/page-heading-block'
  import { computed, ref, inject } from 'vue'

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

  const hasContentToList = ref(true)
  const isWorkload = computed(() => handleTextDomainWorkload.singularLabel === 'workload')
  const actions = [
    {
      type: 'delete',
      title: `${handleTextDomainWorkload.singularLabel}`,
      icon: 'pi pi-trash',
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
        field: 'id',
        header: 'ID',
        filterPath: 'id',
        sortField: 'id'
      },
      {
        field: 'name',
        header: 'Name',
        filterPath: 'name.text',
        type: 'component',
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'text-with-tag'
          })
        }
      },
      {
        field: 'domains',
        header: 'Domains',
        filterPath: 'domains',
        disableSort: true,
        type: 'component',
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'expand-column'
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
            data: columnData,
            columnAppearance: 'text-with-clipboard',
            dependencies: {
              copyContentService: Helpers.clipboardWrite
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
        field: 'lastEditor',
        header: 'Last Editor',
        filterPath: 'lastEditor',
        sortField: 'lastEditor'
      },
      {
        field: 'lastModified',
        header: 'Last Modified',
        filterPath: 'lastModified',
        sortField: 'lastModified'
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
      }
    ]
  })

  function handleLoadData(event) {
    hasContentToList.value = event
  }

  const titleEmptyPage = computed(
    () => `No ${handleTextDomainWorkload.singularLabel} have been created`
  )
  const descriptionEmptyPage = computed(
    () => `Click the button below to create your first ${handleTextDomainWorkload.singularLabel}.`
  )
</script>
