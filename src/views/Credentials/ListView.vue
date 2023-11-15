<template>
  <ListTableBlock
    :listService="listCredentialsService"
    :deleteService="deleteCredentialService"
    :columns="getColumns"
    pageTitle="Credentials"
    addButtonLabel="Credential"
    editPagePath="credentials/edit"
    createPagePath="credentials/create"
  />
</template>

<script>
  import ListTableBlock from '@/templates/list-table-block'

  export default {
    name: 'credentials-view',
    components: {
      ListTableBlock
    },
    props: {
      listCredentialsService: Function,
      deleteCredentialService: Function
    },
    computed: {
      getColumns() {
        return [
          {
            field: 'name',
            header: 'Name'
          },
          {
            field: 'lastEditor',
            header: 'Last Editor'
          },
          {
            field: 'lastModified',
            header: 'Last Modified'
          },
          {
            field: 'status',
            header: 'Active'
          }
        ]
      }
    }
  }
</script>
