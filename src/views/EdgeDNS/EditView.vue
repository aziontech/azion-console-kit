<script setup>
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import ContentBlock from '@/templates/content-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import EditDrawerBlock from '@templates/edit-drawer-block'
  import EditFormBlock from '@templates/edit-form-block'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination'
  import PageHeadingBlock from '@templates/page-heading-block'
  import PrimeButton from 'primevue/button'
  import TabPanel from 'primevue/tabpanel'
  import TabView from 'primevue/tabview'
  import { useToast } from 'primevue/usetoast'
  import { computed, onBeforeMount, ref, watch, reactive, provide, inject } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import * as yup from 'yup'
  import FormFieldsEdgeDnsCreate from './FormFields/FormFieldsEdgeDns.vue'
  import FormFieldsRecords from './FormFields/FormFieldsRecords'
  import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import { TTL_MAX_VALUE_RECORDS } from '@/utils/constants'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

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
      header: 'Name',
      sortField: 'entry'
    },
    {
      field: 'type',
      header: 'Type',
      sortField: 'record_type'
    },
    {
      field: 'value',
      header: 'Value',
      sortField: 'answers_list',
      filterPath: 'value.content',
      type: 'component',
      component: (columnData) =>
        columnBuilder({ data: columnData, columnAppearance: 'expand-column' })
    },
    {
      field: 'ttl',
      header: 'TTL (seconds)',
      sortField: 'ttl'
    },
    {
      field: 'policy',
      header: 'Policy',
      sortField: 'policy'
    },
    {
      field: 'weight',
      header: 'Weight',
      sortField: 'weight'
    },
    {
      field: 'description',
      header: 'Description',
      sortField: 'description'
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
        otherwise: (schema) => schema.min(0).max(TTL_MAX_VALUE_RECORDS).required()
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

  const EDGE_DNS_RECORDS_FIELDS = [
    'id',
    'entry',
    'record_type',
    'answers_list',
    'ttl',
    'policy',
    'weight',
    'description'
  ]

  const initialValuesCreateRecords = {
    name: '',
    selectedRecordType: 'A',
    value: '',
    ttl: TTL_MAX_VALUE_RECORDS,
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

  const handleTrackEditEvent = () => {
    tracker.product.productEdited({
      productName: 'Edge DNS Zone'
    })
  }

  const handleTrackFailEditEvent = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToEdit({
        productName: 'Edge DNS Zone',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }

  const listRecordsServiceEdgeDNSDecorator = async (query) => {
    return await props.listRecordsService({ id: edgeDNSID.value, ...query })
  }

  const deleteRecordsServiceEdgeDNSDecorator = async (recordID) => {
    return await props.deleteRecordsService({
      recordID: recordID,
      edgeDNSID: edgeDNSID.value
    })
  }

  const openCreateDrawerEDNSResource = () => {
    showCreateRecordDrawer.value = true
    handleTrackEventGoToCreate()
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
      summary: 'Successfully copied!'
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

  const actions = [
    {
      type: 'delete',
      title: 'record',
      icon: 'pi pi-trash',
      service: deleteRecordsServiceEdgeDNSDecorator
    }
  ]

  const handleTrackEventGoToCreate = () => {
    tracker.product
      .clickToCreate({
        productName: 'Record'
      })
      .track()
  }

  const handleTrackEventGoToEdit = () => {
    tracker.product
      .clickToEdit({
        productName: 'Record'
      })
      .track()
  }

  const handleTrackSuccessCreated = () => {
    tracker.product
      .productCreated({
        productName: 'Record'
      })
      .track()
  }

  const handleTrackFailCreated = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToCreate({
        productName: 'Record',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }

  const handleTrackSuccessEdit = () => {
    tracker.product
      .productEdited({
        productName: 'Record'
      })
      .track()
  }
  const handleTrackFailEdit = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToEdit({
        productName: 'Record',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Edit Zone"
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
      <TabView
        :activeIndex="activeTab"
        @tab-click="changeRouteByClickingOnTab"
        class="w-full"
      >
        <TabPanel
          header="Main Settings"
          :pt="{
            root: {
              'data-testid': 'edge-dns-edit-view__main-settings__tab-panel'
            }
          }"
        >
          <EditFormBlock
            :editService="editEdgeDNSService"
            :loadService="loadEdgeDNSService"
            :schema="validationSchemaEditEDNS"
            :updatedRedirect="updatedRedirect"
            :isTabs="true"
            @on-edit-success="handleTrackEditEvent"
            @on-edit-fail="handleTrackFailEditEvent"
          >
            <template #form>
              <FormFieldsEdgeDnsCreate></FormFieldsEdgeDnsCreate>
            </template>
            <template #action-bar="{ onSubmit, onCancel, loading }">
              <ActionBarTemplate
                v-if="showEditFormWithActionTab"
                @onSubmit="onSubmit"
                @onCancel="onCancel"
                :loading="loading"
              />
            </template>
          </EditFormBlock>
        </TabPanel>
        <TabPanel
          header="Records"
          :pt="{
            root: {
              'data-testid': 'edge-dns-edit-view__records__tab-panel'
            }
          }"
        >
          <div v-if="showRecords">
            <FetchListTableBlock
              ref="listEDNSResourcesRef"
              v-if="hasContentToList"
              addButtonLabel="Record"
              :defaultOrderingFieldName="'entry'"
              :editInDrawer="openEditDrawerEDNSResource"
              :columns="recordListColumns"
              :listService="listRecordsServiceEdgeDNSDecorator"
              @on-load-data="handleLoadData"
              emptyListMessage="No records found."
              :actions="actions"
              isTabs
              :apiFields="EDGE_DNS_RECORDS_FIELDS"
              @on-before-go-to-edit="handleTrackEventGoToEdit"
            >
              <template #addButton>
                <PrimeButton
                  icon="pi pi-plus"
                  label="Record"
                  @click="openCreateDrawerEDNSResource"
                  data-testid="create_Record_button"
                />
              </template>
            </FetchListTableBlock>

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
                  class="max-md:w-full w-fit"
                  severity="secondary"
                  icon="pi pi-plus"
                  label="Record"
                  @click="openCreateDrawerEDNSResource"
                  data-testid="create_Record_button"
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
              @onSuccess="[reloadResourcesList, handleTrackSuccessCreated()]"
              @onError="handleTrackFailCreated"
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
              @onSuccess="[reloadResourcesList, handleTrackSuccessEdit()]"
              @onError="handleTrackFailEdit"
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
