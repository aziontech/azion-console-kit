<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edit Intelligent DNS"> </PageHeadingBlock>
    </template>
    <template #content>
      <TabView
        :activeIndex="activeTab"
        @tab-click="changeRouteByClickingOnTab"
        class="w-full"
      >
        <TabPanel header="Main Settings">
          <EditFormBlock
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
                description="Espaço livre para descrição e instruções de preenchimento. Esse conteúdo deve ser criado pensando tanto em funcionalidade quanto em em alinhamento e estética. Devemos sempre criar os blocos conforme o contexto, cuidando sempre para não ter blocos muito longos."
              >
                <template #inputs>
                  <div class="flex flex-col sm:max-w-lg w-full gap-2">
                    <label
                      for="name"
                      class="text-color text-base font-medium"
                      >Name *</label
                    >
                    <InputText
                      placeholder="Zone Name"
                      v-bind="name"
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
                  <div class="flex flex-col sm:max-w-lg w-full gap-2">
                    <label
                      for="domain"
                      class="text-color text-base font-medium"
                      >Domain *</label
                    >
                    <InputText
                      placeholder="Domain"
                      id="domain"
                      v-bind="domain"
                      type="text"
                      :class="{ 'p-invalid': errors.domain }"
                    />
                    <small
                      v-if="errors.domain"
                      class="p-error text-xs font-normal leading-tight"
                      >{{ errors.domain }}</small
                    >
                  </div>
                  <div class="flex gap-3 items-center">
                    <label for="">Active</label>
                    <InputSwitch
                      v-bind="isActive"
                      v-model="isActive.value"
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
  import InputSwitch from 'primevue/inputswitch'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import { useForm } from 'vee-validate'
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
      ContentBlock,
      EmptyResultsBlock,
      Illustration
    },

    props: {
      loadIntelligentDNSService: { type: Function, required: true },
      editIntelligentDNSService: { type: Function, required: true },
      listRecordsService: { type: Function, required: true },
      deleteRecordsService: { type: Function, required: true },
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

      const { errors, defineInputBinds, meta, values, setValues } = useForm({
        validationSchema
      })

      const name = defineInputBinds('name', { validateOnInput: true })
      const domain = defineInputBinds('domain', { validateOnInput: true })
      const isActive = defineInputBinds('isActive')

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
      handleLoadData(event) {
        this.hasContentToList = event
      }
    },

    watch: {
      domain() {
        this.intelligentDNSStore.addDomain(this.domain)
      }
    }
  }
</script>
