<template>
  <ListTableBlock
    :listService="listPersonalTokensService"
    :deleteService="deletePersonalTokenService"
    :columns="getColumns"
    pageTitle="Personal Tokens"
    addButtonLabel="Add Personal Token"
    createPagePath="personal-tokens/create"
    editPagePath="list-personal-tokens"
  />
</template>

<script>
  import ListTableBlock from '@/templates/list-table-block'

  export default {
    name: 'personal-tokens-view',
    components: {
      ListTableBlock
    },
    props: {
      listPersonalTokensService: {
        required: true,
        type: Function
      },
      deletePersonalTokenService: {
        required: true,
        type: Function
      }
    },
    computed: {
      getColumns() {
        return [
          {
            field: 'name',
            header: 'Token Name'
          },
          {
            field: 'scope',
            header: 'Scope'
          },
          {
            field: 'created',
            header: 'Last modified'
          },
          {
            field: 'expires_at',
            header: 'Expires'
          }
        ]
      }
    }
  }
</script>
