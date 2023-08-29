<template>
  <TabView @tabClick="changeTab">
    <TabPanel header="Main Settings">
      <EditFormBlock
        :pageTitle="'Edit Intelligent DNS'"
        :editService="this.editIntelligentDNSService"
        :loadService="this.loadIntelligentDNSService"
        :initialDataSetter="setValues"
        :isValid="meta.valid"
        :formData="values"
      >
        <template #form>
          <InputText
            placeholder="Zone Name"
            v-bind="name"
            type="text"
            :class="{ 'p-invalid': errors.name }"
            v-tooltip.top="errors.name"
          />
          <InputText
            placeholder="Domain"
            v-bind="domain"
            type="text"
            :class="{ 'p-invalid': errors.domain }"
            v-tooltip.top="errors.domain"
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
        :createPagePath="`${intelligentDNSID}/records/create`"
        editPagePath="/"
        :columns="recordListColumns"
        :listService="listRecordsServiceIntelligentDNSDecorator"
        :deleteService="deleteRecordsServiceIntelligentDNS"
      />
    </TabPanel>
  </TabView>
</template>

<script>
import EditFormBlock from '@/templates/edit-form-block'
import ListTableBlock from '@templates/list-table-block'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import InputText from 'primevue/inputtext'
import InputSwitch from 'primevue/inputswitch'
import { useForm } from 'vee-validate'
import * as yup from 'yup'
import { ref } from 'vue'

export default {
  name: 'edit-intelligent-dns-view',
  components: {
    EditFormBlock,
    TabView,
    TabPanel,
    InputText,
    InputSwitch,
    ListTableBlock
  },

  props: {
    loadIntelligentDNSService: { type: Function, required: true },
    editIntelligentDNSService: { type: Function, required: true },
    listRecordsService: { type: Function, required: true },
    deleteRecordsService: {
      type: Function,
      required: true
    }
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

    const intelligentDNSID = ref(0)

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
      intelligentDNSID
    }
  },

  created() {
    this.intelligentDNSID = this.$route.params.id
  },

  methods: {
    changeTab(e) {
      console.log(e.index)
    },

    async listRecordsServiceIntelligentDNSDecorator(payload) {
      return await this.listRecordsService({ ...payload, id: this.intelligentDNSID })
    },

    async deleteRecordsServiceIntelligentDNS(id) {
      return await this.deleteRecordsService({ id: this.intelligentDNSID, recordId:  id})
    }
  }
}
</script>
