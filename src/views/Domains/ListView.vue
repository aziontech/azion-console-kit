<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Domains"></PageHeadingBlock>
    </template>
    <template #content>
      <ListTableBlock
        v-if="hasContentToList"
        pageTitleDelete="domain"
        addButtonLabel="Domain"
        createPagePath="domains/create"
        editPagePath="domains/edit"
        :listService="listDomainsService"
        :deleteService="deleteDomainService"
        :columns="getColumns"
        @on-load-data="handleLoadData"
        @on-before-go-to-add-page="handleTrackEvent"
        emptyListMessage="No domains found."
      />
      <EmptyResultsBlock
        v-else
        title="No domains have been created"
        description="Click the button below to create your first domain."
        createButtonLabel="Domain"
        createPagePath="domains/create?origin=list"
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

  const hasContentToList = ref(true)

  const handleTrackEvent = () => {
    tracker.product.clickToCreate({
      productName: 'Domains'
    })
  }

  const getColumns = computed(() => {
    return [
      {
        field: 'name',
        header: 'Name'
      },
      {
        field: 'digitalCertificateId',
        header: 'Digital Certificate'
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
