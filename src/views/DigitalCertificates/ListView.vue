<template>
  <ListTableBlock
    v-if="hasContentToList"
    :listService="listDigitalCertificatesService"
    :deleteService="deleteDigitalCertificatesService"
    :columns="getColumns"
    pageTitle="Digital Certificates"
    editPagePath="digital-certificates/edit"
    addButtonLabel="Digital Certificates"
    createPagePath="digital-certificates/create"
    @on-load-data="handleLoadData"
  />

  <EmptyResultsBlock
    v-else
    pageTitle="Digital Certificates"
    title="No digital certificates added"
    description="Create your first digital certificates."
    createButtonLabel="Add digital certificates"
    createPagePath="digital-certificates/create"
    :documentationService="documentationService"
  >
    <template #illustration>
      <Illustration />
    </template>
  </EmptyResultsBlock>
</template>

<script>
  import ListTableBlock from '@/templates/list-table-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import Illustration from '@/assets/svg/illustration-layers.vue'

  export default {
    name: 'digital-certificates-view',
    components: {
      ListTableBlock,
      EmptyResultsBlock,
      Illustration
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
            header: 'Status'
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
