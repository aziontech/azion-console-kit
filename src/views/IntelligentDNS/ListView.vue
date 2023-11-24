<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Intelligent DNS"
        description="Copy the Nameservers values for change your domain's authoritative DNS servers to use Azion Intelligent DNS."
      >
        <template #default>
          <PrimeButton
            outlined
            icon="pi pi-copy"
            class="max-md:w-full"
            label="Copy Nameservers"
            @click="handleCopyNameServers"
          ></PrimeButton>
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <ListTableBlock
        v-if="hasContentToList"
        :listService="listIntelligentDNSService"
        :deleteService="deleteIntelligentDNSService"
        :columns="getColumns"
        pageTitleDelete="Intelligent DNS"
        addButtonLabel="Intelligent DNS"
        createPagePath="intelligent-dns/create"
        editPagePath="intelligent-dns/edit"
        @on-load-data="handleLoadData"
      />
      <EmptyResultsBlock
        v-else
        title="No intelligent dns added"
        description="Create your first intelligent dns."
        createButtonLabel="Intelligent DNS"
        createPagePath="intelligent-dns/create"
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
  import PrimeButton from 'primevue/button'
  import PageHeadingBlock from '@/templates/page-heading-block'

  export default {
    name: 'intelligent-dns-view',
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
      listIntelligentDNSService: {
        required: true,
        type: Function
      },
      deleteIntelligentDNSService: {
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
            header: 'Domain'
          },
          {
            field: 'isActive',
            header: 'Active'
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
          closable: false,
          severity: 'success',
          summary: 'Nameservers copied',
          life: 10000
        })
      }
    }
  }
</script>
