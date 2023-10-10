<template>
  <ListTableBlockNoEdit :listService="listPersonalTokensService" :deleteService="deletePersonalTokenService"
    :columns="getColumns" pageTitle="Personal Tokens" addButtonLabel="Add Personal Token"
    createPagePath="personal-tokens/create" />
</template>

<script>
import ListTableBlockNoEdit from '@/templates/list-table-block/no-edit'

export default {
  name: 'personal-tokens-view',
  components: {
    ListTableBlockNoEdit
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
          field: 'expiresAt',
          header: 'Expires'
        }
      ]
    }
  }
}
</script>
