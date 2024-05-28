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
  import FormFieldsEdgeDnsCreate from './FormFields/FormFieldsEdgeDns.vue'
  import FormFieldsRecords from './FormFields/FormFieldsRecords'
  import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import { TTL_MAX_VALEU_RECORDS } from '@/utils/constants'

  const props = defineProps({
    loadEdgeDNSService: { type: Function, required: true },
    editEdgeDNSService: { type: Function, required: true },

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
  const listEDNSResourcesRef = ref('')
  const edgeDNSID = ref(0)
  const activeTab = ref(0)
  const selectedEdgeDnsRecordToEdit = ref(0)
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
      header: 'Value',
      filterPath: 'value.content',
      type: 'component',
      component: (columnData) =>
        columnBuilder({ data: columnData, columnAppearance: 'expand-column' })
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

  const validationSchemaEditEDNS = yup.object({
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

  const validationSchemaEDNSRecords = yup.object({
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
        otherwise: (schema) => schema.min(0).max(TTL_MAX_VALEU_RECORDS).required()
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
    edgeDNSID: yup.number()
  })
  const initialValuesCreateRecords = {
    name: '',
    selectedRecordType: 'A',
    value: '',
    ttl: TTL_MAX_VALEU_RECORDS,
    selectedPolicy: 'simple',
    weight: '100',
    description: '',
    edgeDNSID: route.params.id
  }

  const reloadResourcesList = () => {
    if (hasContentToList.value) {
      listEDNSResourcesRef.value.reload()
      return
    }
    hasContentToList.value = true
  }

  const listRecordsServiceEdgeDNSDecorator = async () => {
    return await props.listRecordsService({ id: edgeDNSID.value })
  }

  const deleteRecordsServiceEdgeDNSDecorator = async (recordID) => {
    return await props.deleteRecordsService({
      recordID: recordID,
      edgeDNSID: edgeDNSID.value
    })
  }

  const openCreateDrawerEDNSResource = () => {
    showCreateRecordDrawer.value = true
  }
  const openEditDrawerEDNSResource = (event) => {
    selectedEdgeDnsRecordToEdit.value = event.id
    showEditRecordDrawer.value = true
  }

  const renderTabByRouterPath = () => {
    if (route.name === 'edge-dns-records') {
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

  const loadRecordServiceWithEDNSIdDecorator = async (payload) => {
    return await props.loadRecordsService({
      id: payload.id,
      edgeDNSId: edgeDNSID.value
    })
  }

  const editRecordServiceWithEDNSIdDecorator = async (payload) => {
    return await props.editRecordsService({ edgeDNSId: edgeDNSID.value, ...payload })
  }

  watch(route, () => {
    renderTabByRouterPath()
  })

  onBeforeMount(() => {
    edgeDNSID.value = route.params.id
    renderTabByRouterPath()
  })

  const changeTab = (index) => {
    activeTab.value = index
    if (index === 0) {
      router.push({ name: 'edit-edge-dns', params: { id: edgeDNSID.value } })
    } else {
      router.push({
        name: 'edge-dns-records',
        params: { id: edgeDNSID.value }
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
        pageTitle="Edit Zone"
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
            :editService="editEdgeDNSService"
            :loadService="loadEdgeDNSService"
            :schema="validationSchemaEditEDNS"
            :updatedRedirect="updatedRedirect"
            :isTabs="true"
          >
            <template #form>
              <FormFieldsEdgeDnsCreate></FormFieldsEdgeDnsCreate>
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
              ref="listEDNSResourcesRef"
              v-if="hasContentToList"
              pageTitleDelete="record"
              addButtonLabel="Record"
              :editInDrawer="openEditDrawerEDNSResource"
              :columns="recordListColumns"
              :listService="listRecordsServiceEdgeDNSDecorator"
              :deleteService="deleteRecordsServiceEdgeDNSDecorator"
              @on-load-data="handleLoadData"
              emptyListMessage="No records found."
            >
              <template #addButton>
                <PrimeButton
                  icon="pi pi-plus"
                  label="Record"
                  @click="openCreateDrawerEDNSResource"
                />
              </template>
            </ListTableNoHeaderBlock>

            <EmptyResultsBlock
              v-else
              title="No record has been created"
              description=" Click the button below to create your first record."
              createButtonLabel="Record"
              createPagePath="records/create"
              :documentationService="documentationService"
              :inTabs="true"
            >
              <template #default>
                <PrimeButton
                  severity="secondary"
                  icon="pi pi-plus"
                  label="Record"
                  @click="openCreateDrawerEDNSResource"
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
              :schema="validationSchemaEDNSRecords"
              :initialValues="initialValuesCreateRecords"
              @onSuccess="reloadResourcesList"
              title="Create Record"
            >
              <template #formFields>
                <FormFieldsRecords />
              </template>
            </CreateDrawerBlock>

            <EditDrawerBlock
              v-if="showEditRecordDrawer"
              :id="selectedEdgeDnsRecordToEdit"
              v-model:visible="showEditRecordDrawer"
              :loadService="loadRecordServiceWithEDNSIdDecorator"
              :editService="editRecordServiceWithEDNSIdDecorator"
              :schema="validationSchemaEDNSRecords"
              @onSuccess="reloadResourcesList"
              title="Edit Record"
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
