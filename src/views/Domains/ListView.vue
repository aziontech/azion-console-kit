<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Domains"></PageHeadingBlock>
    </template>
    <template #content>
      <FetchListTableBlock
        v-if="hasContentToList"
        addButtonLabel="Domain"
        :createPagePath="createDomainPath"
        editPagePath="domains/edit"
        :listService="listDomainsService"
        :columns="getColumns"
        @on-load-data="handleLoadData"
        @on-before-go-to-add-page="handleTrackEvent"
        @on-before-go-to-edit="handleTrackEditEvent"
        emptyListMessage="No domains found."
        :actions="actions"
        :apiFields="DOMAINS_API_FIELDS"
        :defaultOrderingFieldName="'name'"
      />
      <EmptyResultsBlock
        v-else
        title="No domains have been created"
        description="Click the button below to create your first domain."
        createButtonLabel="Domain"
        :createPagePath="createDomainPath"
        @click-to-create="handleTrackEvent"
        :documentationService="documentationService"
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
  import { INFORMATION_TEXTS } from '@/helpers'

  import PageHeadingBlock from '@/templates/page-heading-block'
  import { computed, ref, inject } from 'vue'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const props = defineProps({
    listDomainsService: {
      required: true,
      type: Function
    },
    deleteDomainService: {
      required: true,
      type: Function
    },
    documentationService: {
      required: true,
      type: Function
    },
    clipboardWrite: {
      required: true,
      type: Function
    }
  })

  const createDomainPath = 'domains/create?origin=list'
  const toast = useToast()
  const DOMAINS_API_FIELDS = [
    'id',
    'name',
    'edge_application',
    'active',
    'alternate_domains',
    'domains',
    'product_version'
  ]

  const hasContentToList = ref(true)
  const actions = [
    {
      type: 'delete',
      title: 'domain',
      icon: 'pi pi-trash',
      service: props.deleteDomainService
    }
  ]

  const handleTrackEvent = () => {
    tracker.product.clickToCreate({
      productName: 'Domain'
    })
  }

  const showLockedMessage = () => {
    const options = {
      closable: true,
      severity: 'warn',
      summary: 'Warning',
      detail: INFORMATION_TEXTS.LOCKED_MESSAGE_TOAST
    }

    toast.add(options)
  }

  const handleTrackEditEvent = (domain) => {
    tracker.product.clickToEdit({
      productName: 'Domain'
    })
    if (domain.isLocked) {
      showLockedMessage()
    }
  }

  const getColumns = computed(() => {
    return [
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
        field: 'domainName',
        header: 'Domain Name',
        filterPath: 'domainName.content',
        disableSort: true,
        type: 'component',
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'text-with-clipboard',
            dependencies: {
              copyContentService: props.clipboardWrite
            }
          })
        }
      },
      {
        field: 'cnames',
        header: 'CNAME',
        filterPath: 'description.value',
        type: 'component',
        disableSort: true,
        component: (columnData) =>
          columnBuilder({ data: columnData, columnAppearance: 'expand-column' })
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
</script>
