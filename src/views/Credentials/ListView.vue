<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Credentials"></PageHeadingBlock>
    </template>
    <template #content>
      <ListTableBlock
        v-if="hasContentToList"
        :listService="listCredentialsService"
        :deleteService="deleteCredentialService"
        :columns="getColumns"
        pageTitleDelete="Credential"
        addButtonLabel="Credential"
        editPagePath="credentials/edit"
        createPagePath="credentials/create"
        @on-load-data="handleLoadData"
      />
      <EmptyResultsBlock
        v-else
        title="No credentials added"
        description="Create your first credentials."
        createButtonLabel="Credential"
        createPagePath="credentials/create"
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

  export default {
    name: 'credentials-view',
    components: {
      ListTableBlock,
      EmptyResultsBlock,
      Illustration,
      ContentBlock,
      PageHeadingBlock
    },
    props: {
      listCredentialsService: Function,
      deleteCredentialService: Function,
      documentationService: Function
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
    },
    methods: {
      handleLoadData(event) {
        this.hasContentToList = event
      }
    }
  }
</script>
