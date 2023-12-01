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
            :initialDataSetter="setValues"
            :formData="values"
            :formMeta="meta"
            :updatedRedirect="updatedRedirect"
          >
            <template #form>
              <FormHorizontal
                title="General"
                description="Description"
              >
                <template #inputs>
                  <div class="flex flex-col sm:max-w-lg w-full gap-2">
                    <label
                      for="name"
                      class="text-color text-base font-medium"
                      >Name *</label
                    >
                    <InputText
                      v-model="name"
                      id="name"
                      type="text"
                      :class="{ 'p-invalid': errors.name }"
                    />
                    <small
                      v-if="errors.name"
                      class="p-error text-xs font-normal leading-tight"
                      >{{ errors.name }}</small
                    >
                  </div>
                </template>
              </FormHorizontal>
              <FormHorizontal
                title="Title Section"
                description="Description"
              >
                <template #inputs>
                  <div class="flex flex-col sm:max-w-lg w-full gap-2">
                    <label
                      for="domain"
                      class="text-color text-base font-medium"
                      >Domain *</label
                    >
                    <InputText
                      id="domain"
                      v-model="domain"
                      type="text"
                      :class="{ 'p-invalid': errors.domain }"
                    />
                    <small
                      v-if="errors.domain"
                      class="p-error text-xs font-normal leading-tight"
                      >{{ errors.domain }}</small
                    >
                  </div>
                </template>
              </FormHorizontal>
              <FormHorizontal
                title="Status"
                description="Description"
              >
                <template #inputs>
                  <div class="flex gap-3 items-center">
                    <label for="">Active</label>
                    <InputSwitch
                      v-model="isActive"
                      :class="{ 'p-invalid': errors.isActive }"
                    />
                  </div>
                </template>
              </FormHorizontal>
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
  import EditFormBlock from '@templates/edit-form-block-new/no-header'
  import FormHorizontal from '@templates/create-form-block-new/form-horizontal'
  import PageHeadingBlock from '@templates/page-heading-block'
  import ListTableBlock from '@templates/list-table-block/no-header'
  import ContentBlock from '@/templates/content-block'
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
  import InputText from 'primevue/inputtext'
  import PrimeButton from 'primevue/button'
  import InputSwitch from 'primevue/inputswitch'
  import { useForm, useField } from 'vee-validate'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import * as yup from 'yup'

  export default {
    name: 'edit-intelligent-dns-view',
    components: {
      EditFormBlock,
      TabView,
      TabPanel,
      InputText,
      InputSwitch,
      ListTableBlock,
      FormHorizontal,
      PageHeadingBlock,
      PrimeButton,
      ContentBlock,
      EmptyResultsBlock,
      Illustration
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

      const { errors, meta, values, setValues } = useForm({
        validationSchema
      })

      const { value: name } = useField('name')
      const { value: domain } = useField('domain')
      const { value: isActive } = useField('isActive')

      const intelligentDNSStore = useIntelligentDNSStore()

      return {
        errors,
        meta,
        values,
        name,
        domain,
        isActive,
        setValues,
        hasContentToList,
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
