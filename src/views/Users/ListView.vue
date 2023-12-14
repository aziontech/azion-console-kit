<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Users"></PageHeadingBlock>
    </template>
    <template #content>
      <ListTableBlock
        v-if="hasContentToList"
        :listService="listUsersService"
        :deleteService="deleteUsersService"
        :columns="getColumns"
        pageTitleDelete="User"
        addButtonLabel="Users"
        createPagePath="users/create"
        editPagePath="users/edit"
        @on-load-data="handleLoadData"
      />
      <EmptyResultsBlock
        v-else
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
    </template>
  </ContentBlock>
</template>

<script>
  import ListTableBlock from '@/templates/list-table-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { useToast } from 'primevue/usetoast'

  export default {
    name: 'users-view',
    components: {
      ListTableBlock,
      EmptyResultsBlock,
      Illustration,
      ContentBlock,
      PageHeadingBlock
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
      hasContentToList: true,
      emailHasChanged: false
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
    },
    mounted() {
      const emailHasChanged = localStorage.getItem('emailHasChanged')

      if (emailHasChanged) {
        const toast = useToast()
        const toastConfig = {
          closable: true,
          severity: 'warn',
          summary: 'Confirmation email',
          detail: 'A confirmation email message has been sent to your email address.'
        }
        toast.add({ ...toastConfig })

        localStorage.removeItem('emailHasChanged')
      }
    }
  }
</script>
