<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Edge DNS"
        description="Set Azion Edge DNS as the authoritative DNS server for a domain by copying the nameservers values."
      >
        <template #default>
          <PrimeButton
            outlined
            icon="pi pi-copy"
            class="max-md:w-full"
            label="Copy Nameserver Values"
            @click="handleCopyNameServers"
          ></PrimeButton>
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <ListTableBlock
        v-if="hasContentToList"
        :listService="listEdgeDNSService"
        :columns="getColumns"
        addButtonLabel="Zone"
        createPagePath="edge-dns/create"
        editPagePath="edge-dns/edit"
        @on-load-data="handleLoadData"
        emptyListMessage="No zone found."
        :actions="actions"
      />
      <EmptyResultsBlock
        v-else
        title="No zone has been added"
        description="Click the button below to add your first zone."
        createButtonLabel="Zone"
        createPagePath="edge-dns/create"
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
  import { ref, computed } from 'vue'
  import { useToast } from 'primevue/usetoast'
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import ContentBlock from '@/templates/content-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import ListTableBlock from '@/templates/list-table-block/index.vue'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import PrimeButton from 'primevue/button'

  defineOptions({ name: 'edge-dns-view' })

  const props = defineProps({
    listEdgeDNSService: {
      required: true,
      type: Function
    },
    deleteEdgeDNSService: {
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

  const toast = useToast()
  const hasContentToList = ref(true)
  const actions = [
    {
      type: 'delete',
      title: 'zone',
      icon: 'pi pi-trash',
      service: props.deleteEdgeDNSService
    }
  ]

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const handleCopyNameServers = () => {
    props.clipboardWrite('ns1.aziondns.net;ns2.aziondns.com;ns3.aziondns.org')
    toast.add({
      closable: true,
      severity: 'success',
      summary: 'Successfully copied!'
    })
  }

  const getColumns = computed(() => {
    return [
      {
        field: 'name',
        header: 'Name'
      },

      {
        field: 'domain',
        header: 'Domain',
        type: 'component',
        filterPath: 'domain.content',
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
        field: 'status',
        header: 'Status',
        type: 'component',
        filterPath: 'status.content',
        component: (columnData) =>
          columnBuilder({
            data: columnData,
            columnAppearance: 'tag'
          })
      }
    ]
  })
</script>
