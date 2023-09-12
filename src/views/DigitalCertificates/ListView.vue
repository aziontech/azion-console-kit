<template>
  <ListTableBlock
    :listService="listDigitalCertificatesService"
    :deleteService="deleteDigitalCertificatesService"
    :columns="getColumns"
    pageTitle="Digital Certificates"
    editPagePath="digital-certificates/edit"
    addButtonLabel="Add Certificate"
    createPagePath="digital-certificates/create"
  />
</template>

<script>
  import ListTableBlock from '@/templates/list-table-block'

  export default {
    name: 'digital-certificates-view',
    components: {
      ListTableBlock
    },
    props: {
      listDigitalCertificatesService: {
        required: true,
        type: Function
      },
      deleteDigitalCertificatesService: {
        required: true,
        type: Function
      }
    },
    computed: {
      getColumns() {
        return [
          {
            field: 'name',
            header: 'Application Name'
          },
          {
            field: 'subject_name',
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
            header: 'Validity (not after)'
          },
          {
            field: 'status',
            header: 'Status'
          }
        ]
      }
    }
  }
</script>
