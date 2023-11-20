<template>
  <div>
    <ListTableBlock
      v-if="hasContentToList"
      :listService="listUsersService"
      :deleteService="deleteUsersService"
      :columns="getColumns"
      pageTitle="Users"
      pageTitleDelete="User"
      addButtonLabel="Users"
      createPagePath="users/create"
      editPagePath="users/edit"
      @on-load-data="handleLoadData"
    />
    <EmptyResultsBlock
      v-else
      pageTitle="Users"
      title="No users added"
      description="Create your first users."
      createButtonLabel="Users"
      createPagePath="users/create"
      :documentationService="documentationService"
    >
      <template #illustration>
        <Illustration />
      </template>
    </EmptyResultsBlock>
  </div>
</template>

<script>
  import ListTableBlock from '@/templates/list-table-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import Illustration from '@/assets/svg/illustration-layers.vue'

  export default {
    name: 'variables-view',
    components: {
      ListTableBlock,
      EmptyResultsBlock,
      Illustration
    },
    props: {
      listUsersService: {
        required: true,
        type: Function
      },
      deleteUsersService: {
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
    },
    methods: {
      handleLoadData(event) {
        this.hasContentToList = event
      }
    }
  }
</script>
