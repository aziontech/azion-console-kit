<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Edit Intelligent DNS"
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
      <TabView
        v-model:activeIndex="activeTab"
        @tab-click="changeRouteByClickingOnTab"
        class="w-full"
      >
        <TabPanel header="Main Settings">
          <EditFormBlock
            v-if="showEditFormWithActionTab"
            :editService="editIntelligentDNSService"
            :loadService="loadIntelligentDNSService"
            :schema="validationSchema"
            :updatedRedirect="updatedRedirect"
            :isTabs="true"
          >
            <template #form>
              <FormFieldsIntelligentDnsCreate></FormFieldsIntelligentDnsCreate>
            </template>
            <template #action-bar="{ onSubmit, formValid, onCancel, loading }">
              <ActionBarTemplate
                @onSubmit="onSubmit"
                @onCancel="onCancel"
                :loading="loading"
                :submitDisabled="!formValid"
              />
            </template>
          </EditFormBlock>
        </TabPanel>
        <TabPanel header="Records">
          <ListTableBlock
            v-if="hasContentToList"
            pageTitleDelete="Record"
            addButtonLabel="Record"
            createPagePath="records/create"
            editPagePath="records/edit"
            :columns="recordListColumns"
            :listService="listRecordsServiceIntelligentDNSDecorator"
            :deleteService="deleteRecordsServiceIntelligentDNSDecorator"
            @on-load-data="handleLoadData"
          />
          <EmptyResultsBlock
            v-else
            title="No record added"
            description="Create your first record."
            createButtonLabel="Record"
            createPagePath="records/create"
            :documentationService="documentationService"
            :inTabs="true"
          >
            <template #illustration>
              <Illustration />
            </template>
          </EmptyResultsBlock>
        </TabPanel>
      </TabView>
      <router-view></router-view>
    </template>
  </ContentBlock>
</template>

<script>
  import { useIntelligentDNSStore } from '@/stores/intelligent-dns'
  import EditFormBlock from '@templates/edit-form-block'
  import PageHeadingBlock from '@templates/page-heading-block'
  import ListTableBlock from '@templates/list-table-block/no-header'
  import ContentBlock from '@/templates/content-block'
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
  import PrimeButton from 'primevue/button'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import FormFieldsIntelligentDnsCreate from './FormFields/FormFieldsIntelligentDns.vue'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'

  import * as yup from 'yup'

  export default {
    name: 'edit-intelligent-dns-view',
    components: {
      EditFormBlock,
      TabView,
      TabPanel,
      ListTableBlock,
      PageHeadingBlock,
      PrimeButton,
      ContentBlock,
      EmptyResultsBlock,
      Illustration,
      ActionBarTemplate,
      FormFieldsIntelligentDnsCreate
    },

    props: {
      loadIntelligentDNSService: { type: Function, required: true },
      editIntelligentDNSService: { type: Function, required: true },
      listRecordsService: { type: Function, required: true },
      deleteRecordsService: { type: Function, required: true },
      clipboardWrite: { type: Function, required: true },
      updatedRedirect: { type: String, required: true },
      documentationService: { type: Function, required: true }
    },

    data: () => {
      const hasContentToList = true
      const validationSchema = yup.object({
        name: yup.string().required(),
        domain: yup
          .string()
          .required()
          .test('valid-domain', 'Invalid domain', function (value) {
            const domainRegex = /^(?:[-A-Za-z0-9]+\.)+[A-Za-z]{2,6}$/
            return domainRegex.test(value)
          }),
        isActive: yup.boolean().required()
      })

      const intelligentDNSStore = useIntelligentDNSStore()

      return {
        hasContentToList,
        validationSchema,
        recordListColumns: [
          {
            field: 'name',
            header: 'Name'
          },
          {
            field: 'type',
            header: 'Type'
          },
          {
            field: 'value',
            header: 'Value'
          },
          {
            field: 'ttl',
            header: 'TTL'
          },
          {
            field: 'policy',
            header: 'Policy'
          },
          {
            field: 'weight',
            header: 'Weight'
          },
          {
            field: 'description',
            header: 'Description'
          }
        ],
        intelligentDNSStore,
        intelligentDNSID: 0,
        activeTab: 0
      }
    },

    created() {
      this.intelligentDNSID = this.$route.params.id
      this.renderTabCurrentRouter()
    },

    methods: {
      async listRecordsServiceIntelligentDNSDecorator(payload) {
        return await this.listRecordsService({ ...payload, id: this.intelligentDNSID })
      },
      async deleteRecordsServiceIntelligentDNSDecorator(recordID) {
        return await this.deleteRecordsService({
          recordID: recordID,
          intelligentDNSID: this.intelligentDNSID
        })
      },
      renderTabCurrentRouter() {
        if (this.$route.name === 'intelligent-dns-records') {
          this.activeTab = 1
        } else {
          this.activeTab = 0
        }
      },
      changeRouteByClickingOnTab(e) {
        if (e.index === 0) {
          this.$router.push({ name: 'edit-intelligent-dns', params: { id: this.intelligentDNSID } })
        } else {
          this.$router.push({
            name: 'intelligent-dns-records',
            params: { id: this.intelligentDNSID }
          })
        }
      },
      handleCopyNameServers() {
        this.clipboardWrite('ns1.aziondns.net;ns2.aziondns.com;ns3.aziondns.org')
        this.$toast.add({
          closable: true,
          severity: 'success',
          summary: 'Nameservers copied'
        })
      },
      handleLoadData(event) {
        this.hasContentToList = event
      }
    },
    computed: {
      showEditFormWithActionTab() {
        return this.activeTab === 0
      }
    },

    watch: {
      domain() {
        this.intelligentDNSStore.addDomain(this.domain)
      },
      $router() {
        this.renderTabCurrentRouter()
      }
    }
  }
</script>
