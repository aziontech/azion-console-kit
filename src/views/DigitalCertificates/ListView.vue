<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Digital Certificates"></PageHeadingBlock>
    </template>
    <template #content>
      <ListTableBlock
        v-if="hasContentToList"
        :listService="listDigitalCertificatesService"
        :columns="getColumns"
        editPagePath="digital-certificates/edit"
        addButtonLabel="Digital Certificate"
        createPagePath="digital-certificates/create"
        @on-load-data="handleLoadData"
        emptyListMessage="No digital certificates found."
        :actions="actions"
        @on-before-go-to-add-page="handleTrackEventGoToCreate"
        @on-before-go-to-edit="handleTrackEventGoToEdit"
      />

      <EmptyResultsBlock
        v-else
        title="No digital certificate has been added"
        description="Click the button below to add your first digital certificate."
        createButtonLabel="Digital Certificate"
        createPagePath="digital-certificates/create"
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
  import { ref, computed, inject } from 'vue'
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import ContentBlock from '@/templates/content-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import ListTableBlock from '@/templates/list-table-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import PageHeadingBlock from '@/templates/page-heading-block'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  defineOptions({ name: 'digital-certificates-view' })

  const props = defineProps({
    listDigitalCertificatesService: {
      required: true,
      type: Function
    },
    deleteDigitalCertificatesService: {
      required: true,
      type: Function
    },
    documentationService: {
      required: true,
      type: Function
    }
  })

  const hasContentToList = ref(true)
  const actions = [
    {
      type: 'delete',
      title: 'digital certificate',
      icon: 'pi pi-trash',
      service: props.deleteDigitalCertificatesService
    }
  ]

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const handleTrackEventGoToCreate = () => {
    tracker.product.clickToCreate({
      productName: 'Digital Certificate'
    })
  }

  const handleTrackEventGoToEdit = () => {
    tracker.product.clickToEdit({
      productName: 'Digital Certificate'
    })
  }

  const getColumns = computed(() => {
    return [
      {
        field: 'name',
        header: 'Name'
      },
      {
        field: 'subjectName',
        header: 'Subject Names'
      },
      {
        field: 'issuer',
        header: 'Issuer'
      },
      {
        field: 'type',
        header: 'Type'
      },
      {
        field: 'validity',
        header: 'Expiration Date'
      },
      {
        field: 'status',
        header: 'Status',
        sortField: 'status.content',
        type: 'component',
        component: (columnData) =>
          columnBuilder({
            data: columnData,
            columnAppearance: 'tag'
          })
      }
    ]
  })
</script>
