<script setup>
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import ContentBlock from '@/templates/content-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import EditDrawerBlock from '@templates/edit-drawer-block'
  import EditFormBlock from '@templates/edit-form-block'
  import ListTableNoHeaderBlock from '@templates/list-table-block/no-header'
  import PageHeadingBlock from '@templates/page-heading-block'
  import PrimeButton from 'primevue/button'
  import TabPanel from 'primevue/tabpanel'
  import TabView from 'primevue/tabview'
  import { useToast } from 'primevue/usetoast'
  import { computed, onBeforeMount, ref, watch, reactive, provide } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import * as yup from 'yup'
  import FormFieldsIntelligentDnsCreate from './FormFields/FormFieldsIntelligentDns.vue'
  import FormFieldsRecords from './FormFields/FormFieldsRecords'
  import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'

  const props = defineProps({
    loadIntelligentDNSService: { type: Function, required: true },
    editIntelligentDNSService: { type: Function, required: true },

    listRecordsService: { type: Function, required: true },
    deleteRecordsService: { type: Function, required: true },
    loadRecordsService: { type: Function, required: true },
    editRecordsService: { type: Function, required: true },

    clipboardWrite: { type: Function, required: true },
    updatedRedirect: { type: String, required: true },
    documentationService: { type: Function, required: true },
    createRecordsService: {
      type: Function,
      required: true
    }
  })

  const route = useRoute()
  const router = useRouter()
  const toast = useToast()
  const hasContentToList = ref(true)
  const showCreateRecordDrawer = ref(false)
  const showEditRecordDrawer = ref(false)
  const listIDNSResourcesRef = ref('')
  const intelligentDNSID = ref(0)
  const activeTab = ref(0)
  const selectedIdnsRecordToEdit = ref(0)
  const recordListColumns = ref([
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
      header: 'TTL (seconds)'
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
  ])
  const RECORD_TYPE_WITHOUT_TTL = 'ANAME'

  const tabHasUpdate = reactive({ oldTab: null, nextTab: 0, updated: 0 })
  const formHasUpdated = ref(false)
  const visibleOnSaved = ref(false)

  const defaultTabs = {
    mainSettings: 0,
    records: 1
  }

  const mapTabs = ref({ ...defaultTabs })

  const validationSchemaEditIDNS = yup.object({
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

  const validationSchemaIDNSRecords = yup.object({
    name: yup.string().required(),
    selectedRecordType: yup.string().required('Select an option'),
    value: yup.string().required(),
    ttl: yup
      .number()
      .label('TTL')
      .transform((value) => (Number.isNaN(value) ? null : value))
      .when('selectedRecordType', {
        is: RECORD_TYPE_WITHOUT_TTL,
        then: (schema) => schema.notRequired(),
        otherwise: (schema) => schema.min(0).max(3600).required()
      }),
    selectedPolicy: yup.string().required('Please select an option').default('simple'),
    weight: yup
      .number()
      .label('Weight')
      .transform((value) => (Number.isNaN(value) ? null : value))
      .when('selectedPolicy', {
        is: 'weighted',
        then: (schema) => schema.min(0).max(255).required()
      }),
    description: yup.string().when('selectedPolicy', {
      is: 'weighted',
      then: (schema) => schema.required().label('Description')
    }),
    intelligentDNSID: yup.number()
  })
  const initialValuesCreateRecords = {
    name: '',
    selectedRecordType: 'A',
    value: '',
    ttl: 3600,
    selectedPolicy: 'simple',
    weight: '100',
    description: '',
    intelligentDNSID: route.params.id
  }

  const reloadResourcesList = () => {
    if (hasContentToList.value) {
      listIDNSResourcesRef.value.reload()
      return
    }
    hasContentToList.value = true
  }

  const listRecordsServiceIntelligentDNSDecorator = async (payload) => {
    return await props.listRecordsService({ ...payload, id: intelligentDNSID.value })
  }

  const deleteRecordsServiceIntelligentDNSDecorator = async (recordID) => {
    return await props.deleteRecordsService({
      recordID: recordID,
      intelligentDNSID: intelligentDNSID.value
    })
  }

  const openCreateDrawerIDNSResource = () => {
    showCreateRecordDrawer.value = true
  }
  const openEditDrawerIDNSResource = (event) => {
    selectedIdnsRecordToEdit.value = event.id
    showEditRecordDrawer.value = true
  }

  const renderTabByRouterPath = () => {
    if (route.name === 'intelligent-dns-records') {
      activeTab.value = 1
    } else {
      activeTab.value = 0
    }
  }

  const changeRouteByClickingOnTab = (tabEvent) => {
    changeTab(tabEvent.index)
  }

  const handleCopyNameServers = () => {
    props.clipboardWrite('ns1.aziondns.net;ns2.aziondns.com;ns3.aziondns.org')
    toast.add({
      closable: true,
      severity: 'success',
      summary: 'Copied successfully!'
    })
  }

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const showEditFormWithActionTab = computed(() => {
    return activeTab.value === 0
  })

  const showRecords = computed(() => {
    return activeTab.value === mapTabs.value?.records
  })

  const loadRecordServiceWithIDNSIdDecorator = async (payload) => {
    return await props.loadRecordsService({
      id: payload.id,
      intelligentDNSId: intelligentDNSID.value
    })
  }

  const editRecordServiceWithIDNSIdDecorator = async (payload) => {
    return await props.editRecordsService({ intelligentDNSId: intelligentDNSID.value, ...payload })
  }

  watch(route, () => {
    renderTabByRouterPath()
  })

  onBeforeMount(() => {
    intelligentDNSID.value = route.params.id
    renderTabByRouterPath()
  })

  const changeTab = (index) => {
    activeTab.value = index
    if (index === 0) {
      router.push({ name: 'edit-intelligent-dns', params: { id: intelligentDNSID.value } })
    } else {
      router.push({
        name: 'intelligent-dns-records',
        params: { id: intelligentDNSID.value }
      })
    }
  }

  provide('unsaved', {
    changeTab,
    tabHasUpdate,
    formHasUpdated,
    visibleOnSaved
  })

  watch(activeTab, (newValue, oldValue) => {
    if (visibleOnSaved.value) {
      return
    } else {
      tabHasUpdate.oldTab = oldValue
      tabHasUpdate.nextTab = newValue
      tabHasUpdate.updated = generateCurrentTimestamp()
    }
  })
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Edit Edge DNS Zone"
        description="Set Azion Edge DNS as the authoritative DNS server for your domain by copying the nameservers values."
      >
        <template #default>
          <PrimeButton
            outlined
            icon="pi pi-copy"
            class="max-md:w-full"
            label="Copy"
            @click="handleCopyNameServers"
          ></PrimeButton>
        </template>
      </PageHeadingBlock>
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
            :schema="validationSchemaEditIDNS"
            :updatedRedirect="updatedRedirect"
            :isTabs="true"
          >
            <template #form>
              <FormFieldsIntelligentDnsCreate></FormFieldsIntelligentDnsCreate>
            </template>
            <template #action-bar="{ onSubmit, formValid, onCancel, loading }">
              <ActionBarTemplate
                v-if="showEditFormWithActionTab"
                @onSubmit="onSubmit"
                @onCancel="onCancel"
                :loading="loading"
                :submitDisabled="!formValid"
              />
            </template>
          </EditFormBlock>
        </TabPanel>
        <TabPanel header="Records">
          <div v-if="showRecords">
            <ListTableNoHeaderBlock
              ref="listIDNSResourcesRef"
              v-if="hasContentToList"
              pageTitleDelete="Record"
              addButtonLabel="Record"
              :editInDrawer="openEditDrawerIDNSResource"
              :columns="recordListColumns"
              :listService="listRecordsServiceIntelligentDNSDecorator"
              :deleteService="deleteRecordsServiceIntelligentDNSDecorator"
              @on-load-data="handleLoadData"
              emptyListMessage="No records found."
            >
              <template #addButton>
                <PrimeButton
                  icon="pi pi-plus"
                  label="Add"
                  @click="openCreateDrawerIDNSResource"
                />
              </template>
            </ListTableNoHeaderBlock>

            <EmptyResultsBlock
              v-else
              title="No record has been created"
              description=" Click the button below to initiate the setup process and create your first record."
              createButtonLabel="Add"
              createPagePath="records/create"
              :documentationService="documentationService"
              :inTabs="true"
            >
              <template #default>
                <PrimeButton
                  severity="secondary"
                  icon="pi pi-plus"
                  label="Add"
                  @click="openCreateDrawerIDNSResource"
                />
              </template>
              <template #illustration>
                <Illustration />
              </template>
            </EmptyResultsBlock>

            <CreateDrawerBlock
              v-if="showCreateRecordDrawer"
              v-model:visible="showCreateRecordDrawer"
              :createService="createRecordsService"
              :schema="validationSchemaIDNSRecords"
              :initialValues="initialValuesCreateRecords"
              @onSuccess="reloadResourcesList"
              title="Create Edge DNS Record"
            >
              <template #formFields>
                <FormFieldsRecords />
              </template>
            </CreateDrawerBlock>

            <EditDrawerBlock
              v-if="showEditRecordDrawer"
              :id="selectedIdnsRecordToEdit"
              v-model:visible="showEditRecordDrawer"
              :loadService="loadRecordServiceWithIDNSIdDecorator"
              :editService="editRecordServiceWithIDNSIdDecorator"
              :schema="validationSchemaIDNSRecords"
              @onSuccess="reloadResourcesList"
              title="Edit Edge DNS Record"
            >
              <template #formFields>
                <FormFieldsRecords />
              </template>
            </EditDrawerBlock>
          </div>
        </TabPanel>
      </TabView>
      <router-view></router-view>
    </template>
  </ContentBlock>
</template>
