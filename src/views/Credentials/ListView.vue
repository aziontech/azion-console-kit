<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Credentials"
        data-testid="credentials__list-view__page-heading"
      />
    </template>
    <template #content>
      <ListTableBlock
        v-if="hasContentToList"
        :listService="listCredentialsService"
        :columns="getColumns"
        addButtonLabel="Credential"
        editPagePath="credentials/edit"
        createPagePath="credentials/create"
        @on-load-data="handleLoadData"
        emptyListMessage="No credentials found."
        :actions="actions"
      />
      <EmptyResultsBlock
        v-else
        data-testid="credentials__list-view__empty-results-block"
        title="No credentials have been generated"
        description="Click the button below to generate your first credential."
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

<script setup>
  import { computed, ref } from 'vue'
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import ContentBlock from '@/templates/content-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import ListTableBlock from '@/templates/list-table-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import PageHeadingBlock from '@/templates/page-heading-block'

  defineOptions({ name: 'credentials-view' })

  const props = defineProps({
    listCredentialsService: {
      type: Function,
      required: true
    },
    deleteCredentialService: {
      type: Function,
      required: true
    },
    documentationService: {
      type: Function,
      required: true
    }
  })

  const hasContentToList = ref(true)

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const actions = [
    {
      type: 'delete',
      title: 'credential',
      icon: 'pi pi-trash',
      service: props.deleteCredentialService
    }
  ]

  const getColumns = computed(() => {
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
        sortField: 'lastModifiedDate',
        header: 'Last Modified'
      },
      {
        field: 'status',
        header: 'Status',
        filterPath: 'status.content',
        type: 'component',
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'tag'
          })
        }
      }
    ]
  })
</script>
