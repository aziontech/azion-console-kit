<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Digital Certificates"></PageHeadingBlock>
    </template>
    <template #content>
      <FetchListTableBlock
        v-if="hasContentToList"
        :listService="digitalCertificatesService.listDigitalCertificates"
        :columns="getColumns"
        editPagePath="digital-certificates/edit"
        addButtonLabel="Digital Certificate"
        createPagePath="digital-certificates/create"
        :apiFields="DIGITAL_CERTIFICATE_API_FIELDS"
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
        :documentationService="documentationCatalog.digitalCertificates"
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
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import { digitalCertificatesService } from '@/services/v2'
  import { documentationCatalog } from '@/helpers'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  defineOptions({ name: 'digital-certificates-view' })

  const hasContentToList = ref(true)
  const DIGITAL_CERTIFICATE_API_FIELDS = [
    'id',
    'name',
    'subject_name',
    'issuer',
    'status',
    'status_detail',
    'validity',
    'type'
  ]

  const actions = [
    {
      type: 'delete',
      title: 'digital certificate',
      icon: 'pi pi-trash',
      service: digitalCertificatesService.deleteDigitalCertificate
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
        header: 'Name',
        type: 'component',
        sortField: 'name',
        component: (columnData) =>
          columnBuilder({ data: columnData, columnAppearance: 'expand-text-column' })
      },
      {
        field: 'subjectName',
        header: 'Subject Names',
        sortField: 'subject_name',
        type: 'component',
        component: (columnData) =>
          columnBuilder({ data: columnData, columnAppearance: 'expand-text-column' })
      },
      {
        field: 'issuer',
        header: 'Issuer',
        sortField: 'issuer'
      },
      {
        field: 'type',
        header: 'Type',
        sortField: 'type'
      },
      {
        field: 'validity',
        header: 'Expiration Date',
        sortField: 'validity'
      },
      {
        field: 'status',
        header: 'Status',
        sortField: 'status',
        type: 'component',
        component: (columnData) =>
          columnBuilder({
            data: { ...columnData.status, tooltipText: columnData.statusDetail },
            columnAppearance: 'tag-with-tooltip'
          })
      }
    ]
  })
</script>
