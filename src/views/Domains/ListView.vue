<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Domains"></PageHeadingBlock>
    </template>
    <template #content>
      <ListTableBlock
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
  import ListTableBlock from '@/templates/list-table-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
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
  const handleTrackEditEvent = () => {
    tracker.product.clickToEdit({
      productName: 'Domain'
    })
  }

  const getColumns = computed(() => {
    return [
      {
        field: 'name',
        header: 'Name'
      },
      {
        field: 'domainName',
        header: 'Domain Name',
        filterPath: 'domainName.content',
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
        component: (columnData) =>
          columnBuilder({ data: columnData, columnAppearance: 'expand-column' })
      },
      {
        field: 'active',
        sortField: 'activeSort',
        header: 'Status',
        filterPath: 'active.content',
        type: 'component',
        component: (columnData) =>
          columnBuilder({
            data: columnData,
            columnAppearance: 'tag'
          })
      },
      {
        field: 'edgeApplicationName',
        header: 'Edge Application'
      }
    ]
  })

  function handleLoadData(event) {
    hasContentToList.value = event
  }
</script>
