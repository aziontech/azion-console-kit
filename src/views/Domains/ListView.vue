<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Domains"></PageHeadingBlock>
    </template>
    <template #content>
      <ListTableBlock
        v-if="hasContentToList"
        pageTitleDelete="Domain"
        addButtonLabel="Domains"
        createPagePath="domains/create"
        editPagePath="domains/edit"
        :listService="listDomainsService"
        :deleteService="deleteDomainService"
        :columns="getColumns"
        @on-load-data="handleLoadData"
      />
      <EmptyResultsBlock
        v-else
        title="You don't have any Domain created"
        description="Create your first domain."
        createButtonLabel="Domains"
        createPagePath="domains/create"
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
  import ListTableBlock from '@/templates/list-table-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import { computed, ref } from 'vue'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'

  const props = defineProps({
    listDomainsService: {
      required: true,
      type: Function
    },
    deleteDomainService: {
      required: true,
      type: Function
    },
    documentationService: {
      required: true,
      type: Function
    },
    clipboardWrite: {
      required: true,
      type: Function
    }
  })

  const hasContentToList = ref(true)

  const getColumns = computed(() => {
    return [
      {
        field: 'name',
        header: 'Name'
      },
      {
        field: 'digitalCertificateId',
        header: 'Digital Certificate'
      },
      {
        field: 'domainName',
        header: 'Domain Name',
        type: 'component',
        component: (columnData) => {
          return columnBuilder({
            data: columnData,
            columnAppearance: 'text-with-clipboard',
            dependencies: {
              copyContentService: props.clipboardWrite
            }
          })
        }
      },
      {
        field: 'cnames',
        header: 'CNAME'
      },
      {
        field: 'active',
        header: 'Status',
        type: 'component',
        component: (columnData) =>
          columnBuilder({
            data: columnData,
            columnAppearance: 'tag'
          })
      },
      {
        field: 'edgeApplicationName',
        header: 'Edge Application'
      }
    ]
  })

  function handleLoadData(event) {
    hasContentToList.value = event
  }
</script>
