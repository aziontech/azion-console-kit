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
        :defaultOrderingFieldName="'name'"
        :hiddenByDefault="columnsHiddenByDefault"
      />
      <EmptyResultsBlock
        v-else
        title="No workload have been created"
        description="Click the button below to create your first workload."
        :createButtonLabel="`${handleTextDomainWorkload.singularTitle}`"
        :createPagePath="createDomainPath"
        @click-to-create="handleTrackEvent"
        :documentationService="Helpers.documentationCatalog.domains"
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
  import { workloadService } from '@/services/v2'
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

  const columnsHiddenByDefault = ['id', 'lastEditor', 'protocols']

  const hasContentToList = ref(true)

  const actions = [
    {
      type: 'delete',
      title: 'domain',
      icon: 'pi pi-trash',
      service: workloadService.deleteWorkload
    }
  ]

  const handleTrackEvent = () => {
    tracker.product.clickToCreate({
      productName: 'Workload'
    })
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
        header: 'Workload Domain',
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
        field: 'lastModified',
        header: 'Last Modified',
        filterPath: 'lastModified',
        sortField: 'lastModified'
      },
      {
        field: 'lastEditor',
        header: 'Last Editor',
        filterPath: 'lastEditor',
        sortField: 'lastEditor'
      },
      {
        field: 'protocols',
        header: 'Protocols',
        filterPath: 'protocols',
        sortField: 'protocols'
      }
    ]
  })

  function handleLoadData(event) {
    hasContentToList.value = event
  }
</script>
