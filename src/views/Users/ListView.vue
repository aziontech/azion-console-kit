<template>
  <ListTableBlock
    :listService="listUsersService"
    :deleteService="deleteUsersService"
    :columns="getColumns"
    pageTitle="Users"
    addButtonLabel="Add Users"
    createPagePath="users/create"
    editPagePath="users/edit"
  />
</template>

<script>
  import ListTableBlock from '@/templates/list-table-block'

  export default {
    name: 'variables-view',
    components: {
      ListTableBlock
    },
    props: {
      listUsersService: {
        required: true,
        type: Function
      },
      deleteUsersService: {
        required: true,
        type: Function
      }
    },
    computed: {
      getColumns() {
        return [
          {
            field: 'firstName',
            header: 'First Name'
          },
          {
            field: 'lastName',
            header: 'Last Name'
          },
          {
            field: 'email',
            header: 'Email Address'
          },
          {
            field: 'teams',
            header: 'Teams'
          },
          {
            field: 'mfa',
            header: 'MFA'
          },
          {
            field: 'active',
            header: 'Active'
          },
          {
            field: 'owner',
            header: 'Owner'
          }
        ]
      }
    }
  }
</script>
