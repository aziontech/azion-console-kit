<template>
  <ListTableBlock
    :listService="listDigitalCertificatesService"
    :deleteService="deleteDigitalCertificatesService"
    :columns="[
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
        field: 'validity',
        header: 'Validity (not after)'
      },
      {
        field: 'status',
        header: 'Status'
      }
    ]"
    :pageTitle="'Digital Certificates'"
    :addButtonLabel="'Add Certificate'"
    :createPagePath="'digital-certificates/create'"
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
    }
  }
</script>
