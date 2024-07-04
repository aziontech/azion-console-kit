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
        :deleteService="deleteEdgeDNSService"
        :columns="getColumns"
        pageTitleDelete="zone"
        addButtonLabel="Zone"
        createPagePath="edge-dns/create"
        editPagePath="edge-dns/edit"
        @on-load-data="handleLoadData"
        emptyListMessage="No zone found."
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

<script>
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import ContentBlock from '@/templates/content-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import ListTableBlock from '@/templates/list-table-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import PrimeButton from 'primevue/button'

  export default {
    name: 'edge-dns-view',
    components: {
      ListTableBlock,
      EmptyResultsBlock,
      Illustration,
      ContentBlock,
      PrimeButton,
      PageHeadingBlock
    },
    data: () => ({
      hasContentToList: true
    }),
    props: {
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
    },
    computed: {
      getColumns() {
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
                  copyContentService: this.clipboardWrite
                }
              })
            }
          },
          {
            field: 'status',
            header: 'Status',
            type: 'component',
            filterPath: 'status.content',
            sortField: 'status.content',
            component: (columnData) =>
              columnBuilder({
                data: columnData,
                columnAppearance: 'tag'
              })
          }
        ]
      }
    },
    methods: {
      handleLoadData(event) {
        this.hasContentToList = event
      },
      handleCopyNameServers() {
        this.clipboardWrite('ns1.aziondns.net;ns2.aziondns.com;ns3.aziondns.org')
        this.$toast.add({
          closable: true,
          severity: 'success',
          summary: 'Successfully copied!'
        })
      }
    }
  }
</script>
