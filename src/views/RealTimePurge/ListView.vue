<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Real-Time Purge"></PageHeadingBlock>
    </template>
    <template #content>
      <ListTableBlock
        v-if="hasContentToList"
        :listService="props.listRealTimePurgeService"
        :columns="getColumns"
        addButtonLabel="Add"
        createPagePath="real-time-purge/create"
        @on-load-data="handleLoadData"
        :isGraphql="true"
        :enableEditClick="false"
        emptyListMessage="No Purge found."
      >
      </ListTableBlock>
      <EmptyResultsBlock
        v-else
        title="No purge has been created"
        description="Click the button below to initiate the setup process and create your first purge."
        createButtonLabel="Add"
        createPagePath="real-time-purge/create"
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
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import ContentBlock from '@/templates/content-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import ListTableBlock from '@/templates/list-table-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { computed, ref } from 'vue'

  const props = defineProps({
    listRealTimePurgeService: { required: true, type: Function },
    documentationService: {
      required: true,
      type: Function
    }
  })

  const hasContentToList = ref(true)

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const getColumns = computed(() => {
    return [
      {
        field: 'time',
        header: 'Date'
      },
      {
        field: 'user',
        header: 'User'
      },
      {
        field: 'layer',
        header: 'Layer'
      },
      {
        field: 'type',
        header: 'Type'
      },
      {
        field: 'arguments',
        header: 'Arguments'
      }
    ]
  })
</script>
