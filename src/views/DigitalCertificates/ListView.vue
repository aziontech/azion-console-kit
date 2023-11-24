<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Digital Certificates"></PageHeadingBlock>
    </template>
    <template #content>
      <ListTableBlock
        v-if="hasContentToList"
        :listService="listDigitalCertificatesService"
        :deleteService="deleteDigitalCertificatesService"
        :columns="getColumns"
        pageTitleDelete="Digital Certificate"
        editPagePath="digital-certificates/edit"
        addButtonLabel="Digital Certificates"
        createPagePath="digital-certificates/create"
        @on-load-data="handleLoadData"
      />

      <EmptyResultsBlock
        v-else
        title="No digital certificates added"
        description="Create your first digital certificates."
        createButtonLabel="Digital Certificates"
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

<script>
  import ListTableBlock from '@/templates/list-table-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'

  export default {
    name: 'digital-certificates-view',
    components: {
      ListTableBlock,
      EmptyResultsBlock,
      Illustration,
      ContentBlock,
      PageHeadingBlock
    },
    props: {
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
    },
    data: () => ({
      hasContentToList: true
    }),
    computed: {
      getColumns() {
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
            type: 'component',
            component: (columnData) =>
              columnBuilder({
                data: columnData,
                columnAppearance: 'tag'
              })
          }
        ]
      }
    },
    methods: {
      handleLoadData(event) {
        this.hasContentToList = event
      }
    }
  }
</script>
