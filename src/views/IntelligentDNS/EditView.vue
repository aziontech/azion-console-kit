<template>
  <PageHeadingBlock pageTitle="Edit Intelligent DNS">
    <template #tabs>
      <TabView
        :activeIndex="activeTab"
        @tab-click="changeRouteByClickingOnTab"
        class="w-full"
      >
        <TabPanel header="Main Settings">
          <EditFormBlock
            pageTitle="Edit Intelligent DNS"
            :editService="editIntelligentDNSService"
            :loadService="loadIntelligentDNSService"
            :initialDataSetter="setValues"
            :isValid="meta.valid"
            :formData="values"
            backURL="/intelligent-dns"
          >
            <template #form>
              <InputText
                placeholder="Zone Name"
                v-bind="name"
                type="text"
                :class="{ 'p-invalid': errors.name }"
                v-tooltip.top="{ value: errors.name, showDelay: 200 }"
              />
              <InputText
                placeholder="Domain"
                v-bind="domain"
                type="text"
                :class="{ 'p-invalid': errors.domain }"
                v-tooltip.top="{ value: errors.domain, showDelay: 200 }"
              />
              <div class="flex gap-3 items-center">
                <label for="">Active</label>
                <InputSwitch
                  v-bind="isActive"
                  v-model="isActive.value"
                  :class="{ 'p-invalid': errors.isActive }"
                />
              </div>
            </template>
          </EditFormBlock>
        </TabPanel>
        <TabPanel header="Records">
          <ListTableBlock
            pageTitle="Records"
            addButtonLabel="Add Record"
            createPagePath="records/create"
            editPagePath="/records/edit"
            :columns="recordListColumns"
            :listService="listRecordsServiceIntelligentDNSDecorator"
            :deleteService="deleteRecordsServiceIntelligentDNSDecorator"
          />
        </TabPanel>
      </TabView>
      <router-view></router-view>
    </template>
  </PageHeadingBlock>
</template>

<script>
  import { useIntelligentDNSStore } from '@/stores/intelligent-dns'
  import EditFormBlock from '@/templates/edit-form-block/no-header'
  import PageHeadingBlock from '@/templates/page-heading-block-tabs'
  import ListTableBlock from '@templates/list-table-block/no-header'
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
  import InputText from 'primevue/inputtext'
  import InputSwitch from 'primevue/inputswitch'
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
      PageHeadingBlock
    },

    props: {
      loadIntelligentDNSService: { type: Function, required: true },
      editIntelligentDNSService: { type: Function, required: true },
      listRecordsService: { type: Function, required: true },
      deleteRecordsService: { type: Function, required: true }
    },

    data: () => {
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
        if (this.$route.name === 'edit-intelligent-dns-records') {
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
            name: 'edit-intelligent-dns-records',
            params: { id: this.intelligentDNSID }
          })
        }
      }
    },

    watch: {
      domain() {
        this.intelligentDNSStore.addDomain(this.domain)
      }
    }
  }
</script>
